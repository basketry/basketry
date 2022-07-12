import { ChangeContext, ChangeInfo, ServiceScope } from '.';
import { Enum } from '../types';
import * as cache from './cache';
import { asValue, eq, getInputs, getOutputs } from './utils';

export type Mode = 'input' | 'output';

function buildContext(mode: Mode, scope: ServiceScope, e: Enum): ChangeContext {
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
          a: { context: a_context, ...asValue(a_enum.name) },
          b: { context: b_context, ...asValue(b_enum.name) },
        };
      }

      for (const a_value of a_enum.values) {
        const b_value = cache.getEnumValue(b_enum, a_value.value);

        if (b_value) {
          if (!eq(a_value, b_value)) {
            yield {
              kind: 'changed',
              target: `${mode}-enum-value-casing`,
              a: { context: a_context, ...asValue(a_value) },
              b: { context: b_context, ...asValue(b_value) },
            };
          }
        } else {
          yield {
            kind: 'removed',
            target: `${mode}-enum-value`,
            a: { context: b_context, ...asValue(a_value) },
          };
        }
      }

      for (const b_value of b_enum.values) {
        const a_value = cache.getEnumValue(a_enum, b_value.value);

        if (a_value === undefined) {
          yield {
            kind: 'added',
            target: `${mode}-enum-value`,
            b: { context: b_context, ...asValue(b_value) },
          };
        }
      }
    } else {
      yield {
        kind: 'removed',
        target: `${mode}-enum`,
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
        b: { context: b_context, value: b_enum.name.value, loc: b_enum.loc },
      };
    }
  }
}
