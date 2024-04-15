import {
  ChangeInfo,
  InterfaceScope,
  MethodContext,
  ReturnTypeContext,
  ReturnTypeScope,
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

      if (a_method.returnType && b_method.returnType) {
        yield* returnTypes(
          { ...a, method: a_method, returnType: a_method.returnType },
          { ...b, method: b_method, returnType: b_method.returnType },
        );
      } else if (a_method.returnType) {
        yield {
          kind: 'removed',
          target: 'return-type',
          category: 'major',
          a: {
            context: {
              scope: 'return-type',
              service: a.service.title.value,
              interface: a.interface.name.value,
              method: a_method.name.value,
              returnType: a_method.returnType.typeName.value,
            },
            value: a_method.returnType.typeName.value,
            loc: a_method.returnType.loc,
          },
        };
      } else if (b_method.returnType) {
        yield {
          kind: 'added',
          target: 'return-type',
          category: 'major',
          b: {
            context: {
              scope: 'return-type',
              service: b.service.title.value,
              interface: b.interface.name.value,
              method: b_method.name.value,
              returnType: b_method.returnType.typeName.value,
            },
            value: b_method.returnType.typeName.value,
            loc: b_method.returnType.loc,
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

function* returnTypes(
  a: ReturnTypeScope,
  b: ReturnTypeScope,
): Iterable<ChangeInfo> {
  yield* rules('return-type', a, b);

  const a_context: ReturnTypeContext = {
    scope: 'return-type',
    service: a.service.title.value,
    interface: a.interface.name.value,
    method: a.method.name.value,
    returnType: a.returnType.typeName.value,
  };

  const b_context: ReturnTypeContext = {
    scope: 'return-type',
    service: b.service.title.value,
    interface: b.interface.name.value,
    method: b.method.name.value,
    returnType: b.returnType.typeName.value,
  };

  if (!eq(a.returnType.typeName, b.returnType.typeName)) {
    yield {
      kind: 'changed',
      target: 'return-type',
      category: 'major',
      a: { context: a_context, ...asValue(a.returnType.typeName) },
      b: { context: b_context, ...asValue(b.returnType.typeName) },
    };
  }

  if (!eq(a.returnType.isPrimitive, b.returnType.isPrimitive)) {
    yield {
      kind: 'changed',
      target: 'return-type-primitive',
      category: 'major',
      a: {
        context: a_context,
        value: a.returnType.isPrimitive,
        loc: a.returnType.loc,
      },
      b: {
        context: b_context,
        value: b.returnType.isPrimitive,
        loc: b.returnType.loc,
      },
    };
  }

  if (!eq(a.returnType.isArray, b.returnType.isArray)) {
    yield {
      kind: 'changed',
      target: 'return-type-array',
      category: 'major',
      a: {
        context: a_context,
        value: a.returnType.isArray,
        loc: a.returnType.loc,
      },
      b: {
        context: b_context,
        value: b.returnType.isArray,
        loc: b.returnType.loc,
      },
    };
  }
}
