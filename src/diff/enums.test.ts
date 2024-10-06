import { EnumChangeInfo, ServiceScope } from '.';
import { Enum } from '../ir';
import { enums, Mode } from './enums';
import {
  buildComplexValue,
  buildEnum,
  buildEnumMember,
  buildInterface,
  buildMethod,
  buildParameter,
  buildPrimitiveValue,
  buildReturnValue,
  buildService,
  stringLiteral,
  trueLiteral,
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
    name: stringLiteral(parameterName),
    value: a
      ? buildComplexValue({
          typeName: stringLiteral(a.name.value),
        })
      : buildPrimitiveValue(),
  });
  const b_parameter = buildParameter({
    name: stringLiteral(parameterName),
    value: b
      ? buildComplexValue({
          typeName: stringLiteral(b.name.value),
        })
      : buildPrimitiveValue(),
  });

  const a_method = buildMethod({
    name: stringLiteral(methodName),
    parameters: mode === 'input' ? [a_parameter] : [],
    returns:
      mode === 'input' || !a
        ? undefined
        : buildReturnValue({
            value: buildComplexValue({
              typeName: stringLiteral(a.name.value),
            }),
          }),
  });
  const b_method = buildMethod({
    name: stringLiteral(methodName),
    parameters: mode === 'input' ? [b_parameter] : [],
    returns:
      mode === 'input' || !b
        ? undefined
        : buildReturnValue({
            value: buildComplexValue({
              typeName: stringLiteral(b.name.value),
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
    enums: a ? [a] : [],
  });
  const b_service = buildService({
    title: stringLiteral(title),
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
        buildEnum({ name: stringLiteral(enumName) }),
        buildEnum({ name: stringLiteral(enumName) }),
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
        buildEnum({ name: stringLiteral(enumName) }),
      );

      // console.log(JSON.stringify({ a, b }, null, 2));

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
          },
        },
      ]);
    });

    it('identifies a removed enum', () => {
      // ARRANGE
      const [a, b] = setup(
        mode,
        buildEnum({ name: stringLiteral(enumName) }),
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
        buildEnum({ name: stringLiteral(originalName) }),
        buildEnum({ name: stringLiteral(newName) }),
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
          name: stringLiteral(enumName),
          description: [stringLiteral(originalDescription)],
        }),
        buildEnum({
          name: stringLiteral(enumName),
          description: [stringLiteral(newDescription)],
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
            value: [originalDescription],
          },
          b: {
            context: {
              scope: `${mode}-enum`,
              service: title,
              enum: enumName,
            },
            value: [newDescription],
          },
        },
      ]);
    });

    it('identifies an added enum deprecation', () => {
      // ARRANGE
      const [a, b] = setup(
        mode,
        buildEnum({
          name: stringLiteral(enumName),
        }),
        buildEnum({
          name: stringLiteral(enumName),
          deprecated: trueLiteral(),
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
          name: stringLiteral(enumName),
          deprecated: trueLiteral(),
        }),
        buildEnum({
          name: stringLiteral(enumName),
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
          name: stringLiteral(enumName),
          members: [buildEnumMember({ content: stringLiteral('first') })],
        }),
        buildEnum({
          name: stringLiteral(enumName),
          members: [
            buildEnumMember({ content: stringLiteral('first') }),
            buildEnumMember({ content: stringLiteral('second') }),
          ],
        }),
      );

      // ACT
      const result = enums(mode, a, b);

      // ASSERT
      expect(Array.from(result)).toEqual<EnumChangeInfo[]>([
        {
          kind: 'added',
          target: `${mode}-enum-member`,
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
          name: stringLiteral(enumName),
          members: [
            buildEnumMember({ content: stringLiteral('first') }),
            buildEnumMember({ content: stringLiteral('second') }),
          ],
        }),
        buildEnum({
          name: stringLiteral(enumName),
          members: [buildEnumMember({ content: stringLiteral('first') })],
        }),
      );

      // ACT
      const result = enums(mode, a, b);

      // ASSERT
      expect(Array.from(result)).toEqual<EnumChangeInfo[]>([
        {
          kind: 'removed',
          target: `${mode}-enum-member`,
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
          name: stringLiteral(enumName),
          members: [buildEnumMember({ content: stringLiteral(originalValue) })],
        }),
        buildEnum({
          name: stringLiteral(enumName),
          members: [buildEnumMember({ content: stringLiteral(newValue) })],
        }),
      );

      // ACT
      const result = enums(mode, a, b);

      // ASSERT
      expect(Array.from(result)).toEqual<EnumChangeInfo[]>([
        {
          kind: 'changed',
          target: `${mode}-enum-member-casing`,
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
          name: stringLiteral(enumName),
          members: [
            buildEnumMember({
              description: [stringLiteral(originalDescription)],
            }),
          ],
        }),
        buildEnum({
          name: stringLiteral(enumName),
          members: [
            buildEnumMember({ description: [stringLiteral(newDescription)] }),
          ],
        }),
      );

      // ACT
      const result = enums(mode, a, b);

      // ASSERT
      expect(Array.from(result)).toEqual<EnumChangeInfo[]>([
        {
          kind: 'changed',
          target: `${mode}-enum-member-description`,
          category: 'patch',
          a: {
            context: {
              scope: `${mode}-enum`,
              service: title,
              enum: enumName,
            },
            value: [originalDescription],
          },
          b: {
            context: {
              scope: `${mode}-enum`,
              service: title,
              enum: enumName,
            },
            value: [newDescription],
          },
        },
      ]);
    });

    it('identifies an added enum value deprecation', () => {
      // ARRANGE
      const [a, b] = setup(
        mode,
        buildEnum({
          name: stringLiteral(enumName),
          members: [buildEnumMember()],
        }),
        buildEnum({
          name: stringLiteral(enumName),
          members: [buildEnumMember({ deprecated: trueLiteral() })],
        }),
      );

      // ACT
      const result = enums(mode, a, b);

      // ASSERT
      expect(Array.from(result)).toEqual<EnumChangeInfo[]>([
        {
          kind: 'added',
          target: `${mode}-enum-member-deprecated`,
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
          name: stringLiteral(enumName),
          members: [buildEnumMember({ deprecated: trueLiteral() })],
        }),
        buildEnum({
          name: stringLiteral(enumName),
          members: [buildEnumMember()],
        }),
      );

      // ACT
      const result = enums(mode, a, b);

      // ASSERT
      expect(Array.from(result)).toEqual<EnumChangeInfo[]>([
        {
          kind: 'removed',
          target: `${mode}-enum-member-deprecated`,
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
