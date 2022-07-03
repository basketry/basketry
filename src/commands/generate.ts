import { readFileSync, StatWatcher, watchFile } from 'fs';
import { EOL } from 'os';
import { performance, PerformanceEntry, PerformanceObserver } from 'perf_hooks';

import Ajv from 'ajv';
import chalk from 'chalk';

import schema from '../config-schema.json';
import { BasketryError, CliOutput, FileStatus, Violation } from '../types';
import { Engine, getInput } from '../engine';
import { CommmonArgs } from './types';

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
    } = args;
    j = json || false;
    p = perf || false;

    if (perf) performanceObserver.observe({ type: 'measure' });

    performance.mark('basketry-start');
    const stdin = !process.stdin.isTTY;
    if (!j) bold(`🧺 Basketry v${require('../../package.json').version}`);

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
      if (!j) printErrors(inputs.errors);

      // TODO: fail if multiplexed with stdin (#24)

      for (const input of inputs.values) {
        if (!j) console.log(info(`Parsing ${input.sourcePath}`));

        const pipeline = new Engine(input);

        performance.mark('run-start');

        pipeline.loadParser();
        pipeline.loadRules();
        pipeline.loadGenerators();
        pipeline.runParser();
        pipeline.runRules();
        pipeline.runGenerators();

        performance.mark('run-end');
        performance.measure('run', 'run-start', 'run-end');

        await pipeline.compareFiles();
        await pipeline.commitFiles();

        errors.push(...pipeline.errors);
        if (!j) printErrors(pipeline.errors);

        violations.push(...pipeline.violations);
        if (!j) printViolations(pipeline.violations, validate || false);

        files = pipeline.changes;
        if (!j && !validate) printFiles(pipeline.changes);
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

function printViolations(violations: Violation[], validateOnly: boolean): void {
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
  } else if (validateOnly) {
    console.log(info('No violations'));
    console.log();
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
