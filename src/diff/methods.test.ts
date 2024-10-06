import { InterfaceScope, MethodChangeInfo, ReturnTypeChangeInfo } from '.';
import { Method } from '../ir';
import { methods } from './methods';
import {
  buildComplexValue,
  buildInterface,
  buildMethod,
  buildPrimitiveValue,
  buildReturnValue,
  buildService,
  primitiveLiteral,
  stringLiteral,
  trueLiteral,
} from './test-utils';

const title = 'service title';
const interfaceName = 'interface name';
const methodName = 'method name';
function setup(
  a: Method | undefined,
  b: Method | undefined,
): [InterfaceScope, InterfaceScope] {
  const a_methods = a ? [a] : [];
  const b_methods = b ? [b] : [];

  const a_int = buildInterface({
    name: stringLiteral(interfaceName),
    methods: a_methods,
  });
  const b_int = buildInterface({
    name: stringLiteral(interfaceName),
    methods: b_methods,
  });
  const a_service = buildService({
    title: stringLiteral(title),
    interfaces: [a_int],
  });
  const b_service = buildService({
    title: stringLiteral(title),
    interfaces: [b_int],
  });

  return [
    { service: a_service, interface: a_int },
    { service: b_service, interface: b_int },
  ];
}

describe(methods, () => {
  it('identifies two identical methods', () => {
    // ARRANGE
    const [a, b] = setup(
      buildMethod({ name: stringLiteral(methodName) }),
      buildMethod({ name: stringLiteral(methodName) }),
    );

    // ACT
    const result = methods(a, b);

    // ASSERT
    expect(Array.from(result)).toEqual<MethodChangeInfo[]>([]);
  });

  it('identifies an added method', () => {
    // ARRANGE
    const [a, b] = setup(
      undefined,
      buildMethod({ name: stringLiteral(methodName) }),
    );

    // ACT
    const result = methods(a, b);

    // ASSERT
    expect(Array.from(result)).toEqual<MethodChangeInfo[]>([
      {
        kind: 'added',
        target: 'method',
        category: 'minor',
        b: {
          context: {
            interface: 'interface name',
            method: 'method name',
            scope: 'method',
            service: 'service title',
          },
          value: 'method name',
        },
      },
    ]);
  });

  it('identifies a removed method', () => {
    // ARRANGE
    const [a, b] = setup(
      buildMethod({ name: stringLiteral(methodName) }),
      undefined,
    );

    // ACT
    const result = methods(a, b);

    // ASSERT
    expect(Array.from(result)).toEqual<MethodChangeInfo[]>([
      {
        kind: 'removed',
        target: 'method',
        category: 'major',
        a: {
          context: {
            interface: 'interface name',
            method: 'method name',
            scope: 'method',
            service: 'service title',
          },
          value: 'method name',
        },
      },
    ]);
  });

  it('identifies changed method name casing', () => {
    // ARRANGE
    const originalName = 'SOME_NAME';
    const newName = 'someName';
    const [a, b] = setup(
      buildMethod({ name: stringLiteral(originalName) }),
      buildMethod({ name: stringLiteral(newName) }),
    );

    // ACT
    const result = methods(a, b);

    // ASSERT
    expect(Array.from(result)).toEqual<MethodChangeInfo[]>([
      {
        kind: 'changed',
        target: 'method-name-casing',
        category: 'patch',
        a: {
          context: {
            scope: 'method',
            service: title,
            interface: interfaceName,
            method: originalName,
          },
          value: originalName,
        },
        b: {
          context: {
            scope: 'method',
            service: title,
            interface: interfaceName,
            method: newName,
          },
          value: newName,
        },
      },
    ]);
  });

  it('identifies an added method description', () => {
    // ARRANGE
    const description = 'some description';
    const [a, b] = setup(
      buildMethod({ name: stringLiteral(methodName) }),
      buildMethod({
        name: stringLiteral(methodName),
        description: [stringLiteral(description)],
      }),
    );

    // ACT
    const result = methods(a, b);

    // ASSERT
    expect(Array.from(result)).toEqual<MethodChangeInfo[]>([
      {
        kind: 'added',
        target: 'method-description',
        category: 'patch',
        b: {
          context: {
            scope: 'method',
            service: title,
            interface: interfaceName,
            method: methodName,
          },
          value: [description],
        },
      },
    ]);
  });

  it('identifies a removed method description', () => {
    // ARRANGE
    const description = 'some description';
    const [a, b] = setup(
      buildMethod({
        name: stringLiteral(methodName),
        description: [stringLiteral(description)],
      }),
      buildMethod({ name: stringLiteral(methodName) }),
    );

    // ACT
    const result = methods(a, b);

    // ASSERT
    expect(Array.from(result)).toEqual<MethodChangeInfo[]>([
      {
        kind: 'removed',
        target: 'method-description',
        category: 'patch',
        a: {
          context: {
            scope: 'method',
            service: title,
            interface: interfaceName,
            method: methodName,
          },
          value: [description],
        },
      },
    ]);
  });

  it('identifies a changed method description', () => {
    // ARRANGE
    const originalDescription = 'some description';
    const newDescription = 'different description';
    const [a, b] = setup(
      buildMethod({
        name: stringLiteral(methodName),
        description: [stringLiteral(originalDescription)],
      }),
      buildMethod({
        name: stringLiteral(methodName),
        description: [stringLiteral(newDescription)],
      }),
    );

    // ACT
    const result = methods(a, b);

    // ASSERT
    expect(Array.from(result)).toEqual<MethodChangeInfo[]>([
      {
        kind: 'changed',
        target: 'method-description',
        category: 'patch',
        a: {
          context: {
            scope: 'method',
            service: title,
            interface: interfaceName,
            method: methodName,
          },
          value: [originalDescription],
        },
        b: {
          context: {
            scope: 'method',
            service: title,
            interface: interfaceName,
            method: methodName,
          },
          value: [newDescription],
        },
      },
    ]);
  });

  it('identifies an added method deprecation', () => {
    // ARRANGE
    const [a, b] = setup(
      buildMethod({
        name: stringLiteral(methodName),
      }),
      buildMethod({
        name: stringLiteral(methodName),
        deprecated: trueLiteral(),
      }),
    );

    // ACT
    const result = methods(a, b);

    // ASSERT
    expect(Array.from(result)).toEqual<MethodChangeInfo[]>([
      {
        kind: 'added',
        target: 'method-deprecated',
        category: 'minor',
        b: {
          context: {
            scope: 'method',
            service: title,
            interface: interfaceName,
            method: methodName,
          },
          value: true,
        },
      },
    ]);
  });

  it('identifies a removed method deprecation', () => {
    // ARRANGE
    const [a, b] = setup(
      buildMethod({
        name: stringLiteral(methodName),
        deprecated: trueLiteral(),
      }),
      buildMethod({
        name: stringLiteral(methodName),
      }),
    );

    // ACT
    const result = methods(a, b);

    // ASSERT
    expect(Array.from(result)).toEqual<MethodChangeInfo[]>([
      {
        kind: 'removed',
        target: 'method-deprecated',
        category: 'patch',
        a: {
          context: {
            scope: 'method',
            service: title,
            interface: interfaceName,
            method: methodName,
          },
          value: true,
        },
      },
    ]);
  });

  it('identifies two identical method return types', () => {
    // ARRANGE
    const [a, b] = setup(
      buildMethod({
        name: stringLiteral(methodName),
        returns: buildReturnValue({
          value: buildPrimitiveValue({ typeName: primitiveLiteral('string') }),
        }),
      }),
      buildMethod({
        name: stringLiteral(methodName),
        returns: buildReturnValue({
          value: buildPrimitiveValue({ typeName: primitiveLiteral('string') }),
        }),
      }),
    );

    // ACT
    const result = methods(a, b);

    // ASSERT
    expect(Array.from(result)).toEqual<MethodChangeInfo[]>([]);
  });

  it('identifies an added method return type', () => {
    // ARRANGE
    const [a, b] = setup(
      buildMethod({ name: stringLiteral(methodName) }),
      buildMethod({
        name: stringLiteral(methodName),
        returns: buildReturnValue({
          value: buildPrimitiveValue({ typeName: primitiveLiteral('string') }),
        }),
      }),
    );

    // ACT
    const result = methods(a, b);

    // ASSERT
    expect(Array.from(result)).toEqual<ReturnTypeChangeInfo[]>([
      {
        kind: 'added',
        target: 'returns',
        category: 'major',
        b: {
          context: {
            scope: 'returns',
            service: title,
            interface: interfaceName,
            method: methodName,
            returns: 'string',
          },
          value: 'string',
        },
      },
    ]);
  });

  it('identifies a removed method return type', () => {
    // ARRANGE
    const [a, b] = setup(
      buildMethod({
        name: stringLiteral(methodName),
        returns: buildReturnValue({
          value: buildPrimitiveValue({ typeName: primitiveLiteral('string') }),
        }),
      }),
      buildMethod({ name: stringLiteral(methodName) }),
    );

    // ACT
    const result = methods(a, b);

    // ASSERT
    expect(Array.from(result)).toEqual<ReturnTypeChangeInfo[]>([
      {
        kind: 'removed',
        target: 'returns',
        category: 'major',
        a: {
          context: {
            scope: 'returns',
            service: title,
            interface: interfaceName,
            method: methodName,
            returns: 'string',
          },
          value: 'string',
        },
      },
    ]);
  });

  it('identifies a changed method return type', () => {
    // ARRANGE
    const [a, b] = setup(
      buildMethod({
        name: stringLiteral(methodName),
        returns: buildReturnValue({
          value: buildPrimitiveValue({ typeName: primitiveLiteral('number') }),
        }),
      }),
      buildMethod({
        name: stringLiteral(methodName),
        returns: buildReturnValue({
          value: buildPrimitiveValue({ typeName: primitiveLiteral('string') }),
        }),
      }),
    );

    // ACT
    const result = methods(a, b);

    // ASSERT
    expect(Array.from(result)).toEqual<ReturnTypeChangeInfo[]>([
      {
        kind: 'changed',
        target: 'returns',
        category: 'major',
        a: {
          context: {
            scope: 'returns',
            service: title,
            interface: interfaceName,
            method: methodName,
            returns: 'number',
          },
          value: 'number',
        },
        b: {
          context: {
            scope: 'returns',
            service: title,
            interface: interfaceName,
            method: methodName,
            returns: 'string',
          },
          value: 'string',
        },
      },
    ]);
  });

  it('identifies a changed method return type isArray', () => {
    // ARRANGE
    const [a, b] = setup(
      buildMethod({
        name: stringLiteral(methodName),
        returns: buildReturnValue({
          value: buildPrimitiveValue({
            typeName: primitiveLiteral('string'),
            isArray: trueLiteral(),
          }),
        }),
      }),
      buildMethod({
        name: stringLiteral(methodName),
        returns: buildReturnValue({
          value: buildPrimitiveValue({
            typeName: primitiveLiteral('string'),
          }),
        }),
      }),
    );

    // ACT
    const result = methods(a, b);

    // ASSERT
    expect(Array.from(result)).toEqual<ReturnTypeChangeInfo[]>([
      {
        kind: 'changed',
        target: 'returns-array',
        category: 'major',
        a: {
          context: {
            scope: 'returns',
            service: title,
            interface: interfaceName,
            method: methodName,
            returns: 'string',
          },
          value: true,
        },
        b: {
          context: {
            scope: 'returns',
            service: title,
            interface: interfaceName,
            method: methodName,
            returns: 'string',
          },
          value: false,
        },
      },
    ]);
  });

  it('identifies a changed method return type isPrimitive', () => {
    // ARRANGE
    const [a, b] = setup(
      buildMethod({
        name: stringLiteral(methodName),
        returns: buildReturnValue({
          value: buildPrimitiveValue({
            typeName: primitiveLiteral('string'),
          }),
        }),
      }),
      buildMethod({
        name: stringLiteral(methodName),
        returns: buildReturnValue({
          value: buildComplexValue({
            typeName: stringLiteral('string'),
          }),
        }),
      }),
    );

    // ACT
    const result = methods(a, b);

    // ASSERT
    expect(Array.from(result)).toEqual<ReturnTypeChangeInfo[]>([
      {
        kind: 'changed',
        target: 'returns-primitive',
        category: 'major',
        a: {
          context: {
            scope: 'returns',
            service: title,
            interface: interfaceName,
            method: methodName,
            returns: 'string',
          },
          value: true,
        },
        b: {
          context: {
            scope: 'returns',
            service: title,
            interface: interfaceName,
            method: methodName,
            returns: 'string',
          },
          value: false,
        },
      },
    ]);
  });
});
