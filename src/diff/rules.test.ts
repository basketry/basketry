import {
  ChangeContext,
  ChangeInfo,
  MethodScope,
  ParameterScope,
  PropertyScope,
  ReturnTypeScope,
} from '.';
import { ValidationRule } from '../types';
import { Mode, rules } from './rules';
import {
  buildInterface,
  buildMethod,
  buildParameter,
  buildProperty,
  buildReturnType,
  buildService,
  buildType,
} from './test-utils';

type SetupFunction = (
  a: ValidationRule | undefined,
  b: ValidationRule | undefined,
) =>
  | [ParameterScope, ParameterScope]
  | [ReturnTypeScope, ReturnTypeScope]
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
    name: { value: parameterName },
    rules: a ? [a] : [],
  });
  const b_param = buildParameter({
    name: { value: parameterName },
    rules: b ? [b] : [],
  });
  const a_method = buildMethod({
    name: { value: methodName },
    parameters: [a_param],
  });
  const b_method = buildMethod({
    name: { value: methodName },
    parameters: [b_param],
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

function setupReturnType(
  a: ValidationRule | undefined,
  b: ValidationRule | undefined,
): [ReturnTypeScope, ReturnTypeScope] {
  const a_method = buildMethod({
    name: { value: methodName },
    returnType: buildReturnType({ rules: a ? [a] : [] }),
  });
  const b_method = buildMethod({
    name: { value: methodName },
    returnType: buildReturnType({ rules: b ? [b] : [] }),
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
    {
      service: a_service,
      interface: a_int,
      method: a_method,
      returnType: a_method.returnType!,
    },
    {
      service: b_service,
      interface: b_int,
      method: b_method,
      returnType: b_method.returnType!,
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
    name: { value: propertyName },
    rules: a ? [a] : [],
  });

  const b_property = buildProperty({
    name: { value: propertyName },
    rules: b ? [b] : [],
  });

  const a_type = buildType({
    name: { value: typeName },
    properties: [a_property],
  });

  const b_type = buildType({
    name: { value: typeName },
    properties: [b_property],
  });

  const a_parameter = buildParameter({
    name: { value: parameterName },
    isPrimitive: false,
    typeName: { value: typeName },
  });
  const b_parameter = buildParameter({
    name: { value: parameterName },
    isPrimitive: false,
    typeName: { value: typeName },
  });

  const a_method = buildMethod({
    name: { value: methodName },
    parameters: mode === 'input-property' ? [a_parameter] : [],
    returnType:
      mode === 'input-property' || !a
        ? undefined
        : buildReturnType({
            isPrimitive: false,
            typeName: { value: typeName },
          }),
  });
  const b_method = buildMethod({
    name: { value: methodName },
    parameters: mode === 'input-property' ? [b_parameter] : [],
    returnType:
      mode === 'input-property' || !b
        ? undefined
        : buildReturnType({
            isPrimitive: false,
            typeName: { value: typeName },
          }),
  });

  const a_int = buildInterface({ name: interfaceName, methods: [a_method] });
  const b_int = buildInterface({ name: interfaceName, methods: [b_method] });

  const a_service = buildService({
    title: { value: title },
    interfaces: [a_int],
    types: [a_type],
  });
  const b_service = buildService({
    title: { value: title },
    interfaces: [b_int],
    types: [b_type],
  });

  return [
    { service: a_service, type: a_type, property: a_property },
    { service: b_service, type: b_type, property: b_property },
  ];
}

const loc = '1;1;0';

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
  fn: (setup: SetupFunction, context: ChangeContext, mode: Mode) => void,
) {
  const parameterContext: ChangeContext = {
    scope: 'parameter',
    service: title,
    interface: interfaceName,
    method: methodName,
    parameter: parameterName,
  };

  const returnTypeContext: ChangeContext = {
    scope: 'return-type',
    service: title,
    interface: interfaceName,
    method: methodName,
    returnType: 'string',
  };

  const inputPropertyContext: ChangeContext = {
    scope: 'input-property',
    service: title,
    type: typeName,
    property: propertyName,
  };

  const outputPropertyContext: ChangeContext = {
    scope: 'output-property',
    service: title,
    type: typeName,
    property: propertyName,
  };

  describe('parameter', () =>
    fn(setupParameter, parameterContext, 'parameter'));
  describe('return-type', () =>
    fn(setupReturnType, returnTypeContext, 'return-type'));
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
    describeRule('array-max-items', (id) => {
      it('identifies two identical rules', () => {
        // ARRANGE
        const [a, b] = setup(
          { id, max: { value: 5 }, loc },
          { id, max: { value: 5 }, loc },
        );

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<ChangeInfo[]>([]);
      });

      it('identifies an added rule', () => {
        // ARRANGE
        const [a, b] = setup(undefined, { id, max: { value: 5 }, loc });

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<ChangeInfo[]>([
          {
            kind: 'added',
            target: id,
            b: { context, value: 5 },
          },
        ]);
      });

      it('identifies a removed rule', () => {
        // ARRANGE
        const [a, b] = setup({ id, max: { value: 5 }, loc }, undefined);

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<ChangeInfo[]>([
          {
            kind: 'removed',
            target: id,
            a: { context, value: 5 },
          },
        ]);
      });

      it('identifies an increased max', () => {
        // ARRANGE
        const [a, b] = setup(
          { id, max: { value: 5 }, loc },
          { id, max: { value: 7 }, loc },
        );

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<ChangeInfo[]>([
          {
            kind: 'increased',
            target: id,
            a: { context, value: 5 },
            b: { context, value: 7 },
          },
        ]);
      });

      it('identifies a decreased max', () => {
        // ARRANGE
        const [a, b] = setup(
          { id, max: { value: 5 }, loc },
          { id, max: { value: 3 }, loc },
        );

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<ChangeInfo[]>([
          {
            kind: 'decreased',
            target: id,
            a: { context, value: 5 },
            b: { context, value: 3 },
          },
        ]);
      });
    });

    describeRule('array-min-items', (id) => {
      it('identifies two identical rules', () => {
        // ARRANGE
        const [a, b] = setup(
          { id, min: { value: 5 }, loc },
          { id, min: { value: 5 }, loc },
        );

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<ChangeInfo[]>([]);
      });

      it('identifies an added rule', () => {
        // ARRANGE
        const [a, b] = setup(undefined, { id, min: { value: 5 }, loc });

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<ChangeInfo[]>([
          {
            kind: 'added',
            target: id,
            b: { context, value: 5 },
          },
        ]);
      });

      it('identifies a removed rule', () => {
        // ARRANGE
        const [a, b] = setup({ id, min: { value: 5 }, loc }, undefined);

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<ChangeInfo[]>([
          {
            kind: 'removed',
            target: id,
            a: { context, value: 5 },
          },
        ]);
      });

      it('identifies an increased min', () => {
        // ARRANGE
        const [a, b] = setup(
          { id, min: { value: 5 }, loc },
          { id, min: { value: 7 }, loc },
        );

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<ChangeInfo[]>([
          {
            kind: 'increased',
            target: id,
            a: { context, value: 5 },
            b: { context, value: 7 },
          },
        ]);
      });

      it('identifies a decreased min', () => {
        // ARRANGE
        const [a, b] = setup(
          { id, min: { value: 5 }, loc },
          { id, min: { value: 3 }, loc },
        );

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<ChangeInfo[]>([
          {
            kind: 'decreased',
            target: id,
            a: { context, value: 5 },
            b: { context, value: 3 },
          },
        ]);
      });
    });

    describeRule('array-unique-items', (id) => {
      it('identifies two identical rules', () => {
        // ARRANGE
        const [a, b] = setup(
          { id, required: true, loc },
          { id, required: true, loc },
        );

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<ChangeInfo[]>([]);
      });

      it('identifies an added rule', () => {
        // ARRANGE
        const [a, b] = setup(undefined, { id, required: true, loc });

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<ChangeInfo[]>([
          {
            kind: 'added',
            target: id,
            b: { context, value: true },
          },
        ]);
      });

      it('identifies a removed rule', () => {
        // ARRANGE
        const [a, b] = setup({ id, required: true, loc }, undefined);

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<ChangeInfo[]>([
          {
            kind: 'removed',
            target: id,
            a: { context, value: true },
          },
        ]);
      });
    });

    describeRules(
      [
        'number-gt',
        'number-gte',
        'number-lt',
        'number-lte',
        'number-multiple-of',
      ],
      (id) => {
        it('identifies two identical rules', () => {
          // ARRANGE
          const [a, b] = setup(
            { id, value: { value: 5 }, loc },
            { id, value: { value: 5 }, loc },
          );

          // ACT
          const result = rules(mode, a, b);

          // ASSERT
          expect(Array.from(result)).toEqual<ChangeInfo[]>([]);
        });

        it('identifies an added rule', () => {
          // ARRANGE
          const [a, b] = setup(undefined, { id, value: { value: 5 }, loc });

          // ACT
          const result = rules(mode, a, b);

          // ASSERT
          expect(Array.from(result)).toEqual<ChangeInfo[]>([
            {
              kind: 'added',
              target: id,
              b: { context, value: 5 },
            },
          ]);
        });

        it('identifies a removed rule', () => {
          // ARRANGE
          const [a, b] = setup({ id, value: { value: 5 }, loc }, undefined);

          // ACT
          const result = rules(mode, a, b);

          // ASSERT
          expect(Array.from(result)).toEqual<ChangeInfo[]>([
            {
              kind: 'removed',
              target: id,
              a: { context, value: 5 },
            },
          ]);
        });

        it('identifies an increased value', () => {
          // ARRANGE
          const [a, b] = setup(
            { id, value: { value: 5 }, loc },
            { id, value: { value: 7 }, loc },
          );

          // ACT
          const result = rules(mode, a, b);

          // ASSERT
          expect(Array.from(result)).toEqual<ChangeInfo[]>([
            {
              kind: 'increased',
              target: id,
              a: { context, value: 5 },
              b: { context, value: 7 },
            },
          ]);
        });

        it('identifies a decreased value', () => {
          // ARRANGE
          const [a, b] = setup(
            { id, value: { value: 5 }, loc },
            { id, value: { value: 3 }, loc },
          );

          // ACT
          const result = rules(mode, a, b);

          // ASSERT
          expect(Array.from(result)).toEqual<ChangeInfo[]>([
            {
              kind: 'decreased',
              target: id,
              a: { context, value: 5 },
              b: { context, value: 3 },
            },
          ]);
        });
      },
    );

    describeRule('string-format', (id) => {
      it('identifies two identical rules', () => {
        // ARRANGE
        const [a, b] = setup(
          { id, format: { value: 'date' }, loc },
          { id, format: { value: 'date' }, loc },
        );

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<ChangeInfo[]>([]);
      });

      it('identifies an added rule', () => {
        // ARRANGE
        const [a, b] = setup(undefined, { id, format: { value: 'date' }, loc });

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<ChangeInfo[]>([
          {
            kind: 'added',
            target: id,
            b: { context, value: 'date' },
          },
        ]);
      });

      it('identifies a removed rule', () => {
        // ARRANGE
        const [a, b] = setup({ id, format: { value: 'date' }, loc }, undefined);

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<ChangeInfo[]>([
          {
            kind: 'removed',
            target: id,
            a: { context, value: 'date' },
          },
        ]);
      });

      it('identifies a changed format', () => {
        // ARRANGE
        const [a, b] = setup(
          { id, format: { value: 'date' }, loc },
          { id, format: { value: 'date-time' }, loc },
        );

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<ChangeInfo[]>([
          {
            kind: 'changed',
            target: id,
            a: { context, value: 'date' },
            b: { context, value: 'date-time' },
          },
        ]);
      });
    });

    describeRules(['string-max-length', 'string-min-length'], (id) => {
      it('identifies two identical rules', () => {
        // ARRANGE
        const [a, b] = setup(
          { id, length: { value: 50 }, loc },
          { id, length: { value: 50 }, loc },
        );

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<ChangeInfo[]>([]);
      });

      it('identifies an added rule', () => {
        // ARRANGE
        const [a, b] = setup(undefined, { id, length: { value: 50 }, loc });

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<ChangeInfo[]>([
          {
            kind: 'added',
            target: id,
            b: { context, value: 50 },
          },
        ]);
      });

      it('identifies a removed rule', () => {
        // ARRANGE
        const [a, b] = setup({ id, length: { value: 50 }, loc }, undefined);

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<ChangeInfo[]>([
          {
            kind: 'removed',
            target: id,
            a: { context, value: 50 },
          },
        ]);
      });

      it('identifies an increased value', () => {
        // ARRANGE
        const [a, b] = setup(
          { id, length: { value: 50 }, loc },
          { id, length: { value: 100 }, loc },
        );

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<ChangeInfo[]>([
          {
            kind: 'increased',
            target: id,
            a: { context, value: 50 },
            b: { context, value: 100 },
          },
        ]);
      });

      it('identifies a decreased value', () => {
        // ARRANGE
        const [a, b] = setup(
          { id, length: { value: 50 }, loc },
          { id, length: { value: 25 }, loc },
        );

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<ChangeInfo[]>([
          {
            kind: 'decreased',
            target: id,
            a: { context, value: 50 },
            b: { context, value: 25 },
          },
        ]);
      });
    });

    describeRule('string-pattern', (id) => {
      it('identifies two identical rules', () => {
        // ARRANGE
        const [a, b] = setup(
          { id, pattern: { value: '^asdf$' }, loc },
          { id, pattern: { value: '^asdf$' }, loc },
        );

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<ChangeInfo[]>([]);
      });

      it('identifies an added rule', () => {
        // ARRANGE
        const [a, b] = setup(undefined, {
          id,
          pattern: { value: '^asdf$' },
          loc,
        });

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<ChangeInfo[]>([
          {
            kind: 'added',
            target: id,
            b: { context, value: '^asdf$' },
          },
        ]);
      });

      it('identifies a removed rule', () => {
        // ARRANGE
        const [a, b] = setup(
          { id, pattern: { value: '^asdf$' }, loc },
          undefined,
        );

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<ChangeInfo[]>([
          {
            kind: 'removed',
            target: id,
            a: { context, value: '^asdf$' },
          },
        ]);
      });

      it('identifies a changed pattern', () => {
        // ARRANGE
        const [a, b] = setup(
          { id, pattern: { value: '^original$' }, loc },
          { id, pattern: { value: '^new$' }, loc },
        );

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<ChangeInfo[]>([
          {
            kind: 'changed',
            target: id,
            a: { context, value: '^original$' },
            b: { context, value: '^new$' },
          },
        ]);
      });
    });

    describeRule('required', (id) => {
      it('no-ops on identical rules', () => {
        // ARRANGE
        const [a, b] = setup({ id }, { id });

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<ChangeInfo[]>([]);
      });

      it('identifies an added rule', () => {
        // ARRANGE
        const [a, b] = setup(undefined, { id });

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<ChangeInfo[]>([
          {
            kind: 'added',
            target: id,
            b: { context, value: true },
          },
        ]);
      });

      it('identifies a removed rule', () => {
        // ARRANGE
        const [a, b] = setup({ id }, undefined);

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<ChangeInfo[]>([
          {
            kind: 'removed',
            target: id,
            a: { context, value: true },
          },
        ]);
      });
    });
  });
});
