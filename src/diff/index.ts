import {
  Enum,
  Interface,
  Method,
  Parameter,
  Property,
  ReturnValue,
  Service,
  Type,
  ValidationRule,
} from '../ir';
import { types } from './types';
import { interfaces } from './interfaces';
import { enums } from './enums';

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

const interfaceChangeTarget = [
  'interface',
  'interface-name-casing',
  'interface-description',
  'interface-deprecated',
] as const;
export type InterfaceChangeTarget = typeof interfaceChangeTarget[number];
export function isInterfaceChangeTarget(
  changeTarget: ChangeTarget,
): changeTarget is InterfaceChangeTarget {
  return interfaceChangeTarget.includes(changeTarget as any);
}

const methodChangeTarget = [
  'method',
  'method-name-casing',
  'method-description',
  'method-deprecated',
] as const;
export type MethodChangeTarget = typeof methodChangeTarget[number];
export function isMethodChangeTarget(
  changeTarget: ChangeTarget,
): changeTarget is MethodChangeTarget {
  return methodChangeTarget.includes(changeTarget as any);
}

const parameterChangeTarget = [
  'parameter',
  'parameter-name-casing',
  'parameter-description',
  'parameter-deprecated',
  'parameter-type',
  'parameter-type-array',
  'parameter-type-primitive',
] as const;
export type ParameterChangeTarget = typeof parameterChangeTarget[number];
export function isParameterChangeTarget(
  changeTarget: ChangeTarget,
): changeTarget is ParameterChangeTarget {
  return parameterChangeTarget.includes(changeTarget as any);
}

const returnsChangeTarget = [
  'returns',
  'returns-array',
  'returns-primitive',
] as const;
export type ReturnTypeChangeTarget = typeof returnsChangeTarget[number];
export function isReturnTypeChangeTarget(
  changeTarget: ChangeTarget,
): changeTarget is ReturnTypeChangeTarget {
  return returnsChangeTarget.includes(changeTarget as any);
}

const typeChangeTarget = [
  'input-type',
  'input-type-name-casing',
  'input-type-description',
  'input-type-deprecated',
  'output-type',
  'output-type-name-casing',
  'output-type-description',
  'output-type-deprecated',
] as const;
export type TypeChangeTarget = typeof typeChangeTarget[number];
export function isTypeChangeTarget(
  changeTarget: ChangeTarget,
): changeTarget is TypeChangeTarget {
  return typeChangeTarget.includes(changeTarget as any);
}

const propertyChangeTarget = [
  'input-property',
  'input-property-name-casing',
  'input-property-description',
  'input-property-deprecated',
  'input-property-type',
  'input-property-type-array',
  'input-property-type-primitive',
  'output-property',
  'output-property-name-casing',
  'output-property-description',
  'output-property-deprecated',
  'output-property-type',
  'output-property-type-array',
  'output-property-type-primitive',
] as const;
export type PropertyChangeTarget = typeof propertyChangeTarget[number];
export function isPropertyChangeTarget(
  changeTarget: ChangeTarget,
): changeTarget is PropertyChangeTarget {
  return propertyChangeTarget.includes(changeTarget as any);
}

const enumChangeTarget = [
  'input-enum',
  'input-enum-name-casing',
  'input-enum-description',
  'input-enum-deprecated',
  'input-enum-member',
  'input-enum-member-casing',
  'input-enum-member-description',
  'input-enum-member-deprecated',
  'output-enum',
  'output-enum-name-casing',
  'output-enum-description',
  'output-enum-deprecated',
  'output-enum-member',
  'output-enum-member-casing',
  'output-enum-member-description',
  'output-enum-member-deprecated',
] as const;
export type EnumChangeTarget = typeof enumChangeTarget[number];
export function isEnumChangeTarget(
  changeTarget: ChangeTarget,
): changeTarget is EnumChangeTarget {
  return enumChangeTarget.includes(changeTarget as any);
}

const ruleChangeTarget = [
  'required',
  'string-max-length',
  'string-min-length',
  'string-pattern',
  'string-format',
  'string-enum',
  'number-multiple-of',
  'number-gt',
  'number-gte',
  'number-lt',
  'number-lte',
  'array-max-items',
  'array-min-items',
  'array-unique-items',
];
type RuleChangeTarget = ValidationRule['id'];
export function isRuleChangeTarget(
  changeTarget: ChangeTarget,
): changeTarget is RuleChangeTarget {
  return ruleChangeTarget.includes(changeTarget as any);
}

export type ChangeContext =
  | ServiceContext
  | InterfaceContext
  | MethodContext
  | ParameterContext
  | ReturnValueContext
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

export type ReturnValueContext = Omit<MethodContext, 'scope'> & {
  scope: 'returns';
  returns: string;
};

export type ReturnValueScope = MethodScope & {
  returns: ReturnValue;
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
  | ReturnValueContext
  | ParameterContext;
export type RuleScope = PropertyScope | ReturnValueScope | ParameterScope;

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
export function isInterfaceChangeInfo(
  changeInfo: ChangeInfo,
): changeInfo is InterfaceChangeInfo {
  return isInterfaceChangeTarget(changeInfo.target);
}

export type MethodChangeInfo = ChangeInfoKind<
  MethodChangeTarget,
  MethodContext
>;
export function isMethodChangeInfo(
  changeInfo: ChangeInfo,
): changeInfo is MethodChangeInfo {
  return isMethodChangeTarget(changeInfo.target);
}

export type ParameterChangeInfo = ChangeInfoKind<
  ParameterChangeTarget,
  ParameterContext
>;
export function isParameterChangeInfo(
  changeInfo: ChangeInfo,
): changeInfo is ParameterChangeInfo {
  return isParameterChangeTarget(changeInfo.target);
}

export type ReturnTypeChangeInfo = ChangeInfoKind<
  ReturnTypeChangeTarget,
  ReturnValueContext
>;
export function isReturnTypeChangeInfo(
  changeInfo: ChangeInfo,
): changeInfo is ReturnTypeChangeInfo {
  return isReturnTypeChangeTarget(changeInfo.target);
}

export type TypeChangeInfo = ChangeInfoKind<TypeChangeTarget, TypeContext>;
export function isTypeChangeInfo(
  changeInfo: ChangeInfo,
): changeInfo is TypeChangeInfo {
  return isTypeChangeTarget(changeInfo.target);
}

export type PropertyChangeInfo = ChangeInfoKind<
  PropertyChangeTarget,
  PropertyContext
>;
export function isPropertyChangeInfo(
  changeInfo: ChangeInfo,
): changeInfo is PropertyChangeInfo {
  return isPropertyChangeTarget(changeInfo.target);
}

export type EnumChangeInfo = ChangeInfoKind<EnumChangeTarget, EnumContext>;
export function isEnumChangeInfo(
  changeInfo: ChangeInfo,
): changeInfo is EnumChangeInfo {
  return isEnumChangeTarget(changeInfo.target);
}

export type RuleChangeInfo = ChangeInfoKind<RuleChangeTarget, RuleContext>;
export function isRuleChangeInfo(
  changeInfo: ChangeInfo,
): changeInfo is RuleChangeInfo {
  return isRuleChangeTarget(changeInfo.target);
}

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
