import { EOL } from 'os';
import { join, relative } from 'path';
import {
  ApiKeyScheme,
  BasicScheme,
  Method,
  OAuth2Scheme,
  SecurityScheme,
  ValidationRule,
} from './ir';
import { File, Range } from './types';

export function hasParameters(method: Method): boolean {
  return !!method.parameters.length;
}

export function hasRequiredParameters(method: Method): boolean {
  return method.parameters.some((p) => isRequired(p.value));
}

export function hasOptionalParameters(method: Method): boolean {
  return method.parameters.some((p) => !isRequired(p.value));
}

export function hasOnlyRequiredParameters(method: Method): boolean {
  return hasRequiredParameters(method) && !hasOptionalParameters(method);
}

export function hasOnlyOptionalParameters(method: Method): boolean {
  return !hasRequiredParameters(method) && hasOptionalParameters(method);
}

export function isRequired(obj: { rules?: ValidationRule[] }): boolean {
  return !!obj.rules?.some((r) => r.id === 'Required');
}

export function isEnum(obj: { rules: ValidationRule[] }): boolean {
  return obj.rules.some((r) => r.id === 'StringEnum');
}

export { encodeRange, decodeRange } from './range';
