#!/usr/bin/env node

import { readFileSync, StatWatcher, watchFile } from 'fs';
import { EOL, type } from 'os';
import { performance, PerformanceEntry, PerformanceObserver } from 'perf_hooks';

import Ajv from 'ajv';
import chalk from 'chalk';
import { hideBin } from 'yargs/helpers';

import schema from './config-schema.json';
import { BasketryError, Violation, FileStatus, CliOutput } from './types';
import { getInput, run, writeFiles } from './engine';

let events: PerformanceEntry[] = [];
const performanceObserver = new PerformanceObserver((items, observer) => {
  events.push(...items.getEntries());

  if (done) {
    if (j) {
      console.log(JSON.stringify({ ...cliOutput, perf: events }));
    } else {
      printPerformance();
    }

    observer.disconnect();
  }
});

let cliOutput: CliOutput = { errors: [], files: {}, violations: [] };
let done = false;
let j = false;

import yargs = require('yargs/yargs');

const ajv = new Ajv({ allErrors: false });
const runner = ajv.compile(schema);

const { argv } = yargs(hideBin(process.argv))
  .option('config', {
    alias: 'c',
    string: true,
    description: 'Path to the config file. Defaults to basketry.conifg.json.',
    default: 'basketry.config.json',
    requiresArg: true,
  })
  .option('parser', {
    alias: 'p',
    string: true,
    description: 'The parser',
    requiresArg: true,
  })
  .option('source', {
    alias: 's',
    string: true,
    description:
      'Path to an SDL file. Reads from stdin if omitted and config is not found.',
    requiresArg: true,
  })
  .option('output', {
    alias: 'o',
    string: true,
    description:
      'Path of the output folder. Writes to the current working directory if omitted and config is not found.',
    requiresArg: true,
  })
  .option('generators', {
    alias: 'g',
    string: true,
    array: true,
    description: `Generators`,
    requiresArg: true,
  })
  .option('rules', {
    alias: 'r',
    string: true,
    array: true,
    description: `Rules`,
    requiresArg: true,
  })
  .option('watch', {
    alias: 'w',
    boolean: true,
    description: 'Recreates the output each time the input file changes.',
    nargs: 0,
  })
  .option('validate', {
    alias: 'v',
    boolean: true,
    default: false,
    description:
      'Only validates the source document without writing any files.',
    nargs: 0,
  })
  .option('json', {
    alias: 'j',
    boolean: true,
    default: false,
    description: 'Outputs validation results as JSON',
    nargs: 0,
  })
  .option('perf', {
    boolean: true,
    default: false,
    description: 'Report performance',
    nargs: 0,
  });

(async () => {
  let p = false;
  const errors: BasketryError[] = [];
  const violations: Violation[] = [];
  let files: Record<string, FileStatus> = {};

  try {
    const {
      config,
      parser,
      source,
      output,
      generators,
      rules,
      watch,
      validate,
      json,
      perf,
    } = await argv;
    j = json;
    p = perf;

    if (perf) performanceObserver.observe({ type: 'measure' });

    performance.mark('basketry-start');
    const stdin = !process.stdin.isTTY;
    if (!j) bold(`🧺 Basketry v${require('../package.json').version}`);

    const sourceContent = stdin
      ? await readStreamToString(process.stdin)
      : undefined;

    let watcher: StatWatcher | undefined = undefined;

    const go = async () => {
      const inputs = await getInput(config, {
        output,
        validate,
        generators,
        parser,
        rules,
        sourceContent,
        sourcePath: source,
      });
      errors.push(...inputs.errors);
      if (!j) printErrors(inputs.errors);

      // TODO: fail if multiplexed with stdin (#24)

      for (const input of inputs.values) {
        if (!j) console.log(info(`Parsing ${input.sourcePath}`));
        const result = run(input);
        errors.push(...result.errors);
        if (!j) printErrors(result.errors);

        violations.push(...result.violations);
        if (!j) printViolations(result.violations);

        const writeResult = await writeFiles(result.files);
        errors.push(...writeResult.errors);
        files = writeResult.value;
        if (!j) printFiles(writeResult.value);
        done = true;
      }

      if (!watcher && watch && !stdin && !json) {
        for (const input of inputs.values) {
          let timer: NodeJS.Timeout | undefined = undefined;
          watcher = watchFile(input.sourcePath, () => {
            if (timer) clearTimeout(timer);
            timer = setTimeout(go, 100);
          });
        }
      }
    };

    await go();
  } catch (ex) {
    error('FATAL ERROR!', ex.message);
    process.exit(1);
  } finally {
    performance.mark('basketry-end');
    performance.measure('basketry', 'basketry-start', 'basketry-end');

    process.nextTick(() => {
      if (j) {
        cliOutput = { errors, violations, files };
        done = true;
        if (!p) console.log(JSON.stringify(cliOutput));
      } else if (errors.length) {
        process.exit(1);
      }
    });
  }
})();

function bold(message: string): void {
  console.log(chalk.bold(message));
}

function info(...text: unknown[]) {
  return chalk.blueBright(text);
}

function warning(...text: unknown[]) {
  return chalk.yellow(text);
}

async function readStreamToString(stream: NodeJS.ReadStream) {
  const chunks: any[] = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

function error(...lines: string[]): void {
  console.error();
  for (const line of lines) {
    console.error(chalk.bold.red(line));
  }
  console.error();
}

function printViolations(violations: Violation[]): void {
  if (violations.length) {
    const contentBySource = new Map<string, string[]>();

    for (const violation of violations) {
      const { start, end } = violation.range;

      if (!contentBySource.has(violation.sourcePath)) {
        contentBySource.set(
          violation.sourcePath,
          readFileSync(violation.sourcePath).toString().split(EOL),
        );
      }
      const line = contentBySource.get(violation.sourcePath)![start.line - 1];
      const violationLength =
        start.line === end.line
          ? end.column - start.column
          : line.length - start.column + 1;

      console.error();
      console.error(
        `${chalk.cyan(violation.sourcePath)}:${warning(start.line)}:${warning(
          start.column,
        )}`,
      );
      let severity: string;
      let underline: string;

      switch (violation.severity) {
        case 'info':
          severity = info(violation.severity);
          underline = info('~'.repeat(violationLength));
          break;
        case 'warning':
          severity = warning(violation.severity);
          underline = warning('~'.repeat(violationLength));
          break;
        case 'error':
          severity = chalk.redBright(violation.severity);
          underline = chalk.redBright('~'.repeat(violationLength));
          break;
      }

      console.error(
        `${severity} ${chalk.gray(`${violation.code}:`)} ${violation.message}`,
      );
      console.error();
      console.error(`${chalk.bgWhite.black(start.line)}${line}`);
      console.error(
        `${chalk.bgWhite.black(' '.repeat(`${start.line}`.length))}${' '.repeat(
          start.column - 1,
        )}${underline}`,
      );
    }
    console.error();
  }
}

function printErrors(errors: BasketryError[]): void {
  for (const e of errors) {
    console.error();
    console.error(e);
  }
}

function printFiles(files: Record<string, FileStatus>): void {
  if (Object.keys(files).some((file) => files[file] !== 'no-change')) {
    console.log();
    for (const file in files) {
      switch (files[file]) {
        case 'added':
          console.log(chalk.green(`+ ${file}`));
          break;
        case 'error':
          console.log(chalk.bold.red(`E ${file}`));
          break;
        case 'modified':
          console.log(info(`m ${file}`));
          break;
      }
    }
  } else {
    console.log(info('No changes'));
  }
  console.log();
}

export function validateConfig(service: any): boolean {
  return runner(service);
}

function printPerformance() {
  console.log('⌛ Component Performance:');
  console.log();
  for (const event of events.sort((a, b) => b.duration - a.duration)) {
    if (event.detail && ['rule', 'parser', 'generator'].includes(event.name)) {
      let ms = `(${Math.round(event.duration)}ms)`;

      if (event.duration > 100) {
        ms = chalk.red(ms);
      } else if (event.duration > 50) {
        ms = warning(ms);
      } else {
        ms = chalk.greenBright(ms);
      }

      const line = `   ${pad(`${event.name}:`, 10)} ${event.detail} ${ms}`;

      console.log(line);
    }
  }
  events = [];
  console.log();
}

function pad(text: string, length: number): string {
  return `${text}${' '.repeat(length)}`.substring(0, length);
}
