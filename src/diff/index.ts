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
  | 'input-enum-value'
  | 'input-enum-value-casing'
  | 'output-enum'
  | 'output-enum-name-casing'
  | 'output-enum-value'
  | 'output-enum-value-casing'
  | ValidationRule['id'];

export type ChangeContext =
  | ({
      scope: 'service';
    } & ServiceContext)
  | ({
      scope: 'interface';
    } & InterfaceContext)
  | ({
      scope: 'method';
    } & MethodContext)
  | ({
      scope: 'parameter';
    } & ParameterContext)
  | ({
      scope: 'return-type';
    } & ReturnTypeContext)
  | ({
      scope: 'input-type' | 'output-type';
    } & TypeContext)
  | ({
      scope: 'input-property' | 'output-property';
    } & PropertyContext)
  | ({
      scope: 'input-enum' | 'output-enum';
    } & EnumContext);

export type ServiceContext = {
  service: string;
};

export type ServiceScope = {
  service: Service;
};

export type InterfaceContext = ServiceContext & {
  interface: string;
};

export type InterfaceScope = ServiceScope & {
  interface: Interface;
};

export type MethodContext = InterfaceContext & {
  method: string;
};

export type MethodScope = InterfaceScope & {
  method: Method;
};

export type ParameterContext = MethodContext & {
  parameter: string;
  required: boolean;
};

export type ParameterScope = MethodScope & {
  parameter: Parameter;
};

export type ReturnTypeContext = MethodContext & {
  returnType: string;
};

export type ReturnTypeScope = MethodScope & {
  returnType: ReturnType;
};

export type TypeContext = ServiceContext & {
  type: string;
};

export type TypeScope = ServiceScope & {
  type: Type;
};

export type PropertyContext = TypeContext & {
  property: string;
};

export type PropertyScope = TypeScope & {
  property: Property;
};

export type EnumContext = ServiceContext & {
  enum: string;
};

export type EnumScope = ServiceScope & {
  enum: Enum;
};

type Primitive = string | number | boolean | null;

export type ChangeState = {
  context: ChangeContext;
  value: Primitive | Primitive[] | undefined;
  loc?: string;
};

export type ChangeInfo = {
  kind: ChangeKind;
  target: ChangeTarget;
  a?: ChangeState;
  b?: ChangeState;
};

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
