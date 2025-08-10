import { MethodScope, ParameterContext, ChangeInfo } from '.';
import * as cache from './cache';
import { Parameter } from '../ir';
import { isRequired } from '..';
import { eq, asValue } from './utils';
import { rules } from './rules';

function buildContext(
  scope: MethodScope,
  parameter: Parameter,
): ParameterContext {
  return {
    scope: 'parameter',
    service: scope.service.title.value,
    interface: scope.interface.name.value,
    method: scope.method.name.value,
    parameter: parameter.name.value,
    required: isRequired(parameter.value),
  };
}

export function* parameters(
  a: MethodScope,
  b: MethodScope,
): Iterable<ChangeInfo> {
  for (const a_param of a.method.parameters) {
    const a_context = buildContext(a, a_param);
    const b_param = cache.getParameter(b.method, a_param.name.value);
    if (b_param) {
      const b_context = buildContext(b, b_param);

      // Name
      if (!eq(a_param.name.value, b_param.name.value)) {
        yield {
          kind: 'changed',
          target: 'parameter-name-casing',
          category: 'patch',
          a: { context: a_context, ...asValue(a_param.name) },
          b: { context: b_context, ...asValue(b_param.name) },
        };
      }

      // Description
      if (a_param.description && !b_param.description) {
        yield {
          kind: 'removed',
          target: 'parameter-description',
          category: 'patch',
          a: { context: a_context, ...asValue(a_param.description) },
        };
      } else if (!a_param.description && b_param.description) {
        yield {
          kind: 'added',
          target: 'parameter-description',
          category: 'patch',
          b: { context: b_context, ...asValue(b_param.description) },
        };
      } else if (!eq(a_param.description, b_param.description)) {
        yield {
          kind: 'changed',
          target: 'parameter-description',
          category: 'patch',
          a: { context: a_context, ...asValue(a_param.description) },
          b: { context: b_context, ...asValue(b_param.description) },
        };
      }

      // Deprecated
      if (!a_param.deprecated?.value && b_param.deprecated?.value) {
        yield {
          kind: 'added',
          target: 'parameter-deprecated',
          category: 'minor',
          b: { context: b_context, ...asValue(b_param.deprecated) },
        };
      } else if (a_param.deprecated?.value && !b_param.deprecated?.value) {
        yield {
          kind: 'removed',
          target: 'parameter-deprecated',
          category: 'patch',
          a: { context: a_context, ...asValue(a_param.deprecated) },
        };
      }

      // Type
      if (!eq(a_param.value.typeName, b_param.value.typeName)) {
        yield {
          kind: 'changed',
          target: 'parameter-type',
          category: 'major',
          a: { context: a_context, ...asValue(a_param.value.typeName) },
          b: { context: b_context, ...asValue(b_param.value.typeName) },
        };
      }
      if (!eq(a_param.value.kind, b_param.value.kind)) {
        yield {
          kind: 'changed',
          target: 'parameter-type-primitive',
          category: 'major',
          a: {
            context: a_context,
            value: a_param.value.kind === 'PrimitiveValue',
            loc: a_param.loc,
          },
          b: {
            context: b_context,
            value: b_param.value.kind === 'PrimitiveValue',
            loc: b_param.loc,
          },
        };
      }
      if (!eq(a_param.value.isArray, b_param.value.isArray)) {
        yield {
          kind: 'changed',
          target: 'parameter-type-array',
          category: 'major',
          a: {
            context: a_context,
            value: a_param.value.isArray?.value ?? false,
            loc: a_param.loc,
          },
          b: {
            context: b_context,
            value: b_param.value.isArray?.value ?? false,
            loc: b_param.loc,
          },
        };
      }

      yield* rules(
        'parameter',
        { ...a, parameter: a_param },
        { ...b, parameter: b_param },
      );
    } else {
      yield {
        kind: 'removed',
        target: 'parameter',
        category: 'major',
        a: {
          context: a_context,
          value: a_param.name.value,
          loc: a_param.loc,
        },
      };
    }
  }

  for (const b_param of b.method.parameters) {
    const b_context = buildContext(b, b_param);

    const a_param = cache.getParameter(a.method, b_param.name.value);

    if (!a_param) {
      yield {
        kind: 'added',
        target: 'parameter',
        category: isRequired(b_param.value) ? 'major' : 'minor',
        b: {
          context: b_context,
          value: b_param.name.value,
          loc: b_param.loc,
        },
      };
    }
  }
}
