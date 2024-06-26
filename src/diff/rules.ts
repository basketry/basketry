import {
  ChangeInfo,
  MethodScope,
  ParameterScope,
  PropertyScope,
  ReturnTypeScope,
  RuleContext,
} from '.';
import { isRequired } from '..';

import { ValidationRule } from '../ir';

function buildContext(
  mode: Mode,
  scope: ParameterScope | ReturnTypeScope | PropertyScope,
): RuleContext {
  if (isParameterScope(scope)) {
    return {
      scope: 'parameter',
      service: scope.service.title.value,
      interface: scope.interface.name.value,
      method: scope.method.name.value,
      parameter: scope.parameter.name.value,
      required: isRequired(scope.parameter),
    };
  } else if (isReturnTypeScope(scope)) {
    return {
      scope: 'return-type',
      service: scope.service.title.value,
      interface: scope.interface.name.value,
      method: scope.method.name.value,
      returnType: scope.returnType.typeName.value,
    };
  } else {
    return {
      scope: mode === 'input-property' ? 'input-property' : 'output-property',
      service: scope.service.title.value,
      type: scope.type.name.value,
      property: scope.property.name.value,
      required: isRequired(scope.property),
    };
  }
}

function isParameterScope(
  scope: ParameterScope | MethodScope | PropertyScope,
): scope is ParameterScope {
  return !!(scope as any).parameter;
}

function isReturnTypeScope(
  scope: ParameterScope | ReturnTypeScope | PropertyScope,
): scope is ReturnTypeScope {
  return !!(scope as any).returnType;
}

function getRules(
  scope: ParameterScope | ReturnTypeScope | PropertyScope,
): ValidationRule[] {
  if (isParameterScope(scope)) {
    return scope.parameter.rules;
  } else if (isReturnTypeScope(scope)) {
    return scope.returnType.rules;
  } else {
    return scope.property.rules;
  }
}

export type ModeMap = {
  parameter: ParameterScope;
  'return-type': ReturnTypeScope;
  'input-property': PropertyScope;
  'output-property': PropertyScope;
};
export type Mode = keyof ModeMap;

export function* rules<TMode extends Mode, TScope extends ModeMap[TMode]>(
  mode: TMode,
  a: TScope,
  b: TScope,
): Iterable<ChangeInfo> {
  for (const a_rule of getRules(a)) {
    if (a_rule.id === 'string-enum') continue;
    const b_rule = getRules(b).find((r) => r.id === a_rule.id);

    const a_context = buildContext(mode, a);

    if (!b_rule) {
      yield {
        kind: 'removed',
        target: a_rule.id,
        category: 'minor',
        a: { context: a_context, ...asValue(a_rule) },
      };
    } else {
      const b_context = buildContext(mode, b);
      switch (a_rule.id) {
        case 'array-max-items':
          if (a_rule.id === b_rule.id) {
            if (a_rule.max.value < b_rule.max.value) {
              yield {
                kind: 'increased',
                target: a_rule.id,
                category: 'minor',
                a: { context: a_context, ...asValue(a_rule) },
                b: { context: b_context, ...asValue(b_rule) },
              };
            } else if (a_rule.max.value > b_rule.max.value) {
              yield {
                kind: 'decreased',
                target: a_rule.id,
                category: 'major',
                a: { context: a_context, ...asValue(a_rule) },
                b: { context: b_context, ...asValue(b_rule) },
              };
            }
          }
          break;
        case 'array-min-items':
          if (a_rule.id === b_rule.id) {
            if (a_rule.min.value < b_rule.min.value) {
              yield {
                kind: 'increased',
                target: a_rule.id,
                category: 'major',
                a: { context: a_context, ...asValue(a_rule) },
                b: { context: b_context, ...asValue(b_rule) },
              };
            } else if (a_rule.min.value > b_rule.min.value) {
              yield {
                kind: 'decreased',
                target: a_rule.id,
                category: 'minor',
                a: { context: a_context, ...asValue(a_rule) },
                b: { context: b_context, ...asValue(b_rule) },
              };
            }
          }
          break;
        case 'array-unique-items':
          if (a_rule.id === b_rule.id) {
            if (a_rule.required !== b_rule.required) {
              yield {
                kind: 'changed',
                target: a_rule.id,
                category: b_rule.required ? 'major' : 'minor',
                a: { context: a_context, ...asValue(a_rule) },
                b: { context: b_context, ...asValue(b_rule) },
              };
            }
          }
          break;
        case 'constant':
          if (a_rule.id === b_rule.id) {
            if (a_rule.value?.value !== b_rule.value?.value) {
              yield {
                kind: 'changed',
                target: a_rule.id,
                category: 'major',
                a: { context: a_context, ...asValue(a_rule) },
                b: { context: b_context, ...asValue(b_rule) },
              };
            }
          }
          break;
        case 'number-gt':
        case 'number-gte':
        case 'number-lt':
        case 'number-lte':
        case 'number-multiple-of':
          if (a_rule.id === b_rule.id) {
            if (a_rule.value.value < b_rule.value.value) {
              yield {
                kind: 'increased',
                target: a_rule.id,
                category:
                  a_rule.id === 'number-lt' || a_rule.id === 'number-lte'
                    ? 'minor'
                    : 'major',
                a: { context: a_context, ...asValue(a_rule) },
                b: { context: b_context, ...asValue(b_rule) },
              };
            } else if (a_rule.value.value > b_rule.value.value) {
              yield {
                kind: 'decreased',
                target: a_rule.id,
                category:
                  a_rule.id === 'number-gt' || a_rule.id === 'number-gte'
                    ? 'minor'
                    : 'major',
                a: { context: a_context, ...asValue(a_rule) },
                b: { context: b_context, ...asValue(b_rule) },
              };
            }
          }
          break;
        case 'string-format':
          if (a_rule.id === b_rule.id) {
            if (a_rule.format.value !== b_rule.format.value) {
              yield {
                kind: 'changed',
                target: a_rule.id,
                category: 'major',
                a: { context: a_context, ...asValue(a_rule) },
                b: { context: b_context, ...asValue(b_rule) },
              };
            }
          }
          break;
        case 'string-max-length':
        case 'string-min-length':
          if (a_rule.id === b_rule.id) {
            if (a_rule.length.value < b_rule.length.value) {
              yield {
                kind: 'increased',
                target: a_rule.id,
                category: a_rule.id === 'string-max-length' ? 'minor' : 'major',
                a: { context: a_context, ...asValue(a_rule) },
                b: { context: b_context, ...asValue(b_rule) },
              };
            } else if (a_rule.length.value > b_rule.length.value) {
              yield {
                kind: 'decreased',
                target: a_rule.id,
                category: a_rule.id === 'string-max-length' ? 'major' : 'minor',
                a: { context: a_context, ...asValue(a_rule) },
                b: { context: b_context, ...asValue(b_rule) },
              };
            }
          }
          break;
        case 'string-pattern':
          if (a_rule.id === b_rule.id) {
            if (a_rule.pattern.value !== b_rule.pattern.value) {
              yield {
                kind: 'changed',
                target: a_rule.id,
                category: 'major',
                a: { context: a_context, ...asValue(a_rule) },
                b: { context: b_context, ...asValue(b_rule) },
              };
            }
          }
          break;
        case 'required':
        default:
          return undefined;
      }
    }
  }

  for (const b_rule of getRules(b)) {
    if (b_rule.id === 'string-enum') continue;
    const a_rule = getRules(a).find((r) => r.id === b_rule.id);
    const b_context = buildContext(mode, b);

    if (!a_rule) {
      const { value, loc } = asValue(b_rule);
      yield {
        kind: 'added',
        target: b_rule.id,
        category: 'major',
        b: { context: b_context, value, loc }, // TODO: handle fall-back loc
      };
    }
  }
}

type Primitive = string | number | boolean | null;

function asValue(rule: ValidationRule): {
  value: Primitive | Primitive[] | undefined;
  loc?: string;
} {
  switch (rule.id) {
    case 'array-max-items':
      return rule.max;
    case 'array-min-items':
      return rule.min;
    case 'array-unique-items':
      return { value: rule.required };
    case 'constant':
      return { value: rule.value.value };
    case 'number-gt':
    case 'number-gte':
    case 'number-lt':
    case 'number-lte':
    case 'number-multiple-of':
      return rule.value;
    case 'required':
      return { value: true };
    case 'string-enum':
      return { value: rule.values.map((v) => v.value) };
    case 'string-format':
      return rule.format;
    case 'string-max-length':
    case 'string-min-length':
      return rule.length;
    case 'string-pattern':
      return rule.pattern;
    default:
      return { value: undefined };
  }
}
