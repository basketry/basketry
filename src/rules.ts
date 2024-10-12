import {
  Enum,
  Interface,
  Method,
  HttpMethod,
  Parameter,
  HttpParameter,
  HttpRoute,
  Property,
  Service,
  Type,
  Union,
  EnumMember,
} from './ir';
import { Rule, Severity, Violation } from './types';

export type ContextIterator<Context> = (
  service: Service,
  options: any,
) => Context[];

export interface ServiceRuleContext {
  service: Service;
  options: any;
}
export function serviceRule(
  rule: (context: ServiceRuleContext) => Violation | undefined,
): Rule {
  return (service, options) =>
    [service]
      .map((s) => rule({ service: s, options }))
      .filter((v): v is Violation => !!v);
}

export interface InterfaceRuleContext extends ServiceRuleContext {
  interface: Interface;
}
export function interfaceRule(
  rule: (context: InterfaceRuleContext) => Violation | undefined,
): Rule {
  return (service, options) =>
    allInterfaces(service, options)
      .map((context) => rule(context))
      .filter((v): v is Violation => !!v);
}
export const allInterfaces: ContextIterator<InterfaceRuleContext> = (
  service,
  options,
) =>
  service.interfaces.map((i) => ({
    interface: i,
    service,
    options,
  }));

export interface MethodRuleContext extends InterfaceRuleContext {
  method: Method;
  httpMethod?: HttpMethod;
}
export function methodRule(
  rule: (context: MethodRuleContext) => Violation | undefined,
): Rule {
  return (service, options) =>
    allMethods(service, options)
      .map((context) => rule(context))
      .filter((v): v is Violation => !!v);
}
export const allMethods: ContextIterator<MethodRuleContext> = (
  service,
  options,
) =>
  service.interfaces
    .flatMap((i) => i.methods.map<[Method, Interface]>((m) => [m, i]))
    .map(([m, i]) => ({
      method: m,
      httpMethod: getHttpMethodByName(service, m.name.value),
      interface: i,
      service,
      options,
    }));

export interface HttpRouteRuleContext extends InterfaceRuleContext {
  httpRoute: HttpRoute;
}
export function httpPathRule(
  rule: (context: HttpRouteRuleContext) => Violation | undefined,
): Rule {
  return (service, options) =>
    allHttpRoutes(service, options)
      .map((context) => rule(context))
      .filter((v): v is Violation => !!v);
}
export const allHttpRoutes: ContextIterator<HttpRouteRuleContext> = (
  service,
  options,
) =>
  service.interfaces
    .flatMap(
      (i) =>
        i.protocols?.http?.map<[HttpRoute, Interface]>((r) => [r, i]) ?? [],
    )
    ?.map(([r, i]) => ({
      httpRoute: r,
      interface: i,
      service,
      options,
    }));

export interface ParameterRuleContext extends MethodRuleContext {
  parameter: Parameter;
  httpParameter?: HttpParameter;
}
export function parameterRule(
  rule: (context: ParameterRuleContext) => Violation | undefined,
): Rule {
  return (service, options) =>
    allParameters(service, options)
      .map((context) => rule(context))
      .filter((v): v is Violation => !!v);
}
export const allParameters: ContextIterator<ParameterRuleContext> = (
  service,
  options,
) =>
  service.interfaces
    .flatMap((i) => i.methods.map<[Method, Interface]>((m) => [m, i]))
    .flatMap(([m, i]) =>
      m.parameters.map<[Parameter, Method, Interface]>((p) => [p, m, i]),
    )
    .map(([p, m, i]) => ({
      parameter: p,
      httpParameter: getHttpMethodByName(
        service,
        m.name.value,
      )?.parameters?.find((x) => x.name.value === p.name.value),
      method: m,
      httpMethod: getHttpMethodByName(service, m.name.value),
      interface: i,
      service,
      options,
    }));

export interface TypeRuleContext extends ServiceRuleContext {
  type: Type;
}
export function typeRule(
  rule: (context: TypeRuleContext) => Violation | undefined,
): Rule {
  return (service, options) =>
    allTypes(service, options)
      .map((context) => rule(context))
      .filter((v): v is Violation => !!v);
}
export const allTypes: ContextIterator<TypeRuleContext> = (service, options) =>
  service.types.map((type) => ({ type, service, options }));

export interface PropertyRuleContext extends TypeRuleContext {
  property: Property;
}
export function propertyRule(
  rule: (context: PropertyRuleContext) => Violation | undefined,
): Rule {
  return (service, options) =>
    allProperties(service, options)
      .map((context) => rule(context))
      .filter((v): v is Violation => !!v);
}
export const allProperties: ContextIterator<PropertyRuleContext> = (
  service,
  options,
) =>
  service.types
    .flatMap((t) => t.properties.map<[Property, Type]>((p) => [p, t]))
    .map(([p, t]) => ({ property: p, type: t, service, options }));

export interface EnumRuleContext extends ServiceRuleContext {
  enum: Enum;
}
export function enumRule(
  rule: (context: EnumRuleContext) => Violation | undefined,
): Rule {
  return (service, options) =>
    allEnums(service, options)
      .map((context) => rule(context))
      .filter((v): v is Violation => !!v);
}
export const allEnums: ContextIterator<EnumRuleContext> = (service, options) =>
  service.enums.map((e) => ({ enum: e, service, options }));

export interface EnumMemberRuleContext extends EnumRuleContext {
  member: EnumMember;
}
export function enumValueRule(
  rule: (context: EnumMemberRuleContext) => Violation | undefined,
): Rule {
  return (service, options) =>
    allEnumMembers(service, options)
      .map((context) => rule(context))
      .filter((v): v is Violation => !!v);
}
export const allEnumMembers: ContextIterator<EnumMemberRuleContext> = (
  service,
  options,
) =>
  service.enums
    .flatMap((e) => e.members.map<[EnumMember, Enum]>((m) => [m, e]))
    .map(([m, e]) => ({ member: m, enum: e, service, options }));

export interface UnionRuleContext extends ServiceRuleContext {
  union: Union;
}
export function unionRule(
  rule: (context: UnionRuleContext) => Violation | undefined,
): Rule {
  return (service, options) =>
    allUnions(service, options)
      .map((context) => rule(context))
      .filter((v): v is Violation => !!v);
}
export const allUnions: ContextIterator<UnionRuleContext> = (
  service,
  options,
) => service.unions.map((union) => ({ union, service, options }));

export function combineRules(...rules: Rule[]): Rule {
  return (service: Service, options: any) =>
    Promise.all(rules.map((rule) => rule(service, options))).then((results) =>
      results.flatMap((x) => x),
    );
}

export function parseSeverity(
  input: any,
  fallback: Severity = 'error',
): Severity {
  switch (input) {
    case 'info':
    case 'warning':
    case 'error':
      return input;
    default:
      return fallback;
  }
}

const methodMapsByService = new WeakMap<
  Service,
  ReadonlyMap<string, HttpMethod>
>();
export function getHttpMethodByName(
  service: Service,
  methodName: string | undefined,
): HttpMethod | undefined {
  if (!methodName) return;

  if (!methodMapsByService.has(service)) {
    const httpMethodsByName: ReadonlyMap<string, HttpMethod> = new Map(
      service.interfaces
        .flatMap((i) => i.protocols?.http ?? [])
        .flatMap((p) => p.methods)
        .map((m) => [m.name.value.toLowerCase(), m]),
    );
    methodMapsByService.set(service, httpMethodsByName);
  }
  return methodMapsByService.get(service)?.get(methodName.toLowerCase());
}

const typeMapsByService = new WeakMap<Service, ReadonlyMap<string, Type>>();
export function getTypeByName(
  service: Service,
  typeName: string | undefined,
): Type | undefined {
  if (!typeName) return;

  if (!typeMapsByService.has(service)) {
    const typesByName: ReadonlyMap<string, Type> = new Map(
      service.types.map((t) => [t.name.value.toLowerCase(), t]),
    );
    typeMapsByService.set(service, typesByName);
  }
  return typeMapsByService.get(service)?.get(typeName.toLowerCase());
}

const enumMapsByService = new WeakMap<Service, ReadonlyMap<string, Enum>>();
export function getEnumByName(
  service: Service,
  enumName: string | undefined,
): Enum | undefined {
  if (!enumName) return;

  if (!enumMapsByService.has(service)) {
    const enumsByName: ReadonlyMap<string, Enum> = new Map(
      service.enums.map((e) => [e.name.value.toLowerCase(), e]),
    );
    enumMapsByService.set(service, enumsByName);
  }
  return enumMapsByService.get(service)?.get(enumName.toLowerCase());
}

const unionMapsByService = new WeakMap<Service, ReadonlyMap<string, Union>>();
export function getUnionByName(
  service: Service,
  unionName: string | undefined,
): Union | undefined {
  if (!unionName) return;

  if (!unionMapsByService.has(service)) {
    const unionsByName: ReadonlyMap<string, Union> = new Map(
      service.unions.map((e) => [e.name.value.toLowerCase(), e]),
    );
    unionMapsByService.set(service, unionsByName);
  }
  return unionMapsByService.get(service)?.get(unionName.toLowerCase());
}
