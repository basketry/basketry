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
  | InterfaceChangeTarget
  | MethodChangeTarget
  | ParameterChangeTarget
  | ReturnTypeChangeTarget
  | TypeChangeTarget
  | PropertyChangeTarget
  | EnumChangeTarget
  | RuleChangeTarget;

type InterfaceChangeTarget =
  | 'interface'
  | 'interface-name-casing'
  | 'interface-description'
  | 'interface-deprecated';

type MethodChangeTarget =
  | 'method'
  | 'method-name-casing'
  | 'method-description'
  | 'method-deprecated';

type ParameterChangeTarget =
  | 'parameter'
  | 'parameter-name-casing'
  | 'parameter-description'
  | 'parameter-deprecated'
  | 'parameter-type'
  | 'parameter-type-array'
  | 'parameter-type-primitive';

type ReturnTypeChangeTarget =
  | 'return-type'
  | 'return-type-array'
  | 'return-type-primitive';

type TypeChangeTarget =
  | 'input-type'
  | 'input-type-name-casing'
  | 'input-type-description'
  | 'input-type-deprecated'
  | 'output-type'
  | 'output-type-name-casing'
  | 'output-type-description'
  | 'output-type-deprecated';

type PropertyChangeTarget =
  | 'input-property'
  | 'input-property-name-casing'
  | 'input-property-description'
  | 'input-property-deprecated'
  | 'input-property-type'
  | 'input-property-type-array'
  | 'input-property-type-primitive'
  | 'output-property'
  | 'output-property-name-casing'
  | 'output-property-description'
  | 'output-property-deprecated'
  | 'output-property-type'
  | 'output-property-type-array'
  | 'output-property-type-primitive';

type EnumChangeTarget =
  | 'input-enum'
  | 'input-enum-name-casing'
  | 'input-enum-description'
  | 'input-enum-deprecated'
  | 'input-enum-value'
  | 'input-enum-value-casing'
  | 'input-enum-value-description'
  | 'input-enum-value-deprecated'
  | 'output-enum'
  | 'output-enum-name-casing'
  | 'output-enum-description'
  | 'output-enum-deprecated'
  | 'output-enum-value'
  | 'output-enum-value-casing'
  | 'output-enum-value-description'
  | 'output-enum-value-deprecated';

type RuleChangeTarget = ValidationRule['id'];

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
  InterfaceChangeTarget,
  InterfaceContext
>;

export type MethodChangeInfo = ChangeInfoKind<
  MethodChangeTarget,
  MethodContext
>;

export type ParameterChangeInfo = ChangeInfoKind<
  ParameterChangeTarget,
  ParameterContext
>;

export type ReturnTypeChangeInfo = ChangeInfoKind<
  ReturnTypeChangeTarget,
  ReturnTypeContext
>;

export type TypeChangeInfo = ChangeInfoKind<TypeChangeTarget, TypeContext>;

export type PropertyChangeInfo = ChangeInfoKind<
  PropertyChangeTarget,
  PropertyContext
>;

export type EnumChangeInfo = ChangeInfoKind<EnumChangeTarget, EnumContext>;

export type RuleChangeInfo = ChangeInfoKind<RuleChangeTarget, RuleContext>;

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
