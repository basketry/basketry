import {
  ParameterContext,
  ParameterScope,
  PropertyContext,
  PropertyScope,
  ReturnValueContext,
  ReturnValueScope,
  RuleChangeInfo,
  RuleContext,
} from '.';
import { ValidationRule } from '../ir';
import { Mode, rules } from './rules';
import {
  buildComplexValue,
  buildInterface,
  buildMethod,
  buildParameter,
  buildPrimitiveValue,
  buildProperty,
  buildReturnValue,
  buildService,
  buildType,
  nonEmptyStringLiteral,
  nonNegativeIntegerLiteral,
  nonNegativeNumberLiteral,
  numberLiteral,
  stringLiteral,
} from './test-utils';

type SetupFunction = (
  a: ValidationRule | undefined,
  b: ValidationRule | undefined,
) =>
  | [ParameterScope, ParameterScope]
  | [ReturnValueScope, ReturnValueScope]
  | [PropertyScope, PropertyScope];

const title = 'service title';
const interfaceName = 'interface name';
const methodName = 'method name';
const parameterName = 'parameter name';

function setupParameter(
  a: ValidationRule | undefined,
  b: ValidationRule | undefined,
): [ParameterScope, ParameterScope] {
  const a_param = buildParameter({
    name: stringLiteral(parameterName),
    value: buildPrimitiveValue({
      rules: a ? [a] : [],
    }),
  });
  const b_param = buildParameter({
    name: stringLiteral(parameterName),
    value: buildPrimitiveValue({
      rules: b ? [b] : [],
    }),
  });
  const a_method = buildMethod({
    name: stringLiteral(methodName),
    parameters: [a_param],
  });
  const b_method = buildMethod({
    name: stringLiteral(methodName),
    parameters: [b_param],
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
    {
      service: a_service,
      interface: a_int,
      method: a_method,
      parameter: a_param,
    },
    {
      service: b_service,
      interface: b_int,
      method: b_method,
      parameter: b_param,
    },
  ];
}

function setupReturnValue(
  a: ValidationRule | undefined,
  b: ValidationRule | undefined,
): [ReturnValueScope, ReturnValueScope] {
  const a_method = buildMethod({
    name: stringLiteral(methodName),
    returns: buildReturnValue({
      value: buildPrimitiveValue({
        rules: a ? [a] : [],
      }),
    }),
  });
  const b_method = buildMethod({
    name: stringLiteral(methodName),
    returns: buildReturnValue({
      value: buildPrimitiveValue({
        rules: b ? [b] : [],
      }),
    }),
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
    {
      service: a_service,
      interface: a_int,
      method: a_method,
      returns: a_method.returns!,
    },
    {
      service: b_service,
      interface: b_int,
      method: b_method,
      returns: b_method.returns!,
    },
  ];
}

const typeName = 'type name';
const propertyName = 'property name';
function setupProperty(
  mode: 'input-property' | 'output-property',
  a: ValidationRule | undefined,
  b: ValidationRule | undefined,
): [PropertyScope, PropertyScope] {
  const a_property = buildProperty({
    name: stringLiteral(propertyName),
    value: buildPrimitiveValue({
      rules: a ? [a] : [],
    }),
  });

  const b_property = buildProperty({
    name: stringLiteral(propertyName),
    value: buildPrimitiveValue({
      rules: b ? [b] : [],
    }),
  });

  const a_type = buildType({
    name: stringLiteral(typeName),
    properties: [a_property],
  });

  const b_type = buildType({
    name: stringLiteral(typeName),
    properties: [b_property],
  });

  const a_parameter = buildParameter({
    name: stringLiteral(parameterName),
    value: buildComplexValue({
      typeName: stringLiteral(typeName),
    }),
  });
  const b_parameter = buildParameter({
    name: stringLiteral(parameterName),
    value: buildComplexValue({
      typeName: stringLiteral(typeName),
    }),
  });

  const a_method = buildMethod({
    name: stringLiteral(methodName),
    parameters: mode === 'input-property' ? [a_parameter] : [],
    returns:
      mode === 'input-property' || !a
        ? undefined
        : buildReturnValue({
            value: buildComplexValue({
              typeName: stringLiteral(typeName),
            }),
          }),
  });
  const b_method = buildMethod({
    name: stringLiteral(methodName),
    parameters: mode === 'input-property' ? [b_parameter] : [],
    returns:
      mode === 'input-property' || !b
        ? undefined
        : buildReturnValue({
            value: buildComplexValue({
              typeName: stringLiteral(typeName),
            }),
          }),
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
    types: [a_type],
  });
  const b_service = buildService({
    title: stringLiteral(title),
    interfaces: [b_int],
    types: [b_type],
  });

  return [
    { service: a_service, type: a_type, property: a_property },
    { service: b_service, type: b_type, property: b_property },
  ];
}

function describeRule<T extends ValidationRule['id']>(
  ruleId: T,
  fn: (id: T) => void,
): ReturnType<typeof describe> {
  describe(ruleId, () => fn(ruleId));
}

function describeRules<T extends ValidationRule['id']>(
  ruleIds: T[],
  fn: (id: T) => void,
): ReturnType<typeof describe> {
  for (const ruleId of ruleIds) describe(ruleId, () => fn(ruleId));
}

function forEachContext(
  fn: (setup: SetupFunction, context: RuleContext, mode: Mode) => void,
) {
  const parameterContext: ParameterContext = {
    scope: 'parameter',
    service: title,
    interface: interfaceName,
    method: methodName,
    parameter: parameterName,
    required: false,
  };

  const returnTypeContext: ReturnValueContext = {
    scope: 'returns',
    service: title,
    interface: interfaceName,
    method: methodName,
    returns: 'string',
  };

  const inputPropertyContext: PropertyContext = {
    scope: 'input-property',
    service: title,
    type: typeName,
    property: propertyName,
    required: false,
  };

  const outputPropertyContext: PropertyContext = {
    scope: 'output-property',
    service: title,
    type: typeName,
    property: propertyName,
    required: false,
  };

  describe('parameter', () =>
    fn(setupParameter, parameterContext, 'parameter'));
  describe('returns', () => fn(setupReturnValue, returnTypeContext, 'returns'));
  describe('input-property', () =>
    fn(
      (a, b) => setupProperty('input-property', a, b),
      inputPropertyContext,
      'input-property',
    ));
  describe('output-property', () =>
    fn(
      (a, b) => setupProperty('output-property', a, b),
      outputPropertyContext,
      'output-property',
    ));
}

describe(rules, () => {
  forEachContext((setup, context, mode) => {
    describeRule('ArrayMaxItems', (id) => {
      it('identifies two identical rules', () => {
        // ARRANGE
        const [a, b] = setup(
          { kind: 'ValidationRule', id, max: nonNegativeNumberLiteral(5) },
          { kind: 'ValidationRule', id, max: nonNegativeNumberLiteral(5) },
        );

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<RuleChangeInfo[]>([]);
      });

      it('identifies an added rule', () => {
        // ARRANGE
        const [a, b] = setup(undefined, {
          kind: 'ValidationRule',
          id,
          max: nonNegativeNumberLiteral(5),
        });

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<RuleChangeInfo[]>([
          {
            kind: 'added',
            target: id,
            category: 'major',
            b: { context, value: 5 },
          },
        ]);
      });

      it('identifies a removed rule', () => {
        // ARRANGE
        const [a, b] = setup(
          { kind: 'ValidationRule', id, max: nonNegativeNumberLiteral(5) },
          undefined,
        );

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<RuleChangeInfo[]>([
          {
            kind: 'removed',
            target: id,
            category: 'minor',
            a: { context, value: 5 },
          },
        ]);
      });

      it('identifies an increased max', () => {
        // ARRANGE
        const [a, b] = setup(
          { kind: 'ValidationRule', id, max: nonNegativeNumberLiteral(5) },
          { kind: 'ValidationRule', id, max: nonNegativeNumberLiteral(7) },
        );

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<RuleChangeInfo[]>([
          {
            kind: 'increased',
            target: id,
            category: 'minor',
            a: { context, value: 5 },
            b: { context, value: 7 },
          },
        ]);
      });

      it('identifies a decreased max', () => {
        // ARRANGE
        const [a, b] = setup(
          { kind: 'ValidationRule', id, max: nonNegativeNumberLiteral(5) },
          { kind: 'ValidationRule', id, max: nonNegativeNumberLiteral(3) },
        );

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<RuleChangeInfo[]>([
          {
            kind: 'decreased',
            target: id,
            category: 'major',
            a: { context, value: 5 },
            b: { context, value: 3 },
          },
        ]);
      });
    });

    describeRule('ArrayMinItems', (id) => {
      it('identifies two identical rules', () => {
        // ARRANGE
        const [a, b] = setup(
          { kind: 'ValidationRule', id, min: nonNegativeNumberLiteral(5) },
          { kind: 'ValidationRule', id, min: nonNegativeNumberLiteral(5) },
        );

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<RuleChangeInfo[]>([]);
      });

      it('identifies an added rule', () => {
        // ARRANGE
        const [a, b] = setup(undefined, {
          kind: 'ValidationRule',
          id,
          min: nonNegativeNumberLiteral(5),
        });

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<RuleChangeInfo[]>([
          {
            kind: 'added',
            target: id,
            category: 'major',
            b: { context, value: 5 },
          },
        ]);
      });

      it('identifies a removed rule', () => {
        // ARRANGE
        const [a, b] = setup(
          { kind: 'ValidationRule', id, min: nonNegativeNumberLiteral(5) },
          undefined,
        );

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<RuleChangeInfo[]>([
          {
            kind: 'removed',
            target: id,
            category: 'minor',
            a: { context, value: 5 },
          },
        ]);
      });

      it('identifies an increased min', () => {
        // ARRANGE
        const [a, b] = setup(
          { kind: 'ValidationRule', id, min: nonNegativeNumberLiteral(5) },
          { kind: 'ValidationRule', id, min: nonNegativeNumberLiteral(7) },
        );

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<RuleChangeInfo[]>([
          {
            kind: 'increased',
            target: id,
            category: 'major',
            a: { context, value: 5 },
            b: { context, value: 7 },
          },
        ]);
      });

      it('identifies a decreased min', () => {
        // ARRANGE
        const [a, b] = setup(
          { kind: 'ValidationRule', id, min: nonNegativeNumberLiteral(5) },
          { kind: 'ValidationRule', id, min: nonNegativeNumberLiteral(3) },
        );

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<RuleChangeInfo[]>([
          {
            kind: 'decreased',
            target: id,
            category: 'minor',
            a: { context, value: 5 },
            b: { context, value: 3 },
          },
        ]);
      });
    });

    describeRule('ArrayUniqueItems', (id) => {
      it('identifies two identical rules', () => {
        // ARRANGE
        const [a, b] = setup(
          { kind: 'ValidationRule', id, required: true },
          { kind: 'ValidationRule', id, required: true },
        );

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<RuleChangeInfo[]>([]);
      });

      it('identifies an added rule', () => {
        // ARRANGE
        const [a, b] = setup(undefined, {
          kind: 'ValidationRule',
          id,
          required: true,
        });

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<RuleChangeInfo[]>([
          {
            kind: 'added',
            target: id,
            category: 'major',
            b: { context, value: true },
          },
        ]);
      });

      it('identifies a removed rule', () => {
        // ARRANGE
        const [a, b] = setup(
          { kind: 'ValidationRule', id, required: true },
          undefined,
        );

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<RuleChangeInfo[]>([
          {
            kind: 'removed',
            target: id,
            category: 'minor',
            a: { context, value: true },
          },
        ]);
      });
    });

    describeRules(['NumberGT', 'NumberGTE', 'NumberLT', 'NumberLTE'], (id) => {
      it('identifies two identical rules', () => {
        // ARRANGE
        const [a, b] = setup(
          { kind: 'ValidationRule', id, value: numberLiteral(5) },
          { kind: 'ValidationRule', id, value: numberLiteral(5) },
        );

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<RuleChangeInfo[]>([]);
      });

      it('identifies an added rule', () => {
        // ARRANGE
        const [a, b] = setup(undefined, {
          kind: 'ValidationRule',
          id,
          value: numberLiteral(5),
        });

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<RuleChangeInfo[]>([
          {
            kind: 'added',
            target: id,
            category: 'major',
            b: { context, value: 5 },
          },
        ]);
      });

      it('identifies a removed rule', () => {
        // ARRANGE
        const [a, b] = setup(
          { kind: 'ValidationRule', id, value: numberLiteral(5) },
          undefined,
        );

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<RuleChangeInfo[]>([
          {
            kind: 'removed',
            target: id,
            category: 'minor',
            a: { context, value: 5 },
          },
        ]);
      });

      it('identifies an increased value', () => {
        // ARRANGE
        const [a, b] = setup(
          { kind: 'ValidationRule', id, value: numberLiteral(5) },
          { kind: 'ValidationRule', id, value: numberLiteral(7) },
        );

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<RuleChangeInfo[]>([
          {
            kind: 'increased',
            target: id,
            category:
              id === 'NumberLT' || id === 'NumberLTE' ? 'minor' : 'major',
            a: { context, value: 5 },
            b: { context, value: 7 },
          },
        ]);
      });

      it('identifies a decreased value', () => {
        // ARRANGE
        const [a, b] = setup(
          { kind: 'ValidationRule', id, value: numberLiteral(5) },
          { kind: 'ValidationRule', id, value: numberLiteral(3) },
        );

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<RuleChangeInfo[]>([
          {
            kind: 'decreased',
            target: id,
            category:
              id === 'NumberGT' || id === 'NumberGTE' ? 'minor' : 'major',
            a: { context, value: 5 },
            b: { context, value: 3 },
          },
        ]);
      });
    });

    describeRules(['NumberMultipleOf'], (id) => {
      it('identifies two identical rules', () => {
        // ARRANGE
        const [a, b] = setup(
          { kind: 'ValidationRule', id, value: nonNegativeNumberLiteral(5) },
          { kind: 'ValidationRule', id, value: nonNegativeNumberLiteral(5) },
        );

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<RuleChangeInfo[]>([]);
      });

      it('identifies an added rule', () => {
        // ARRANGE
        const [a, b] = setup(undefined, {
          kind: 'ValidationRule',
          id,
          value: nonNegativeNumberLiteral(5),
        });

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<RuleChangeInfo[]>([
          {
            kind: 'added',
            target: id,
            category: 'major',
            b: { context, value: 5 },
          },
        ]);
      });

      it('identifies a removed rule', () => {
        // ARRANGE
        const [a, b] = setup(
          { kind: 'ValidationRule', id, value: nonNegativeNumberLiteral(5) },
          undefined,
        );

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<RuleChangeInfo[]>([
          {
            kind: 'removed',
            target: id,
            category: 'minor',
            a: { context, value: 5 },
          },
        ]);
      });

      it('identifies an increased value', () => {
        // ARRANGE
        const [a, b] = setup(
          { kind: 'ValidationRule', id, value: nonNegativeNumberLiteral(5) },
          { kind: 'ValidationRule', id, value: nonNegativeNumberLiteral(7) },
        );

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<RuleChangeInfo[]>([
          {
            kind: 'increased',
            target: id,
            category: 'major',
            a: { context, value: 5 },
            b: { context, value: 7 },
          },
        ]);
      });

      it('identifies a decreased value', () => {
        // ARRANGE
        const [a, b] = setup(
          { kind: 'ValidationRule', id, value: nonNegativeNumberLiteral(5) },
          { kind: 'ValidationRule', id, value: nonNegativeNumberLiteral(3) },
        );

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<RuleChangeInfo[]>([
          {
            kind: 'decreased',
            target: id,
            category: 'major',
            a: { context, value: 5 },
            b: { context, value: 3 },
          },
        ]);
      });
    });

    describeRule('StringFormat', (id) => {
      it('identifies two identical rules', () => {
        // ARRANGE
        const [a, b] = setup(
          { kind: 'ValidationRule', id, format: nonEmptyStringLiteral('date') },
          { kind: 'ValidationRule', id, format: nonEmptyStringLiteral('date') },
        );

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<RuleChangeInfo[]>([]);
      });

      it('identifies an added rule', () => {
        // ARRANGE
        const [a, b] = setup(undefined, {
          kind: 'ValidationRule',
          id,
          format: nonEmptyStringLiteral('date'),
        });

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<RuleChangeInfo[]>([
          {
            kind: 'added',
            target: id,
            category: 'major',
            b: { context, value: 'date' },
          },
        ]);
      });

      it('identifies a removed rule', () => {
        // ARRANGE
        const [a, b] = setup(
          { kind: 'ValidationRule', id, format: nonEmptyStringLiteral('date') },
          undefined,
        );

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<RuleChangeInfo[]>([
          {
            kind: 'removed',
            target: id,
            category: 'minor',
            a: { context, value: 'date' },
          },
        ]);
      });

      it('identifies a changed format', () => {
        // ARRANGE
        const [a, b] = setup(
          { kind: 'ValidationRule', id, format: nonEmptyStringLiteral('date') },
          {
            kind: 'ValidationRule',
            id,
            format: nonEmptyStringLiteral('date-time'),
          },
        );

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<RuleChangeInfo[]>([
          {
            kind: 'changed',
            target: id,
            category: 'major',
            a: { context, value: 'date' },
            b: { context, value: 'date-time' },
          },
        ]);
      });
    });

    describeRules(['StringMaxLength', 'StringMinLength'], (id) => {
      it('identifies two identical rules', () => {
        // ARRANGE
        const [a, b] = setup(
          { kind: 'ValidationRule', id, length: nonNegativeIntegerLiteral(50) },
          { kind: 'ValidationRule', id, length: nonNegativeIntegerLiteral(50) },
        );

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<RuleChangeInfo[]>([]);
      });

      it('identifies an added rule', () => {
        // ARRANGE
        const [a, b] = setup(undefined, {
          kind: 'ValidationRule',
          id,
          length: nonNegativeIntegerLiteral(50),
        });

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<RuleChangeInfo[]>([
          {
            kind: 'added',
            target: id,
            category: 'major',
            b: { context, value: 50 },
          },
        ]);
      });

      it('identifies a removed rule', () => {
        // ARRANGE
        const [a, b] = setup(
          { kind: 'ValidationRule', id, length: nonNegativeIntegerLiteral(50) },
          undefined,
        );

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<RuleChangeInfo[]>([
          {
            kind: 'removed',
            target: id,
            category: 'minor',
            a: { context, value: 50 },
          },
        ]);
      });

      it('identifies an increased value', () => {
        // ARRANGE
        const [a, b] = setup(
          { kind: 'ValidationRule', id, length: nonNegativeIntegerLiteral(50) },
          {
            kind: 'ValidationRule',
            id,
            length: nonNegativeIntegerLiteral(100),
          },
        );

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<RuleChangeInfo[]>([
          {
            kind: 'increased',
            target: id,
            category: id === 'StringMaxLength' ? 'minor' : 'major',
            a: { context, value: 50 },
            b: { context, value: 100 },
          },
        ]);
      });

      it('identifies a decreased value', () => {
        // ARRANGE
        const [a, b] = setup(
          { kind: 'ValidationRule', id, length: nonNegativeIntegerLiteral(50) },
          { kind: 'ValidationRule', id, length: nonNegativeIntegerLiteral(25) },
        );

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<RuleChangeInfo[]>([
          {
            kind: 'decreased',
            target: id,
            category: id === 'StringMaxLength' ? 'major' : 'minor',
            a: { context, value: 50 },
            b: { context, value: 25 },
          },
        ]);
      });
    });

    describeRule('StringPattern', (id) => {
      it('identifies two identical rules', () => {
        // ARRANGE
        const [a, b] = setup(
          {
            kind: 'ValidationRule',
            id,
            pattern: nonEmptyStringLiteral('^asdf$'),
          },
          {
            kind: 'ValidationRule',
            id,
            pattern: nonEmptyStringLiteral('^asdf$'),
          },
        );

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<RuleChangeInfo[]>([]);
      });

      it('identifies an added rule', () => {
        // ARRANGE
        const [a, b] = setup(undefined, {
          kind: 'ValidationRule',
          id,
          pattern: nonEmptyStringLiteral('^asdf$'),
        });

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<RuleChangeInfo[]>([
          {
            kind: 'added',
            target: id,
            category: 'major',
            b: { context, value: '^asdf$' },
          },
        ]);
      });

      it('identifies a removed rule', () => {
        // ARRANGE
        const [a, b] = setup(
          {
            kind: 'ValidationRule',
            id,
            pattern: nonEmptyStringLiteral('^asdf$'),
          },
          undefined,
        );

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<RuleChangeInfo[]>([
          {
            kind: 'removed',
            target: id,
            category: 'minor',
            a: { context, value: '^asdf$' },
          },
        ]);
      });

      it('identifies a changed pattern', () => {
        // ARRANGE
        const [a, b] = setup(
          {
            kind: 'ValidationRule',
            id,
            pattern: nonEmptyStringLiteral('^original$'),
          },
          {
            kind: 'ValidationRule',
            id,
            pattern: nonEmptyStringLiteral('^new$'),
          },
        );

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<RuleChangeInfo[]>([
          {
            kind: 'changed',
            target: id,
            category: 'major',
            a: { context, value: '^original$' },
            b: { context, value: '^new$' },
          },
        ]);
      });
    });

    describeRule('Required', (id) => {
      it('no-ops on identical rules', () => {
        // ARRANGE
        const [a, b] = setup(
          { kind: 'ValidationRule', id },
          { kind: 'ValidationRule', id },
        );

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<RuleChangeInfo[]>([]);
      });

      it('identifies an added rule', () => {
        // ARRANGE
        const [a, b] = setup(undefined, { kind: 'ValidationRule', id });
        const ctx =
          mode === 'returns'
            ? context
            : { ...(context as any), required: true };

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<RuleChangeInfo[]>([
          {
            kind: 'added',
            target: id,
            category: 'major',
            b: { context: ctx, value: true },
          },
        ]);
      });

      it('identifies a removed rule', () => {
        // ARRANGE
        const [a, b] = setup({ kind: 'ValidationRule', id }, undefined);
        const ctx =
          mode === 'returns'
            ? context
            : { ...(context as any), required: true };

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<RuleChangeInfo[]>([
          {
            kind: 'removed',
            target: id,
            category: 'minor',
            a: { context: ctx, value: true },
          },
        ]);
      });
    });
  });
});
