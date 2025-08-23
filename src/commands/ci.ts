import { relative } from 'path';

import chalk from 'chalk';

import { NodeEngine, RpcEngine } from '../engine';
import {
  BasketryError,
  CliOutput,
  EngineEvents,
  FileStatus,
  Severity,
  Violation,
} from '../types';
import {
  bold,
  error,
  info,
  printError,
  printErrors,
  printFiles,
  printViolation,
  readStreamToString,
  warning,
} from '../private-utils';

import { CommmonArgs } from './types';

export type CiArgs = {
  engine?: string;
  severity?: Severity;
  config: string;
  source?: string;
  parser?: string;
  rules?: string[];
  generators?: string[];
  output?: string;
} & CommmonArgs;

export async function ci(args: CiArgs) {
  const errors: BasketryError[] = [];
  const violations: Violation[] = [];
  let files: Record<string, FileStatus> = {};

  try {
    const { config, parser, source, output, generators, rules, json } = args;
    const stdin = !process.stdin.isTTY;
    if (!json) bold(`🧺 Basketry v${require('../../package.json').version}`);

    const sourceContent = stdin
      ? await readStreamToString(process.stdin)
      : undefined;

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
        if (!json)
          console.log(
            info(`Parsing ${relative(process.cwd(), pipeline.sourcePath)}`),
          );

        await pipeline.runParser();
        await pipeline.runRules();
        await pipeline.runGenerators();

        await pipeline.compareFiles();

        errors.push(...pipeline.errors);

        // violations.push(...pipeline.violations);

        files = pipeline.changes;
        if (!json) printFiles(pipeline.changes);

        const hasModifications = !!Object.keys(pipeline.changes).find(
          (key) => pipeline.changes[key] !== 'no-change',
        );

        const filteredViolations = pipeline.violations.filter((v) => {
          switch (args.severity) {
            case 'info':
              if (v.severity === 'info') return true;
            case 'warning':
              if (v.severity === 'warning') return true;
            case 'error':
            default:
              if (v.severity === 'error') return true;
          }
          return false;
        });

        if (
          hasModifications ||
          pipeline.errors.length ||
          filteredViolations.length
        ) {
          console.error(
            chalk.red('The project in its current state cannot be integrated:'),
          );
          if (hasModifications) {
            console.error(
              chalk.red(
                ' - Changes detected. Revert manual changes or re-run Basketry.',
              ),
            );
          }
          if (pipeline.errors.length) {
            console.error(
              chalk.red(
                ' - One or more errors occurred. Address the errors and re-run Basketry.',
              ),
            );
          }
          if (filteredViolations.length) {
            console.error(
              chalk.red(
                ' - One or more rule violations detected. Fix the violations in the source doc and re-run Basketry.',
              ),
            );
          }

          console.error();
          console.error(chalk.bold.red('Exiting with error code 1!'));
          console.error();
          process.exit(1);
        }
      }
    };

    await go();
  } catch (ex) {
    error('FATAL ERROR!', ex.message);
    process.exit(1);
  } finally {
    if (args.json) {
      const cliOutput: CliOutput = { errors, violations, files };
      console.log(JSON.stringify(cliOutput));
    } else {
      if (errors.length) process.exit(1);
    }
  }
}
