import { BasketryError, decodeRange, Engine, getInput, Range } from '..';
import { CommmonArgs } from './types';

import { ChangeInfo, diff as compare } from '../diff';
import { sentence } from 'case';
import chalk from 'chalk';
import { EOL } from 'os';

export type DiffArgs = {
  config: string;
  source?: string;
  parser?: string;
  json?: boolean;
  silent?: boolean;
  major?: boolean;
  minor?: boolean;
  patch?: boolean;
  reference?: string;
} & CommmonArgs;

export async function diff(args: DiffArgs) {
  const errors: BasketryError[] = [];
  const {
    config,
    parser,
    source,
    json,
    silent,
    major,
    minor,
    patch,
    reference,
  } = args;

  const stdin = !process.stdin.isTTY;
  const sourceContent = stdin
    ? await readStreamToString(process.stdin)
    : undefined;

  const [a_inputs, b_inputs] = await Promise.all([
    getInput(config, {
      parser,
      sourcePath: reference,
    }),
    getInput(config, {
      parser,
      sourceContent,
      sourcePath: source,
    }),
  ]);

  errors.push(...a_inputs.errors);
  errors.push(...b_inputs.errors);

  for (const err of errors) {
    console.error(err);
  }

  // TODO: ensure that a and b only have one value each

  const a = new Engine(a_inputs.values[0], { onError: console.error });
  a.loadParser();
  a.runParser();

  const b = new Engine(b_inputs.values[0], { onError: console.error });
  b.loadParser();
  b.runParser();

  if (a.service && b.service) {
    const changes = compare(a.service, b.service);
    const majorChanges = changes.filter(
      (change) => change.category === 'major',
    );
    const minorChanges = changes.filter(
      (change) => change.category === 'minor',
    );
    const patchChanges = changes.filter(
      (change) => change.category === 'patch',
    );

    if (!silent) {
      if (json) {
        if (patch) {
          console.log(
            JSON.stringify([...majorChanges, ...minorChanges, ...patchChanges]),
          );
        } else if (minor) {
          console.log(JSON.stringify([...majorChanges, ...minorChanges]));
        } else {
          console.log(JSON.stringify(majorChanges));
        }
      } else {
        if (patch) {
          console.log(
            JSON.stringify(
              [...majorChanges, ...minorChanges, ...patchChanges],
              null,
              2,
            ),
          );
        } else if (minor) {
          console.log(
            JSON.stringify([...majorChanges, ...minorChanges], null, 2),
          );
        } else {
          console.log(JSON.stringify(majorChanges, null, 2));
        }
      }
    }

    if (majorChanges.length) process.exit(1);
  }
}
const _contentBySource = new Map<string, string[]>();
function getLine(
  sourcePath: string,
  sourceContent: string,
  lineNumber: number,
): string {
  if (!_contentBySource.has(sourcePath)) {
    _contentBySource.set(sourcePath, sourceContent.split(EOL));
  }
  return _contentBySource.get(sourcePath)![lineNumber - 1];
}

async function readStreamToString(stream: NodeJS.ReadStream) {
  const chunks: any[] = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

function info(...text: unknown[]) {
  return chalk.blueBright(text);
}

function warning(...text: unknown[]) {
  return chalk.yellow(text);
}

function error(...text: unknown[]) {
  return chalk.redBright(text);
}

function printLine(
  range: Range,
  line: string,
  sourcePath: string,
  s: 'error' | 'warning' | 'info',
) {
  const { start, end } = range;
  const violationLength =
    start.line === end.line
      ? end.column - start.column
      : line.length - start.column + 1;

  console.error();
  console.error(
    `${chalk.cyan(sourcePath)}:${warning(start.line)}:${warning(start.column)}`,
  );
  let severity: string;
  let underline: string;

  switch (s) {
    case 'info':
      severity = info(s);
      underline = info('~'.repeat(violationLength));
      break;
    case 'warning':
      severity = warning(s);
      underline = warning('~'.repeat(violationLength));
      break;
    case 'error':
      severity = error(s);
      underline = error('~'.repeat(violationLength));
      break;
  }

  console.error(`${chalk.bgWhite.black(start.line)}${line}`);
  console.error(
    `${chalk.bgWhite.black(' '.repeat(`${start.line}`.length))}${' '.repeat(
      start.column - 1,
    )}${underline}`,
  );
}

function description(change: ChangeInfo): string {
  const x = (suffix: string) => sentence(`${change.kind} ${suffix}`);

  switch (change.target) {
    case 'array-max-items':
      return x('maximum array length');
    case 'array-min-items':
      return x('minimum array length');
    case 'array-unique-items':
      return x('unique array items requirement');

    case 'number-gt':
      return x('number lower bound (inclusive)');
    case 'number-gte':
      return x('number lower bound (exclusive)');
    case 'number-lt':
      return x('number upper bound (inclusive)');
    case 'number-lte':
      return x('number upper bound (exclusive)');
    case 'number-multiple-of':
      return x('multiple');
    default:
      return x(sentence(change.target));
  }
}
