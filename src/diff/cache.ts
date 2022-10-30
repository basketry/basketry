import { snake } from 'case';
import { Enum, Scalar, Property } from '..';
import {
  EnumValue,
  Interface,
  Method,
  Parameter,
  Service,
  Type,
} from '../types';

const interfaceCache = new WeakMap<Service, Map<string, Interface | null>>();
export function getInterface(
  service: Service,
  name: string,
): Interface | undefined {
  const n = snake(name);
  if (!interfaceCache.has(service)) interfaceCache.set(service, new Map());
  const hit = interfaceCache.get(service)!.get(n);

  if (hit === null) return undefined;

  for (const int of service.interfaces) {
    if (n === snake(int.name)) {
      interfaceCache.get(service)!.set(n, int);
      return int;
    }
  }

  interfaceCache.get(service)!.set(n, null);
  return undefined;
}

const methodCache = new WeakMap<Service, Map<string, Method | null>>();
export function getMethod(service: Service, name: string): Method | undefined {
  const n = snake(name);
  if (!methodCache.has(service)) methodCache.set(service, new Map());
  const hit = methodCache.get(service)!.get(n);

  if (hit === null) return undefined;

  for (const int of service.interfaces) {
    for (const method of int.methods) {
      if (n === snake(method.name.value)) {
        methodCache.get(service)!.set(n, method);
        return method;
      }
    }
  }

  methodCache.get(service)!.set(n, null);
  return undefined;
}

const parameterCache = new WeakMap<Method, Map<string, Parameter | null>>();
export function getParameter(
  method: Method,
  name: string,
): Parameter | undefined {
  const n = snake(name);
  if (!parameterCache.has(method)) parameterCache.set(method, new Map());
  const hit = parameterCache.get(method)!.get(n);

  if (hit === null) return undefined;

  for (const param of method.parameters) {
    if (n === snake(param.name.value)) {
      parameterCache.get(method)!.set(n, param);
      return param;
    }
  }

  parameterCache.get(method)!.set(n, null);
  return undefined;
}

const typeCache = new WeakMap<Service, Map<string, Type | null>>();
export function getType(service: Service, name: string): Type | undefined {
  const n = snake(name);
  if (!typeCache.has(service)) typeCache.set(service, new Map());
  const hit = typeCache.get(service)!.get(n);

  if (hit === null) return undefined;

  for (const type of service.types) {
    if (n === snake(type.name.value)) {
      typeCache.get(service)!.set(n, type);
      return type;
    }
  }

  typeCache.get(service)!.set(n, null);
  return undefined;
}

const propertyCache = new WeakMap<Type, Map<string, Property | null>>();
export function getProperty(type: Type, name: string): Property | undefined {
  const n = snake(name);
  if (!propertyCache.has(type)) propertyCache.set(type, new Map());
  const hit = propertyCache.get(type)!.get(n);

  if (hit === null) return undefined;

  for (const prop of type.properties) {
    if (n === snake(prop.name.value)) {
      propertyCache.get(type)!.set(n, prop);
      return prop;
    }
  }

  propertyCache.get(type)!.set(n, null);
  return undefined;
}

const enumCache = new WeakMap<Service, Map<string, Enum | null>>();
export function getEnum(service: Service, name: string): Enum | undefined {
  const n = snake(name);
  if (!enumCache.has(service)) enumCache.set(service, new Map());
  const hit = enumCache.get(service)!.get(n);

  if (hit === null) return undefined;

  for (const e of service.enums) {
    if (n === snake(e.name.value)) {
      enumCache.get(service)!.set(n, e);
      return e;
    }
  }

  enumCache.get(service)!.set(n, null);
  return undefined;
}

const enumValueCache = new WeakMap<Enum, Map<string, EnumValue | null>>();
export function getEnumValue(e: Enum, value: string): EnumValue | undefined {
  const key = snake(value);
  if (!enumValueCache.has(e)) enumValueCache.set(e, new Map());
  const hit = enumValueCache.get(e)!.get(key);

  if (hit === null) return undefined;

  for (const v of e.values) {
    if (key === snake(v.content.value)) {
      enumValueCache.get(e)!.set(key, v);
      return v;
    }
  }

  enumValueCache.get(e)!.set(key, null);
  return undefined;
}
