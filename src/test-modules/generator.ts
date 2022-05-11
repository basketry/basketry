import { File, Generator } from '../types';

let files: File[] = [];

export function setFiles(value: File[]): void {
  files = value;
}

const generator: Generator = () => {
  return files;
};

export default generator;
