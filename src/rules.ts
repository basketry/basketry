import {
  Enum,
  Interface,
  Method,
  HttpMethod,
  Parameter,
  HttpParameter,
  HttpPath,
  Property,
  Service,
  Type,
  Union,
} from './ir';
import { Rule, Severity, Violation } from './types';

export type ContextIterator<Context> = (
  service: Service,
  sourcePath: string,
  options: any,
) => Context[];

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
    allInterfaces(service, sourcePath, options)
      .map((context) => rule(context))
      .filter((v): v is Violation => !!v);
}
export const allInterfaces: ContextIterator<InterfaceRuleContext> = (
  service,
  sourcePath,
  options,
) =>
  service.interfaces.map((i) => ({
    interface: i,
    service,
    sourcePath,
    options,
  }));

export interface MethodRuleContext extends InterfaceRuleContext {
  method: Method;
  httpMethod?: HttpMethod;
}
export function methodRule(
  rule: (context: MethodRuleContext) => Violation | undefined,
): Rule {
  return (service, sourcePath, options) =>
    allMethods(service, sourcePath, options)
      .map((context) => rule(context))
      .filter((v): v is Violation => !!v);
}
export const allMethods: ContextIterator<MethodRuleContext> = (
  service,
  sourcePath,
  options,
) =>
  service.interfaces
    .flatMap((i) => i.methods.map<[Method, Interface]>((m) => [m, i]))
    .map(([m, i]) => ({
      method: m,
      httpMethod: getHttpMethodByName(service, m.name.value),
      interface: i,
      service,
      sourcePath,
      options,
    }));

export interface HttpPathRuleContext extends InterfaceRuleContext {
  httpPath: HttpPath;
}
export function httpPathRule(
  rule: (context: HttpPathRuleContext) => Violation | undefined,
): Rule {
  return (service, sourcePath, options) =>
    allHttpPaths(service, sourcePath, options)
      .map((context) => rule(context))
      .filter((v): v is Violation => !!v);
}
export const allHttpPaths: ContextIterator<HttpPathRuleContext> = (
  service,
  sourcePath,
  options,
) =>
  service.interfaces
    .flatMap((i) => i.protocols.http.map<[HttpPath, Interface]>((p) => [p, i]))
    .map(([p, i]) => ({
      httpPath: p,
      interface: i,
      service,
      sourcePath,
      options,
    }));

export interface ParameterRuleContext extends MethodRuleContext {
  parameter: Parameter;
  httpParameter?: HttpParameter;
}
export function parameterRule(
  rule: (context: ParameterRuleContext) => Violation | undefined,
): Rule {
  return (service, sourcePath, options) =>
    allParameters(service, sourcePath, options)
      .map((context) => rule(context))
      .filter((v): v is Violation => !!v);
}
export const allParameters: ContextIterator<ParameterRuleContext> = (
  service,
  sourcePath,
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
      sourcePath,
      options,
    }));

export interface TypeRuleContext extends ServiceRuleContext {
  type: Type;
}
export function typeRule(
  rule: (context: TypeRuleContext) => Violation | undefined,
): Rule {
  return (service, sourcePath, options) =>
    allTypes(service, sourcePath, options)
      .map((context) => rule(context))
      .filter((v): v is Violation => !!v);
}
export const allTypes: ContextIterator<TypeRuleContext> = (
  service,
  sourcePath,
  options,
) => service.types.map((type) => ({ type, service, sourcePath, options }));

export interface PropertyRuleContext extends TypeRuleContext {
  property: Property;
}
export function propertyRule(
  rule: (context: PropertyRuleContext) => Violation | undefined,
): Rule {
  return (service, sourcePath, options) =>
    allProperties(service, sourcePath, options)
      .map((context) => rule(context))
      .filter((v): v is Violation => !!v);
}
export const allProperties: ContextIterator<PropertyRuleContext> = (
  service,
  sourcePath,
  options,
) =>
  service.types
    .flatMap((t) => t.properties.map<[Property, Type]>((p) => [p, t]))
    .map(([p, t]) => ({ property: p, type: t, service, sourcePath, options }));

export interface EnumRuleContext extends ServiceRuleContext {
  enum: Enum;
}
export function enumRule(
  rule: (context: EnumRuleContext) => Violation | undefined,
): Rule {
  return (service, sourcePath, options) =>
    allEnums(service, sourcePath, options)
      .map((context) => rule(context))
      .filter((v): v is Violation => !!v);
}
export const allEnums: ContextIterator<EnumRuleContext> = (
  service,
  sourcePath,
  options,
) => service.enums.map((e) => ({ enum: e, service, sourcePath, options }));

export interface EnumValueRuleContext extends EnumRuleContext {
  value: Enum['values'][number];
}
export function enumValueRule(
  rule: (context: EnumValueRuleContext) => Violation | undefined,
): Rule {
  return (service, sourcePath, options) =>
    allEnumValues(service, sourcePath, options)
      .map((context) => rule(context))
      .filter((v): v is Violation => !!v);
}
export const allEnumValues: ContextIterator<EnumValueRuleContext> = (
  service,
  sourcePath,
  options,
) =>
  service.enums
    .flatMap((e) => e.values.map<[Enum['values'][number], Enum]>((v) => [v, e]))
    .map(([v, e]) => ({ value: v, enum: e, service, sourcePath, options }));

export interface UnionRuleContext extends ServiceRuleContext {
  union: Union;
}
export function unionRule(
  rule: (context: UnionRuleContext) => Violation | undefined,
): Rule {
  return (service, sourcePath, options) =>
    allUnions(service, sourcePath, options)
      .map((context) => rule(context))
      .filter((v): v is Violation => !!v);
}
export const allUnions: ContextIterator<UnionRuleContext> = (
  service,
  sourcePath,
  options,
) => service.unions.map((union) => ({ union, service, sourcePath, options }));

export function combineRules(...rules: Rule[]): Rule {
  return (service, sourcePath, options) =>
    rules.flatMap((rule) => rule(service, sourcePath, options));
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
        .flatMap((i) => i.protocols.http)
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
