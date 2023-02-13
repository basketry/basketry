#!/usr/bin/env node

import { hideBin } from 'yargs/helpers';
import yargs = require('yargs/yargs');
import chalk from 'chalk';

import { ci, clean, diff, generate, init, validate } from './commands';
import { Severity } from './types';

import {
  ciArgs,
  cleanArgs,
  diffArgs,
  generateArgs,
  initArgs,
  validateArgs,
} from './args';

const { argv } = yargs(hideBin(process.argv))
  .strictCommands()
  .version(chalk.bold(`🧺 Basketry v${require('../package.json').version}`))
  .command(
    'init',
    'Initializes a new Basketry project',
    (y) => y.options(initArgs),
    (args) => init(args),
  )
  .command(
    ['generate', '*'],
    'Generates files from a service definition',
    (y) => y.options(generateArgs),
    (args) => generate(args),
  )
  .command(
    'clean',
    'Remove all generated files',
    (y) => y.options(cleanArgs),
    (args) => clean(args),
  )
  .command(
    ['ci'],
    'af',
    (y) => y.options(ciArgs),
    (args) => {
      const { severity, ...rest } = args;

      const sev = severity as unknown as Severity;

      ci({
        severity: sev,
        ...rest,
      });
    },
  )
  .command(
    ['diff'],
    'Compares the service definition with another version and returns the differences.',
    (y) => {
      return y.options(diffArgs);
    },
    (args) => {
      const { filter, ...rest } = args;
      diff({
        ...rest,
        filter: filter as 'all' | 'major' | 'minor' | 'patch',
      });
    },
  )
  .command(
    ['validate'],
    'Validates the source document without generating any files',
    (y) => y.options(validateArgs),
    (args) => validate(args),
  );
