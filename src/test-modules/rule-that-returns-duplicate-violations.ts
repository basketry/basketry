import { decodeRange } from '../helpers';
import { Rule, Violation } from '../types';

const rule: Rule = (_, sourcePath, options) => {
  const violation: Violation = {
    code: 'rule-that-returns-duplicate-violations',
    message: 'some message',
    range: {
      start: {
        offset: 2000,
        line: 30,
        column: 100,
      },
      end: {
        offset: 2100,
        line: 30,
        column: 200,
      },
    },
    severity: options?.severity || 'error',
    sourcePath,
  };

  return [violation, violation, violation, violation];
};

export default rule;
