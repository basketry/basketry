import { exec } from 'child_process';

import { BasketryError, LegacyEngine, getInput } from '..';
import { CommmonArgs } from './types';

import { diff as compare } from '../diff';

import { relative } from 'path';
import { prettyPrint } from '../diff/pretty-print';

export type DiffArgs = {
  config: string;
  source?: string;
  parser?: string;
  json?: boolean;
  silent?: boolean;
  filter: 'major' | 'minor' | 'patch' | 'all';
  previous?: string;
  ref?: string;
} & CommmonArgs;

export function readFromGit(
  sourcePath: string,
  ref: string | undefined,
): Promise<string | undefined> {
  return new Promise((res, rej) => {
    if (ref) {
      relative(process.cwd(), sourcePath);

      exec(
        `git show ${ref}:${relative(process.cwd(), sourcePath)}`,
        (err, stdout, stderr) => {
          if (err) rej(err);
          if (stderr) rej(stderr);
          res(stdout);
        },
      );
    } else {
      res(undefined);
    }
  });
}

export async function diff(args: DiffArgs) {
  const errors: BasketryError[] = [];
  const { config, parser, source, json, silent, filter, previous, ref } = args;

  const stdin = !process.stdin.isTTY;
  const sourceContent = stdin
    ? await readStreamToString(process.stdin)
    : undefined;

  const b_inputs = await getInput(config, {
    parser,
    sourcePath: source,
  });

  const a_sourceContent = previous
    ? undefined
    : sourceContent || (await readFromGit(b_inputs.values[0].sourcePath, ref));

  const [a_inputs] = await Promise.all([
    getInput(config, {
      parser,
      sourceContent: a_sourceContent,
      sourcePath: previous || (sourceContent ? source : undefined),
    }),
  ]);

  errors.push(...a_inputs.errors);
  errors.push(...b_inputs.errors);

  for (const err of errors) {
    console.error(err);
  }

  // TODO: ensure that a and b only have one value each

  const a = new LegacyEngine(a_inputs.values[0], { onError: console.error });
  a.loadParser();
  await a.runParser();

  const b = new LegacyEngine(b_inputs.values[0], { onError: console.error });
  b.loadParser();
  await b.runParser();

  if (a.service && b.service) {
    const changes = compare(a.service, b.service);
    const majorChanges = changes.filter(
      (change) => change.category === 'major',
    );
    const minorChanges = changes.filter(
      (change) => change.category === 'minor',
    );
    const patchChanges = changes.filter(
      (change) => change.category === 'patch',
    );

    if (!silent) {
      if (json) {
        if (filter === 'all' || filter === 'patch') {
          console.log(
            JSON.stringify([...majorChanges, ...minorChanges, ...patchChanges]),
          );
        } else if (filter === 'minor') {
          console.log(JSON.stringify([...majorChanges, ...minorChanges]));
        } else {
          console.log(JSON.stringify(majorChanges));
        }
      } else {
        if (filter === 'all' || filter === 'patch') {
          prettyPrint([...majorChanges, ...minorChanges, ...patchChanges]);
        } else if (filter === 'minor') {
          prettyPrint([...majorChanges, ...minorChanges]);
        } else {
          prettyPrint(majorChanges);
        }
      }
    }

    if (majorChanges.length) process.exit(1);
  }
}

async function readStreamToString(stream: NodeJS.ReadStream) {
  const chunks: any[] = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}
