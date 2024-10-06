import {
  ChangeInfo,
  InterfaceScope,
  MethodContext,
  ReturnValueContext,
  ReturnValueScope as ReturnsScope,
} from '.';

import * as cache from './cache';
import { parameters } from './parameters';
import { rules } from './rules';
import { asValue, eq } from './utils';

export function* methods(
  a: InterfaceScope,
  b: InterfaceScope,
): Iterable<ChangeInfo> {
  for (const a_method of a.interface.methods) {
    const a_context: MethodContext = {
      scope: 'method',
      service: a.service.title.value,
      interface: a.interface.name.value,
      method: a_method.name.value,
    };
    const b_method = cache.getMethod(b.service, a_method.name.value);
    if (b_method) {
      const b_context: MethodContext = {
        scope: 'method',
        service: b.service.title.value,
        interface: b.interface.name.value,
        method: b_method.name.value,
      };

      if (!eq(a_method.name, b_method.name)) {
        yield {
          kind: 'changed',
          target: 'method-name-casing',
          category: 'patch',
          a: {
            context: a_context,
            value: a_method.name.value,
            loc: a_method.name.loc,
          },
          b: {
            context: b_context,
            value: b_method.name.value,
            loc: b_method.name.loc,
          },
        };
      }
      if (a_method.description && !b_method.description) {
        yield {
          kind: 'removed',
          target: 'method-description',
          category: 'patch',
          a: {
            context: a_context,
            ...asValue(a_method.description),
          },
        };
      } else if (!a_method.description && b_method.description) {
        yield {
          kind: 'added',
          target: 'method-description',
          category: 'patch',
          b: {
            context: b_context,
            ...asValue(b_method.description),
          },
        };
      } else if (!eq(a_method.description, b_method.description)) {
        yield {
          kind: 'changed',
          target: 'method-description',
          category: 'patch',
          a: {
            context: a_context,
            ...asValue(a_method.description),
          },
          b: {
            context: b_context,
            ...asValue(b_method.description),
          },
        };
      }

      if (!a_method.deprecated?.value && b_method.deprecated?.value) {
        yield {
          kind: 'added',
          target: 'method-deprecated',
          category: 'minor',
          b: { context: b_context, ...asValue(b_method.deprecated) },
        };
      } else if (a_method.deprecated?.value && !b_method.deprecated?.value) {
        yield {
          kind: 'removed',
          target: 'method-deprecated',
          category: 'patch',
          a: { context: a_context, ...asValue(a_method.deprecated) },
        };
      }

      if (a_method.returns && b_method.returns) {
        yield* returns(
          { ...a, method: a_method, returns: a_method.returns },
          { ...b, method: b_method, returns: b_method.returns },
        );
      } else if (a_method.returns) {
        yield {
          kind: 'removed',
          target: 'returns',
          category: 'major',
          a: {
            context: {
              scope: 'returns',
              service: a.service.title.value,
              interface: a.interface.name.value,
              method: a_method.name.value,
              returns: a_method.returns.value.typeName.value,
            },
            value: a_method.returns.value.typeName.value,
            loc: a_method.returns.loc,
          },
        };
      } else if (b_method.returns) {
        yield {
          kind: 'added',
          target: 'returns',
          category: 'major',
          b: {
            context: {
              scope: 'returns',
              service: b.service.title.value,
              interface: b.interface.name.value,
              method: b_method.name.value,
              returns: b_method.returns.value.typeName.value,
            },
            value: b_method.returns.value.typeName.value,
            loc: b_method.returns.loc,
          },
        };
      }

      yield* parameters({ ...a, method: a_method }, { ...b, method: b_method });
    } else {
      yield {
        kind: 'removed',
        target: 'method',
        category: 'major',
        a: {
          context: a_context,
          value: a_method.name.value,
          loc: a_method.loc,
        },
      };
    }
  }

  for (const b_method of b.interface.methods) {
    const b_context: MethodContext = {
      scope: 'method',
      service: b.service.title.value,
      interface: b.interface.name.value,
      method: b_method.name.value,
    };

    const a_method = cache.getMethod(a.service, b_method.name.value);
    if (!a_method) {
      yield {
        kind: 'added',
        target: 'method',
        category: 'minor',
        b: {
          context: b_context,
          value: b_method.name.value,
          loc: b_method.loc,
        },
      };
    }
  }
}

function* returns(a: ReturnsScope, b: ReturnsScope): Iterable<ChangeInfo> {
  yield* rules('returns', a, b);

  const a_context: ReturnValueContext = {
    scope: 'returns',
    service: a.service.title.value,
    interface: a.interface.name.value,
    method: a.method.name.value,
    returns: a.returns.value.typeName.value,
  };

  const b_context: ReturnValueContext = {
    scope: 'returns',
    service: b.service.title.value,
    interface: b.interface.name.value,
    method: b.method.name.value,
    returns: b.returns.value.typeName.value,
  };

  if (!eq(a.returns.value.typeName, b.returns.value.typeName)) {
    yield {
      kind: 'changed',
      target: 'returns',
      category: 'major',
      a: { context: a_context, ...asValue(a.returns.value.typeName) },
      b: { context: b_context, ...asValue(b.returns.value.typeName) },
    };
  }

  if (!eq(a.returns.value.kind, b.returns.value.kind)) {
    yield {
      kind: 'changed',
      target: 'returns-primitive',
      category: 'major',
      a: {
        context: a_context,
        value: a.returns.value.kind === 'PrimitiveValue',
        loc: a.returns.loc,
      },
      b: {
        context: b_context,
        value: b.returns.value.kind === 'PrimitiveValue',
        loc: b.returns.loc,
      },
    };
  }

  if (!eq(a.returns.value.isArray, b.returns.value.isArray)) {
    yield {
      kind: 'changed',
      target: 'returns-array',
      category: 'major',
      a: {
        context: a_context,
        value: a.returns.value.isArray?.value ?? false,
        loc: a.returns.loc,
      },
      b: {
        context: b_context,
        value: b.returns.value.isArray?.value ?? false,
        loc: b.returns.loc,
      },
    };
  }
}
