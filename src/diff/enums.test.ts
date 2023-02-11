import { EnumChangeInfo, ServiceScope } from '.';
import { Enum } from '../types';
import { enums, Mode } from './enums';
import {
  buildEnum,
  buildEnumValue,
  buildInterface,
  buildMethod,
  buildParameter,
  buildReturnType,
  buildService,
} from './test-utils';

const title = 'service title';
const interfaceName = 'interface name';
const methodName = 'method name';
const parameterName = 'parameter name';
const enumName = 'enum name';

function setup(
  mode: Mode,
  a: Enum | undefined,
  b: Enum | undefined,
): [ServiceScope, ServiceScope] {
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
    enums: a ? [a] : [],
  });
  const b_service = buildService({
    title: { value: title },
    interfaces: [b_int],
    enums: b ? [b] : [],
  });

  return [{ service: a_service }, { service: b_service }];
}

function describeModes<T extends Mode>(
  modes: T[],
  fn: (mode: T) => void,
): ReturnType<typeof describe> {
  for (const mode of modes) describe(mode, () => fn(mode));
}

describe(enums, () => {
  describeModes(['input', 'output'], (mode) => {
    it('identifies two identical enums', () => {
      // ARRANGE
      const [a, b] = setup(
        mode,
        buildEnum({ name: { value: enumName } }),
        buildEnum({ name: { value: enumName } }),
      );

      // ACT
      const result = enums(mode, a, b);

      // ASSERT
      expect(Array.from(result)).toEqual<EnumChangeInfo[]>([]);
    });

    it('identifies an added enum', () => {
      // ARRANGE
      const [a, b] = setup(
        mode,
        undefined,
        buildEnum({ name: { value: enumName } }),
      );

      // ACT
      const result = enums(mode, a, b);

      // ASSERT
      expect(Array.from(result)).toEqual<EnumChangeInfo[]>([
        {
          kind: 'added',
          target: `${mode}-enum`,
          category: mode === 'input' ? 'minor' : 'major',
          b: {
            context: {
              scope: `${mode}-enum`,
              service: title,
              enum: enumName,
            },
            value: enumName,
            loc: '1;1;0',
          },
        },
      ]);
    });

    it('identifies a removed enum', () => {
      // ARRANGE
      const [a, b] = setup(
        mode,
        buildEnum({ name: { value: enumName } }),
        undefined,
      );

      // ACT
      const result = enums(mode, a, b);

      // ASSERT
      expect(Array.from(result)).toEqual<EnumChangeInfo[]>([
        {
          kind: 'removed',
          target: `${mode}-enum`,
          category: 'major',
          a: {
            context: {
              scope: `${mode}-enum`,
              service: title,
              enum: enumName,
            },
            value: enumName,
            loc: '1;1;0',
          },
        },
      ]);
    });

    it('identifies a changed enum name casing', () => {
      // ARRANGE
      const originalName = 'SOME_NAME';
      const newName = 'someName';
      const [a, b] = setup(
        mode,
        buildEnum({ name: { value: originalName } }),
        buildEnum({ name: { value: newName } }),
      );

      // ACT
      const result = enums(mode, a, b);

      // ASSERT
      expect(Array.from(result)).toEqual<EnumChangeInfo[]>([
        {
          kind: 'changed',
          target: `${mode}-enum-name-casing`,
          category: 'patch',
          a: {
            context: {
              scope: `${mode}-enum`,
              service: title,
              enum: originalName,
            },
            value: originalName,
          },
          b: {
            context: {
              scope: `${mode}-enum`,
              service: title,
              enum: newName,
            },
            value: newName,
          },
        },
      ]);
    });

    it('identifies an added enum value', () => {
      // ARRANGE
      const [a, b] = setup(
        mode,
        buildEnum({
          name: { value: enumName },
          values: [buildEnumValue({ value: 'first' })],
        }),
        buildEnum({
          name: { value: enumName },
          values: [
            buildEnumValue({ value: 'first' }),
            buildEnumValue({ value: 'second' }),
          ],
        }),
      );

      // ACT
      const result = enums(mode, a, b);

      // ASSERT
      expect(Array.from(result)).toEqual<EnumChangeInfo[]>([
        {
          kind: 'added',
          target: `${mode}-enum-value`,
          category: mode === 'input' ? 'minor' : 'major',
          b: {
            context: {
              scope: `${mode}-enum`,
              service: title,
              enum: enumName,
            },
            value: 'second',
            loc: '1;1;0',
          },
        },
      ]);
    });

    it('identifies a removed enum value', () => {
      // ARRANGE
      const [a, b] = setup(
        mode,
        buildEnum({
          name: { value: enumName },
          values: [
            buildEnumValue({ value: 'first' }),
            buildEnumValue({ value: 'second' }),
          ],
        }),
        buildEnum({
          name: { value: enumName },
          values: [buildEnumValue({ value: 'first' })],
        }),
      );

      // ACT
      const result = enums(mode, a, b);

      // ASSERT
      expect(Array.from(result)).toEqual<EnumChangeInfo[]>([
        {
          kind: 'removed',
          target: `${mode}-enum-value`,
          category: mode === 'input' ? 'major' : 'minor',
          a: {
            context: {
              scope: `${mode}-enum`,
              service: title,
              enum: enumName,
            },
            value: 'second',
            loc: '1;1;0',
          },
        },
      ]);
    });

    it('identifies a changed enum value casing', () => {
      // ARRANGE
      const originalValue = 'SOME_VALUE';
      const newValue = 'someValue';
      const [a, b] = setup(
        mode,
        buildEnum({
          name: { value: enumName },
          values: [buildEnumValue({ value: originalValue })],
        }),
        buildEnum({
          name: { value: enumName },
          values: [buildEnumValue({ value: newValue })],
        }),
      );

      // ACT
      const result = enums(mode, a, b);

      // ASSERT
      expect(Array.from(result)).toEqual<EnumChangeInfo[]>([
        {
          kind: 'changed',
          target: `${mode}-enum-value-casing`,
          category: 'major',
          a: {
            context: {
              scope: `${mode}-enum`,
              service: title,
              enum: enumName,
            },
            value: originalValue,
            loc: '1;1;0',
          },
          b: {
            context: {
              scope: `${mode}-enum`,
              service: title,
              enum: enumName,
            },
            value: newValue,
            loc: '1;1;0',
          },
        },
      ]);
    });
  });
});
