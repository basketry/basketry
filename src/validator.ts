import Ajv from 'ajv';
import schema from './schema.json';

const ajv = new Ajv({ allErrors: true });
const runner = ajv.compile(schema);

export function validate(service: any) {
  return runner(service) ? [] : runner.errors || [];
}
