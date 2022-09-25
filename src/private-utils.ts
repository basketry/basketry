import { PerformanceEntry } from 'perf_hooks';

import Ajv from 'ajv';
import chalk from 'chalk';

import { BasketryError, FileStatus, Violation } from './types';

import schema from './config-schema.json';

export async function readStreamToString(stream: NodeJS.ReadStream) {
  const chunks: any[] = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

export function bold(message: string): void {
  console.log(chalk.bold(message));
}

export function info(...text: unknown[]) {
  return chalk.blueBright(text);
}

export function warning(...text: unknown[]) {
  return chalk.yellow(text);
}

export function error(...lines: string[]): void {
  console.error();
  for (const line of lines) {
    console.error(chalk.bold.red(line));
  }
  console.error();
}

export function printViolation(violation: Violation, line: string): void {
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

export function printPerformance(events: PerformanceEntry[]) {
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

export function printError(e: BasketryError): void {
  console.error();
  console.error(e);
}

export function printErrors(errors: BasketryError[]): void {
  for (const e of errors) printError(e);
}

export function printFiles(files: Record<string, FileStatus>): void {
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

function pad(text: string, length: number): string {
  return `${text}${' '.repeat(length)}`.substring(0, length);
}

const ajv = new Ajv({ allErrors: false });
const runner = ajv.compile(schema);
export function validateConfig(service: any): boolean {
  return runner(service);
}
