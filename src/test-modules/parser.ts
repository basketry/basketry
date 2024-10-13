import { Parser } from '../types';

let parser: Parser = () => {
  return {
    service: {
      kind: 'Service',
      basketry: '0.2',
      title: { kind: 'StringLiteral', value: 'test' },
      majorVersion: { kind: 'IntegerLiteral', value: 1 },
      sourcePaths: ['#'],
      interfaces: [],
      types: [],
      enums: [],
      unions: [],
      loc: '0:0;0;0',
    },
    violations: [],
  };
};

export function setParser(value: Parser) {
  parser = value;
}

export default parser;
