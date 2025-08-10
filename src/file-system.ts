import { PathLike } from 'fs';

export interface FileSystem {
  mkdir(
    path: PathLike,
    options?: { recursive?: boolean },
  ): Promise<string | undefined>;
  readFile(file: PathLike): Promise<string | Buffer>;
  unlink(file: PathLike): Promise<void>;
  writeFile(file: PathLike, data: string): Promise<void>;
}
