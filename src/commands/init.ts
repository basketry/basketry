import { writeFile } from 'fs/promises';
import { Config } from '../types';

import { join } from 'path';

export type CiArgs = {
  json: boolean;
  config: string;
  source?: string;
  parser?: string;
  rules?: string[];
  generators?: string[];
  output?: string;
};

export async function init(args: CiArgs) {
  const config: Config = {
    source: args?.source || '',
    parser: args?.parser || '',
    rules: args?.rules || [],
    generators: args?.generators || [],
    output: args?.output || '',
    options: { basketry: {} },
  };

  const path = join(process.cwd(), args.config);

  const data = JSON.stringify(config, null, 2);

  await writeFile(path, `${data}\n`);

  if (args.json) console.log(data);
}
