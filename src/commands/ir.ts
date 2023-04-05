import { performance } from 'perf_hooks';

import { BasketryError, PerfEvent } from '../types';
import { Engine, getInput } from '../engine';
import * as perf from '../performance';

import { CommmonArgs } from './types';

import { error, readStreamToString } from '../private-utils';
import { Service } from '../ir';

export type CliOutput = {
  errors: BasketryError[];
  service?: Service;
  perf?: PerfEvent[];
};

export type GenerateArgs = {
  config: string;
  source?: string;
  parser?: string;
} & CommmonArgs;

export async function ir(args: GenerateArgs) {
  const errors: BasketryError[] = [];
  let service: Service | undefined;

  try {
    if (args.perf) perf.track();
    if (args.perf) performance.mark('basketry-start');

    const { config, parser, source } = args;
    const stdin = !process.stdin.isTTY;

    const sourceContent = stdin
      ? await readStreamToString(process.stdin)
      : undefined;

    const go = async () => {
      const inputs = await getInput(config, {
        validate: false,
        parser,
        sourceContent,
        sourcePath: source,
      });
      errors.push(...inputs.errors);

      // TODO: fail if multiplexed with stdin (#24)

      for (const input of inputs.values) {
        const pipeline = new Engine(input);

        performance.mark('run-start');

        pipeline.loadParser();
        pipeline.runParser();

        performance.mark('run-end');
        performance.measure('run', 'run-start', 'run-end');

        errors.push(...pipeline.errors);

        service = pipeline.service;
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

    const cliOutput: CliOutput = { errors, service };
    if (args.perf) cliOutput.perf = events as any;
    console.log(JSON.stringify(cliOutput));
  }
}
