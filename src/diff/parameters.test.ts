import { MethodScope, ParameterChangeInfo, RuleChangeInfo } from '.';
import { Parameter } from '../ir';
import { parameters } from './parameters';
import {
  buildComplexValue,
  buildInterface,
  buildMethod,
  buildParameter,
  buildPrimitiveValue,
  buildService,
  primitiveLiteral,
  stringLiteral,
  trueLiteral,
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
    name: stringLiteral(methodName),
    parameters: a ? [a] : [],
  });

  const b_method = buildMethod({
    name: stringLiteral(methodName),
    parameters: b ? [b] : [],
  });

  const a_int = buildInterface({
    name: stringLiteral(interfaceName),
    methods: [a_method],
  });
  const b_int = buildInterface({
    name: stringLiteral(interfaceName),
    methods: [b_method],
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
    { service: a_service, interface: a_int, method: a_method },
    { service: b_service, interface: b_int, method: b_method },
  ];
}

describe(parameters, () => {
  it('identifies two identical parameters', () => {
    // ARRANGE
    const [a, b] = setup(
      buildParameter({ name: stringLiteral(parameterName) }),
      buildParameter({ name: stringLiteral(parameterName) }),
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
      buildParameter({ name: stringLiteral(parameterName) }),
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
        },
      },
    ]);
  });

  it('identifies an added required parameter', () => {
    // ARRANGE
    const [a, b] = setup(
      undefined,
      buildParameter({
        name: stringLiteral(parameterName),
        value: buildPrimitiveValue({
          typeName: primitiveLiteral('string'),
          isOptional: undefined,
        }),
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
        },
      },
    ]);
  });

  it('identifies a removed optional parameter', () => {
    // ARRANGE
    const [a, b] = setup(
      buildParameter({ name: stringLiteral(parameterName) }),
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
        },
      },
    ]);
  });

  it('identifies a removed required parameter', () => {
    // ARRANGE
    const [a, b] = setup(
      buildParameter({
        name: stringLiteral(parameterName),
        value: buildPrimitiveValue({
          typeName: primitiveLiteral('string'),
          isOptional: undefined,
        }),
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
        },
      },
    ]);
  });

  it('identifies changed parameter name casing', () => {
    // ARRANGE
    const originalName = 'SOME_NAME';
    const newName = 'someName';

    const [a, b] = setup(
      buildParameter({ name: stringLiteral(originalName) }),
      buildParameter({ name: stringLiteral(newName) }),
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
      buildParameter({ name: stringLiteral(parameterName) }),
      buildParameter({
        name: stringLiteral(parameterName),
        description: [stringLiteral(description)],
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
          value: [description],
        },
      },
    ]);
  });

  it('identifies a removed parameter description', () => {
    // ARRANGE
    const description = 'some description';
    const [a, b] = setup(
      buildParameter({
        name: stringLiteral(parameterName),
        description: [stringLiteral(description)],
      }),
      buildParameter({ name: stringLiteral(parameterName) }),
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
          value: [description],
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
        name: stringLiteral(parameterName),
        description: [stringLiteral(originalDescription)],
      }),
      buildParameter({
        name: stringLiteral(parameterName),
        description: [stringLiteral(newDescription)],
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
          value: [originalDescription],
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
          value: [newDescription],
        },
      },
    ]);
  });

  it('identifies an added parameter deprecation', () => {
    // ARRANGE
    const [a, b] = setup(
      buildParameter({ name: stringLiteral(parameterName) }),
      buildParameter({
        name: stringLiteral(parameterName),
        deprecated: trueLiteral(),
      }),
    );

    // ACT
    const result = parameters(a, b);

    // ASSERT
    expect(Array.from(result)).toEqual<ParameterChangeInfo[]>([
      {
        kind: 'added',
        target: 'parameter-deprecated',
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
          value: true,
        },
      },
    ]);
  });

  it('identifies a removed parameter deprecation', () => {
    // ARRANGE
    const [a, b] = setup(
      buildParameter({
        name: stringLiteral(parameterName),
        deprecated: trueLiteral(),
      }),
      buildParameter({
        name: stringLiteral(parameterName),
      }),
    );

    // ACT
    const result = parameters(a, b);

    // ASSERT
    expect(Array.from(result)).toEqual<ParameterChangeInfo[]>([
      {
        kind: 'removed',
        target: 'parameter-deprecated',
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
          value: true,
        },
      },
    ]);
  });

  it('identifies a changed parameter type', () => {
    // ARRANGE
    const [a, b] = setup(
      buildParameter({
        name: stringLiteral(parameterName),
        value: buildPrimitiveValue({
          typeName: primitiveLiteral('number'),
        }),
      }),
      buildParameter({
        name: stringLiteral(parameterName),
        value: buildPrimitiveValue({
          typeName: primitiveLiteral('string'),
        }),
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
        name: stringLiteral(parameterName),
        value: buildPrimitiveValue({
          typeName: primitiveLiteral('string'),
          isArray: trueLiteral(),
        }),
      }),
      buildParameter({
        name: stringLiteral(parameterName),
        value: buildPrimitiveValue({
          typeName: primitiveLiteral('string'),
        }),
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
        },
      },
    ]);
  });

  it('identifies a changed parameter type isPrimitive', () => {
    // ARRANGE
    const [a, b] = setup(
      buildParameter({
        name: stringLiteral(parameterName),
        value: buildPrimitiveValue({
          typeName: primitiveLiteral('string'),
          isOptional: { kind: 'TrueLiteral', value: true },
        }),
      }),
      buildParameter({
        name: stringLiteral(parameterName),
        value: buildComplexValue({
          typeName: stringLiteral('string'),
          isOptional: { kind: 'TrueLiteral', value: true },
        }),
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
        },
      },
    ]);
  });
});
