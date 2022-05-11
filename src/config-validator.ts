import Ajv from 'ajv';
import schema from './config-schema.json';
import { BasketryError, Config } from './types';

const ajv = new Ajv({ allErrors: true });
const runner = ajv.compile(schema);

export function validateConfig(config: any): {
  value: Config | undefined;
  errors: BasketryError[];
} {
  const errors: BasketryError[] = [];

  const isValid = runner(config);

  if (!isValid) {
    for (const error of runner.errors || []) {
      errors.push({
        code: 'CONFIG_ERROR',
        message: error.message || 'no message',
      });
    }
    return { value: undefined, errors };
  }

  return { value: config as Config, errors };
}
