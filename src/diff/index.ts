import {
  Enum,
  Interface,
  Method,
  Parameter,
  Property,
  Service,
  Type,
  ValidationRule,
} from '../types';
import { types } from './types';
import { interfaces } from './interfaces';
import { enums } from './enums';
import { ReturnType } from '..';

export type ChangeKind =
  | 'added'
  | 'changed'
  | 'increased'
  | 'decreased'
  | 'removed';

export type ChangeTarget =
  | 'interface'
  | 'interface-name-casing'
  | 'interface-description'
  //
  | 'method'
  | 'method-name-casing'
  | 'method-description'
  | 'parameter'
  | 'parameter-name-casing'
  | 'parameter-description'
  | 'parameter-type'
  | 'parameter-type-array'
  | 'parameter-type-primitive'
  //
  | 'return-type'
  | 'return-type-array'
  | 'return-type-primitive'
  //
  | 'input-type'
  | 'input-type-name-casing'
  | 'input-type-description'
  | 'input-property'
  | 'input-property-name-casing'
  | 'input-property-description'
  | 'input-property-type'
  | 'input-property-type-array'
  | 'input-property-type-primitive'
  | 'output-type'
  | 'output-type-name-casing'
  | 'output-type-description'
  | 'output-property'
  | 'output-property-name-casing'
  | 'output-property-description'
  | 'output-property-type'
  | 'output-property-type-array'
  | 'output-property-type-primitive'
  //
  | 'input-enum'
  | 'input-enum-name-casing'
  | 'input-enum-description'
  | 'input-enum-value'
  | 'input-enum-value-casing'
  | 'input-enum-value-description'
  | 'output-enum'
  | 'output-enum-name-casing'
  | 'output-enum-description'
  | 'output-enum-value'
  | 'output-enum-value-casing'
  | 'output-enum-value-description'
  | ValidationRule['id'];

export type ChangeContext =
  | ServiceContext
  | InterfaceContext
  | MethodContext
  | ParameterContext
  | ReturnTypeContext
  | TypeContext
  | PropertyContext
  | EnumContext;

export type ServiceContext = {
  scope: 'service';
  service: string;
};

export type ServiceScope = {
  service: Service;
};

export type InterfaceContext = Omit<ServiceContext, 'scope'> & {
  scope: 'interface';
  interface: string;
};

export type InterfaceScope = ServiceScope & {
  interface: Interface;
};

export type MethodContext = Omit<InterfaceContext, 'scope'> & {
  scope: 'method';
  method: string;
};

export type MethodScope = InterfaceScope & {
  method: Method;
};

export type ParameterContext = Omit<MethodContext, 'scope'> & {
  scope: 'parameter';
  parameter: string;
  required: boolean;
};

export type ParameterScope = MethodScope & {
  parameter: Parameter;
};

export type ReturnTypeContext = Omit<MethodContext, 'scope'> & {
  scope: 'return-type';
  returnType: string;
};

export type ReturnTypeScope = MethodScope & {
  returnType: ReturnType;
};

export type TypeContext = Omit<ServiceContext, 'scope'> & {
  scope: 'input-type' | 'output-type';
  type: string;
};

export type TypeScope = ServiceScope & {
  type: Type;
};

export type PropertyContext = Omit<TypeContext, 'scope'> & {
  scope: 'input-property' | 'output-property';
  property: string;
  required: boolean;
};

export type PropertyScope = TypeScope & {
  property: Property;
};

export type EnumContext = Omit<ServiceContext, 'scope'> & {
  scope: 'input-enum' | 'output-enum';
  enum: string;
};

export type EnumScope = ServiceScope & {
  enum: Enum;
};

export type RuleContext =
  | PropertyContext
  | ReturnTypeContext
  | ParameterContext;
export type RuleScope = PropertyScope | ReturnTypeScope | ParameterScope;

type Primitive = string | number | boolean | null;

export type ChangeState<Context extends ChangeContext> = {
  context: Context;
  value: Primitive | Primitive[] | undefined;
  loc?: string;
};

export type AAA = {};

type ChangeInfoKind<
  Target extends ChangeTarget,
  Context extends ChangeContext,
> = {
  kind: ChangeKind;
  target: Target;
  category: Category;
  a?: ChangeState<Context>;
  b?: ChangeState<Context>;
};

export type ChangeInfo =
  | InterfaceChangeInfo
  | MethodChangeInfo
  | ParameterChangeInfo
  | ReturnTypeChangeInfo
  | TypeChangeInfo
  | PropertyChangeInfo
  | EnumChangeInfo
  | RuleChangeInfo;

export type InterfaceChangeInfo = ChangeInfoKind<
  'interface' | 'interface-description' | 'interface-name-casing',
  InterfaceContext
>;

export type MethodChangeInfo = ChangeInfoKind<
  'method' | 'method-description' | 'method-name-casing',
  MethodContext
>;

export type ParameterChangeInfo = ChangeInfoKind<
  | 'parameter'
  | 'parameter-description'
  | 'parameter-name-casing'
  | 'parameter-type'
  | 'parameter-type-array'
  | 'parameter-type-primitive',
  ParameterContext
>;

export type ReturnTypeChangeInfo = ChangeInfoKind<
  'return-type' | 'return-type-array' | 'return-type-primitive',
  ReturnTypeContext
>;

export type TypeChangeInfo = ChangeInfoKind<
  | 'input-type'
  | 'input-type-description'
  | 'input-type-name-casing'
  | 'output-type'
  | 'output-type-description'
  | 'output-type-name-casing',
  TypeContext
>;

export type PropertyChangeInfo = ChangeInfoKind<
  | 'input-property'
  | 'input-property-name-casing'
  | 'input-property-description'
  | 'input-property-type'
  | 'input-property-type-array'
  | 'input-property-type-primitive'
  | 'output-property'
  | 'output-property-name-casing'
  | 'output-property-description'
  | 'output-property-type'
  | 'output-property-type-array'
  | 'output-property-type-primitive',
  PropertyContext
>;

export type EnumChangeInfo = ChangeInfoKind<
  | 'input-enum'
  | 'input-enum-name-casing'
  | 'input-enum-description'
  | 'input-enum-value'
  | 'input-enum-value-casing'
  | 'input-enum-value-description'
  | 'output-enum'
  | 'output-enum-name-casing'
  | 'output-enum-description'
  | 'output-enum-value'
  | 'output-enum-value-casing'
  | 'output-enum-value-description',
  EnumContext
>;

export type RuleChangeInfo = ChangeInfoKind<
  | 'string-pattern'
  | 'string-format'
  | 'string-enum'
  | 'number-multiple-of'
  | 'number-gt'
  | 'number-gte'
  | 'number-lt'
  | 'number-lte'
  | 'array-max-items'
  | 'array-min-items'
  | 'array-unique-items'
  | 'required'
  | 'string-max-length'
  | 'string-min-length',
  RuleContext
>;

export function diff(a: Service, b: Service): ChangeInfo[] {
  const changes: ChangeInfo[] = [];

  changes.push(
    ...interfaces({ service: a }, { service: b }),
    ...types('input', { service: a }, { service: b }),
    ...types('output', { service: a }, { service: b }),
    ...enums('input', { service: a }, { service: b }),
    ...enums('output', { service: a }, { service: b }),
  );

  return changes;
}

export type Category = 'major' | 'minor' | 'patch';
