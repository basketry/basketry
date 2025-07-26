import * as fsPromises from 'fs/promises';
import { EOL } from 'os';
import { dirname, join, relative, resolve, sep } from 'path';
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
  Overrides,
  Parser,
  ParserOutput,
  Rule,
  RuleOptions,
  Violation,
} from './types';
import { getConfigs, isLocalConfig } from './utils';
import { validate } from './validator';
import { FileSystem } from './file-system';

require('ts-node').register({
  transpileOnly: true,
});

const componentNames = new WeakMap<Function, string>();

export type EngineLoadInput = {
  configPath?: string | undefined;
} & Overrides &
  EngineEvents;

export class Engine {
  constructor(
    private readonly input: EngineInput,
    private readonly fs: FileSystem,
    private readonly events?: {
      onError?: (error: BasketryError) => void;
      onViolation?: (violation: Violation, line: string) => void;
    },
  ) {
    // TODO: ensure this is an absolute path (eg. an empty first segment)
    this._projectDirectory = input.projectDirectory.split(sep);
    this._outputPath = input.output ? input.output.split(sep) : [];
  }

  static async load({
    configPath,
    onError,
    onViolation,

    ...overrides
  }: EngineLoadInput): Promise<{ engines: Engine[]; errors: BasketryError[] }> {
    const absoluteConfigPath = configPath ? resolve(configPath) : undefined;

    const { values: inputs, errors } = await getInput(
      absoluteConfigPath,
      fsPromises,
      overrides,
    );

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

      // Absolute path of this Engine's single-project config
      // TODO: consider moving this logic to a better place
      const projectDirectory = input.configPath
        ? resolve(process.cwd(), input.configPath)
            .split(sep)
            .reverse()
            .slice(1)
            .reverse()
            .join(sep)
        : process.cwd();

      const engine = new Engine(
        {
          projectDirectory,
          sourceContent: input.sourceContent,
          sourcePath: input.sourcePath,
          parser: parserInfo.fn ?? nullParser,
          rules: rulesInfo.fns,
          generators: generatorsInfo.fns,
          options: input.options,
          output: input.output,
        },
        fsPromises,
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

  private readonly _projectDirectory: string[];
  private readonly _outputPath: string[];
  private readonly _files: File[] = [];
  private readonly _changes: Record<string, FileStatus> = {};
  private readonly _errors: BasketryError[] = [];
  private readonly _violations: Violation[] = [];
  private readonly _filesByFilepath: Map<string, File> = new Map();
  private readonly _violationsByRange = new Map<string, Violation[]>();

  /** Gets the absolute path to the source file. */
  public get sourcePath(): string {
    return resolve(this._projectDirectory.join(sep), this.input.sourcePath);
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
        await this.pushViolations(...violations);
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
        await this.pushViolations(...violations);
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
          outputPath: this._outputPath,
        });
        this._files.push(...withGitattributes(files, this._outputPath));
        this.pushErrors(...errors);
        await this.pushViolations(...violations);
        this.hasGeneratorsRun = true;
      } catch (ex) {
        this.pushErrors(fatal(ex));
      }
    }
  }

  public async compareFiles() {
    if (this.hasGeneratorsRun) {
      const removed = await getRemoved(
        this.files,
        this._projectDirectory,
        this.fs,
      );

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
      const previous = (
        await this.fs.readFile(this.absolute(file.path))
      ).toString();
      return areEquivalent(previous, await file.contents)
        ? 'no-change'
        : 'modified';
    } catch {
      return 'added';
    }
  }

  public async commitFiles() {
    for (const relativePath of Object.keys(this._changes)) {
      const absolutePath = this.absolute(relativePath);
      const status = this._changes[relativePath];

      if (status === 'removed') {
        try {
          await this.fs.unlink(absolutePath);
        } catch (ex) {
          this.pushErrors({
            code: 'WRITE_ERROR',
            message: `Unable to remove file. (${ex.message})`,
            filepath: relativePath,
          });
        }
      }

      if (status === 'added' || status === 'modified') {
        const file = this._filesByFilepath.get(relativePath);
        if (file) {
          if (file.path.length > 1 && status === 'added') {
            // Create subfolder for added file with subfolder
            try {
              await this.fs.readFile(absolutePath);
            } catch {
              const dir = this.absolute(relativePath.split(sep).slice(0, -1));
              await this.fs.mkdir(dir, { recursive: true });
            }
          }

          try {
            await this.fs.writeFile(absolutePath, await file.contents); // This seemingly unnecessary await accounts for an odd bug caused by generators using an older version (<=2) of prettier
          } catch (ex) {
            this.pushErrors({
              code: 'WRITE_ERROR',
              message: `Error writing ${relativePath} (${ex.message})`,
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

  private async pushViolations(...violations: Violation[]): Promise<void> {
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
            // TODO Cache lines (or at least the file) to avoid reading the file multiple times
            const line = this.getLine(
              violation.sourcePath,
              violation.range.start.line,
            );
            this.events?.onViolation?.(violation, await line);
          } catch {}
        }
      }
    }
  }

  private readonly _contentBySource = new Map<string, string[]>();

  private async getLine(
    sourcePath: string,
    lineNumber: number,
  ): Promise<string> {
    if (!this._contentBySource.has(sourcePath)) {
      const buffer = await this.fs.readFile(sourcePath);
      this._contentBySource.set(sourcePath, buffer.toString().split(EOL));
    }
    return this._contentBySource.get(sourcePath)![lineNumber - 1];
  }

  private absolute(relativePath: string | string[]): string {
    return absolute(this._projectDirectory, relativePath);
  }
}

function absolute(
  projectDirectory: string[],
  relativePath: string | string[],
): string {
  return typeof relativePath === 'string'
    ? sep + join(...projectDirectory, relativePath)
    : sep + join(...projectDirectory, ...relativePath);
}

function withGitattributes(files: File[], outputPath: string[]): File[] {
  if (!files.length) return files;
  return [
    ...files,
    {
      path: [...outputPath, '.gitattributes'].filter((x): x is string => !!x),
      contents:
        warning() +
        files
          .map(
            (file) =>
              `${
                outputPath.length
                  ? relative(join(...outputPath), join(...file.path))
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
  fs: FileSystem,
  overrides?: Overrides,
): Promise<{
  values: LegacyInput[];
  errors: BasketryError[];
}> {
  const values: LegacyInput[] = [];
  const errors: BasketryError[] = [];

  const configs = await getConfigs(configPath);
  errors.push(...configs.errors);

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

  for (const [absoluteConfigPath, config] of configs.value) {
    if (!isLocalConfig(config)) continue;

    const cwd = dirname(absoluteConfigPath);

    let inputs: LegacyInput | undefined = undefined;
    const sourcePath = overrides?.sourcePath || config.source;

    const absoluteSourcePath = sourcePath
      ? resolve(cwd, sourcePath)
      : undefined;

    const source = await getSource(absoluteSourcePath, absoluteConfigPath, fs);
    errors.push(...source.errors);

    const sourceContent = overrides?.sourceContent || source.content;
    const parser = overrides?.parser || config.parser;
    const rules = overrides?.rules || config.rules || [];
    const generators = overrides?.generators || config.generators || [];
    const output = overrides?.output || config.output;
    const options = config.options;

    if (sourcePath && sourceContent && parser) {
      inputs = {
        sourcePath,
        sourceContent,
        configPath: absoluteConfigPath,
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
        filepath: absoluteConfigPath,
      });
    }

    if (!sourceContent && !configPath) {
      errors.push({
        code: 'MISSING_PARAMETER',
        message: '`sourceContent` is not specified',
      });
    }

    if (!parser) {
      errors.push({
        code: 'MISSING_PARAMETER',
        message: '`parser` is not specified',
        filepath: absoluteConfigPath,
      });
    }

    if (inputs) values.push(inputs);
  }

  return { values, errors };
}

async function getRemoved(
  created: File[],
  projectDirectory: string[],
  fs: FileSystem,
): Promise<string[]> {
  try {
    // Find the path of the NEW .gitattributes file
    const gitattributesPath = created.find((file) =>
      file.path.some((seg) => seg === '.gitattributes'),
    )?.path;
    if (!gitattributesPath) return [];

    // Read the contents of the PREVIOUS .gitattributes file from disk
    const gitattributes = (
      await fs.readFile(absolute(projectDirectory, gitattributesPath))
    ).toString();

    const [, ...outputPath] = [...gitattributesPath].reverse();
    outputPath.reverse();

    const createdPaths = new Set(
      created.map((file) => absolute(projectDirectory, file.path)),
    );

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
  const unmappedViolations: Violation[] = [];
  let value: Service | undefined = undefined;

  if (!fn) return { value, errors, violations: unmappedViolations };

  try {
    performance.mark('parser-start');
    const result = await fn(sourceContent, sourcePath);
    /** Violations that contain unmapped source file paths (eg. '#') */
    unmappedViolations.push(...result.violations);

    const relativePaths =
      result.service.sourcePaths?.map((p) => {
        const from = process.cwd();
        const to = p === '#' ? sourcePath : p;
        return relative(from, to);
      }) ?? [];

    const validation = validate({
      ...result.service,
      sourcePaths: relativePaths,
    });
    errors.push(...validation.errors);

    value = validation.service
      ? { ...validation.service, sourcePaths: relativePaths }
      : undefined;
  } catch (ex) {
    errors.push({
      code: 'PARSER_ERROR',
      message: getErrorMessage(ex, 'Unhandled exception running parser'),
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

  /** Violations that contain the mapped source path (eg. sourcePath instead of '#') */
  const mappedViolations = unmappedViolations.map((violation) => ({
    ...violation,
    sourcePath:
      violation.sourcePath === '#' ? sourcePath : violation.sourcePath,
  }));

  // Update sourcePaths to be relative to the current working directory
  // If the sourcePath is '#', then it should be replaced with the actual sourcePath
  if (value) {
    for (let i = 0; i < value.sourcePaths.length; i++) {
      const localSourcePath =
        value.sourcePaths[i] === '#' ? sourcePath : value.sourcePaths[i];
      value.sourcePaths[i] = relative(process.cwd(), localSourcePath);
    }
  }

  return { value, errors, violations: mappedViolations };
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
      const vs: Violation[] = await fn(service);

      violations.push(...vs);
    } catch (ex) {
      errors.push({
        code: 'RULE_ERROR',
        message: getErrorMessage(ex, 'Unhandled exception running rule'),
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
  outputPath: string[];
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

      // Append the outputPath to each file's path
      const mappedFiles = (await fn(service)).map((file) => ({
        ...file,
        path: [...options.outputPath, ...file.path],
      }));

      files.push(...mappedFiles);
    } catch (ex) {
      errors.push({
        code: 'GENERATOR_ERROR',
        message: getErrorMessage(ex, 'Unhandled exception running generator'),
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
  configPath: string | undefined,
  fs: FileSystem,
): Promise<{ content: string | undefined; errors: BasketryError[] }> {
  let content: string | undefined;
  const errors: BasketryError[] = [];

  if (sourcePath?.length) {
    try {
      content = (await fs.readFile(sourcePath)).toString();
    } catch (ex) {
      errors.push({
        code: 'SOURCE_ERROR',
        message: 'Source file not found ',
        filepath: configPath,
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
                path: [options?.basketry?.subfolder, ...file.path].filter(
                  (seg): seg is string => !!seg,
                ),
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
      message: `Unhandled error loading module "${moduleName}"`,
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

const nullParser: Parser = (): ParserOutput => ({
  service: {
    basketry: '0.2',
    kind: 'Service',
    sourcePaths: ['#'],
    title: { kind: 'StringLiteral', value: 'null' },
    majorVersion: { kind: 'IntegerLiteral', value: 1 },
    interfaces: [],
    types: [],
    enums: [],
    unions: [],
  },
  violations: [],
});

function getErrorMessage(err: any, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}
