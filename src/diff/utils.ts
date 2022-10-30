import { Enum, getEnumByName, getTypeByName, Service, Type } from '..';
import { Scalar } from '../types';

export function getInputs(service: Service): {
  types: Iterable<Type>;
  enums: Iterable<Enum>;
} {
  return getTypesAndEnums(service, getInputTypeNames(service));
}

export function getOutputs(service: Service): {
  types: Iterable<Type>;
  enums: Iterable<Enum>;
} {
  return getTypesAndEnums(service, getOutputTypeNames(service));
}

function getInputTypeNames(service: Service): Iterable<string> {
  const typeNames = new Set<string>();
  for (const int of service.interfaces) {
    for (const method of int.methods) {
      for (const param of method.parameters) {
        if (param.isPrimitive || !param.typeName) continue;
        typeNames.add(param.typeName.value);
      }
    }
  }
  return typeNames;
}

function getOutputTypeNames(service: Service): Iterable<string> {
  const typeNames = new Set<string>();
  for (const int of service.interfaces) {
    for (const method of int.methods) {
      if (method.returnType?.isPrimitive !== false) continue;
      typeNames.add(method.returnType.typeName.value);
    }
  }
  return typeNames;
}

function getTypesAndEnums(
  service: Service,
  typeNames: Iterable<string>,
): {
  types: Iterable<Type>;
  enums: Iterable<Enum>;
} {
  const enums = new Set<Enum>();
  const types = new Set<Type>();
  for (const typeName of typeNames) {
    const e = getEnumByName(service, typeName);
    const type = getTypeByName(service, typeName);

    if (e) enums.add(e);

    if (type) {
      for (const subType of traverseType(service, type)) {
        types.add(subType);
      }
    }
  }

  for (const type of types) {
    for (const prop of type.properties) {
      if (prop.isPrimitive) continue;
      const e = getEnumByName(service, prop.typeName.value);
      if (e) enums.add(e);
    }
  }

  return { types, enums };
}

function* traverseType(service: Service, type: Type): Iterable<Type> {
  yield type;

  for (const prop of type.properties) {
    if (!prop.isPrimitive) {
      const subtype = getTypeByName(service, prop.typeName.value);
      if (subtype) yield* traverseType(service, subtype);
      // TODO: traverse unions
    }
  }
}

export function asValue<T extends string | number | boolean | null>(
  value: T | Scalar<T> | T[] | Scalar<T>[] | undefined,
): { value: T | T[] | undefined; loc?: string } {
  if (value === undefined) return { value: undefined };
  if (Array.isArray(value)) {
    let loc: string | undefined;
    const values: T[] = [];

    for (const item of value) {
      if (isScalar(item)) {
        loc ||= item.loc;
        values.push(item.value);
      } else {
        values.push(item);
      }
    }

    return { value: values, loc };
  } else {
    if (isScalar(value)) {
      return value;
    } else {
      return { value };
    }
  }
}

export function eq<T extends string | number | boolean | null>(
  a: T | Scalar<T> | T[] | Scalar<T>[] | undefined,
  b: T | Scalar<T> | T[] | Scalar<T>[] | undefined,
): boolean {
  if (a === undefined && b === undefined) return true;
  if (a === undefined || b === undefined) return false;

  if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) {
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
  if (Array.isArray(a) || Array.isArray(b)) return false;

  if (isScalar(a) && isScalar(b)) return a.value === b.value;
  if (isScalar(a) || isScalar(b)) return false;

  return a === b;
}

function isScalar<T extends string | number | boolean | null>(
  value: T | Scalar<T>,
): value is Scalar<T> {
  if (value === null) return false;
  const t = typeof value;

  return t !== 'string' && t !== 'number' && t !== 'boolean';
}
