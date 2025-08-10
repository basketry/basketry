import { decodeRange } from '../helpers';
import { Rule } from '../types';

const rule: Rule = (serivce, options) => {
  const { range, sourceIndex } = decodeRange(null);
  return [
    {
      code: 'rule-that-takes-options',
      message: JSON.stringify(options),
      range,
      severity: options?.severity || 'error',
      sourcePath: serivce.sourcePaths[sourceIndex],
    },
  ];
};

export default rule;
