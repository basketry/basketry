import { StatWatcher, watchFile } from 'fs';
import { performance, PerformanceEntry, PerformanceObserver } from 'perf_hooks';

import Ajv from 'ajv';
import chalk from 'chalk';

import schema from '../config-schema.json';
import { BasketryError, CliOutput, FileStatus, Violation } from '../types';
import { Engine, getInput } from '../engine';
import { CommmonArgs } from './types';
import * as perf from '../performance';

const ajv = new Ajv({ allErrors: false });
const runner = ajv.compile(schema);

export type GenerateArgs = {
  config: string;
  source?: string;
  parser?: string;
  rules?: string[];
  validate?: boolean;
  generators?: string[];
  output?: string;
  watch?: boolean;
} & CommmonArgs;

export async function generate(args: GenerateArgs) {
  const errors: BasketryError[] = [];
  const violations: Violation[] = [];
  let files: Record<string, FileStatus> = {};

  try {
    if (args.perf) perf.track();
    if (args.perf) performance.mark('basketry-start');

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
    } = args;
    const stdin = !process.stdin.isTTY;
    if (!json) bold(`🧺 Basketry v${require('../../package.json').version}`);

    const sourceContent = stdin
      ? await readStreamToString(process.stdin)
      : undefined;

    let watcher: StatWatcher | undefined = undefined;

    const go = async () => {
      const inputs = await getInput(config, {
        output,
        validate: false,
        generators,
        parser,
        rules,
        sourceContent,
        sourcePath: source,
      });
      errors.push(...inputs.errors);
      if (!json) printErrors(inputs.errors);

      // TODO: fail if multiplexed with stdin (#24)

      for (const input of inputs.values) {
        if (!json) console.log(info(`Parsing ${input.sourcePath}`));

        const pipeline = new Engine(
          input,
          json
            ? undefined
            : {
                onError: printError,
                onViolation: printViolation,
              },
        );

        performance.mark('run-start');

        pipeline.loadParser();
        pipeline.loadRules();
        if (!validate) pipeline.loadGenerators();
        pipeline.runParser();
        pipeline.runRules();
        if (!validate) pipeline.runGenerators();

        performance.mark('run-end');
        performance.measure('run', 'run-start', 'run-end');

        if (!validate) await pipeline.compareFiles();
        if (!validate) await pipeline.commitFiles();

        errors.push(...pipeline.errors);

        violations.push(...pipeline.violations);

        files = pipeline.changes;
        if (!json && !validate) printFiles(pipeline.changes);
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
    if (args.perf) {
      performance.measure('basketry', 'basketry-start', 'basketry-end');
    }

    const events = args.perf ? await perf.drain() : [];

    if (args.json) {
      const cliOutput: CliOutput = { errors, violations, files };
      if (args.perf) cliOutput.perf = events as any;
      console.log(JSON.stringify(cliOutput));
    } else {
      if (args.perf) printPerformance(events);
      if (error.length) process.exit(1);
    }
  }
}

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

function printError(e: BasketryError): void {
  console.error();
  console.error(e);
}

function printViolation(violation: Violation, line: string): void {
  const { start, end } = violation.range;
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
        case 'removed':
          console.log(chalk.bold.red(`- ${file}`));
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

function printPerformance(events: PerformanceEntry[]) {
  console.log();
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
  console.log();
}

function pad(text: string, length: number): string {
  return `${text}${' '.repeat(length)}`.substring(0, length);
}
