import { ChangeInfo, EnumContext, ServiceScope } from '.';
import { Enum } from '../ir';
import * as cache from './cache';
import { asValue, eq, getInputs, getOutputs } from './utils';

export type Mode = 'input' | 'output';

function buildContext(mode: Mode, scope: ServiceScope, e: Enum): EnumContext {
  return {
    scope: `${mode}-enum`,
    service: scope.service.title.value,
    enum: e.name.value,
  };
}

export function* enums(
  mode: Mode,
  a: ServiceScope,
  b: ServiceScope,
): Iterable<ChangeInfo> {
  for (const a_enum of mode === 'input'
    ? getInputs(a.service).enums
    : getOutputs(a.service).enums) {
    const a_context = buildContext(mode, a, a_enum);
    const b_enum = cache.getEnum(b.service, a_enum.name.value);

    if (b_enum) {
      const b_context = buildContext(mode, b, b_enum);
      if (!eq(a_enum.name, b_enum.name)) {
        yield {
          kind: 'changed',
          target: `${mode}-enum-name-casing`,
          category: 'patch',
          a: { context: a_context, ...asValue(a_enum.name) },
          b: { context: b_context, ...asValue(b_enum.name) },
        };
      }

      if (!eq(a_enum.description, b_enum.description)) {
        yield {
          kind: 'changed',
          target: `${mode}-enum-description`,
          category: 'patch',
          a: { context: a_context, ...asValue(a_enum.description) },
          b: { context: b_context, ...asValue(b_enum.description) },
        };
      }

      if (!a_enum.deprecated?.value && b_enum.deprecated?.value) {
        yield {
          kind: 'added',
          target: `${mode}-enum-deprecated`,
          category: 'minor',
          b: { context: b_context, ...asValue(b_enum.deprecated) },
        };
      } else if (a_enum.deprecated?.value && !b_enum.deprecated?.value) {
        yield {
          kind: 'removed',
          target: `${mode}-enum-deprecated`,
          category: 'patch',
          a: { context: a_context, ...asValue(a_enum.deprecated) },
        };
      }

      for (const a_value of a_enum.values) {
        const b_value = cache.getEnumValue(b_enum, a_value.content.value);

        if (b_value) {
          if (!eq(a_value.content, b_value.content)) {
            yield {
              kind: 'changed',
              target: `${mode}-enum-value-casing`,
              category: 'major',
              a: { context: a_context, ...asValue(a_value.content) },
              b: { context: b_context, ...asValue(b_value.content) },
            };
          }

          if (!eq(a_value.description, b_value.description)) {
            yield {
              kind: 'changed',
              target: `${mode}-enum-value-description`,
              category: 'patch',
              a: { context: a_context, ...asValue(a_value.description) },
              b: { context: b_context, ...asValue(b_value.description) },
            };
          }

          if (!a_value.deprecated?.value && b_value.deprecated?.value) {
            yield {
              kind: 'added',
              target: `${mode}-enum-value-deprecated`,
              category: 'minor',
              b: { context: b_context, ...asValue(b_value.deprecated) },
            };
          } else if (a_value.deprecated?.value && !b_value.deprecated?.value) {
            yield {
              kind: 'removed',
              target: `${mode}-enum-value-deprecated`,
              category: 'patch',
              a: { context: a_context, ...asValue(a_value.deprecated) },
            };
          }
        } else {
          yield {
            kind: 'removed',
            target: `${mode}-enum-value`,
            category: mode === 'input' ? 'major' : 'minor',
            a: { context: b_context, ...asValue(a_value.content) },
          };
        }
      }

      for (const b_value of b_enum.values) {
        const a_value = cache.getEnumValue(a_enum, b_value.content.value);

        if (a_value === undefined) {
          yield {
            kind: 'added',
            target: `${mode}-enum-value`,
            category: mode === 'input' ? 'minor' : 'major',
            b: { context: b_context, ...asValue(b_value.content) },
          };
        }
      }
    } else {
      yield {
        kind: 'removed',
        target: `${mode}-enum`,
        category: 'major',
        a: { context: a_context, value: a_enum.name.value, loc: a_enum.loc },
      };
    }
  }

  for (const b_enum of mode === 'input'
    ? getInputs(b.service).enums
    : getOutputs(b.service).enums) {
    const b_context = buildContext(mode, b, b_enum);
    const a_type = cache.getEnum(a.service, b_enum.name.value);

    if (!a_type) {
      yield {
        kind: 'added',
        target: `${mode}-enum`,
        category: 'major',
        b: { context: b_context, value: b_enum.name.value, loc: b_enum.loc },
      };
    }
  }
}
