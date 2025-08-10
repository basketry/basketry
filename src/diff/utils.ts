import { Enum, getEnumByName, getTypeByName, Service, Type } from '..';
import {
  BooleanLiteral,
  HttpArrayFormatLiteral,
  HttpLocationLiteral,
  HttpVerbLiteral,
  IntegerLiteral,
  NonEmptyStringLiteral,
  NonNegativeIntegerLiteral,
  NonNegativeNumberLiteral,
  NumberLiteral,
  PrimitiveLiteral,
  StringLiteral,
  TrueLiteral,
} from '../ir';

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
        if (param.value.kind === 'ComplexValue' && param.value.typeName.value) {
          typeNames.add(param.value.typeName.value);
        }
      }
    }
  }
  return typeNames;
}

function getOutputTypeNames(service: Service): Iterable<string> {
  const typeNames = new Set<string>();
  for (const int of service.interfaces) {
    for (const method of int.methods) {
      if (method.returns?.value.kind !== 'ComplexValue') continue;
      typeNames.add(method.returns.value.typeName.value);
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
      if (prop.value.kind === 'PrimitiveValue') continue;
      const e = getEnumByName(service, prop.value.typeName.value);
      if (e) enums.add(e);
    }
  }

  return { types, enums };
}

function* traverseType(service: Service, type: Type): Iterable<Type> {
  yield type;

  for (const prop of type.properties) {
    if (prop.value.kind === 'ComplexValue') {
      const subtype = getTypeByName(service, prop.value.typeName.value);
      if (subtype) yield* traverseType(service, subtype);
      // TODO: traverse unions
    }
  }
}

export function asValue<T extends Literal>(
  value: T | T['value'] | T[] | T['value'][] | undefined,
): { value: T['value'] | T['value'][] | undefined; loc?: string } {
  if (value === undefined) return { value: undefined };
  if (Array.isArray(value)) {
    let loc: string | undefined;
    const values: T['value'][] = [];

    for (const item of value) {
      if (isLiteral(item)) {
        loc ||= item.loc;
        values.push(item.value);
      } else {
        values.push(item);
      }
    }

    return { value: values, loc };
  } else {
    if (isLiteral(value)) {
      const { kind, ...rest } = value;

      return rest;
    } else {
      return { value };
    }
  }
}

export function eq<T extends Literal>(
  a: T | Literal['value'] | T[] | Literal['value'][] | undefined,
  b: T | Literal['value'] | T[] | Literal['value'][] | undefined,
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

  if (isLiteral(a) && isLiteral(b)) return a.value === b.value;
  if (isLiteral(a) || isLiteral(b)) return false;

  return a === b;
}

function isLiteral<T extends Literal>(value: T | T['value']): value is T {
  return (value as Literal).kind !== undefined;
}

export type LiteralValue = Literal['value'];
export type LiteralKind = Literal['kind'];

export type Literal =
  | StringLiteral
  | NumberLiteral
  | IntegerLiteral
  | BooleanLiteral
  | TrueLiteral
  | NonEmptyStringLiteral
  | NonNegativeIntegerLiteral
  | NonNegativeNumberLiteral
  | PrimitiveLiteral
  | HttpVerbLiteral
  | HttpLocationLiteral
  | HttpArrayFormatLiteral;
