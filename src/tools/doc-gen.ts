import { Options } from 'yargs';
import { readFileSync, writeFileSync } from 'node:fs';

import {
  ciArgs,
  cleanArgs,
  diffArgs,
  generateArgs,
  initArgs,
  irArgs,
  validateArgs,
} from '../args';

writeCommand('init', initArgs);
writeCommand('generate', generateArgs);
writeCommand('validate', validateArgs);
writeCommand('clean', cleanArgs);
writeCommand('ci', ciArgs);
writeCommand('diff', diffArgs);
writeCommand('ir', irArgs);

function writeCommand(name: string, options: Record<string, Options>): void {
  const readme = readFileSync('./README.md').toString();

  const startSplit = `<!-- BEGIN GENERATED COMMAND ARGS: ${name} -->`;
  const endSplit = `<!-- END GENERATED COMMAND ARGS: ${name} -->`;

  const [before] = readme.split(startSplit);
  const [, after] = readme.split(endSplit);

  writeFileSync(
    'README.md',
    [
      before,
      startSplit,
      '\n',
      Array.from(buildCommand(options)).join('\n'),
      '\n',
      endSplit,
      after,
    ].join(''),
  );
}

function* buildCommand(options: Record<string, Options>): Iterable<string> {
  yield '### Options';

  for (const key of Object.keys(options).sort((a, b) => a.localeCompare(b))) {
    yield* buildOption(key, options[key]);
  }
}

function* buildOption(name: string, arg: Options): Iterable<string> {
  const type = buildType(arg);
  yield '';
  const display = arg.alias
    ? `\`--${name}\`, \`-${arg.alias}\``
    : `\`--${name}\``;
  yield `#### ${display} (${type})`;
  if (arg.description && !arg.default) {
    yield '';
    yield arg.description;
  } else if (!arg.description && arg.default) {
    yield '';
    yield `The default value is \`${arg.default}\`.`;
  } else if (arg.description && arg.default) {
    yield `${arg.description} The default value is \`${arg.default}\`.`;
  }

  if (arg.choices) {
    yield '';
    yield 'Possible values:';
    yield '';
    for (const value of arg.choices) {
      yield `  - \`${value}\``;
    }
  }

  if (arg.conflicts) {
    yield '';

    if (Array.isArray(arg.conflicts)) {
      yield `Note: cannot be used with ${arg.conflicts
        .map((x) => `\`--${x}\``)
        .join(', ')}.`;
    } else {
      yield `Note: cannot be used with \`${arg.conflicts}\`.`;
    }
  }
}

function buildType(arg: Options): string {
  if (arg.boolean) return 'boolean';
  if (arg.number) return 'number';
  if (arg.string) return 'string';
  return 'any';
}
