import Ajv from 'ajv';
import schema from './schema.json';
import { BasketryError, Service } from './types';

const ajv = new Ajv({ allErrors: true });
const runner = ajv.compile(schema);

export function validate(service: any): {
  service: Service | undefined;
  errors: BasketryError[];
} {
  const errors: BasketryError[] = [];

  const isValid = runner(service);

  if (!isValid) {
    for (const error of runner.errors || []) {
      const message = `Invalid IR: \`#${error.instancePath}\` ${error.message}`;

      errors.push({
        code: 'PARSER_ERROR',
        message,
      });
    }
    return { service: undefined, errors };
  }

  return { service: service as Service, errors };
}
