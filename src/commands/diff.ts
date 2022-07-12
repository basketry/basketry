import { BasketryError, Engine, getInput } from '..';
import { CommmonArgs } from './types';

import { diff as compare } from '../diff';

export type DiffArgs = {
  config: string;
  source?: string;
  parser?: string;
  reference?: string;
} & CommmonArgs;

export async function diff(args: DiffArgs) {
  console.log('diff', args);
  const errors: BasketryError[] = [];
  const { config, parser, source, reference } = args;

  const stdin = !process.stdin.isTTY;
  const sourceContent = stdin
    ? await readStreamToString(process.stdin)
    : undefined;

  const [a_inputs, b_inputs] = await Promise.all([
    getInput(config, {
      parser,
      sourcePath: reference,
    }),
    getInput(config, {
      parser,
      sourceContent,
      sourcePath: source,
    }),
  ]);

  errors.push(...a_inputs.errors);
  errors.push(...b_inputs.errors);

  for (const error of errors) {
    console.error(error);
  }

  // TODO: ensure that a and b only have one value each

  const a = new Engine(a_inputs.values[0], { onError: console.error });
  a.loadParser();
  a.runParser();

  const b = new Engine(b_inputs.values[0], { onError: console.error });
  b.loadParser();
  b.runParser();

  if (a.service && b.service) {
    console.log(JSON.stringify(compare(a.service, b.service), null, 2));
  }
}

async function readStreamToString(stream: NodeJS.ReadStream) {
  const chunks: any[] = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}
