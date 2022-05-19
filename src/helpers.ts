import {
  ApiKeyScheme,
  BasicScheme,
  Method,
  OAuth2Scheme,
  Range,
  SecurityScheme,
  ValidationRule,
} from './types';

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

export function isBasicScheme(scheme: SecurityScheme): scheme is BasicScheme {
  return scheme.type.value === 'basic';
}

export function isApiKeyScheme(scheme: SecurityScheme): scheme is ApiKeyScheme {
  return scheme.type.value === 'apiKey';
}

export function isOAuth2Scheme(scheme: SecurityScheme): scheme is OAuth2Scheme {
  return scheme.type.value === 'oauth2';
}

export function encodeRange(range: Range): string {
  if (range.start.offset === range.end.offset) {
    return [range.start.line, range.start.column, range.start.offset].join(';');
  } else if (range.start.line === range.end.line) {
    return [
      range.start.line,
      range.start.column,
      range.end.column,
      range.start.offset,
      range.end.offset,
    ].join(';');
  } else {
    return [
      range.start.line,
      range.start.column,
      range.end.line,
      range.end.column,
      range.start.offset,
      range.end.offset,
    ].join(';');
  }
}

export function decodeRange(range: string | null | undefined): Range {
  if (!range) return decodeRange('0;0;0');

  const parts = range.split(';').map((x) => Number(x));

  if (parts.length === 6) {
    return {
      start: {
        line: parts[0],
        column: parts[1],
        offset: parts[4],
      },
      end: {
        line: parts[2],
        column: parts[3],
        offset: parts[5],
      },
    };
  } else if (parts.length === 5) {
    return {
      start: {
        line: parts[0],
        column: parts[1],
        offset: parts[3],
      },
      end: {
        line: parts[0],
        column: parts[2],
        offset: parts[4],
      },
    };
  } else {
    return {
      start: {
        line: parts[0],
        column: parts[1],
        offset: parts[2],
      },
      end: {
        line: parts[0],
        column: parts[1],
        offset: parts[2],
      },
    };
  }
}
