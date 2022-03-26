export type Config = {
  parser: string;
  generators: (string | GeneratorOptions)[];
  source?: string;
  output?: string;
};

export type GeneratorOptions = {
  generator: string;
};

export type Parser = (input: string) => Service;
export type Generator = (service: Service) => File[];

/** @deprecated */
export interface ServiceFactory {
  parse(): Service;
}

/** @deprecated */
export interface FileFactory {
  get target(): string;
  build(service: Service): File[];
}

export type File = {
  path: string[];
  contents: string;
};

/**
 * Intermediate Representation (IR) of a service
 */
export type Service = {
  title: string;
  majorVersion: number;
  interfaces: Interface[];
  types: Type[];
  enums: Enum[];
};

export type Type = {
  name: string;
  description?: string | string[];
  properties: Property[];
  rules: ObjectValidationRule[];
};

export type Enum = {
  name: string;
  values: string[];
};

export type Property = {
  name: string;
  description?: string | string[];
  typeName: string;
  isUnknown: boolean;
  isArray: boolean;
  isLocal: boolean;
  rules: ValidationRule[];
};

export type Interface = {
  name: string;
  description?: string | string[];
  methods: Method[];
  protocols: {
    http: PathSpec[];
  };
};

export type PathSpec = {
  path: string;
  methods: MethodSpec[];
};

export type MethodSpec = {
  name: string;
  verb: string;
  parameters: ParameterSpec[];
  successCode: number;
};

export type ParameterSpec = {
  name: string;
  in: 'header' | 'query' | 'path' | 'formData' | 'body';
  array?: 'csv' | 'ssv' | 'tsv' | 'pipes' | 'multi';
};

export type Method = {
  name: string;
  description?: string | string[];
  parameters: Parameter[];
  returnType: ReturnType | undefined;
};

export type Parameter = {
  name: string;
  description?: string | string[];
  typeName: string;
  isUnknown: boolean;
  isArray: boolean;
  isLocal: boolean;
  rules: ValidationRule[];
};

export type ReturnType = {
  typeName: string;
  isUnknown: boolean;
  isArray: boolean;
  isLocal: boolean;
  rules: ValidationRule[];
};

export type RequiredRule = {
  id: 'required';
};

export type StringRule = {
  id: 'string';
};

export type StringMaxLengthRule = {
  id: 'string-max-length';
  length: number;
};

export type StringMinLengthRule = {
  id: 'string-min-length';
  length: number;
};

export type StringPatternRule = {
  id: 'string-pattern';
  pattern: string;
};

export type StringFormatRule = {
  id: 'string-format';
  format: string;
};

export type StringEnumRule = {
  id: 'string-enum';
  values: string[];
};

export type NumberMultipleOfRule = {
  id: 'number-multiple-of';
  value: number;
};

export type NumberGtRule = {
  id: 'number-gt';
  value: number;
};

export type NumberGteRule = {
  id: 'number-gte';
  value: number;
};

export type NumberLtRule = {
  id: 'number-lt';
  value: number;
};

export type NumberLteRule = {
  id: 'number-lte';
  value: number;
};

export type ArrayMaxItemsRule = {
  id: 'array-max-items';
  max: number;
};

export type ArrayMinItemsRule = {
  id: 'array-min-items';
  min: number;
};

export type ArrayUniqueItemsRule = {
  id: 'array-unique-items';
  required: boolean;
};

export type ObjectMinPropertiesRule = {
  id: 'object-min-properties';
  min: number;
};

export type ObjectMaxPropertiesRule = {
  id: 'object-max-properties';
  max: number;
};

export type ObjectAdditionalPropertiesRule = {
  id: 'object-additional-properties';
  forbidden: true;
};

export type ValidationRule =
  | RequiredRule
  | StringMaxLengthRule
  | StringMinLengthRule
  | StringPatternRule
  | StringFormatRule
  | StringEnumRule
  | NumberMultipleOfRule
  | NumberGtRule
  | NumberGteRule
  | NumberLtRule
  | NumberLteRule
  | ArrayMaxItemsRule
  | ArrayMinItemsRule
  | ArrayUniqueItemsRule;

export type ObjectValidationRule =
  | ObjectMinPropertiesRule
  | ObjectMaxPropertiesRule
  | ObjectAdditionalPropertiesRule;

export function isRequired(obj: { rules: ValidationRule[] }): boolean {
  return obj.rules.some((r) => r.id === 'required');
}

export function isEnum(obj: { rules: ValidationRule[] }): boolean {
  return obj.rules.some((r) => r.id === 'string-enum');
}
