import { ChangeInfo, ServiceScope } from '.';
import { Interface } from '..';
import { interfaces } from './interfaces';
import { buildInterface, buildService } from './test-utils';

const title = 'service title';
const name = 'interface name';
function setup(
  a: Interface | undefined,
  b: Interface | undefined,
): [ServiceScope, ServiceScope] {
  const a_service = buildService({
    title: { value: title },
    interfaces: a ? [a] : [],
  });
  const b_service = buildService({
    title: { value: title },
    interfaces: b ? [b] : [],
  });

  return [{ service: a_service }, { service: b_service }];
}

describe(interfaces, () => {
  it('identifies two identical interfaces', () => {
    // ARRANGE
    const [a, b] = setup(buildInterface({ name }), buildInterface({ name }));

    // ACT
    const result = interfaces(a, b);

    // ASSERT
    expect(Array.from(result)).toEqual<ChangeInfo[]>([]);
  });

  it('identifies an added interface', () => {
    // ARRANGE
    const [a, b] = setup(undefined, buildInterface({ name }));

    // ACT
    const result = interfaces(a, b);

    // ASSERT
    expect(Array.from(result)).toEqual<ChangeInfo[]>([
      {
        kind: 'added',
        target: 'interface',
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
    const [a, b] = setup(buildInterface({ name }), undefined);

    // ACT
    const result = interfaces(a, b);

    // ASSERT
    expect(Array.from(result)).toEqual<ChangeInfo[]>([
      {
        kind: 'removed',
        target: 'interface',
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
      buildInterface({ name: originalName }),
      buildInterface({ name: newName }),
    );

    // ACT
    const result = interfaces(a, b);

    // ASSERT
    expect(Array.from(result)).toEqual<ChangeInfo[]>([
      {
        kind: 'changed',
        target: 'interface-name-casing',
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
      buildInterface({ name }),
      buildInterface({ name, description }),
    );

    // ACT
    const result = interfaces(a, b);

    // ASSERT
    expect(Array.from(result)).toEqual<ChangeInfo[]>([
      {
        kind: 'added',
        target: 'interface-description',
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
      buildInterface({ name, description }),
      buildInterface({ name }),
    );

    // ACT
    const result = interfaces(a, b);

    // ASSERT
    expect(Array.from(result)).toEqual<ChangeInfo[]>([
      {
        kind: 'removed',
        target: 'interface-description',
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
      buildInterface({ name, description: originalDescription }),
      buildInterface({ name, description: newDescription }),
    );

    // ACT
    const result = interfaces(a, b);

    // ASSERT
    expect(Array.from(result)).toEqual<ChangeInfo[]>([
      {
        kind: 'changed',
        target: 'interface-description',
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
});
