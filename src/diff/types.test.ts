import { ServiceScope, TypeChangeInfo } from '.';
import { Type } from '../ir';
import { types, Mode } from './types';
import {
  buildComplexValue,
  buildInterface,
  buildMethod,
  buildParameter,
  buildReturnValue,
  buildService,
  buildType,
  stringLiteral,
  trueLiteral,
} from './test-utils';

const title = 'service title';
const interfaceName = 'interface name';
const methodName = 'method name';
const parameterName = 'parameter name';
const typeName = 'type name';

function setup(
  mode: Mode,
  a: Type | undefined,
  b: Type | undefined,
): [ServiceScope, ServiceScope] {
  const a_parameter = buildParameter({
    name: stringLiteral(parameterName),
    value: buildComplexValue({
      typeName: stringLiteral(a?.name.value ?? 'string'),
    }),
  });
  const b_parameter = buildParameter({
    name: stringLiteral(parameterName),
    value: buildComplexValue({
      typeName: stringLiteral(b?.name.value ?? 'string'),
    }),
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
    types: a ? [a] : [],
  });
  const b_service = buildService({
    title: stringLiteral(title),
    interfaces: [b_int],
    types: b ? [b] : [],
  });

  return [{ service: a_service }, { service: b_service }];
}

function describeModes<T extends Mode>(
  modes: T[],
  fn: (mode: T) => void,
): ReturnType<typeof describe> {
  for (const mode of modes) describe(mode, () => fn(mode));
}

describe(types, () => {
  describeModes(['input', 'output'], (mode) => {
    it('identifies two identical types', () => {
      // ARRANGE
      const [a, b] = setup(
        mode,
        buildType({ name: stringLiteral(typeName) }),
        buildType({ name: stringLiteral(typeName) }),
      );

      // ACT
      const result = types(mode, a, b);

      // ASSERT
      expect(Array.from(result)).toEqual<TypeChangeInfo[]>([]);
    });

    it('identifies an added type', () => {
      // ARRANGE
      const [a, b] = setup(
        mode,
        undefined,
        buildType({ name: stringLiteral(typeName) }),
      );

      // ACT
      const result = types(mode, a, b);

      // ASSERT
      expect(Array.from(result)).toEqual<TypeChangeInfo[]>([
        {
          kind: 'added',
          target: `${mode}-type`,
          category: 'minor',
          b: {
            context: {
              scope: `${mode}-type`,
              service: title,
              type: typeName,
            },
            value: typeName,
          },
        },
      ]);
    });

    it('identifies a removed type', () => {
      // ARRANGE
      const [a, b] = setup(
        mode,
        buildType({ name: stringLiteral(typeName) }),
        undefined,
      );

      // ACT
      const result = types(mode, a, b);

      // ASSERT
      expect(Array.from(result)).toEqual<TypeChangeInfo[]>([
        {
          kind: 'removed',
          target: `${mode}-type`,
          category: 'major',
          a: {
            context: {
              scope: `${mode}-type`,
              service: title,
              type: typeName,
            },
            value: typeName,
          },
        },
      ]);
    });

    it('identifies a changed type name casing', () => {
      // ARRANGE
      const originalName = 'SOME_NAME';
      const newName = 'someName';
      const [a, b] = setup(
        mode,
        buildType({ name: stringLiteral(originalName) }),
        buildType({ name: stringLiteral(newName) }),
      );

      // ACT
      const result = types(mode, a, b);

      // ASSERT
      expect(Array.from(result)).toEqual<TypeChangeInfo[]>([
        {
          kind: 'changed',
          target: `${mode}-type-name-casing`,
          category: 'patch',
          a: {
            context: {
              scope: `${mode}-type`,
              service: title,
              type: originalName,
            },
            value: originalName,
          },
          b: {
            context: {
              scope: `${mode}-type`,
              service: title,
              type: newName,
            },
            value: newName,
          },
        },
      ]);
    });

    it('identifies an added type deprecation', () => {
      // ARRANGE
      const [a, b] = setup(
        mode,
        buildType({ name: stringLiteral(typeName) }),
        buildType({
          name: stringLiteral(typeName),
          deprecated: trueLiteral(),
        }),
      );

      // ACT
      const result = types(mode, a, b);

      // ASSERT
      expect(Array.from(result)).toEqual<TypeChangeInfo[]>([
        {
          kind: 'added',
          target: `${mode}-type-deprecated`,
          category: 'minor',
          b: {
            context: {
              scope: `${mode}-type`,
              service: title,
              type: typeName,
            },
            value: true,
          },
        },
      ]);
    });

    it('identifies a removed type deprecation', () => {
      // ARRANGE
      const [a, b] = setup(
        mode,
        buildType({
          name: stringLiteral(typeName),
          deprecated: trueLiteral(),
        }),
        buildType({ name: stringLiteral(typeName) }),
      );

      // ACT
      const result = types(mode, a, b);

      // ASSERT
      expect(Array.from(result)).toEqual<TypeChangeInfo[]>([
        {
          kind: 'removed',
          target: `${mode}-type-deprecated`,
          category: 'patch',
          a: {
            context: {
              scope: `${mode}-type`,
              service: title,
              type: typeName,
            },
            value: true,
          },
        },
      ]);
    });
  });
});
