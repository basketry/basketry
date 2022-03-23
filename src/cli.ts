#!/usr/bin/env node

import { readFile, writeFile, mkdir } from 'fs/promises';
import { watchFile } from 'fs';
import { join, sep } from 'path';

import * as chalk from 'chalk';
import yargs = require('yargs/yargs');
import { hideBin } from 'yargs/helpers';
import {
  Config,
  File,
  Generator,
  GeneratorOptions,
  Parser,
  Service,
} from './types';

const { argv } = yargs(hideBin(process.argv))
  .option('config', {
    alias: 'c',
    string: true,
    description: 'Path to the config file. Defaults to basketry.conifg.json.',
    default: 'basketry.config.json',
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
    description: `Generators`,
    requiresArg: true,
  })
  .option('watch', {
    alias: 'w',
    boolean: true,
    description: 'Recreates the output each time the input file changes.',
    nargs: 0,
  });

(async () => {
  try {
    const { config: configPath, source, output, watch } = await argv;

    const config = await getConfig(configPath);

    const sdlPath = source || config.source;

    if (watch && !sdlPath) {
      throw new Error('Must specify source when running in watch mode.');
    }

    const x = output || config.output || '';
    const outputPath = x.startsWith('/') ? x.substring(1) : x;

    let sdl: string | undefined;

    if (sdlPath) {
      sdl = (await readFile(sdlPath)).toString('utf8');
    } else if (!process.stdin.isTTY) {
      sdl = await readStreamToString(process.stdin);
    } else {
      throw new Error('No input file provided and nothing to read from stdin');
    }

    if (sdl) {
      const parser = getParser(config.parser);
      const generators = getGenerators(config.generators);

      console.log(
        chalk.bold(`🧺 Basketry v${require('../package.json').version}`),
      );
      console.log(chalk.blue(`Parsing ${sdlPath}`));
      let service: Service | null = null;
      try {
        service = parser(sdl);
      } catch (ex) {
        error(`Error parsing file`, ex);
      }
      if (service) {
        const wrote = await doGenerate(outputPath, service, generators);

        if (!wrote) {
          console.log(chalk.blue('Nothing to do'));
        }
      }

      if (watch && sdlPath) {
        console.log();
        console.log('Waiting for changes...');
        console.log();
        watchFile(sdlPath, async () => {
          const newSdl = (await readFile(sdlPath)).toString('utf8');
          let newService: Service | null;

          try {
            newService = parser(newSdl);
          } catch (ex) {
            newService = null;
            error(`Error parsing file`, ex);
            console.log();
            console.log('Waiting for changes...');
            console.log();
          }

          if (newService) await doGenerate(outputPath, newService, generators);
        });
      }
    }
  } catch (ex) {
    console.error('Did not generate server types', ex.message);
    process.exit(1);
  }
})();

async function doGenerate(
  output: string,
  service: Service,
  generators: Generator[],
): Promise<boolean> {
  let wrote = false;
  for (const file of getFiles(service, generators)) {
    wrote = (await write(file, output)) || wrote;
  }
  return wrote;
}

async function getConfig(path: string): Promise<Config> {
  try {
    return JSON.parse(
      ((await readFile(join(process.cwd(), path))) || {}).toString(),
    );
  } catch {}

  try {
    return JSON.parse(
      ((await readFile(join(__dirname, path))) || {}).toString(),
    );
  } catch {}

  try {
    return JSON.parse(((await readFile(path)) || {}).toString());
  } catch {}

  return {
    parser: '',
    generators: [],
  };
}

function getParser(moduleName: string): Parser {
  const parserModule = require(moduleName);

  if (typeof parserModule === 'function') return parserModule;
  if (typeof parserModule.default === 'function') return parserModule.default;

  throw new Error(`${moduleName} is not a valid parser`);
}

function getGenerators(
  moduleNames: (string | GeneratorOptions)[],
): Generator[] {
  return moduleNames.map((x) => {
    const moduleName = typeof x === 'string' ? x : x.generator;
    const parserModule = require(moduleName);

    if (typeof parserModule === 'function') return parserModule;
    if (typeof parserModule.default === 'function') return parserModule.default;

    throw new Error(`${moduleName} is not a valid parser`);
  });
}

function* getFiles(service: Service, generators: Generator[]): Iterable<File> {
  for (const generator of generators) {
    yield* generator(service);
  }
}

async function readStreamToString(stream: NodeJS.ReadStream) {
  const chunks: any[] = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

async function write(file: File, output: string): Promise<boolean> {
  const path = join(...output.split(sep), ...file.path);

  let previous: string | null;
  try {
    previous = (await readFile(path)).toString();
  } catch {
    previous = null;
    await mkdir(join(...path.split(sep).slice(0, -1)), { recursive: true });
  }

  if (file.contents === previous) return false;

  try {
    await writeFile(path, file.contents);

    if (previous === null) {
      console.log(chalk.green(`+ ${path}`));
    } else {
      console.log(chalk.green(`m ${path}`));
    }
    return true;
  } catch (ex) {
    error(`Error writing ${path}`, ex.message);
    return false;
  }
}

function error(...lines: string[]): void {
  console.error();
  for (const line of lines) {
    console.error(chalk.bold.red(line));
  }
  console.error();
}