import { decodeRange } from '../helpers';
import { Rule } from '../types';

const rule: Rule = (serivce, options) => {
  return [
    {
      code: 'rule-that-takes-options',
      message: JSON.stringify(options),
      range: decodeRange(null),
      severity: options?.severity || 'error',
      sourcePath: serivce.sourcePath,
    },
  ];
};

export default rule;
