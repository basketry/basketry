import { Parser } from '../types';

let parser: Parser = () => {
  return {
    service: {
      basketry: '1',
      title: { value: 'test' },
      majorVersion: { value: 1 },
      sourcePath: 'overwritten.ext',
      interfaces: [],
      types: [],
      enums: [],
      unions: [],
      loc: '0;0;0',
    },
    violations: [],
  };
};

export function setParser(value: Parser) {
  parser = value;
}

export default parser;
