#!/usr/bin/env node

import { hideBin } from 'yargs/helpers';
import yargs = require('yargs/yargs');
import chalk from 'chalk';

import { ci, clean, diff, generate, validate } from './commands';
import { Severity } from './types';

const { argv } = yargs(hideBin(process.argv))
  .strictCommands()
  .version(chalk.bold(`🧺 Basketry v${require('../package.json').version}`))
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
  })
  .command(
    ['generate', '*'],
    'Generates files from a service definition',
    (y) => {
      return y
        .option('config', {
          alias: 'c',
          string: true,
          description:
            'Path to the config file. Defaults to basketry.conifg.json.',
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
        .option('validate', {
          alias: 'v',
          deprecated: 'Use the "validate" command.',
          boolean: true,
          default: false,
          description:
            'Only validates the source document without writing any files.',
          nargs: 0,
        })
        .option('watch', {
          alias: 'w',
          boolean: true,
          description: 'Recreates the output each time the input file changes.',
          nargs: 0,
        });
    },
    (args) => {
      const {
        config,
        parser,
        source,
        output,
        generators,
        rules,
        watch,
        validate: v,
        json,
        perf,
      } = args;
      generate({
        config,
        parser,
        source,
        output,
        generators,
        rules,
        watch,
        validate: v,
        json,
        perf,
      });
    },
  )
  .command(
    'clean',
    'Remove all generated files',
    (y) => {
      return y
        .option('config', {
          alias: 'c',
          string: true,
          description:
            'Path to the config file. Defaults to basketry.conifg.json.',
          default: 'basketry.config.json',
          requiresArg: true,
        })
        .option('output', {
          alias: 'o',
          string: true,
          description:
            'Path of the output folder. Writes to the current working directory if omitted and config is not found.',
          requiresArg: true,
        });
    },
    (args) => {
      const { config, output, json, perf } = args;
      clean({
        config,
        output,
        json,
        perf,
      });
    },
  )
  .command(
    ['validate'],
    'Validates the source document without generating any files',
    (y) => {
      return y
        .option('config', {
          alias: 'c',
          string: true,
          description:
            'Path to the config file. Defaults to basketry.conifg.json.',
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
        .option('rules', {
          alias: 'r',
          string: true,
          array: true,
          description: `Rules`,
          requiresArg: true,
        });
    },
    (args) => {
      const { config, parser, source, rules, json, perf } = args;
      validate({ config, parser, source, rules, json, perf });
    },
  )
  .command(
    ['diff <reference>'],
    'Compares the service definition with another version and returns the differences.',
    (y) => {
      return y
        .positional('reference', {
          string: true,
          description: 'Path to the original file to compare against',
          requiresArg: true,
        })
        .option('config', {
          alias: 'c',
          string: true,
          description:
            'Path to the config file. Defaults to basketry.conifg.json.',
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
        .option('filter', {
          string: true,
          default: 'all',
          choices: ['major', 'minor', 'patch', 'all'],
          description: 'Output breaking changes (semver major version).',
        })
        .option('silent', {
          boolean: true,
          default: false,
          description:
            "Don't output any changes. (Still exits with non-zero code on breaking changes.)",
          nargs: 0,
        });
    },
    (args) => {
      const { config, parser, source, json, silent, filter, reference } = args;
      diff({
        config,
        parser,
        source,
        json,
        silent,
        filter: filter as 'all' | 'major' | 'minor' | 'patch',
        reference: reference as any,
      });
    },
  )
  .command(
    ['ci'],
    'af',
    (y) => {
      return y
        .option('severity', {
          string: true,
          description:
            'The minimum violation severity level that will fail the command.',
          default: 'warning',
          requiresArg: true,
          choices: ['error', 'warning', 'info'],
        })
        .option('config', {
          alias: 'c',
          string: true,
          description:
            'Path to the config file. Defaults to basketry.conifg.json.',
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
        });
    },
    (args) => {
      const {
        severity,
        config,
        parser,
        source,
        output,
        generators,
        rules,
        json,
      } = args;

      const sev = severity as unknown as Severity;

      ci({
        severity: sev,
        config,
        parser,
        source,
        output,
        generators,
        rules,
        json,
      });
    },
  );
