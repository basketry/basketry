import { Options } from 'yargs';

const jsonArg = {
  json: {
    alias: 'j',
    boolean: true as const,
    default: false,
    description:
      'Outputs the result of the command as a JSON-formatted object. If ommitted, the CLI will output human-readable progress, results, and pretty-printed errors to `stdout`.',
    nargs: 0,
  },
};
const perfArg = {
  perf: {
    boolean: true as const,
    default: false,
    description: 'Report performance',
    nargs: 0,
  },
};
const configArg = {
  config: {
    alias: 'c',
    string: true as const,
    description: 'Path to the config file.',
    default: 'basketry.config.json',
    requiresArg: true,
  },
};
const parserArg = {
  parser: {
    alias: 'p',
    string: true as const,
    description:
      'The parser thet corresponds to the source SDL file. This must be a string value that refers to a parser module. Any "requirable" value can be used such as globally or locally installed NPM package or the path to a file on your local file system.',
    requiresArg: true,
  },
};
const sourceArg = {
  source: {
    alias: 's',
    string: true as const,
    description:
      'Path to the source SDL file. Basketry reads from `stdin` if this option is omitted and `source` is not defined in the config file. Note that if a source parameter is provided _and_ content is piped in via `stdin`, the content from `stdin` will be parsed, but any violations will include the file name supplied by `source`. This can be useful to a validate dirty version of a file prior to the file being saved and only then accessible by reading from the file system.',
    requiresArg: true,
  },
};

const outputArg = {
  output: {
    alias: 'o',
    string: true as const,
    description:
      'All generated files will be written to the specified output directory. Some generators may elect to write files to a subdirectory within the main output directory. Writes to the current working directory if omitted and `output` is not defined in the config file.',
    requiresArg: true,
  },
};

const generatorsArg = {
  generators: {
    alias: 'g',
    string: true as const,
    array: true as const,
    description: `Generators`,
    requiresArg: true,
  },
};

const rulesArg = {
  rules: {
    alias: 'r',
    string: true as const,
    array: true as const,
    description: `Rules`,
    requiresArg: true,
  },
};

const validateArg = {
  validate: {
    alias: 'v',
    deprecated: 'Use the "validate" command.',
    boolean: true as const,
    default: false,
    description:
      'Only validates the source document without writing any files.',
    nargs: 0,
  },
};

const watchArg = {
  watch: {
    alias: 'w',
    boolean: true as const,
    description:
      "Recreates the output each time the input file changes. In watch mode, `source` must be specified (you can't pipe to `stdio`). Running in watch mode will immediately generate all output files and then update them on each subsequent change to the source SDL file.",
    nargs: 0,
  },
};

export const initArgs = {
  ...jsonArg,
  ...perfArg,
  ...configArg,
  ...parserArg,
  ...sourceArg,
};

export const generateArgs = {
  ...jsonArg,
  ...perfArg,
  ...configArg,
  ...parserArg,
  ...sourceArg,
  ...outputArg,
  ...generatorsArg,
  ...rulesArg,
  ...validateArg,
  ...watchArg,
};

export const cleanArgs = {
  ...jsonArg,
  ...perfArg,
  ...configArg,
  ...outputArg,
};

export const ciArgs = {
  ...jsonArg,
  ...configArg,
  ...parserArg,
  ...sourceArg,
  ...outputArg,
  ...generatorsArg,
  ...rulesArg,
  severity: {
    string: true as const,
    description:
      'The minimum violation severity level that will fail the command.',
    default: 'warning',
    requiresArg: true,
    choices: ['error', 'warning', 'info'],
  },
};

export const diffArgs = {
  ...jsonArg,
  ...configArg,
  ...parserArg,
  ...sourceArg,
  previous: {
    string: true as const,
    description: 'File path of the previous version to compare against.',
    conflicts: ['ref'],
  },
  ref: {
    string: true as const,
    description:
      'The git ref (eg. branch name, tag name, commit sha, etc) of the previous version to compare against.',
    conflicts: ['previous'],
  },
  filter: {
    string: true as const,
    default: 'all',
    choices: ['major', 'minor', 'patch', 'all'],
    description:
      'Specifies the _lowest_ semver change level to return. For example, if `major` is supplied, then only "breaking" changes will be returned. If `minor` is supplied, then both `major` and `minor` semver changes will be returned. A value of `all` ensures that all changes are returned, including the most trivial changes such as textual descriptions.',
  },
  silent: {
    boolean: true,
    default: false,
    description:
      "Don't output any changes. (Still exits with non-zero code on breaking changes.)",
    nargs: 0,
  },
};

export const validateArgs = {
  ...jsonArg,
  ...perfArg,
  ...configArg,
  ...parserArg,
  ...sourceArg,
  ...rulesArg,
};
