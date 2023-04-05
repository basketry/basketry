import { InterfaceChangeInfo, ServiceScope } from '.';
import { Interface } from '..';
import { interfaces } from './interfaces';
import { buildInterface, buildScalar, buildService } from './test-utils';

const title = 'service title';
const name = 'interface name';
function setup(
  a: Interface | undefined,
  b: Interface | undefined,
): [ServiceScope, ServiceScope] {
  const a_service = buildService({
    title: buildScalar(title),
    interfaces: a ? [a] : [],
  });
  const b_service = buildService({
    title: buildScalar(title),
    interfaces: b ? [b] : [],
  });

  return [{ service: a_service }, { service: b_service }];
}

describe(interfaces, () => {
  it('identifies two identical interfaces', () => {
    // ARRANGE
    const [a, b] = setup(
      buildInterface({ name: buildScalar(name) }),
      buildInterface({ name: buildScalar(name) }),
    );

    // ACT
    const result = interfaces(a, b);

    // ASSERT
    expect(Array.from(result)).toEqual<InterfaceChangeInfo[]>([]);
  });

  it('identifies an added interface', () => {
    // ARRANGE
    const [a, b] = setup(
      undefined,
      buildInterface({ name: buildScalar(name) }),
    );

    // ACT
    const result = interfaces(a, b);

    // ASSERT
    expect(Array.from(result)).toEqual<InterfaceChangeInfo[]>([
      {
        kind: 'added',
        target: 'interface',
        category: 'minor',
        b: {
          context: {
            scope: 'interface',
            service: title,
            interface: name,
          },
          value: name,
        },
      },
    ]);
  });

  it('identifies a removed interface', () => {
    // ARRANGE
    const [a, b] = setup(
      buildInterface({ name: buildScalar(name) }),
      undefined,
    );

    // ACT
    const result = interfaces(a, b);

    // ASSERT
    expect(Array.from(result)).toEqual<InterfaceChangeInfo[]>([
      {
        kind: 'removed',
        target: 'interface',
        category: 'major',
        a: {
          context: {
            scope: 'interface',
            service: title,
            interface: name,
          },
          value: name,
        },
      },
    ]);
  });

  it('identifies changed interface name casing', () => {
    // ARRANGE
    const originalName = 'SOME_NAME';
    const newName = 'someName';

    const [a, b] = setup(
      buildInterface({ name: buildScalar(originalName) }),
      buildInterface({ name: buildScalar(newName) }),
    );

    // ACT
    const result = interfaces(a, b);

    // ASSERT
    expect(Array.from(result)).toEqual<InterfaceChangeInfo[]>([
      {
        kind: 'changed',
        target: 'interface-name-casing',
        category: 'patch',
        a: {
          context: {
            scope: 'interface',
            service: title,
            interface: originalName,
          },
          value: originalName,
        },
        b: {
          context: {
            scope: 'interface',
            service: title,
            interface: newName,
          },
          value: newName,
        },
      },
    ]);
  });

  it('identifies an added interface description', () => {
    // ARRANGE
    const description = 'some description';
    const [a, b] = setup(
      buildInterface({ name: buildScalar(name) }),
      buildInterface({
        name: buildScalar(name),
        description: buildScalar(description),
      }),
    );

    // ACT
    const result = interfaces(a, b);

    // ASSERT
    expect(Array.from(result)).toEqual<InterfaceChangeInfo[]>([
      {
        kind: 'added',
        target: 'interface-description',
        category: 'patch',
        b: {
          context: {
            scope: 'interface',
            service: title,
            interface: name,
          },
          value: description,
        },
      },
    ]);
  });

  it('identifies a removed interface description', () => {
    // ARRANGE
    const description = 'some description';
    const [a, b] = setup(
      buildInterface({
        name: buildScalar(name),
        description: buildScalar(description),
      }),
      buildInterface({ name: buildScalar(name) }),
    );

    // ACT
    const result = interfaces(a, b);

    // ASSERT
    expect(Array.from(result)).toEqual<InterfaceChangeInfo[]>([
      {
        kind: 'removed',
        target: 'interface-description',
        category: 'patch',
        a: {
          context: {
            scope: 'interface',
            service: title,
            interface: name,
          },
          value: description,
        },
      },
    ]);
  });

  it('identifies a changed interface description', () => {
    // ARRANGE
    const originalDescription = 'some description';
    const newDescription = 'different description';
    const [a, b] = setup(
      buildInterface({
        name: buildScalar(name),
        description: buildScalar(originalDescription),
      }),
      buildInterface({
        name: buildScalar(name),
        description: buildScalar(newDescription),
      }),
    );

    // ACT
    const result = interfaces(a, b);

    // ASSERT
    expect(Array.from(result)).toEqual<InterfaceChangeInfo[]>([
      {
        kind: 'changed',
        target: 'interface-description',
        category: 'patch',
        a: {
          context: {
            scope: 'interface',
            service: title,
            interface: name,
          },
          value: originalDescription,
        },
        b: {
          context: {
            scope: 'interface',
            service: title,
            interface: name,
          },
          value: newDescription,
        },
      },
    ]);
  });

  it('identifies an added interface deprecation', () => {
    // ARRANGE
    const [a, b] = setup(
      buildInterface({ name: buildScalar(name) }),
      buildInterface({
        name: buildScalar(name),
        deprecated: buildScalar(true),
      }),
    );

    // ACT
    const result = interfaces(a, b);

    // ASSERT
    expect(Array.from(result)).toEqual<InterfaceChangeInfo[]>([
      {
        kind: 'added',
        target: 'interface-deprecated',
        category: 'minor',
        b: {
          context: {
            scope: 'interface',
            service: title,
            interface: name,
          },
          value: true,
        },
      },
    ]);
  });

  it('identifies a removed interface deprecation', () => {
    // ARRANGE
    const [a, b] = setup(
      buildInterface({
        name: buildScalar(name),
        deprecated: buildScalar(true),
      }),
      buildInterface({
        name: buildScalar(name),
      }),
    );

    // ACT
    const result = interfaces(a, b);

    // ASSERT
    expect(Array.from(result)).toEqual<InterfaceChangeInfo[]>([
      {
        kind: 'removed',
        target: 'interface-deprecated',
        category: 'patch',
        a: {
          context: {
            scope: 'interface',
            service: title,
            interface: name,
          },
          value: true,
        },
      },
    ]);
  });
});
