import { InterfaceScope, MethodChangeInfo, ReturnTypeChangeInfo } from '.';
import { Method } from '../ir';
import { methods } from './methods';
import {
  buildInterface,
  buildMethod,
  buildReturnType,
  buildScalar,
  buildService,
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
    name: buildScalar(interfaceName),
    methods: a_methods,
  });
  const b_int = buildInterface({
    name: buildScalar(interfaceName),
    methods: b_methods,
  });
  const a_service = buildService({
    title: { value: title },
    interfaces: [a_int],
  });
  const b_service = buildService({
    title: { value: title },
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
      buildMethod({ name: { value: methodName } }),
      buildMethod({ name: { value: methodName } }),
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
      buildMethod({ name: { value: methodName } }),
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
      buildMethod({ name: { value: methodName } }),
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
      buildMethod({ name: { value: originalName } }),
      buildMethod({ name: { value: newName } }),
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
      buildMethod({ name: { value: methodName } }),
      buildMethod({
        name: { value: methodName },
        description: { value: description },
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
          value: description,
        },
      },
    ]);
  });

  it('identifies a removed method description', () => {
    // ARRANGE
    const description = 'some description';
    const [a, b] = setup(
      buildMethod({
        name: { value: methodName },
        description: { value: description },
      }),
      buildMethod({ name: { value: methodName } }),
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
          value: description,
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
        name: { value: methodName },
        description: { value: originalDescription },
      }),
      buildMethod({
        name: { value: methodName },
        description: { value: newDescription },
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
          value: originalDescription,
        },
        b: {
          context: {
            scope: 'method',
            service: title,
            interface: interfaceName,
            method: methodName,
          },
          value: newDescription,
        },
      },
    ]);
  });

  it('identifies two identical method return types', () => {
    // ARRANGE
    const [a, b] = setup(
      buildMethod({
        name: { value: methodName },
        returnType: buildReturnType({ typeName: { value: 'string' } }),
      }),
      buildMethod({
        name: { value: methodName },
        returnType: buildReturnType({ typeName: { value: 'string' } }),
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
      buildMethod({ name: { value: methodName } }),
      buildMethod({
        name: { value: methodName },
        returnType: buildReturnType({ typeName: { value: 'string' } }),
      }),
    );

    // ACT
    const result = methods(a, b);

    // ASSERT
    expect(Array.from(result)).toEqual<ReturnTypeChangeInfo[]>([
      {
        kind: 'added',
        target: 'return-type',
        category: 'major',
        b: {
          context: {
            scope: 'return-type',
            service: title,
            interface: interfaceName,
            method: methodName,
            returnType: 'string',
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
        name: { value: methodName },
        returnType: buildReturnType({ typeName: { value: 'string' } }),
      }),
      buildMethod({ name: { value: methodName } }),
    );

    // ACT
    const result = methods(a, b);

    // ASSERT
    expect(Array.from(result)).toEqual<ReturnTypeChangeInfo[]>([
      {
        kind: 'removed',
        target: 'return-type',
        category: 'major',
        a: {
          context: {
            scope: 'return-type',
            service: title,
            interface: interfaceName,
            method: methodName,
            returnType: 'string',
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
        name: { value: methodName },
        returnType: buildReturnType({ typeName: { value: 'number' } }),
      }),
      buildMethod({
        name: { value: methodName },
        returnType: buildReturnType({ typeName: { value: 'string' } }),
      }),
    );

    // ACT
    const result = methods(a, b);

    // ASSERT
    expect(Array.from(result)).toEqual<ReturnTypeChangeInfo[]>([
      {
        kind: 'changed',
        target: 'return-type',
        category: 'major',
        a: {
          context: {
            scope: 'return-type',
            service: title,
            interface: interfaceName,
            method: methodName,
            returnType: 'number',
          },
          value: 'number',
        },
        b: {
          context: {
            scope: 'return-type',
            service: title,
            interface: interfaceName,
            method: methodName,
            returnType: 'string',
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
        name: { value: methodName },
        returnType: buildReturnType({
          typeName: { value: 'string' },
          isArray: true,
        }),
      }),
      buildMethod({
        name: { value: methodName },
        returnType: buildReturnType({
          typeName: { value: 'string' },
          isArray: false,
        }),
      }),
    );

    // ACT
    const result = methods(a, b);

    // ASSERT
    expect(Array.from(result)).toEqual<ReturnTypeChangeInfo[]>([
      {
        kind: 'changed',
        target: 'return-type-array',
        category: 'major',
        a: {
          context: {
            scope: 'return-type',
            service: title,
            interface: interfaceName,
            method: methodName,
            returnType: 'string',
          },
          value: true,
        },
        b: {
          context: {
            scope: 'return-type',
            service: title,
            interface: interfaceName,
            method: methodName,
            returnType: 'string',
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
        name: { value: methodName },
        returnType: buildReturnType({
          typeName: { value: 'string' },
          isPrimitive: true,
        }),
      }),
      buildMethod({
        name: { value: methodName },
        returnType: buildReturnType({
          typeName: { value: 'string' },
          isPrimitive: false,
        }),
      }),
    );

    // ACT
    const result = methods(a, b);

    // ASSERT
    expect(Array.from(result)).toEqual<ReturnTypeChangeInfo[]>([
      {
        kind: 'changed',
        target: 'return-type-primitive',
        category: 'major',
        a: {
          context: {
            scope: 'return-type',
            service: title,
            interface: interfaceName,
            method: methodName,
            returnType: 'string',
          },
          value: true,
        },
        b: {
          context: {
            scope: 'return-type',
            service: title,
            interface: interfaceName,
            method: methodName,
            returnType: 'string',
          },
          value: false,
        },
      },
    ]);
  });
});
