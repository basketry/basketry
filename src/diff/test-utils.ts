import { Literal, ValidationRule } from '..';
import {
  Enum,
  Interface,
  Method,
  Parameter,
  Property,
  ReturnType,
  Service,
  Type,
} from '../types';

export function buildService(service?: Partial<Service>): Service {
  return {
    basketry: '1',
    sourcePath: 'path/file.ext',
    title: { value: 'my service' },
    majorVersion: { value: 1 },
    interfaces: [],
    types: [],
    enums: [],
    unions: [],
    loc: '1;1;0',
    ...service,
  };
}

export function buildInterface(int?: Partial<Interface>): Interface {
  return {
    name: 'my_interface',
    methods: [],
    protocols: {
      http: [],
    },
    ...int,
  };
}

export function buildMethod(method?: Partial<Method>): Method {
  return {
    name: { value: 'my_method' },
    parameters: [],
    security: [],
    returnType: undefined,
    loc: '1;1;0',
    ...method,
  };
}

export function buildParameter(parameter?: Partial<Parameter>): Parameter {
  return {
    name: { value: 'my_parameter' },
    isArray: false,
    isPrimitive: true,
    typeName: { value: 'string' },
    rules: [],
    loc: '1;1;0',
    ...(parameter as any),
  };
}

export function buildReturnType(returnType?: Partial<ReturnType>): ReturnType {
  return {
    isArray: false,
    isPrimitive: true,
    typeName: { value: 'string' },
    rules: [],
    loc: '1;1;0',
    ...(returnType as any),
  };
}

export function buildType(type?: Partial<Type>): Type {
  return {
    name: { value: 'my_method' },
    properties: [buildProperty()],
    rules: [],
    loc: '1;1;0',
    ...type,
  };
}

export function buildProperty(property?: Partial<Property>): Property {
  return {
    name: { value: 'my_method' },
    isArray: false,
    isPrimitive: true,
    typeName: { value: 'string' },
    rules: [],
    loc: '1;1;0',
    ...(property as any),
  };
}

export function buildEnum(e?: Partial<Enum>): Enum {
  return {
    name: { value: 'my_enum' },
    values: [
      buildEnumValue({ value: 'some_value' }),
      buildEnumValue({ value: 'other_value' }),
    ],
    loc: '1;1;0',
    ...e,
  };
}

export function buildEnumValue(
  value?: Partial<Literal<string>>,
): Literal<string> {
  return {
    value: 'my_enum_value',
    loc: '1;1;0',
    ...value,
  };
}
