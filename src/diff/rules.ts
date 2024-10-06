import {
  ChangeInfo,
  MethodScope,
  ParameterScope,
  PropertyScope,
  ReturnValueScope as ReturnsScope,
  RuleContext,
} from '.';
import { isRequired } from '..';

import { ValidationRule } from '../ir';
import { Literal } from './utils';

function buildContext(
  mode: Mode,
  scope: ParameterScope | ReturnsScope | PropertyScope,
): RuleContext {
  if (isParameterScope(scope)) {
    return {
      scope: 'parameter',
      service: scope.service.title.value,
      interface: scope.interface.name.value,
      method: scope.method.name.value,
      parameter: scope.parameter.name.value,
      required: isRequired(scope.parameter.value),
    };
  } else if (isReturnTypeScope(scope)) {
    return {
      scope: 'returns',
      service: scope.service.title.value,
      interface: scope.interface.name.value,
      method: scope.method.name.value,
      returns: scope.returns.value.typeName.value,
    };
  } else {
    return {
      scope: mode === 'input-property' ? 'input-property' : 'output-property',
      service: scope.service.title.value,
      type: scope.type.name.value,
      property: scope.property.name.value,
      required: isRequired(scope.property.value),
    };
  }
}

function isParameterScope(
  scope: ParameterScope | MethodScope | PropertyScope,
): scope is ParameterScope {
  return !!(scope as any).parameter;
}

function isReturnTypeScope(
  scope: ParameterScope | ReturnsScope | PropertyScope,
): scope is ReturnsScope {
  return !!(scope as any).returns;
}

function getRules(
  scope: ParameterScope | ReturnsScope | PropertyScope,
): ValidationRule[] {
  if (isParameterScope(scope)) {
    return scope.parameter.value.rules;
  } else if (isReturnTypeScope(scope)) {
    return scope.returns.value.rules;
  } else {
    return scope.property.value.rules;
  }
}

export type ModeMap = {
  parameter: ParameterScope;
  returns: ReturnsScope;
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
    if (a_rule.id === 'StringEnum') continue;
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
        case 'ArrayMaxItems':
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
        case 'ArrayMinItems':
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
        case 'ArrayUniqueItems':
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
        case 'Constant':
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
        case 'NumberGT':
        case 'NumberGTE':
        case 'NumberLT':
        case 'NumberLTE':
        case 'NumberMultipleOf':
          if (a_rule.id === b_rule.id) {
            if (a_rule.value.value < b_rule.value.value) {
              yield {
                kind: 'increased',
                target: a_rule.id,
                category:
                  a_rule.id === 'NumberLT' || a_rule.id === 'NumberLTE'
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
                  a_rule.id === 'NumberGT' || a_rule.id === 'NumberGTE'
                    ? 'minor'
                    : 'major',
                a: { context: a_context, ...asValue(a_rule) },
                b: { context: b_context, ...asValue(b_rule) },
              };
            }
          }
          break;
        case 'StringFormat':
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
        case 'StringMaxLength':
        case 'StringMinLength':
          if (a_rule.id === b_rule.id) {
            if (a_rule.length.value < b_rule.length.value) {
              yield {
                kind: 'increased',
                target: a_rule.id,
                category: a_rule.id === 'StringMaxLength' ? 'minor' : 'major',
                a: { context: a_context, ...asValue(a_rule) },
                b: { context: b_context, ...asValue(b_rule) },
              };
            } else if (a_rule.length.value > b_rule.length.value) {
              yield {
                kind: 'decreased',
                target: a_rule.id,
                category: a_rule.id === 'StringMaxLength' ? 'major' : 'minor',
                a: { context: a_context, ...asValue(a_rule) },
                b: { context: b_context, ...asValue(b_rule) },
              };
            }
          }
          break;
        case 'StringPattern':
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
        case 'Required':
        default:
          return undefined;
      }
    }
  }

  for (const b_rule of getRules(b)) {
    if (b_rule.id === 'StringEnum') continue;
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
  function clean<T extends Literal>(literal: T): Omit<T, 'kind'> {
    const { kind, ...rest } = literal;
    return rest;
  }

  switch (rule.id) {
    case 'ArrayMaxItems':
      return clean(rule.max);
    case 'ArrayMinItems':
      return clean(rule.min);
    case 'ArrayUniqueItems':
      return { value: rule.required };
    case 'Constant':
      return { value: rule.value.value };
    case 'NumberGT':
    case 'NumberGTE':
    case 'NumberLT':
    case 'NumberLTE':
    case 'NumberMultipleOf':
      return clean(rule.value);
    case 'Required':
      return { value: true };
    case 'StringEnum':
      return { value: rule.values.map((v) => v.value) };
    case 'StringFormat':
      return clean(rule.format);
    case 'StringMaxLength':
    case 'StringMinLength':
      return clean(rule.length);
    case 'StringPattern':
      return clean(rule.pattern);
    default:
      return { value: undefined };
  }
}
