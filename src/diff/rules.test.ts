import {
  ParameterContext,
  ParameterScope,
  PropertyContext,
  PropertyScope,
  ReturnTypeContext,
  ReturnTypeScope,
  RuleChangeInfo,
  RuleContext,
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

  const returnTypeContext: ReturnTypeContext = {
    scope: 'return-type',
    service: title,
    interface: interfaceName,
    method: methodName,
    returnType: 'string',
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
          { kind: 'ValidationRule', id, max: { value: 5 }, loc },
          { kind: 'ValidationRule', id, max: { value: 5 }, loc },
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
          max: { value: 5 },
          loc,
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
          { kind: 'ValidationRule', id, max: { value: 5 }, loc },
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
          { kind: 'ValidationRule', id, max: { value: 5 }, loc },
          { kind: 'ValidationRule', id, max: { value: 7 }, loc },
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
          { kind: 'ValidationRule', id, max: { value: 5 }, loc },
          { kind: 'ValidationRule', id, max: { value: 3 }, loc },
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

    describeRule('array-min-items', (id) => {
      it('identifies two identical rules', () => {
        // ARRANGE
        const [a, b] = setup(
          { kind: 'ValidationRule', id, min: { value: 5 }, loc },
          { kind: 'ValidationRule', id, min: { value: 5 }, loc },
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
          min: { value: 5 },
          loc,
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
          { kind: 'ValidationRule', id, min: { value: 5 }, loc },
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
          { kind: 'ValidationRule', id, min: { value: 5 }, loc },
          { kind: 'ValidationRule', id, min: { value: 7 }, loc },
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
          { kind: 'ValidationRule', id, min: { value: 5 }, loc },
          { kind: 'ValidationRule', id, min: { value: 3 }, loc },
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

    describeRule('array-unique-items', (id) => {
      it('identifies two identical rules', () => {
        // ARRANGE
        const [a, b] = setup(
          { kind: 'ValidationRule', id, required: true, loc },
          { kind: 'ValidationRule', id, required: true, loc },
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
          loc,
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
          { kind: 'ValidationRule', id, required: true, loc },
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
            { kind: 'ValidationRule', id, value: { value: 5 }, loc },
            { kind: 'ValidationRule', id, value: { value: 5 }, loc },
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
            value: { value: 5 },
            loc,
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
            { kind: 'ValidationRule', id, value: { value: 5 }, loc },
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
            { kind: 'ValidationRule', id, value: { value: 5 }, loc },
            { kind: 'ValidationRule', id, value: { value: 7 }, loc },
          );

          // ACT
          const result = rules(mode, a, b);

          // ASSERT
          expect(Array.from(result)).toEqual<RuleChangeInfo[]>([
            {
              kind: 'increased',
              target: id,
              category:
                id === 'number-lt' || id === 'number-lte' ? 'minor' : 'major',
              a: { context, value: 5 },
              b: { context, value: 7 },
            },
          ]);
        });

        it('identifies a decreased value', () => {
          // ARRANGE
          const [a, b] = setup(
            { kind: 'ValidationRule', id, value: { value: 5 }, loc },
            { kind: 'ValidationRule', id, value: { value: 3 }, loc },
          );

          // ACT
          const result = rules(mode, a, b);

          // ASSERT
          expect(Array.from(result)).toEqual<RuleChangeInfo[]>([
            {
              kind: 'decreased',
              target: id,
              category:
                id === 'number-gt' || id === 'number-gte' ? 'minor' : 'major',
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
          { kind: 'ValidationRule', id, format: { value: 'date' }, loc },
          { kind: 'ValidationRule', id, format: { value: 'date' }, loc },
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
          format: { value: 'date' },
          loc,
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
          { kind: 'ValidationRule', id, format: { value: 'date' }, loc },
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
          { kind: 'ValidationRule', id, format: { value: 'date' }, loc },
          { kind: 'ValidationRule', id, format: { value: 'date-time' }, loc },
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

    describeRules(['string-max-length', 'string-min-length'], (id) => {
      it('identifies two identical rules', () => {
        // ARRANGE
        const [a, b] = setup(
          { kind: 'ValidationRule', id, length: { value: 50 }, loc },
          { kind: 'ValidationRule', id, length: { value: 50 }, loc },
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
          length: { value: 50 },
          loc,
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
          { kind: 'ValidationRule', id, length: { value: 50 }, loc },
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
          { kind: 'ValidationRule', id, length: { value: 50 }, loc },
          { kind: 'ValidationRule', id, length: { value: 100 }, loc },
        );

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<RuleChangeInfo[]>([
          {
            kind: 'increased',
            target: id,
            category: id === 'string-max-length' ? 'minor' : 'major',
            a: { context, value: 50 },
            b: { context, value: 100 },
          },
        ]);
      });

      it('identifies a decreased value', () => {
        // ARRANGE
        const [a, b] = setup(
          { kind: 'ValidationRule', id, length: { value: 50 }, loc },
          { kind: 'ValidationRule', id, length: { value: 25 }, loc },
        );

        // ACT
        const result = rules(mode, a, b);

        // ASSERT
        expect(Array.from(result)).toEqual<RuleChangeInfo[]>([
          {
            kind: 'decreased',
            target: id,
            category: id === 'string-max-length' ? 'major' : 'minor',
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
          { kind: 'ValidationRule', id, pattern: { value: '^asdf$' }, loc },
          { kind: 'ValidationRule', id, pattern: { value: '^asdf$' }, loc },
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
          pattern: { value: '^asdf$' },
          loc,
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
          { kind: 'ValidationRule', id, pattern: { value: '^asdf$' }, loc },
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
          { kind: 'ValidationRule', id, pattern: { value: '^original$' }, loc },
          { kind: 'ValidationRule', id, pattern: { value: '^new$' }, loc },
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

    describeRule('required', (id) => {
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
          mode === 'return-type'
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
          mode === 'return-type'
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
