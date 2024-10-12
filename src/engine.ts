import { readFileSync } from 'fs';
import { mkdir, readFile, unlink, writeFile } from 'fs/promises';
import { EOL } from 'os';
import { join, relative, resolve, sep } from 'path';
import { performance } from 'perf_hooks';

import { merge as webpackMerge } from 'webpack-merge';
import { NamespacedBasketryOptions } from '.';
import { encodeRange } from './range';
import { Service } from './ir';
import {
  BasketryError,
  EngineEvents,
  EngineInput,
  File,
  FileStatus,
  Generator,
  GeneratorOptions,
  LegacyInput,
  Output,
  Overrides,
  Parser,
  Rule,
  RuleOptions,
  Violation,
} from './types';
import { getConfigs, isLocalConfig } from './utils';
import { validate } from './validator';

require('ts-node').register({
  transpileOnly: true,
});

const componentNames = new WeakMap<Function, string>();

export class Engine {
  constructor(
    private readonly input: EngineInput,
    private readonly events?: {
      onError?: (error: BasketryError) => void;
      onViolation?: (violation: Violation, line: string) => void;
    },
  ) {}

  static async load({
    configPath,
    onError,
    onViolation,
    ...overrides
  }: {
    configPath?: string | undefined;
  } & Overrides &
    EngineEvents): Promise<{ engines: Engine[]; errors: BasketryError[] }> {
    const { values: inputs, errors } = await getInput(configPath, overrides);

    const engines: Engine[] = [];

    for (const input of inputs) {
      const parserInfo = getParser(input.parser, input.configPath);
      const rulesInfo = getRules(input.rules, input.configPath);
      const generatorsInfo = getGenerators(
        input.generators,
        input.configPath,
        input.options,
        input.output,
      );

      const engine = new Engine(
        {
          sourceContent: input.sourceContent,
          sourcePath: input.sourcePath,
          parser: parserInfo.fn ?? nullParser,
          rules: rulesInfo.fns,
          generators: generatorsInfo.fns,
          options: input.options,
          output: input.output,
        },
        { onError, onViolation },
      );

      engine.pushErrors(
        ...parserInfo.errors,
        ...rulesInfo.errors,
        ...generatorsInfo.errors,
      );

      engines.push(engine);
    }
    return { engines, errors };
  }

  private readonly _files: File[] = [];
  private readonly _changes: Record<string, FileStatus> = {};
  private readonly _errors: BasketryError[] = [];
  private readonly _violations: Violation[] = [];
  private readonly _filesByFilepath: Map<string, File> = new Map();
  private readonly _violationsByRange = new Map<string, Violation[]>();

  public get sourcePath(): string {
    return this.input.sourcePath;
  }

  public get files() {
    return this._files;
  }
  public get changes() {
    return this._changes;
  }
  public get errors() {
    return this._errors;
  }
  public get violations() {
    return this._violations;
  }
  public get output(): Output {
    return {
      files: this._files,
      errors: this._errors,
      violations: this._violations,
    };
  }
  public get service(): Service | undefined {
    return this._service;
  }

  private _service: Service | undefined;
  private hasParserRun: boolean = false;

  private rulesRun: boolean = false;
  private hasGeneratorsRun: boolean = false;

  public async runParser() {
    if (!this.hasParserRun) {
      try {
        const { value, errors, violations } = await runParser({
          fn: this.input.parser,
          sourcePath: this.input.sourcePath,
          sourceContent: this.input.sourceContent,
        });
        this._service = value;
        this.pushErrors(...errors);
        this.pushViolations(...violations);
        this.hasParserRun = true;
      } catch (ex) {
        this.pushErrors(fatal(ex));
      }
    }
  }

  public async runRules() {
    if (this._service && this.input.rules.length && !this.rulesRun) {
      try {
        const { errors, violations } = await runRules({
          fns: this.input.rules,
          service: this._service,
        });
        this.pushErrors(...errors);
        this.pushViolations(...violations);
        this.rulesRun = true;
      } catch (ex) {
        this.pushErrors(fatal(ex));
      }
    }
  }

  public async runGenerators() {
    if (
      this._service &&
      this.input.generators.length &&
      !this.hasGeneratorsRun
    ) {
      try {
        const { files, errors, violations } = await runGenerators({
          fns: this.input.generators,
          service: this._service,
        });
        this._files.push(...withGitattributes(files, this.input.output));
        this.pushErrors(...errors);
        this.pushViolations(...violations);
        this.hasGeneratorsRun = true;
      } catch (ex) {
        this.pushErrors(fatal(ex));
      }
    }
  }

  public async compareFiles() {
    if (this.hasGeneratorsRun) {
      const removed = await getRemoved(this.files);

      for (const file of removed) {
        this._changes[file] = 'removed';
      }

      for (const file of this.files) {
        const filepath = join(...file.path);
        this._filesByFilepath.set(filepath, file);
        const status = await this.compare(file);
        this._changes[filepath] = status;
      }
    }
  }

  private async compare(file: File): Promise<FileStatus> {
    try {
      const previous = (await readFile(join(...file.path))).toString();
      return areEquivalent(previous, await file.contents)
        ? 'no-change'
        : 'modified';
    } catch {
      return 'added';
    }
  }

  public async commitFiles() {
    for (const filepath of Object.keys(this._changes)) {
      const status = this._changes[filepath];

      if (status === 'removed') {
        try {
          await unlink(filepath);
        } catch (ex) {
          this.pushErrors({
            code: 'WRITE_ERROR',
            message: `Unable to remove file. (${ex.message})`,
            filepath: filepath,
          });
        }
      }

      if (status === 'added' || status === 'modified') {
        const file = this._filesByFilepath.get(filepath);
        if (file) {
          if (file.path.length > 1 && status === 'added') {
            // Create subfolder for added file with subfolder
            try {
              await readFile(filepath);
            } catch {
              await mkdir(join(...file.path.slice(0, -1)), { recursive: true });
            }
          }

          try {
            await writeFile(filepath, await file.contents); // This seemingly unnecessary await accounts for an odd bug caused by generators using an older version (<=2) of prettier
          } catch (ex) {
            this.pushErrors({
              code: 'WRITE_ERROR',
              message: `Error writing ${filepath} (${ex.message})`,
            });
          }
        }
      }
    }
  }

  private pushErrors(...errors: BasketryError[]) {
    this._errors.push(...errors);
    if (this.events?.onError) {
      for (const error of errors) {
        try {
          this.events.onError(error);
        } catch {}
      }
    }
  }

  private pushViolations(...violations: Violation[]) {
    for (const violation of violations) {
      const sourceIndex =
        this._service?.sourcePaths.indexOf(violation.sourcePath) ?? 0;
      const range = encodeRange(sourceIndex, violation.range);
      if (!this._violationsByRange.has(range)) {
        this._violationsByRange.set(range, []);
      }
      const sameLocation = this._violationsByRange.get(range)!;

      const existing = sameLocation.find(
        (v) =>
          v.code === violation.code &&
          v.message === violation.message &&
          v.severity === violation.severity &&
          v.sourcePath === violation.sourcePath,
      );

      if (!existing) {
        sameLocation.push(violation);
        this._violations.push(violation);

        if (this.events?.onViolation) {
          try {
            const line = this.getLine(
              violation.sourcePath,
              violation.range.start.line,
            );
            this.events?.onViolation?.(violation, line);
          } catch {}
        }
      }
    }
  }

  private readonly _contentBySource = new Map<string, string[]>();

  private getLine(sourcePath: string, lineNumber: number): string {
    if (!this._contentBySource.has(sourcePath)) {
      this._contentBySource.set(
        sourcePath,
        readFileSync(sourcePath).toString().split(EOL),
      );
    }
    return this._contentBySource.get(sourcePath)![lineNumber - 1];
  }
}

function withGitattributes(files: File[], output?: string): File[] {
  if (!files.length) return files;
  return [
    ...files,
    {
      path: [output, '.gitattributes'].filter((x): x is string => !!x),
      contents:
        warning() +
        files
          .map(
            (file) =>
              `${
                output
                  ? relative(output, join(...file.path))
                  : join(...file.path)
              } linguist-generated=true${EOL}`,
          )
          .join(''),
    },
  ];
}

/** todo, use warning.ts */
const warning = () => `# This code was generated by ${
  require('../package.json').name
}@${require('../package.json').version}
#
# Changes to this file may cause incorrect behavior and will be lost if
# the code is regenerated.
#
# To learn more, visit: ${require('../package.json').homepage}

`;

export async function getInput(
  configPath: string | undefined,
  overrides?: Overrides,
): Promise<{
  values: LegacyInput[];
  errors: BasketryError[];
}> {
  const values: LegacyInput[] = [];
  const errors: BasketryError[] = [];

  const configs = await getConfigs(configPath);
  push(errors, configs.errors);

  if (!configPath) {
    const input: LegacyInput = {
      sourcePath: overrides?.sourcePath
        ? resolve(process.cwd(), overrides?.sourcePath)
        : 'direct input',
      sourceContent: overrides?.sourceContent ?? '',
      configPath,
      parser: overrides?.parser ?? nullParser,
      rules: overrides?.rules ?? [],
      generators: overrides?.generators ?? [],
      validate: overrides?.validate || false,
      output: overrides?.output,
      options: overrides?.options,
    };

    values.push(input);
  }

  for (const config of configs.value) {
    if (!isLocalConfig(config)) continue;

    let inputs: LegacyInput | undefined = undefined;
    const sourcePath = overrides?.sourcePath || config.source;

    const source = await getSource(sourcePath);
    push(errors, source.errors);

    const sourceContent = overrides?.sourceContent || source.content;
    const parser = overrides?.parser || config.parser;
    const rules = overrides?.rules || config.rules || [];
    const generators = overrides?.generators || config.generators || [];
    const output = overrides?.output || config.output;
    const options = config.options;

    if (sourcePath && sourceContent && parser) {
      inputs = {
        sourcePath: resolve(process.cwd(), sourcePath),
        sourceContent,
        configPath,
        parser,
        rules,
        generators,
        validate: overrides?.validate || false,
        output,
        options,
      };
    }

    if (!sourcePath) {
      errors.push({
        code: 'MISSING_PARAMETER',
        message: '`sourcePath` is not specified',
      });
    }

    if (!sourceContent) {
      errors.push({
        code: 'MISSING_PARAMETER',
        message: '`sourceContent` is not specified',
      });
    }

    if (!parser) {
      errors.push({
        code: 'MISSING_PARAMETER',
        message: '`parser` is not specified',
      });
    }

    if (inputs) values.push(inputs);
  }

  return { values, errors };
}

async function getRemoved(created: File[]): Promise<string[]> {
  try {
    // Find the path of the NEW .gitattributes file
    const gitattributesPath = created.find((file) =>
      file.path.some((seg) => seg === '.gitattributes'),
    )?.path;
    if (!gitattributesPath) return [];

    // Read the contents of the PREVIOUS .gitattributes file from disk
    const gitattributes = (
      await readFile(join(...gitattributesPath))
    ).toString();

    const [, ...outputPath] = [...gitattributesPath].reverse();
    outputPath.reverse();

    const createdPaths = new Set(created.map((file) => join(...file.path)));

    return gitattributes
      .split('\n')
      .map((line) => line.split(' '))
      .filter(
        ([, attribute]) =>
          attribute === 'linguist-generated' ||
          attribute === 'linguist-generated=true',
      )
      .map(([file]) => join(...outputPath, file))
      .filter((file) => !createdPaths.has(file));
  } catch {
    return [];
  }
}

/**
 * Determine if two versions of a file are equivalent by comparing everything but the first line.
 * This prevents diff noise when the only change is the generator's version number.
 * This optimization is not applied to files with only one line, or files with only whitespace after the first line.
 */
function areEquivalent(previous: string | null, next: string): boolean {
  if (previous === null) return false;
  if (previous === next) return true;
  try {
    // If either the previous or next versions don't have a line break, then all of the differences must be on the first line
    const firstLineBreakPrevious = previous.indexOf('\n');
    if (firstLineBreakPrevious === -1) return false;

    const firstLineBreakNext = next.indexOf('\n');
    if (firstLineBreakNext === -1) return false;

    // If either the previous or next versions only contain whitespace after the first line break, then all of the significant differences must be on the first line
    const afterFirstLinePrevious = previous.substring(firstLineBreakPrevious);
    if (!afterFirstLinePrevious.trim()) return false;

    const afterFirstLineNext = next.substring(firstLineBreakNext);
    if (!afterFirstLineNext.trim()) return false;

    return afterFirstLinePrevious === afterFirstLineNext;
  } catch {
    return false;
  }
}

async function runParser(options: {
  fn: Parser | undefined;
  sourceContent: string;
  sourcePath: string;
}): Promise<{
  value: Service | undefined;
  errors: BasketryError[];
  violations: Violation[];
}> {
  const { fn, sourcePath, sourceContent } = options;
  const errors: BasketryError[] = [];
  const violations: Violation[] = [];
  let value: Service | undefined = undefined;

  if (!fn) return { value, errors, violations };

  try {
    performance.mark('parser-start');
    const result = await fn(sourceContent, sourcePath);
    push(violations, result.violations);

    const relativePaths =
      result.service.sourcePaths?.map((p) => relative(process.cwd(), p)) ?? [];

    const validation = validate({
      ...result.service,
      sourcePaths: relativePaths,
    });
    push(errors, validation.errors);

    value = validation.service
      ? { ...validation.service, sourcePaths: relativePaths }
      : undefined;
  } catch (ex) {
    errors.push({
      code: 'PARSER_ERROR',
      message: 'Unhandled exception running parser', // TODO: Use ex (#25)
      filepath: relative(process.cwd(), sourcePath),
    });
  } finally {
    performance.mark('parser-end');
    performance.measure('parser', {
      start: 'parser-start',
      end: 'parser-end',
      detail: componentNames.get(fn),
    });
  }

  return { value, errors, violations };
}

async function runRules(options: { fns: Rule[]; service: Service }): Promise<{
  errors: BasketryError[];
  violations: Violation[];
}> {
  const { fns, service } = options;
  const errors: BasketryError[] = [];
  const violations: Violation[] = [];

  performance.mark('rules-start');
  for (const fn of fns) {
    try {
      performance.mark('rule-start');
      push(violations, await fn(service));
    } catch (ex) {
      errors.push({
        code: 'RULE_ERROR',
        message: 'Unhandled exception running rule', // TODO: Use ex (#25)
      });
    } finally {
      performance.mark('rule-end');
      performance.measure('rule', {
        start: 'rule-start',
        end: 'rule-end',
        detail: componentNames.get(fn),
      });
    }
  }
  performance.mark('rules-end');
  performance.measure('rules', 'rules-start', 'rules-end');

  return { errors, violations };
}

async function runGenerators(options: {
  fns: Generator[];
  service: Service;
}): Promise<{
  files: File[];
  errors: BasketryError[];
  violations: Violation[];
}> {
  const { fns, service } = options;
  const files: File[] = [];
  const errors: BasketryError[] = [];
  const violations: Violation[] = [];

  performance.mark('generators-start');
  for (const fn of fns) {
    try {
      performance.mark('generator-start');
      push(files, await fn(service));
    } catch (ex) {
      errors.push({
        code: 'GENERATOR_ERROR',
        message: 'Unhandled exception running generator', // TODO: Use ex (#25)
      });
    } finally {
      performance.mark('generator-end');
      performance.measure('generator', {
        start: 'generator-start',
        end: 'generator-end',
        detail: componentNames.get(fn),
      });
    }
  }
  performance.mark('generators-end');
  performance.measure('generators', 'generators-start', 'generators-end');

  return { files, errors, violations };
}

async function getSource(
  sourcePath: string | undefined,
): Promise<{ content: string | undefined; errors: BasketryError[] }> {
  let content: string | undefined;
  const errors: BasketryError[] = [];

  if (sourcePath?.length) {
    try {
      content = (await readFile(sourcePath)).toString();
    } catch (ex) {
      errors.push({
        code: 'SOURCE_ERROR',
        message: 'Source file not found ',
      });
    }
  }

  return { content: content, errors };
}

function getParser(
  moduleNameOrParser: string | Parser,
  configPath?: string,
): {
  fn: Parser | undefined;
  errors: BasketryError[];
} {
  return loadModule<Parser>(moduleNameOrParser, configPath);
}

function getRules(
  moduleNamesOrRules: (string | Rule | RuleOptions)[],
  configPath?: string,
): {
  fns: Rule[];
  errors: BasketryError[];
} {
  try {
    performance.mark('load-rules-start');
    const rules = moduleNamesOrRules.reduce(
      (acc, item) => {
        if (item instanceof Function) {
          return {
            fns: [...acc.fns, item],
            errors: acc.errors,
          };
        }

        const moduleNameOrRule = typeof item === 'string' ? item : item.rule;

        const ruleOptions: any =
          typeof item === 'string' ? undefined : item.options;

        const { fn, errors } = loadModule<Rule>(moduleNameOrRule, configPath);

        const rule: Rule | undefined = fn
          ? (service, localOptions) =>
              fn(service, merge(ruleOptions, localOptions))
          : undefined;

        if (rule)
          componentNames.set(
            rule,
            typeof moduleNameOrRule === 'string'
              ? moduleNameOrRule
              : moduleNameOrRule.name,
          );

        return {
          fns: [...acc.fns, rule].filter(
            (f): f is Rule => typeof f === 'function',
          ),
          errors: [...acc.errors, ...errors],
        };
      },
      {
        fns: [] as Rule[],
        errors: [] as BasketryError[],
      },
    );
    return rules;
  } finally {
    performance.mark('load-rules-end');
    performance.measure('load-rules', {
      start: 'load-rules-start',
      end: 'load-rules-end',
    });
  }
}

function getGenerators(
  moduleNames: (string | Generator | GeneratorOptions)[],
  configPath: string | undefined,
  commonOptions: any,
  output?: string,
): {
  fns: Generator[];
  errors: BasketryError[];
} {
  try {
    performance.mark('load-generators-start');
    const generators = moduleNames.reduce(
      (acc, item) => {
        if (item instanceof Function) {
          const withOptions = (service: Service, options: any) =>
            item(service, merge(commonOptions, options));

          return {
            fns: [...acc.fns, withOptions],
            errors: acc.errors,
          };
        }

        const moduleNameOrGenerator =
          typeof item === 'string' ? item : item.generator;

        const generatorOptions: any =
          typeof item === 'string' ? undefined : item.options;

        const { fn, errors } = loadModule<Generator>(
          moduleNameOrGenerator,
          configPath,
        );

        const gen: Generator | undefined = fn
          ? async (service, localOptions) => {
              const options: NamespacedBasketryOptions = merge(
                commonOptions,
                generatorOptions,
                localOptions,
              );

              const files = await fn(service, options);

              return files.map((file) => ({
                ...file,
                path: [
                  output,
                  options?.basketry?.subfolder,
                  ...file.path,
                ].filter((seg): seg is string => !!seg),
              }));
            }
          : undefined;

        if (gen) {
          componentNames.set(
            gen,
            typeof moduleNameOrGenerator === 'string'
              ? moduleNameOrGenerator
              : moduleNameOrGenerator.name,
          );
        }

        return {
          fns: [...acc.fns, gen].filter(
            (f): f is Generator => typeof f === 'function',
          ),
          errors: [...acc.errors, ...errors],
        };
      },
      {
        fns: [] as Generator[],
        errors: [] as BasketryError[],
      },
    );
    return generators;
  } finally {
    performance.mark('load-generators-end');
    performance.measure('load-generators', {
      start: 'load-generators-start',
      end: 'load-generators-end',
    });
  }
}

function push<T>(a: T[], b: T[]): T[] {
  for (const item of b) {
    a.push(item);
  }
  return a;
}

function fatal(ex: any): BasketryError {
  try {
    return {
      code: 'FATAL_ERROR',
      message: ex.message || ex.toString(),
    };
  } catch {
    return {
      code: 'FATAL_ERROR',
      message: 'Unrecoverable error',
    };
  }
}

function loadModule<T extends Function>(
  moduleName: string | Function,
  filepath?: string,
): { fn: T | undefined; errors: BasketryError[] } {
  if (moduleName instanceof Function) {
    return { fn: moduleName as T, errors: [] };
  }

  let fn: T | undefined = undefined;
  const errors: BasketryError[] = [];

  const cwd = process.cwd();

  try {
    let ruleModule: any;

    try {
      ruleModule = require(moduleName);
    } catch {
      try {
        ruleModule = require(join(cwd, moduleName));
      } catch (ex) {
        errors.push({
          code: 'MODULE_ERROR',
          message: `Error loading module "${moduleName}".`,
          filepath,
        });
      }
    }

    if (typeof ruleModule === 'function') fn = ruleModule;
    if (typeof ruleModule?.default === 'function') fn = ruleModule.default;
  } catch {
    errors.push({
      code: 'MODULE_ERROR',
      message: `Unhandle error loading module "${moduleName}"`,
      filepath,
    });
  }

  if (fn) componentNames.set(fn, moduleName);

  return { fn, errors };
}

function merge<T extends object>(
  ...configurations: (T | null | undefined)[]
): T | undefined {
  const input = configurations.filter((c): c is T => !!c);

  return input.length ? webpackMerge(input) : undefined;
}

const nullParser: Parser = (_, sourcePath) => ({
  service: {
    basketry: '0.2',
    kind: 'Service',
    sourcePaths: [sourcePath],
    title: { kind: 'StringLiteral', value: 'null' },
    majorVersion: { kind: 'IntegerLiteral', value: 1 },
    interfaces: [],
    types: [],
    enums: [],
    unions: [],
  },
  violations: [],
});
