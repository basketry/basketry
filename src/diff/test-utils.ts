import {
  ComplexValue,
  Enum,
  EnumMember,
  IntegerLiteral,
  Interface,
  MemberValue,
  Method,
  NonEmptyStringLiteral,
  NonNegativeIntegerLiteral,
  NonNegativeNumberLiteral,
  NumberLiteral,
  Parameter,
  Primitive,
  PrimitiveLiteral,
  PrimitiveValue,
  Property,
  ReturnValue,
  Service,
  StringLiteral,
  TrueLiteral,
  Type,
} from '../ir';

export function stringLiteral(value: string): StringLiteral {
  return { kind: 'StringLiteral', value };
}

export function integerLiteral(value: number): IntegerLiteral {
  return { kind: 'IntegerLiteral', value };
}

export function numberLiteral(value: number): NumberLiteral {
  return { kind: 'NumberLiteral', value };
}

export function trueLiteral(): TrueLiteral {
  return { kind: 'TrueLiteral', value: true };
}

export function primitiveLiteral(value: Primitive): PrimitiveLiteral {
  return { kind: 'PrimitiveLiteral', value };
}

export function nonNegativeNumberLiteral(
  value: number,
): NonNegativeNumberLiteral {
  return { kind: 'NonNegativeNumberLiteral', value };
}

export function nonNegativeIntegerLiteral(
  value: number,
): NonNegativeIntegerLiteral {
  return { kind: 'NonNegativeIntegerLiteral', value };
}

export function nonEmptyStringLiteral(value: string): NonEmptyStringLiteral {
  return { kind: 'NonEmptyStringLiteral', value };
}

export function buildService(service?: Partial<Service>): Service {
  return {
    kind: 'Service',
    basketry: '0.2',
    sourcePath: 'path/file.ext',
    title: stringLiteral('my service'),
    majorVersion: integerLiteral(1),
    interfaces: [],
    types: [],
    enums: [],
    unions: [],
    ...service,
  };
}

export function buildInterface(int?: Partial<Interface>): Interface {
  return {
    kind: 'Interface',
    name: stringLiteral('my_interface'),
    methods: [],
    protocols: {
      kind: 'InterfaceProtocols',
      http: [],
    },
    ...int,
  };
}

export function buildComplexValue(value: Partial<ComplexValue>): ComplexValue {
  return {
    kind: 'ComplexValue',
    rules: [],
    typeName: stringLiteral('my_type'),
    ...value,
  };
}

export function buildPrimitiveValue(
  value?: Partial<PrimitiveValue>,
): PrimitiveValue {
  return {
    kind: 'PrimitiveValue',
    typeName: primitiveLiteral('string'),
    rules: [],
    ...value,
  };
}

export function buildMethod(method?: Partial<Method>): Method {
  return {
    kind: 'Method',
    name: stringLiteral('my_method'),
    parameters: [],
    security: [],
    ...method,
  };
}

export function buildParameter(parameter?: Partial<Parameter>): Parameter {
  return {
    kind: 'Parameter',
    name: stringLiteral('my_parameter'),
    value: buildPrimitiveValue(),
    ...parameter,
  };
}

export function buildReturnValue(
  returnValue?: Partial<ReturnValue>,
): ReturnValue {
  return {
    kind: 'ReturnValue',
    value: buildPrimitiveValue(),
    ...returnValue,
  };
}

export function buildType(type?: Partial<Type>): Type {
  return {
    kind: 'Type',
    name: stringLiteral('my_type'),
    properties: [buildProperty()],
    rules: [],
    ...type,
  };
}

export function buildProperty(property?: Partial<Property>): Property {
  return {
    kind: 'Property',
    name: stringLiteral('my_property'),
    value: buildPrimitiveValue(),
    ...property,
  };
}

export function buildEnum(e?: Partial<Enum>): Enum {
  return {
    kind: 'Enum',
    name: stringLiteral('my_enum'),
    members: [
      buildEnumMember({ content: stringLiteral('some_content') }),
      buildEnumMember({ content: stringLiteral('other_content') }),
    ],
    ...e,
  };
}

export function buildEnumMember(value?: Partial<EnumMember>): EnumMember {
  return {
    kind: 'EnumMember',
    content: stringLiteral('some_content'),
    ...value,
  };
}
