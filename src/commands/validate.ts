import { generate } from '.';
import { CommmonArgs } from './types';

export type ValidateArgs = {
  engine?: string;
  config: string;
  source?: string;
  parser?: string;
  rules?: string[];
} & CommmonArgs;

export async function validate(args: ValidateArgs) {
  generate({ ...args, validate: true });
}
