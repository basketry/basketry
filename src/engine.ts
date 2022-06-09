import { mkdir, readFile, writeFile } from 'fs/promises';
import { join, resolve, sep } from 'path';
import { performance } from 'perf_hooks';

import { merge as webpackMerge } from 'webpack-merge';
import { withGitattributes } from './helpers';

import {
  BasketryError,
  Config,
  File,
  FileStatus,
  Generator,
  GeneratorOptions,
  Input,
  Output,
  Overrides,
  Parser,
  Rule,
  RuleOptions,
  Service,
  Violation,
} from './types';
import { getConfigs, isLocalConfig } from './utils';
import { validate } from './validator';

require('ts-node').register({
  transpileOnly: true,
});

const componentNames = new WeakMap<Function, string>();

export async function getInput(
  configPath: string | undefined,
  overrides?: Overrides,
): Promise<{
  values: Input[];
  errors: BasketryError[];
}> {
  const values: Input[] = [];
  const errors: BasketryError[] = [];

  const configs = await getConfigs(configPath);
  push(errors, configs.errors);

  for (const config of configs.value) {
    if (!isLocalConfig(config)) continue;

    let inputs: Input | undefined = undefined;
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

export function run(input: Input): Output {
  const { sourcePath, sourceContent } = input;

  const violations: Violation[] = [];
  const errors: BasketryError[] = [];
  const files: File[] = [];

  try {
    performance.mark('run-start');
    const parser = getParser(input.parser, input.configPath);
    push(errors, parser.errors);

    const rules = getRules(input.rules, input.configPath);
    push(errors, rules.errors);

    const generators = getGenerators(
      input.generators,
      input.configPath,
      input.options,
    );
    push(errors, generators.errors);

    const service = runParser({ fn: parser.fn, sourcePath, sourceContent });
    push(violations, service.violations);
    push(errors, service.errors);

    if (service.value) {
      const ruleResults = runRules({
        fns: rules.fns,
        service: service.value,
        sourcePath,
      });
      push(violations, ruleResults.violations);
      push(errors, ruleResults.errors);
    }

    if (service.value && !input.validate) {
      const generatorResults = runGenerators({
        fns: generators.fns,
        service: service.value,
      });
      push(files, prepend(input.output, generatorResults.files));
      push(violations, generatorResults.violations);
      push(errors, generatorResults.errors);
    }
  } catch (ex) {
    errors.push(fatal(ex));
  } finally {
    performance.mark('run-end');
    performance.measure('run', 'run-start', 'run-end');
  }

  return { violations, errors, files };
}

export async function writeFiles(
  files: File[],
): Promise<{ value: Record<string, FileStatus>; errors: BasketryError[] }> {
  const value: Record<string, FileStatus> = {};
  const errors: BasketryError[] = [];

  for (const file of files) {
    const result = await write(file);
    value[join(...file.path)] = result.value;
    errors.push(...result.errors);
  }

  return { value, errors };
}

async function write(
  file: File,
): Promise<{ value: FileStatus; errors: BasketryError[] }> {
  const errors: BasketryError[] = [];
  let value: FileStatus;

  const path = join(...file.path);

  let previous: string | null;
  try {
    previous = (await readFile(path)).toString();
  } catch {
    previous = null;
    await mkdir(join(...path.split(sep).slice(0, -1)), { recursive: true });
  }

  if (file.contents === previous) {
    value = 'no-change';
  } else {
    try {
      await writeFile(path, file.contents);

      if (previous === null) {
        value = 'added';
      } else {
        value = 'modified';
      }
    } catch (ex) {
      errors.push({
        code: 'WRITE_ERROR',
        message: `Error writing ${path} (${ex.message})`,
      });
      value = 'error';
    }
  }

  return { value, errors };
}

function runParser(options: {
  fn: Parser | undefined;
  sourceContent: string;
  sourcePath: string;
}): {
  value: Service | undefined;
  errors: BasketryError[];
  violations: Violation[];
} {
  const { fn, sourcePath, sourceContent } = options;
  const errors: BasketryError[] = [];
  const violations: Violation[] = [];
  let value: Service | undefined = undefined;

  if (!fn) return { value, errors, violations };

  try {
    performance.mark('parser-start');
    const result = fn(sourceContent, sourcePath);
    push(violations, result.violations);

    const validation = validate({ ...result.service, sourcePath });
    push(errors, validation.errors);

    value = validation.service;
  } catch (ex) {
    errors.push({
      code: 'PARSER_ERROR',
      message: 'Unhandled exception running parser', // TODO: Use ex,
      filepath: sourcePath,
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

function runRules(options: {
  fns: Rule[];
  service: Service;
  sourcePath: string;
}): {
  errors: BasketryError[];
  violations: Violation[];
} {
  const { fns, service, sourcePath } = options;
  const errors: BasketryError[] = [];
  const violations: Violation[] = [];

  performance.mark('rules-start');
  for (const fn of fns) {
    try {
      performance.mark('rule-start');
      push(violations, fn(service, sourcePath));
    } catch (ex) {
      errors.push({
        code: 'RULE_ERROR',
        message: 'Unhandled exception running rule', // TODO: Use ex
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

function runGenerators(options: { fns: Generator[]; service: Service }): {
  files: File[];
  errors: BasketryError[];
  violations: Violation[];
} {
  const { fns, service } = options;
  const files: File[] = [];
  const errors: BasketryError[] = [];
  const violations: Violation[] = [];

  performance.mark('generators-start');
  for (const fn of fns) {
    try {
      performance.mark('generator-start');
      push(files, fn(service));
    } catch (ex) {
      errors.push({
        code: 'GENERATOR_ERROR',
        message: 'Unhandled exception running generator', // TODO: Use ex
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

  return { files: withGitattributes(files), errors, violations };
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
  moduleName: string,
  configPath?: string,
): {
  fn: Parser | undefined;
  errors: BasketryError[];
} {
  return loadModule<Parser>(moduleName, configPath);
}

function getRules(
  moduleNames: (string | RuleOptions)[],
  configPath?: string,
): {
  fns: Rule[];
  errors: BasketryError[];
} {
  try {
    performance.mark('load-rules-start');
    const rules = moduleNames.reduce(
      (acc, item) => {
        const moduleName = typeof item === 'string' ? item : item.rule;

        const ruleOptions: any =
          typeof item === 'string' ? undefined : item.options;

        const { fn, errors } = loadModule<Rule>(moduleName, configPath);

        const rule: Rule | undefined = fn
          ? (service, sourcePath, localOptions) =>
              fn(service, sourcePath, merge(ruleOptions, localOptions))
          : undefined;

        if (rule) componentNames.set(rule, moduleName);

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
  moduleNames: (string | GeneratorOptions)[],
  configPath: string | undefined,
  commonOptions: any,
): {
  fns: Generator[];
  errors: BasketryError[];
} {
  try {
    performance.mark('load-generators-start');
    const generators = moduleNames.reduce(
      (acc, item) => {
        const moduleName = typeof item === 'string' ? item : item.generator;

        const generatorOptions: any =
          typeof item === 'string' ? undefined : item.options;

        const { fn, errors } = loadModule<Generator>(moduleName, configPath);

        const gen: Generator | undefined = fn
          ? (service, localOptions) =>
              fn(service, merge(commonOptions, generatorOptions, localOptions))
          : undefined;

        if (gen) componentNames.set(gen, moduleName);

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

function prepend(output: string | undefined, files: File[]): File[] {
  if (!output) return files;

  return files.map((file) => ({
    ...file,
    path: [output, ...file.path],
  }));
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
  moduleName: string,
  filepath?: string,
): { fn: T | undefined; errors: BasketryError[] } {
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
