import { StatWatcher, watchFile } from 'fs';
import { relative } from 'path';
import { performance } from 'perf_hooks';

import {
  BasketryError,
  CliOutput,
  EngineEvents,
  FileStatus,
  Violation,
} from '../types';
import { NodeEngine, RpcEngine } from '../engine';
import * as perf from '../performance';

import { CommmonArgs } from './types';

import {
  bold,
  error,
  info,
  printError,
  printErrors,
  printFiles,
  printPerformance,
  printViolation,
  readStreamToString,
  warning,
} from '../private-utils';

export type GenerateArgs = {
  engine?: string;
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
  const errors: BasketryError[] = [];
  const violations: Violation[] = [];
  let files: Record<string, FileStatus> = {};

  try {
    if (args.perf) perf.track();
    if (args.perf) performance.mark('basketry-start');

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
    } = args;
    const stdin = !process.stdin.isTTY;
    if (!json) bold(`🧺 Basketry v${require('../../package.json').version}`);

    const sourceContent = stdin
      ? await readStreamToString(process.stdin)
      : undefined;

    let watcher: StatWatcher | undefined = undefined;

    const go = async () => {
      const events: EngineEvents = json
        ? {}
        : {
            onError: printError,
            onViolation: printViolation,
          };

      const loadEngine = () => {
        if (args.engine === 'rpc') {
          if (!json) console.log(warning('Using experimental RPC engine\n'));
          return RpcEngine.load({
            configPath: config,
            ...events,
          });
        } else {
          return NodeEngine.load({
            configPath: config,
            output,
            generators,
            parser,
            rules,
            sourceContent,
            sourcePath: source,
            ...events,
          });
        }
      };

      const { engines: pipelines, errors: errorsMkII } = await loadEngine();

      errors.push(...errorsMkII);
      if (!json) printErrors(errorsMkII);

      // TODO: fail if multiplexed with stdin (#24)

      for (const pipeline of pipelines) {
        if (!json) {
          console.log(
            info(
              `Project: ${relative(
                process.cwd(),
                pipeline.resolve('./basketry.config.json'), // TODO: allow for custom config file names
              )}`,
            ),
          );
          console.log(
            info(`Source:  ${relative(process.cwd(), pipeline.sourcePath)}`),
          );
        }

        performance.mark('run-start');

        await pipeline.runParser();
        await pipeline.runRules();
        if (!validate) await pipeline.runGenerators();

        performance.mark('run-end');
        performance.measure('run', 'run-start', 'run-end');

        if (!validate) await pipeline.compareFiles();
        if (!validate) await pipeline.commitFiles();

        errors.push(...pipeline.errors);

        violations.push(...pipeline.violations);
        files = pipeline.changes;
        if (!json && !validate) {
          const changesWithRelativePaths = Object.fromEntries(
            Object.entries(pipeline.changes).map(([filepath, fileStatus]) => [
              relative(process.cwd(), pipeline.resolve(filepath)),
              fileStatus,
            ]),
          );

          printFiles(changesWithRelativePaths);
        }

        if (!json && pipeline.legacyModules.length) {
          console.log(
            `${pipeline.legacyModules.length} components were loaded as Node modules. This behavior is deprecated and will be removed in a future version.`,
          );
          console.log(
            'See: https://basketry.io/docs/deprecations#legacy-modules',
          );
          console.log();
          for (const legacyModule of pipeline.legacyModules) {
            console.log(` • ${legacyModule}`);
          }
          console.log();
        }
      }

      if (!watcher && watch && !stdin && !json) {
        for (const pipeline of pipelines) {
          let timer: NodeJS.Timeout | undefined = undefined;
          watcher = watchFile(pipeline.sourcePath, () => {
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
    if (args.perf) {
      performance.measure('basketry', 'basketry-start', 'basketry-end');
    }

    const events = args.perf ? await perf.drain() : [];

    if (args.json) {
      const cliOutput: CliOutput = { errors, violations, files };
      if (args.perf) cliOutput.perf = events as any;
      console.log(JSON.stringify(cliOutput));
    } else {
      if (args.perf) printPerformance(events);
      if (errors.length) process.exit(1);
    }
  }
}
