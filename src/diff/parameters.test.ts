import { MethodScope, ParameterChangeInfo, RuleChangeInfo } from '.';
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
    expect(Array.from(result)).toEqual<ParameterChangeInfo[]>([]);
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
    expect(Array.from(result)).toEqual<ParameterChangeInfo[]>([
      {
        kind: 'added',
        target: 'parameter',
        category: 'minor',
        b: {
          context: {
            scope: 'parameter',
            service: title,
            interface: interfaceName,
            method: methodName,
            parameter: parameterName,
            required: false,
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
    expect(Array.from(result)).toEqual<
      (ParameterChangeInfo | RuleChangeInfo)[]
    >([
      {
        kind: 'added',
        target: 'parameter',
        category: 'major',
        b: {
          context: {
            scope: 'parameter',
            service: title,
            interface: interfaceName,
            method: methodName,
            parameter: parameterName,
            required: true,
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
    expect(Array.from(result)).toEqual<ParameterChangeInfo[]>([
      {
        kind: 'removed',
        target: 'parameter',
        category: 'major',
        a: {
          context: {
            scope: 'parameter',
            service: title,
            interface: interfaceName,
            method: methodName,
            parameter: parameterName,
            required: false,
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
    expect(Array.from(result)).toEqual<
      (ParameterChangeInfo | RuleChangeInfo)[]
    >([
      {
        kind: 'removed',
        target: 'parameter',
        category: 'major',
        a: {
          context: {
            scope: 'parameter',
            service: title,
            interface: interfaceName,
            method: methodName,
            parameter: parameterName,
            required: true,
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
    expect(Array.from(result)).toEqual<ParameterChangeInfo[]>([
      {
        kind: 'changed',
        target: 'parameter-name-casing',
        category: 'patch',
        a: {
          context: {
            scope: 'parameter',
            service: title,
            interface: interfaceName,
            method: methodName,
            parameter: originalName,
            required: false,
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
            required: false,
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
    expect(Array.from(result)).toEqual<ParameterChangeInfo[]>([
      {
        kind: 'added',
        target: 'parameter-description',
        category: 'patch',
        b: {
          context: {
            scope: 'parameter',
            service: title,
            interface: interfaceName,
            method: methodName,
            parameter: parameterName,
            required: false,
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
    expect(Array.from(result)).toEqual<ParameterChangeInfo[]>([
      {
        kind: 'removed',
        target: 'parameter-description',
        category: 'patch',
        a: {
          context: {
            scope: 'parameter',
            service: title,
            interface: interfaceName,
            method: methodName,
            parameter: parameterName,
            required: false,
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
    expect(Array.from(result)).toEqual<ParameterChangeInfo[]>([
      {
        kind: 'changed',
        target: 'parameter-description',
        category: 'patch',
        a: {
          context: {
            scope: 'parameter',
            service: title,
            interface: interfaceName,
            method: methodName,
            parameter: parameterName,
            required: false,
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
            required: false,
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
    expect(Array.from(result)).toEqual<ParameterChangeInfo[]>([
      {
        kind: 'changed',
        target: 'parameter-type',
        category: 'major',
        a: {
          context: {
            scope: 'parameter',
            service: title,
            interface: interfaceName,
            method: methodName,
            parameter: parameterName,
            required: false,
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
            required: false,
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
    expect(Array.from(result)).toEqual<ParameterChangeInfo[]>([
      {
        kind: 'changed',
        target: 'parameter-type-array',
        category: 'major',
        a: {
          context: {
            scope: 'parameter',
            service: title,
            interface: interfaceName,
            method: methodName,
            parameter: parameterName,
            required: false,
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
            required: false,
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
    expect(Array.from(result)).toEqual<ParameterChangeInfo[]>([
      {
        kind: 'changed',
        target: 'parameter-type-primitive',
        category: 'major',
        a: {
          context: {
            scope: 'parameter',
            service: title,
            interface: interfaceName,
            method: methodName,
            parameter: parameterName,
            required: false,
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
            required: false,
          },
          value: false,
          loc: '1;1;0',
        },
      },
    ]);
  });
});
