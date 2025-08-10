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

      for (const a_member of a_enum.members) {
        const b_member = cache.getEnumMember(b_enum, a_member.content.value);

        if (b_member) {
          if (!eq(a_member.content, b_member.content)) {
            yield {
              kind: 'changed',
              target: `${mode}-enum-member-casing`,
              category: 'major',
              a: { context: a_context, ...asValue(a_member.content) },
              b: { context: b_context, ...asValue(b_member.content) },
            };
          }

          if (!eq(a_member.description, b_member.description)) {
            yield {
              kind: 'changed',
              target: `${mode}-enum-member-description`,
              category: 'patch',
              a: { context: a_context, ...asValue(a_member.description) },
              b: { context: b_context, ...asValue(b_member.description) },
            };
          }

          if (!a_member.deprecated?.value && b_member.deprecated?.value) {
            yield {
              kind: 'added',
              target: `${mode}-enum-member-deprecated`,
              category: 'minor',
              b: { context: b_context, ...asValue(b_member.deprecated) },
            };
          } else if (
            a_member.deprecated?.value &&
            !b_member.deprecated?.value
          ) {
            yield {
              kind: 'removed',
              target: `${mode}-enum-member-deprecated`,
              category: 'patch',
              a: { context: a_context, ...asValue(a_member.deprecated) },
            };
          }
        } else {
          yield {
            kind: 'removed',
            target: `${mode}-enum-member`,
            category: mode === 'input' ? 'major' : 'minor',
            a: { context: b_context, ...asValue(a_member.content) },
          };
        }
      }

      for (const b_member of b_enum.members) {
        const a_member = cache.getEnumMember(a_enum, b_member.content.value);

        if (a_member === undefined) {
          yield {
            kind: 'added',
            target: `${mode}-enum-member`,
            category: mode === 'input' ? 'minor' : 'major',
            b: { context: b_context, ...asValue(b_member.content) },
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
        category: mode === 'input' ? 'minor' : 'major',
        b: { context: b_context, value: b_enum.name.value, loc: b_enum.loc },
      };
    }
  }
}
