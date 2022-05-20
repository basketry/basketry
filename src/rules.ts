import {
  Enum,
  Interface,
  Method,
  MethodSpec,
  Parameter,
  ParameterSpec,
  PathSpec,
  Property,
  Rule,
  Service,
  Type,
  Violation,
} from './types';

export interface ServiceRuleContext {
  service: Service;
  sourcePath: string;
  options: any;
}
export function serviceRule(
  rule: (context: ServiceRuleContext) => Violation | undefined,
): Rule {
  return (service, sourcePath, options) =>
    [service]
      .map((s) => rule({ service: s, sourcePath, options }))
      .filter((v): v is Violation => !!v);
}

export interface InterfaceRuleContext extends ServiceRuleContext {
  interface: Interface;
}
export function interfaceRule(
  rule: (context: InterfaceRuleContext) => Violation | undefined,
): Rule {
  return (service, sourcePath, options) =>
    service.interfaces
      .map((i) => rule({ interface: i, service, sourcePath, options }))
      .filter((v): v is Violation => !!v);
}

export interface MethodRuleContext extends InterfaceRuleContext {
  method: Method;
  httpMethod?: MethodSpec;
}
export function methodRule(
  rule: (context: MethodRuleContext) => Violation | undefined,
): Rule {
  return (service, sourcePath, options) =>
    service.interfaces
      .flatMap((i) => i.methods.map<[Method, Interface]>((m) => [m, i]))
      .map(([m, i]) =>
        rule({
          method: m,
          httpMethod: getHttpMethodByName(service, m.name.value),
          interface: i,
          service,
          sourcePath,
          options,
        }),
      )
      .filter((v): v is Violation => !!v);
}

export interface HttpPathRuleContext extends InterfaceRuleContext {
  httpPath: PathSpec;
}
export function httpPathRule(
  rule: (context: HttpPathRuleContext) => Violation | undefined,
): Rule {
  return (service, sourcePath, options) =>
    service.interfaces
      .flatMap((i) =>
        i.protocols.http.map<[PathSpec, Interface]>((p) => [p, i]),
      )
      .map(([p, i]) =>
        rule({ httpPath: p, interface: i, service, sourcePath, options }),
      )
      .filter((v): v is Violation => !!v);
}

export interface ParameterRuleContext extends MethodRuleContext {
  parameter: Parameter;
  httpParameter?: ParameterSpec;
}
export function parameterRule(
  rule: (context: ParameterRuleContext) => Violation | undefined,
): Rule {
  return (service, sourcePath, options) =>
    service.interfaces
      .flatMap((i) => i.methods.map<[Method, Interface]>((m) => [m, i]))
      .flatMap(([m, i]) =>
        m.parameters.map<[Parameter, Method, Interface]>((p) => [p, m, i]),
      )
      .map(([p, m, i]) =>
        rule({
          parameter: p,
          httpParameter: getHttpMethodByName(
            service,
            m.name.value,
          )?.parameters?.find((x) => x.name.value === p.name.value),
          method: m,
          httpMethod: getHttpMethodByName(service, m.name.value),
          interface: i,
          service,
          sourcePath,
          options,
        }),
      )
      .filter((v): v is Violation => !!v);
}

export interface TypeRuleContext extends ServiceRuleContext {
  type: Type;
}
export function typeRule(
  rule: (context: TypeRuleContext) => Violation | undefined,
): Rule {
  return (service, sourcePath, options) =>
    service.types
      .map((type) => rule({ type, service, sourcePath, options }))
      .filter((v): v is Violation => !!v);
}

export interface PropertyRuleContext extends TypeRuleContext {
  property: Property;
}
export function propertyRule(
  rule: (context: PropertyRuleContext) => Violation | undefined,
): Rule {
  return (service, sourcePath, options) =>
    service.types
      .flatMap((t) => t.properties.map<[Property, Type]>((p) => [p, t]))
      .map(([p, t]) =>
        rule({ property: p, type: t, service, sourcePath, options }),
      )
      .filter((v): v is Violation => !!v);
}

export interface EnumRuleContext extends ServiceRuleContext {
  enum: Enum;
}
export function enumRule(
  rule: (context: EnumRuleContext) => Violation | undefined,
): Rule {
  return (service, sourcePath, options) =>
    service.enums
      .map((e) => rule({ enum: e, service, sourcePath, options }))
      .filter((v): v is Violation => !!v);
}

export interface EnumValueRuleContext extends EnumRuleContext {
  value: Enum['values'][number];
}
export function enumValueRule(
  rule: (context: EnumValueRuleContext) => Violation | undefined,
): Rule {
  return (service, sourcePath, options) =>
    service.enums
      .flatMap((e) =>
        e.values.map<[Enum['values'][number], Enum]>((v) => [v, e]),
      )
      .map(([v, e]) =>
        rule({ value: v, enum: e, service, sourcePath, options }),
      )
      .filter((v): v is Violation => !!v);
}

export function combineRules(...rules: Rule[]): Rule {
  return (service, sourcePath, options) =>
    rules.flatMap((rule) => rule(service, sourcePath, options));
}
