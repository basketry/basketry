import { ChangeInfo, PropertyContext, TypeScope } from '.';
import { isRequired } from '..';
import { Property } from '../ir';
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
    required: isRequired(property.value),
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

      // Description
      if (a_prop.description && !b_prop.description) {
        yield {
          kind: 'removed',
          target: `${mode}-property-description`,
          category: 'patch',
          a: { context: a_context, ...asValue(a_prop.description) },
        };
      } else if (!a_prop.description && b_prop.description) {
        yield {
          kind: 'added',
          target: `${mode}-property-description`,
          category: 'patch',
          b: { context: b_context, ...asValue(b_prop.description) },
        };
      } else if (a_prop.description !== b_prop.description) {
        yield {
          kind: 'changed',
          target: `${mode}-property-description`,
          category: 'patch',
          a: { context: a_context, ...asValue(a_prop.description) },
          b: { context: b_context, ...asValue(b_prop.description) },
        };
      }

      // Deprecated
      if (!a_prop.deprecated && b_prop.deprecated) {
        yield {
          kind: 'added',
          target: `${mode}-property-deprecated`,
          category: 'minor',
          b: { context: b_context, ...asValue(b_prop.deprecated) },
        };
      } else if (a_prop.deprecated && !b_prop.deprecated) {
        yield {
          kind: 'removed',
          target: `${mode}-property-deprecated`,
          category: 'patch',
          a: { context: a_context, ...asValue(a_prop.deprecated) },
        };
      }

      // Type
      if (!eq(a_prop.value.typeName, b_prop.value.typeName)) {
        yield {
          kind: 'changed',
          target: `${mode}-property-type`,
          category: 'major',
          a: { context: a_context, ...asValue(a_prop.value.typeName) },
          b: { context: b_context, ...asValue(b_prop.value.typeName) },
        };
      }
      if (!eq(a_prop.value.kind, b_prop.value.kind)) {
        yield {
          kind: 'changed',
          target: `${mode}-property-type-primitive`,
          category: 'major',
          a: {
            context: a_context,
            value: a_prop.value.kind === 'PrimitiveValue',
            loc: a_prop.loc,
          },
          b: {
            context: b_context,
            value: b_prop.value.kind === 'PrimitiveValue',
            loc: b_prop.loc,
          },
        };
      }
      if (!eq(a_prop.value.isArray, b_prop.value.isArray)) {
        yield {
          kind: 'changed',
          target: `${mode}-property-type-array`,
          category: 'major',
          a: {
            context: a_context,
            value: a_prop.value.isArray?.value ?? false,
            loc: a_prop.loc,
          },
          b: {
            context: b_context,
            value: b_prop.value.isArray?.value ?? false,
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
        category: isRequired(a_prop.value)
          ? 'major'
          : mode === 'input'
          ? 'major'
          : 'minor',
        a: { context: a_context, value: a_prop.name.value, loc: a_prop.loc },
      };
    }
  }

  for (const b_prop of b.type.properties) {
    const b_context = buildContext(mode, b, b_prop);
    const a_prop = cache.getProperty(a.type, b_prop.name.value);

    if (!a_prop) {
      yield {
        kind: 'added',
        target: `${mode}-property`,
        category: isRequired(b_prop.value) ? 'major' : 'minor',
        b: { context: b_context, value: b_prop.name.value, loc: b_prop.loc },
      };
    }
  }
}
