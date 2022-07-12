import { ChangeInfo, InterfaceScope } from '.';
import { Method } from '..';
import { methods } from './methods';
import {
  buildInterface,
  buildMethod,
  buildReturnType,
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

  const a_int = buildInterface({ name: interfaceName, methods: a_methods });
  const b_int = buildInterface({ name: interfaceName, methods: b_methods });
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
    expect(Array.from(result)).toEqual<ChangeInfo[]>([]);
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
    expect(Array.from(result)).toEqual<ChangeInfo[]>([
      {
        kind: 'added',
        target: 'method',
        b: {
          context: {
            interface: 'interface name',
            method: 'method name',
            scope: 'method',
            service: 'service title',
          },
          loc: '1;1;0',
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
    expect(Array.from(result)).toEqual<ChangeInfo[]>([
      {
        kind: 'removed',
        target: 'method',
        a: {
          context: {
            interface: 'interface name',
            method: 'method name',
            scope: 'method',
            service: 'service title',
          },
          loc: '1;1;0',
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
    expect(Array.from(result)).toEqual<ChangeInfo[]>([
      {
        kind: 'changed',
        target: 'method-name-casing',
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
    expect(Array.from(result)).toEqual<ChangeInfo[]>([
      {
        kind: 'added',
        target: 'method-description',
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
    expect(Array.from(result)).toEqual<ChangeInfo[]>([
      {
        kind: 'removed',
        target: 'method-description',
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
    expect(Array.from(result)).toEqual<ChangeInfo[]>([
      {
        kind: 'changed',
        target: 'method-description',
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
    expect(Array.from(result)).toEqual<ChangeInfo[]>([]);
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
    expect(Array.from(result)).toEqual<ChangeInfo[]>([
      {
        kind: 'added',
        target: 'return-type',
        b: {
          context: {
            scope: 'return-type',
            service: title,
            interface: interfaceName,
            method: methodName,
            returnType: 'string',
          },
          value: 'string',
          loc: '1;1;0',
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
    expect(Array.from(result)).toEqual<ChangeInfo[]>([
      {
        kind: 'removed',
        target: 'return-type',
        a: {
          context: {
            scope: 'return-type',
            service: title,
            interface: interfaceName,
            method: methodName,
            returnType: 'string',
          },
          value: 'string',
          loc: '1;1;0',
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
    expect(Array.from(result)).toEqual<ChangeInfo[]>([
      {
        kind: 'changed',
        target: 'return-type',
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
    expect(Array.from(result)).toEqual<ChangeInfo[]>([
      {
        kind: 'changed',
        target: 'return-type-array',
        a: {
          context: {
            scope: 'return-type',
            service: title,
            interface: interfaceName,
            method: methodName,
            returnType: 'string',
          },
          value: true,
          loc: '1;1;0',
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
          loc: '1;1;0',
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
    expect(Array.from(result)).toEqual<ChangeInfo[]>([
      {
        kind: 'changed',
        target: 'return-type-primitive',
        a: {
          context: {
            scope: 'return-type',
            service: title,
            interface: interfaceName,
            method: methodName,
            returnType: 'string',
          },
          value: true,
          loc: '1;1;0',
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
          loc: '1;1;0',
        },
      },
    ]);
  });
});
