import { ChangeInfo, InterfaceContext, ServiceScope } from '.';
import * as cache from './cache';
import { methods } from './methods';
import { asValue, eq } from './utils';

export function* interfaces(
  a: ServiceScope,
  b: ServiceScope,
): Iterable<ChangeInfo> {
  for (const a_int of a.service.interfaces) {
    const a_context: InterfaceContext = {
      scope: 'interface',
      service: a.service.title.value,
      interface: a_int.name.value,
    };
    const b_int = cache.getInterface(b.service, a_int.name.value);
    if (b_int) {
      const b_context: InterfaceContext = {
        scope: 'interface',
        service: b.service.title.value,
        interface: b_int.name.value,
      };

      if (!eq(a_int.name, b_int.name)) {
        yield {
          kind: 'changed',
          target: 'interface-name-casing',
          category: 'patch',
          a: { context: a_context, ...asValue(a_int.name) },
          b: { context: b_context, ...asValue(b_int.name) },
        };
      }
      if (a_int.description && !b_int.description) {
        yield {
          kind: 'removed',
          target: 'interface-description',
          category: 'patch',
          a: { context: a_context, ...asValue(a_int.description) },
        };
      } else if (!a_int.description && b_int.description) {
        yield {
          kind: 'added',
          target: 'interface-description',
          category: 'patch',
          b: { context: b_context, ...asValue(b_int.description) },
        };
      } else if (!eq(a_int.description, b_int.description)) {
        yield {
          kind: 'changed',
          target: 'interface-description',
          category: 'patch',
          a: { context: a_context, ...asValue(a_int.description) },
          b: { context: b_context, ...asValue(b_int.description) },
        };
      }

      if (!a_int.deprecated?.value && b_int.deprecated?.value) {
        yield {
          kind: 'added',
          target: 'interface-deprecated',
          category: 'minor',
          b: { context: b_context, ...asValue(b_int.deprecated) },
        };
      } else if (a_int.deprecated?.value && !b_int.deprecated?.value) {
        yield {
          kind: 'removed',
          target: 'interface-deprecated',
          category: 'patch',
          a: { context: a_context, ...asValue(a_int.deprecated) },
        };
      }

      yield* methods({ ...a, interface: a_int }, { ...b, interface: b_int });
    } else {
      yield {
        kind: 'removed',
        target: 'interface',
        category: 'major',
        a: { context: a_context, value: a_int.name.value },
      };
    }
  }

  for (const b_int of b.service.interfaces) {
    const b_context: InterfaceContext = {
      scope: 'interface',
      service: b.service.title.value,
      interface: b_int.name.value,
    };
    const a_int = cache.getInterface(a.service, b_int.name.value);
    if (!a_int) {
      yield {
        kind: 'added',
        target: 'interface',
        category: 'minor',
        b: { context: b_context, value: b_int.name.value },
      };
    }
  }
}
