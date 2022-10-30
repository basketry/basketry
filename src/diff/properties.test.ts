import { PropertyChangeInfo, RuleChangeInfo, TypeScope } from '.';
import { Property } from '../types';
import { properties, Mode } from './properties';
import {
  buildInterface,
  buildMethod,
  buildParameter,
  buildProperty,
  buildReturnType,
  buildService,
  buildType,
} from './test-utils';

const title = 'service title';
const interfaceName = 'interface name';
const methodName = 'method name';
const parameterName = 'parameter name';
const typeName = 'type name';
const propertyName = 'property name';

function setup(
  mode: Mode,
  a: Property | undefined,
  b: Property | undefined,
): [TypeScope, TypeScope] {
  const a_type = buildType({
    name: { value: typeName },
    properties: a ? [a] : [],
  });

  const b_type = buildType({
    name: { value: typeName },
    properties: b ? [b] : [],
  });

  const a_parameter = buildParameter({
    name: { value: parameterName },
    isPrimitive: false,
    typeName: a ? { value: a.name.value } : undefined,
  });
  const b_parameter = buildParameter({
    name: { value: parameterName },
    isPrimitive: false,
    typeName: b ? { value: b.name.value } : undefined,
  });

  const a_method = buildMethod({
    name: { value: methodName },
    parameters: mode === 'input' ? [a_parameter] : [],
    returnType:
      mode === 'input' || !a
        ? undefined
        : buildReturnType({
            isPrimitive: false,
            typeName: { value: a.name.value },
          }),
  });
  const b_method = buildMethod({
    name: { value: methodName },
    parameters: mode === 'input' ? [b_parameter] : [],
    returnType:
      mode === 'input' || !b
        ? undefined
        : buildReturnType({
            isPrimitive: false,
            typeName: { value: b.name.value },
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
    { service: a_service, type: a_type },
    { service: b_service, type: b_type },
  ];
}

function describeModes<T extends Mode>(
  modes: T[],
  fn: (mode: T) => void,
): ReturnType<typeof describe> {
  for (const mode of modes) describe(mode, () => fn(mode));
}

describe(properties, () => {
  describeModes(['input', 'output'], (mode) => {
    it('identifies two identical properties', () => {
      // ARRANGE
      const [a, b] = setup(
        mode,
        buildProperty({ name: { value: propertyName } }),
        buildProperty({ name: { value: propertyName } }),
      );

      // ACT
      const result = properties(mode, a, b);

      // ASSERT
      expect(Array.from(result)).toEqual<PropertyChangeInfo[]>([]);
    });

    it('identifies an added optional property', () => {
      // ARRANGE
      const [a, b] = setup(
        mode,
        undefined,
        buildProperty({ name: { value: propertyName } }),
      );

      // ACT
      const result = properties(mode, a, b);

      // ASSERT
      expect(Array.from(result)).toEqual<PropertyChangeInfo[]>([
        {
          kind: 'added',
          target: `${mode}-property`,
          category: 'minor',
          b: {
            context: {
              scope: `${mode}-property`,
              service: title,
              type: typeName,
              property: propertyName,
              required: false,
            },
            loc: '1;1;0',
            value: propertyName,
          },
        },
      ]);
    });

    it('identifies an added required property', () => {
      // ARRANGE
      const [a, b] = setup(
        mode,
        undefined,
        buildProperty({
          name: { value: propertyName },
          rules: [{ kind: 'ValidationRule', id: 'required' }],
        }),
      );

      // ACT
      const result = properties(mode, a, b);

      // ASSERT
      expect(Array.from(result)).toEqual<
        (PropertyChangeInfo | RuleChangeInfo)[]
      >([
        {
          kind: 'added',
          target: `${mode}-property`,
          category: 'major',
          b: {
            context: {
              scope: `${mode}-property`,
              service: title,
              type: typeName,
              property: propertyName,
              required: true,
            },
            loc: '1;1;0',
            value: propertyName,
          },
        },
      ]);
    });

    it('identifies a removed optional property', () => {
      // ARRANGE
      const [a, b] = setup(
        mode,
        buildProperty({ name: { value: propertyName } }),
        undefined,
      );

      // ACT
      const result = properties(mode, a, b);

      // ASSERT
      expect(Array.from(result)).toEqual<PropertyChangeInfo[]>([
        {
          kind: 'removed',
          target: `${mode}-property`,
          category: mode === 'input' ? 'major' : 'minor',
          a: {
            context: {
              scope: `${mode}-property`,
              service: title,
              type: typeName,
              property: propertyName,
              required: false,
            },
            loc: '1;1;0',
            value: propertyName,
          },
        },
      ]);
    });

    it('identifies a removed required property', () => {
      // ARRANGE
      const [a, b] = setup(
        mode,
        buildProperty({
          name: { value: propertyName },
          rules: [{ kind: 'ValidationRule', id: 'required' }],
        }),
        undefined,
      );

      // ACT
      const result = properties(mode, a, b);

      // ASSERT
      expect(Array.from(result)).toEqual<
        (PropertyChangeInfo | RuleChangeInfo)[]
      >([
        {
          kind: 'removed',
          target: `${mode}-property`,
          category: 'major',
          a: {
            context: {
              scope: `${mode}-property`,
              service: title,
              type: typeName,
              property: propertyName,
              required: true,
            },
            loc: '1;1;0',
            value: propertyName,
          },
        },
      ]);
    });

    it('identifies a changed input property casing', () => {
      // ARRANGE
      const originalName = 'SOME_NAME';
      const newName = 'someName';
      const [a, b] = setup(
        mode,
        buildProperty({ name: { value: originalName } }),
        buildProperty({ name: { value: newName } }),
      );

      // ACT
      const result = properties(mode, a, b);

      // ASSERT
      expect(Array.from(result)).toEqual<PropertyChangeInfo[]>([
        {
          kind: 'changed',
          target: `${mode}-property-name-casing`,
          category: 'patch',
          a: {
            context: {
              scope: `${mode}-property`,
              service: title,
              type: typeName,
              property: originalName,
              required: false,
            },
            loc: '1;1;0',
            value: originalName,
          },
          b: {
            context: {
              scope: `${mode}-property`,
              service: title,
              type: typeName,
              property: newName,
              required: false,
            },
            loc: '1;1;0',
            value: newName,
          },
        },
      ]);
    });

    it('identifies a changed property type', () => {
      // ARRANGE
      const [a, b] = setup(
        mode,
        buildProperty({
          name: { value: propertyName },
          typeName: { value: 'number' },
        }),
        buildProperty({
          name: { value: propertyName },
          typeName: { value: 'string' },
        }),
      );

      // ACT
      const result = properties(mode, a, b);

      // ASSERT
      expect(Array.from(result)).toEqual<PropertyChangeInfo[]>([
        {
          kind: 'changed',
          target: `${mode}-property-type`,
          category: 'major',
          a: {
            context: {
              scope: `${mode}-property`,
              service: title,
              type: typeName,
              property: propertyName,
              required: false,
            },
            value: 'number',
          },
          b: {
            context: {
              scope: `${mode}-property`,
              service: title,
              type: typeName,
              property: propertyName,
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
        mode,
        buildProperty({
          name: { value: propertyName },
          isArray: true,
        }),
        buildProperty({
          name: { value: propertyName },
          isArray: false,
        }),
      );

      // ACT
      const result = properties(mode, a, b);

      // ASSERT
      expect(Array.from(result)).toEqual<PropertyChangeInfo[]>([
        {
          kind: 'changed',
          target: `${mode}-property-type-array`,
          category: 'major',
          a: {
            context: {
              scope: `${mode}-property`,
              service: title,
              type: typeName,
              property: propertyName,
              required: false,
            },
            value: true,
            loc: '1;1;0',
          },
          b: {
            context: {
              scope: `${mode}-property`,
              service: title,
              type: typeName,
              property: propertyName,
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
        mode,
        buildProperty({
          name: { value: propertyName },
          isPrimitive: true,
        }),
        buildProperty({
          name: { value: propertyName },
          isPrimitive: false,
        }),
      );

      // ACT
      const result = properties(mode, a, b);

      // ASSERT
      expect(Array.from(result)).toEqual<PropertyChangeInfo[]>([
        {
          kind: 'changed',
          target: `${mode}-property-type-primitive`,
          category: 'major',
          a: {
            context: {
              scope: `${mode}-property`,
              service: title,
              type: typeName,
              property: propertyName,
              required: false,
            },
            value: true,
            loc: '1;1;0',
          },
          b: {
            context: {
              scope: `${mode}-property`,
              service: title,
              type: typeName,
              property: propertyName,
              required: false,
            },
            value: false,
            loc: '1;1;0',
          },
        },
      ]);
    });
  });
});
