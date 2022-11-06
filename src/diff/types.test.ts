import { ServiceScope, TypeChangeInfo } from '.';
import { Type } from '../ir';
import { types, Mode } from './types';
import {
  buildInterface,
  buildMethod,
  buildParameter,
  buildReturnType,
  buildService,
  buildType,
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
    types: a ? [a] : [],
  });
  const b_service = buildService({
    title: { value: title },
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
        buildType({ name: { value: typeName } }),
        buildType({ name: { value: typeName } }),
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
        buildType({ name: { value: typeName } }),
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
            loc: '1;1;0',
            value: typeName,
          },
        },
      ]);
    });

    it('identifies a removed type', () => {
      // ARRANGE
      const [a, b] = setup(
        mode,
        buildType({ name: { value: typeName } }),
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
            loc: '1;1;0',
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
        buildType({ name: { value: originalName } }),
        buildType({ name: { value: newName } }),
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
            loc: '1;1;0',
            value: originalName,
          },
          b: {
            context: {
              scope: `${mode}-type`,
              service: title,
              type: newName,
            },
            loc: '1;1;0',
            value: newName,
          },
        },
      ]);
    });
  });
});
