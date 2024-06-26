import {
  Enum,
  EnumValue,
  Interface,
  Method,
  Parameter,
  Property,
  ReturnType,
  Scalar,
  Service,
  Type,
} from '../ir';

export function buildService(service?: Partial<Service>): Service {
  return {
    kind: 'Service',
    basketry: '1.1-rc',
    sourcePath: 'path/file.ext',
    title: { value: 'my service' },
    majorVersion: { value: 1 },
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
    name: { value: 'my_interface' },
    methods: [],
    protocols: {
      http: [],
    },
    ...int,
  };
}

export function buildMethod(method?: Partial<Method>): Method {
  return {
    kind: 'Method',
    name: { value: 'my_method' },
    parameters: [],
    security: [],
    returnType: undefined,
    ...method,
  };
}

export function buildParameter(parameter?: Partial<Parameter>): Parameter {
  return {
    kind: 'Parameter',
    name: { value: 'my_parameter' },
    isArray: false,
    isPrimitive: true,
    typeName: { value: 'string' },
    rules: [],
    ...(parameter as any),
  };
}

export function buildReturnType(returnType?: Partial<ReturnType>): ReturnType {
  return {
    kind: 'ReturnType',
    isArray: false,
    isPrimitive: true,
    typeName: { value: 'string' },
    rules: [],
    ...(returnType as any),
  };
}

export function buildType(type?: Partial<Type>): Type {
  return {
    kind: 'Type',
    name: { value: 'my_method' },
    properties: [buildProperty()],
    rules: [],
    ...type,
  };
}

export function buildProperty(property?: Partial<Property>): Property {
  return {
    kind: 'Property',
    name: { value: 'my_method' },
    isArray: false,
    isPrimitive: true,
    typeName: { value: 'string' },
    rules: [],
    ...(property as any),
  };
}

export function buildEnum(e?: Partial<Enum>): Enum {
  return {
    kind: 'Enum',
    name: { value: 'my_enum' },
    values: [
      buildEnumValue({ content: { value: 'some_value' } }),
      buildEnumValue({ content: { value: 'other_value' } }),
    ],
    ...e,
  };
}

export function buildEnumValue(value?: Partial<EnumValue>): EnumValue {
  return {
    kind: 'EnumValue',
    content: { value: 'my_enum_value' },
    ...value,
  };
}

export function buildScalar<T extends string | number | boolean | null>(
  value: T,
): Scalar<T> {
  return { value };
}
