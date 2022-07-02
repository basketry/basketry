#!/usr/bin/env node

import { hideBin } from 'yargs/helpers';
import yargs = require('yargs/yargs');
import chalk from 'chalk';

import { clean, generate, validate } from './commands';

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
  );
