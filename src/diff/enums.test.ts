import { EnumChangeInfo, ServiceScope } from '.';
import { Enum } from '../ir';
import { enums, Mode } from './enums';
import {
  buildEnum,
  buildEnumValue,
  buildInterface,
  buildMethod,
  buildParameter,
  buildReturnType,
  buildScalar,
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

  const a_int = buildInterface({
    name: buildScalar(interfaceName),
    methods: [a_method],
  });
  const b_int = buildInterface({
    name: buildScalar(interfaceName),
    methods: [b_method],
  });

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
          category: 'major',
          b: {
            context: {
              scope: `${mode}-enum`,
              service: title,
              enum: enumName,
            },
            value: enumName,
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

    it('identifies a changed enum description', () => {
      // ARRANGE
      const originalDescription = 'some description';
      const newDescription = 'another description';
      const [a, b] = setup(
        mode,
        buildEnum({
          name: { value: enumName },
          description: { value: originalDescription },
        }),
        buildEnum({
          name: { value: enumName },
          description: { value: newDescription },
        }),
      );

      // ACT
      const result = enums(mode, a, b);

      // ASSERT
      expect(Array.from(result)).toEqual<EnumChangeInfo[]>([
        {
          kind: 'changed',
          target: `${mode}-enum-description`,
          category: 'patch',
          a: {
            context: {
              scope: `${mode}-enum`,
              service: title,
              enum: enumName,
            },
            value: originalDescription,
          },
          b: {
            context: {
              scope: `${mode}-enum`,
              service: title,
              enum: enumName,
            },
            value: newDescription,
          },
        },
      ]);
    });

    it('identifies an added enum deprecation', () => {
      // ARRANGE
      const [a, b] = setup(
        mode,
        buildEnum({
          name: { value: enumName },
        }),
        buildEnum({
          name: { value: enumName },
          deprecated: { value: true },
        }),
      );

      // ACT
      const result = enums(mode, a, b);

      // ASSERT
      expect(Array.from(result)).toEqual<EnumChangeInfo[]>([
        {
          kind: 'added',
          target: `${mode}-enum-deprecated`,
          category: 'minor',
          b: {
            context: {
              scope: `${mode}-enum`,
              service: title,
              enum: enumName,
            },
            value: true,
          },
        },
      ]);
    });

    it('identifies a removed enum deprecation', () => {
      // ARRANGE
      const [a, b] = setup(
        mode,
        buildEnum({
          name: { value: enumName },
          deprecated: { value: true },
        }),
        buildEnum({
          name: { value: enumName },
        }),
      );

      // ACT
      const result = enums(mode, a, b);

      // ASSERT
      expect(Array.from(result)).toEqual<EnumChangeInfo[]>([
        {
          kind: 'removed',
          target: `${mode}-enum-deprecated`,
          category: 'patch',
          a: {
            context: {
              scope: `${mode}-enum`,
              service: title,
              enum: enumName,
            },
            value: true,
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
          values: [buildEnumValue({ content: buildScalar('first') })],
        }),
        buildEnum({
          name: { value: enumName },
          values: [
            buildEnumValue({ content: buildScalar('first') }),
            buildEnumValue({ content: buildScalar('second') }),
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
            buildEnumValue({ content: buildScalar('first') }),
            buildEnumValue({ content: buildScalar('second') }),
          ],
        }),
        buildEnum({
          name: { value: enumName },
          values: [buildEnumValue({ content: buildScalar('first') })],
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
          values: [buildEnumValue({ content: buildScalar(originalValue) })],
        }),
        buildEnum({
          name: { value: enumName },
          values: [buildEnumValue({ content: buildScalar(newValue) })],
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
          },
          b: {
            context: {
              scope: `${mode}-enum`,
              service: title,
              enum: enumName,
            },
            value: newValue,
          },
        },
      ]);
    });

    it('identifies a changed enum value description', () => {
      // ARRANGE
      const originalDescription = 'some description';
      const newDescription = 'another description';
      const [a, b] = setup(
        mode,
        buildEnum({
          name: { value: enumName },
          values: [
            buildEnumValue({ description: buildScalar(originalDescription) }),
          ],
        }),
        buildEnum({
          name: { value: enumName },
          values: [
            buildEnumValue({ description: buildScalar(newDescription) }),
          ],
        }),
      );

      // ACT
      const result = enums(mode, a, b);

      // ASSERT
      expect(Array.from(result)).toEqual<EnumChangeInfo[]>([
        {
          kind: 'changed',
          target: `${mode}-enum-value-description`,
          category: 'patch',
          a: {
            context: {
              scope: `${mode}-enum`,
              service: title,
              enum: enumName,
            },
            value: originalDescription,
          },
          b: {
            context: {
              scope: `${mode}-enum`,
              service: title,
              enum: enumName,
            },
            value: newDescription,
          },
        },
      ]);
    });

    it('identifies an added enum value deprecation', () => {
      // ARRANGE
      const [a, b] = setup(
        mode,
        buildEnum({
          name: { value: enumName },
          values: [buildEnumValue()],
        }),
        buildEnum({
          name: { value: enumName },
          values: [buildEnumValue({ deprecated: buildScalar(true) })],
        }),
      );

      // ACT
      const result = enums(mode, a, b);

      // ASSERT
      expect(Array.from(result)).toEqual<EnumChangeInfo[]>([
        {
          kind: 'added',
          target: `${mode}-enum-value-deprecated`,
          category: 'minor',
          b: {
            context: {
              scope: `${mode}-enum`,
              service: title,
              enum: enumName,
            },
            value: true,
          },
        },
      ]);
    });

    it('identifies a removed enum value deprecation', () => {
      // ARRANGE
      const [a, b] = setup(
        mode,
        buildEnum({
          name: { value: enumName },
          values: [buildEnumValue({ deprecated: buildScalar(true) })],
        }),
        buildEnum({
          name: { value: enumName },
          values: [buildEnumValue()],
        }),
      );

      // ACT
      const result = enums(mode, a, b);

      // ASSERT
      expect(Array.from(result)).toEqual<EnumChangeInfo[]>([
        {
          kind: 'removed',
          target: `${mode}-enum-value-deprecated`,
          category: 'patch',
          a: {
            context: {
              scope: `${mode}-enum`,
              service: title,
              enum: enumName,
            },
            value: true,
          },
        },
      ]);
    });
  });
});
