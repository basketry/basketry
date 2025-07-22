import { MemberValue, Method, ValidationRule } from './ir';

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

export function isRequired(obj: MemberValue): boolean {
  return !obj.isOptional?.value;
}

export { encodeRange, decodeRange } from './range';
