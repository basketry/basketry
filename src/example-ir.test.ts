import example from './example-ir.json';
import { validate } from './validator';

describe.skip('Example IR', () => {
  it('is valid', () => {
    const result = validate(example);

    expect(result.errors).toEqual([]);
  });
});
