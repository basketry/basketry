import * as fsPromises from 'fs/promises';
import { relative, resolve } from 'path';

import chalk from 'chalk';

import { getInput } from '../engine';
import { BasketryError } from '../types';
import { CommmonArgs } from './types';

export type CleanArgs = {
  config: string;
  output?: string;
} & CommmonArgs;

export async function clean(args: CleanArgs) {
  console.log(
    chalk.bold(`🧺 Basketry v${require('../../package.json').version}`),
  );
  console.log();
  const errors: BasketryError[] = [];

  const { config, output } = args;

  const result = await getInput(config, fsPromises, { output });
  errors.push(...result.errors);

  const files: string[] = [];

  for (const input of result.values) {
    files.push(...(await getFiles(input.output)));
  }

  if (files.length) {
    let removed = 0;

    for (const file of files) {
      try {
        await fsPromises.unlink(file);
        console.log(chalk.bold.red(`- ${relative(process.cwd(), file)}`));
        removed++;
      } catch {
        console.log(chalk.gray(`? ${relative(process.cwd(), file)}`));
      }
    }

    console.log();
    console.log(`Removed ${removed} files.`);
  } else {
    console.log(`Nothing to do.`);
  }
  console.log();
}

async function getFiles(output?: string): Promise<string[]> {
  const root = resolve(process.cwd(), output || '');
  const path = resolve(root, '.gitattributes');

  let file: string | undefined;
  try {
    file = (await fsPromises.readFile(path)).toString();
  } catch {
    return [];
  }

  const generatedFiles = [
    ...file
      .split('\n')
      .map((line) => line.trim())
      .filter(
        (line) =>
          !line.startsWith('#') &&
          (line.endsWith('linguist-generated') ||
            line.endsWith('linguist-generated=true')),
      )
      .map((line) =>
        line.substring(0, line.indexOf('linguist-generated')).trim(),
      ),
    '.gitattributes',
  ].map((f) => resolve(root, f));

  return generatedFiles;
}
