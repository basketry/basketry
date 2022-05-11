import { Parser } from '../types';

const parser: Parser = () => {
  return {
    service: {
      basketry: '7',
      interfaces: [{ foo: 'bar' }],
      not: 'a valid service',
    } as any,
    violations: [],
  };
};

export default parser;
