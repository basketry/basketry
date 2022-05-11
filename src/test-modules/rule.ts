import { Rule, Violation } from '../types';

let violations: Violation[] = [];

export function setViolations(value: Violation[]): void {
  violations = value;
}

const rule: Rule = () => {
  return violations;
};

export default rule;
