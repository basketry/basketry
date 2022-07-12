import { ChangeInfo, MethodScope } from '.';
import { Parameter } from '../types';
import { parameters } from './parameters';
import {
  buildInterface,
  buildMethod,
  buildParameter,
  buildService,
} from './test-utils';

const title = 'service title';
const interfaceName = 'interface name';
const methodName = 'method name';
const parameterName = 'parameter name';
function setup(
  a: Parameter | undefined,
  b: Parameter | undefined,
): [MethodScope, MethodScope] {
  const a_method = buildMethod({
    name: { value: methodName },
    parameters: a ? [a] : [],
  });

  const b_method = buildMethod({
    name: { value: methodName },
    parameters: b ? [b] : [],
  });

  const a_int = buildInterface({ name: interfaceName, methods: [a_method] });
  const b_int = buildInterface({ name: interfaceName, methods: [b_method] });
  const a_service = buildService({
    title: { value: title },
    interfaces: [a_int],
  });
  const b_service = buildService({
    title: { value: title },
    interfaces: [b_int],
  });

  return [
    { service: a_service, interface: a_int, method: a_method },
    { service: b_service, interface: b_int, method: b_method },
  ];
}

describe(parameters, () => {
  it('identifies two identical parameters', () => {
    // ARRANGE
    const [a, b] = setup(
      buildParameter({ name: { value: parameterName } }),
      buildParameter({ name: { value: parameterName } }),
    );

    // ACT
    const result = parameters(a, b);

    // ASSERT
    expect(Array.from(result)).toEqual<ChangeInfo[]>([]);
  });

  it('identifies an added optional parameter', () => {
    // ARRANGE
    const [a, b] = setup(
      undefined,
      buildParameter({ name: { value: parameterName } }),
    );

    // ACT
    const result = parameters(a, b);

    // ASSERT
    expect(Array.from(result)).toEqual<ChangeInfo[]>([
      {
        kind: 'added',
        target: 'parameter',
        b: {
          context: {
            scope: 'parameter',
            service: title,
            interface: interfaceName,
            method: methodName,
            parameter: parameterName,
          },
          value: parameterName,
          loc: '1;1;0',
        },
      },
    ]);
  });

  it('identifies an added required parameter', () => {
    // ARRANGE
    const [a, b] = setup(
      undefined,
      buildParameter({
        name: { value: parameterName },
        rules: [{ id: 'required' }],
      }),
    );

    // ACT
    const result = parameters(a, b);

    // ASSERT
    expect(Array.from(result)).toEqual<ChangeInfo[]>([
      {
        kind: 'added',
        target: 'parameter',
        b: {
          context: {
            scope: 'parameter',
            service: title,
            interface: interfaceName,
            method: methodName,
            parameter: parameterName,
          },
          value: parameterName,
          loc: '1;1;0',
        },
      },
      {
        kind: 'added',
        target: 'required',
        b: {
          context: {
            scope: 'parameter',
            service: title,
            interface: interfaceName,
            method: methodName,
            parameter: parameterName,
          },
          value: parameterName,
          loc: '1;1;0',
        },
      },
    ]);
  });

  it('identifies a removed optional parameter', () => {
    // ARRANGE
    const [a, b] = setup(
      buildParameter({ name: { value: parameterName } }),
      undefined,
    );

    // ACT
    const result = parameters(a, b);

    // ASSERT
    expect(Array.from(result)).toEqual<ChangeInfo[]>([
      {
        kind: 'removed',
        target: 'parameter',
        a: {
          context: {
            scope: 'parameter',
            service: title,
            interface: interfaceName,
            method: methodName,
            parameter: parameterName,
          },
          value: parameterName,
          loc: '1;1;0',
        },
      },
    ]);
  });

  it('identifies a removed required parameter', () => {
    // ARRANGE
    const [a, b] = setup(
      buildParameter({
        name: { value: parameterName },
        rules: [{ id: 'required' }],
      }),
      undefined,
    );

    // ACT
    const result = parameters(a, b);

    // ASSERT
    expect(Array.from(result)).toEqual<ChangeInfo[]>([
      {
        kind: 'removed',
        target: 'parameter',
        a: {
          context: {
            scope: 'parameter',
            service: title,
            interface: interfaceName,
            method: methodName,
            parameter: parameterName,
          },
          value: parameterName,
          loc: '1;1;0',
        },
      },
      {
        kind: 'removed',
        target: 'required',
        a: {
          context: {
            scope: 'parameter',
            service: title,
            interface: interfaceName,
            method: methodName,
            parameter: parameterName,
          },
          value: parameterName,
          loc: '1;1;0',
        },
      },
    ]);
  });

  it('identifies changed parameter name casing', () => {
    // ARRANGE
    const originalName = 'SOME_NAME';
    const newName = 'someName';

    const [a, b] = setup(
      buildParameter({ name: { value: originalName } }),
      buildParameter({ name: { value: newName } }),
    );

    // ACT
    const result = parameters(a, b);

    // ASSERT
    expect(Array.from(result)).toEqual<ChangeInfo[]>([
      {
        kind: 'changed',
        target: 'parameter-name-casing',
        a: {
          context: {
            scope: 'parameter',
            service: title,
            interface: interfaceName,
            method: methodName,
            parameter: originalName,
          },
          value: originalName,
        },
        b: {
          context: {
            scope: 'parameter',
            service: title,
            interface: interfaceName,
            method: methodName,
            parameter: newName,
          },
          value: newName,
        },
      },
    ]);
  });

  it('identifies an added parameter description', () => {
    // ARRANGE
    const description = 'some description';
    const [a, b] = setup(
      buildParameter({ name: { value: parameterName } }),
      buildParameter({
        name: { value: parameterName },
        description: { value: description },
      }),
    );

    // ACT
    const result = parameters(a, b);

    // ASSERT
    expect(Array.from(result)).toEqual<ChangeInfo[]>([
      {
        kind: 'added',
        target: 'parameter-description',
        b: {
          context: {
            scope: 'parameter',
            service: title,
            interface: interfaceName,
            method: methodName,
            parameter: parameterName,
          },
          value: description,
        },
      },
    ]);
  });

  it('identifies a removed parameter description', () => {
    // ARRANGE
    const description = 'some description';
    const [a, b] = setup(
      buildParameter({
        name: { value: parameterName },
        description: { value: description },
      }),
      buildParameter({ name: { value: parameterName } }),
    );

    // ACT
    const result = parameters(a, b);

    // ASSERT
    expect(Array.from(result)).toEqual<ChangeInfo[]>([
      {
        kind: 'removed',
        target: 'parameter-description',
        a: {
          context: {
            scope: 'parameter',
            service: title,
            interface: interfaceName,
            method: methodName,
            parameter: parameterName,
          },
          value: description,
        },
      },
    ]);
  });

  it('identifies a changed interface description', () => {
    // ARRANGE
    const originalDescription = 'some description';
    const newDescription = 'different description';
    const [a, b] = setup(
      buildParameter({
        name: { value: parameterName },
        description: { value: originalDescription },
      }),
      buildParameter({
        name: { value: parameterName },
        description: { value: newDescription },
      }),
    );

    // ACT
    const result = parameters(a, b);

    // ASSERT
    expect(Array.from(result)).toEqual<ChangeInfo[]>([
      {
        kind: 'changed',
        target: 'parameter-description',
        a: {
          context: {
            scope: 'parameter',
            service: title,
            interface: interfaceName,
            method: methodName,
            parameter: parameterName,
          },
          value: originalDescription,
        },
        b: {
          context: {
            scope: 'parameter',
            service: title,
            interface: interfaceName,
            method: methodName,
            parameter: parameterName,
          },
          value: newDescription,
        },
      },
    ]);
  });

  it('identifies a changed parameter type', () => {
    // ARRANGE
    const [a, b] = setup(
      buildParameter({
        name: { value: parameterName },
        typeName: { value: 'number' },
      }),
      buildParameter({
        name: { value: parameterName },
        typeName: { value: 'string' },
      }),
    );

    // ACT
    const result = parameters(a, b);

    // ASSERT
    expect(Array.from(result)).toEqual<ChangeInfo[]>([
      {
        kind: 'changed',
        target: 'parameter-type',
        a: {
          context: {
            scope: 'parameter',
            service: title,
            interface: interfaceName,
            method: methodName,
            parameter: parameterName,
          },
          value: 'number',
        },
        b: {
          context: {
            scope: 'parameter',
            service: title,
            interface: interfaceName,
            method: methodName,
            parameter: parameterName,
          },
          value: 'string',
        },
      },
    ]);
  });

  it('identifies a changed parameter type isArray', () => {
    // ARRANGE
    const [a, b] = setup(
      buildParameter({
        name: { value: parameterName },
        isArray: true,
      }),
      buildParameter({
        name: { value: parameterName },
        isArray: false,
      }),
    );

    // ACT
    const result = parameters(a, b);

    // ASSERT
    expect(Array.from(result)).toEqual<ChangeInfo[]>([
      {
        kind: 'changed',
        target: 'parameter-type-array',
        a: {
          context: {
            scope: 'parameter',
            service: title,
            interface: interfaceName,
            method: methodName,
            parameter: parameterName,
          },
          value: true,
          loc: '1;1;0',
        },
        b: {
          context: {
            scope: 'parameter',
            service: title,
            interface: interfaceName,
            method: methodName,
            parameter: parameterName,
          },
          value: false,
          loc: '1;1;0',
        },
      },
    ]);
  });

  it('identifies a changed parameter type isPrimitive', () => {
    // ARRANGE
    const [a, b] = setup(
      buildParameter({
        name: { value: parameterName },
        isPrimitive: true,
      }),
      buildParameter({
        name: { value: parameterName },
        isPrimitive: false,
      }),
    );

    // ACT
    const result = parameters(a, b);

    // ASSERT
    expect(Array.from(result)).toEqual<ChangeInfo[]>([
      {
        kind: 'changed',
        target: 'parameter-type-primitive',
        a: {
          context: {
            scope: 'parameter',
            service: title,
            interface: interfaceName,
            method: methodName,
            parameter: parameterName,
          },
          value: true,
          loc: '1;1;0',
        },
        b: {
          context: {
            scope: 'parameter',
            service: title,
            interface: interfaceName,
            method: methodName,
            parameter: parameterName,
          },
          value: false,
          loc: '1;1;0',
        },
      },
    ]);
  });
});
