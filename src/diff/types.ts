import { ChangeInfo, ServiceScope, TypeContext } from '.';
import { Type } from '../ir';
import * as cache from './cache';
import { properties } from './properties';
import { asValue, eq, getInputs, getOutputs } from './utils';

export type Mode = 'input' | 'output';

function buildContext(
  mode: Mode,
  scope: ServiceScope,
  type: Type,
): TypeContext {
  return {
    scope: `${mode}-type`,
    service: scope.service.title.value,
    type: type.name.value,
  };
}

export function* types(
  mode: Mode,
  a: ServiceScope,
  b: ServiceScope,
): Iterable<ChangeInfo> {
  for (const a_type of mode === 'input'
    ? getInputs(a.service).types
    : getOutputs(a.service).types) {
    const a_context = buildContext(mode, a, a_type);
    const b_type = cache.getType(b.service, a_type.name.value);

    if (b_type) {
      const b_context = buildContext(mode, b, b_type);

      if (!eq(a_type.name, b_type.name)) {
        yield {
          kind: 'changed',
          target: `${mode}-type-name-casing`,
          category: 'patch',
          a: { context: a_context, ...asValue(a_type.name) },
          b: { context: b_context, ...asValue(b_type.name) },
        };
      }

      // Deprecated
      if (!a_type.deprecated && b_type.deprecated) {
        yield {
          kind: 'added',
          target: `${mode}-type-deprecated`,
          category: 'minor',
          b: { context: b_context, ...asValue(b_type.deprecated) },
        };
      } else if (a_type.deprecated && !b_type.deprecated) {
        yield {
          kind: 'removed',
          target: `${mode}-type-deprecated`,
          category: 'patch',
          a: { context: a_context, ...asValue(a_type.deprecated) },
        };
      }

      yield* properties(mode, { ...a, type: a_type }, { ...b, type: b_type });
    } else {
      yield {
        kind: 'removed',
        target: `${mode}-type`,
        category: 'major',
        a: { context: a_context, ...asValue(a_type.name) },
      };
    }
  }

  for (const b_type of mode === 'input'
    ? getInputs(b.service).types
    : getOutputs(b.service).types) {
    const b_context = buildContext(mode, b, b_type);
    const a_type = cache.getType(a.service, b_type.name.value);

    if (!a_type) {
      yield {
        kind: 'added',
        target: `${mode}-type`,
        category: 'minor',
        b: { context: b_context, ...asValue(b_type.name) },
      };
    }
  }
}
