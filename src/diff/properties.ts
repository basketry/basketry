import { ChangeInfo, PropertyContext, TypeScope } from '.';
import { isRequired } from '..';
import { Property } from '../types';
import * as cache from './cache';
import { rules } from './rules';
import { asValue, eq } from './utils';

export type Mode = 'input' | 'output';

function buildContext(
  mode: Mode,
  scope: TypeScope,
  property: Property,
): PropertyContext {
  return {
    scope: `${mode}-property`,
    service: scope.service.title.value,
    type: scope.type.name.value,
    property: property.name.value,
    required: isRequired(property),
  };
}

export function* properties(
  mode: Mode,
  a: TypeScope,
  b: TypeScope,
): Iterable<ChangeInfo> {
  for (const a_prop of a.type.properties) {
    const a_context = buildContext(mode, a, a_prop);
    const b_prop = cache.getProperty(b.type, a_prop.name.value);

    if (b_prop) {
      const b_context = buildContext(mode, b, b_prop);
      if (!eq(a_prop.name, b_prop.name)) {
        yield {
          kind: 'changed',
          target: `${mode}-property-name-casing`,
          category: 'patch',
          a: { context: a_context, value: a_prop.name.value, loc: a_prop.loc },
          b: { context: b_context, value: b_prop.name.value, loc: b_prop.loc },
        };
      }

      // Type
      if (!eq(a_prop.typeName, b_prop.typeName)) {
        yield {
          kind: 'changed',
          target: `${mode}-property-type`,
          category: 'major',
          a: { context: a_context, ...asValue(a_prop.typeName) },
          b: { context: b_context, ...asValue(b_prop.typeName) },
        };
      }
      if (!eq(a_prop.isPrimitive, b_prop.isPrimitive)) {
        yield {
          kind: 'changed',
          target: `${mode}-property-type-primitive`,
          category: 'major',
          a: {
            context: a_context,
            value: a_prop.isPrimitive,
            loc: a_prop.loc,
          },
          b: {
            context: b_context,
            value: b_prop.isPrimitive,
            loc: b_prop.loc,
          },
        };
      }
      if (!eq(a_prop.isArray, b_prop.isArray)) {
        yield {
          kind: 'changed',
          target: `${mode}-property-type-array`,
          category: 'major',
          a: {
            context: a_context,
            value: a_prop.isArray,
            loc: a_prop.loc,
          },
          b: {
            context: b_context,
            value: b_prop.isArray,
            loc: b_prop.loc,
          },
        };
      }

      yield* rules(
        `${mode}-property`,
        { ...a, property: a_prop },
        { ...b, property: b_prop },
      );
    } else {
      yield {
        kind: 'removed',
        target: `${mode}-property`,
        category: isRequired(a_prop)
          ? 'major'
          : mode === 'input'
          ? 'major'
          : 'minor',
        a: { context: a_context, value: a_prop.name.value, loc: a_prop.loc },
      };

      if (isRequired(a_prop)) {
        yield {
          kind: 'removed',
          target: 'required',
          category: 'minor',
          a: { context: a_context, value: a_prop.name.value, loc: a_prop.loc },
        };
      }
    }
  }

  for (const b_prop of b.type.properties) {
    const b_context = buildContext(mode, b, b_prop);
    const a_prop = cache.getProperty(a.type, b_prop.name.value);

    if (!a_prop) {
      yield {
        kind: 'added',
        target: `${mode}-property`,
        category: isRequired(b_prop) ? 'major' : 'minor',
        b: { context: b_context, value: b_prop.name.value, loc: b_prop.loc },
      };

      if (isRequired(b_prop)) {
        yield {
          kind: 'added',
          target: 'required',
          category: 'major',
          b: { context: b_context, value: b_prop.name.value, loc: b_prop.loc },
        };
      }
    }
  }
}
