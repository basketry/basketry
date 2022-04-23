import { Method, ValidationRule } from './types';

export function hasParameters(method: Method): boolean {
  return !!method.parameters.length;
}

export function hasRequiredParameters(method: Method): boolean {
  return method.parameters.some((p) => isRequired(p));
}

export function hasOptionalParameters(method: Method): boolean {
  return method.parameters.some((p) => !isRequired(p));
}

export function hasOnlyRequiredParameters(method: Method): boolean {
  return hasRequiredParameters(method) && !hasOptionalParameters(method);
}

export function hasOnlyOptionalParameters(method: Method): boolean {
  return !hasRequiredParameters(method) && hasOptionalParameters(method);
}

export function isRequired(obj: { rules: ValidationRule[] }): boolean {
  return obj.rules.some((r) => r.id === 'required');
}

export function isEnum(obj: { rules: ValidationRule[] }): boolean {
  return obj.rules.some((r) => r.id === 'string-enum');
}
