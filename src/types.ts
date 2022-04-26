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

export type Position = {
  line: number;
  column: number;
  offset: number;
};

export type Range = {
  start: Position;
  end: Position;
};

export type Literal<T extends string | number | boolean | null> = {
  value: T;
  loc?: string;
};

/**
 * Intermediate Representation (IR) of a service
 */
export type Service = {
  basketry: '1';
  title: Literal<string>;
  majorVersion: Literal<number>;
  interfaces: Interface[];
  types: Type[];
  enums: Enum[];
  loc: string;
};

export type Type = {
  name: Literal<string>;
  description?: Literal<string> | Literal<string>[];
  properties: Property[];
  rules: ObjectValidationRule[];
  loc: string;
};

export type Enum = {
  name: Literal<string>;
  values: Literal<string>[];
  loc: string;
};

export type Property = {
  name: Literal<string>;
  description?: Literal<string> | Literal<string>[];
  typeName: Literal<string>;
  isUnknown: boolean;
  isArray: boolean;
  isLocal: boolean;
  rules: ValidationRule[];
  loc: string;
};

export type Interface = {
  name: string;
  description?: string;
  methods: Method[];
  protocols: {
    http: PathSpec[];
  };
};

export type PathSpec = {
  path: Literal<string>;
  methods: MethodSpec[];
  loc: string;
};

export type MethodSpec = {
  name: Literal<string>;
  verb: Literal<
    'get' | 'post' | 'put' | 'patch' | 'delete' | 'head' | 'options' | 'trace'
  >;
  parameters: ParameterSpec[];
  successCode: Literal<number>;
  loc: string;
};

export type ParameterSpec = {
  name: Literal<string>;
  in: Literal<'header' | 'query' | 'path' | 'formData' | 'body'>;
  array?: Literal<'csv' | 'ssv' | 'tsv' | 'pipes' | 'multi'>;
  loc: string;
};

export type Method = {
  name: Literal<string>;
  security: SecurityOption[];
  description?: Literal<string> | Literal<string>[];
  parameters: Parameter[];
  returnType: ReturnType | undefined;
  loc: string;
};

export type SecurityOption = SecurityScheme[];

export type SecurityScheme = BasicScheme | ApiKeyScheme | OAuth2Scheme;

export type BasicScheme = {
  type: Literal<'basic'>;
  name: Literal<string>;
  description?: Literal<string>;
  loc: string;
};

export type ApiKeyScheme = {
  type: Literal<'apiKey'>;
  name: Literal<string>;
  description?: Literal<string>;
  parameter: Literal<string>;
  in: Literal<'header' | 'query' | 'cookie'>;
  loc: string;
};

export type OAuth2Scheme = {
  type: Literal<'oauth2'>;
  name: Literal<string>;
  description?: Literal<string>;
  flows: OAuth2Flow[];
  loc: string;
};

export type OAuth2Flow =
  | OAuth2ImplicitFlow
  | OAuth2PasswordFlow
  | OAuth2ClientCredentialsFlow
  | OAuth2AuthorizationCodeFlow;

export type OAuth2ImplicitFlow = {
  type: Literal<'implicit'>;
  authorizationUrl: Literal<string>;
  refreshUrl?: Literal<string>;
  scopes: OAuth2Scope[];
  loc: string;
};

export type OAuth2PasswordFlow = {
  type: Literal<'password'>;
  tokenUrl: Literal<string>;
  refreshUrl?: Literal<string>;
  scopes: OAuth2Scope[];
  loc: string;
};

export type OAuth2ClientCredentialsFlow = {
  type: Literal<'clientCredentials'>;
  tokenUrl: Literal<string>;
  refreshUrl?: Literal<string>;
  scopes: OAuth2Scope[];
  loc: string;
};

export type OAuth2AuthorizationCodeFlow = {
  type: Literal<'authorizationCode'>;
  authorizationUrl: Literal<string>;
  tokenUrl: Literal<string>;
  refreshUrl?: Literal<string>;
  scopes: OAuth2Scope[];
  loc: string;
};

export type OAuth2Scope = {
  name: Literal<string>;
  description: Literal<string>;
  loc: string;
};

export type Parameter = {
  name: Literal<string>;
  description?: Literal<string> | Literal<string>[];
  typeName: Literal<string>;
  isUnknown: boolean;
  isArray: boolean;
  isLocal: boolean;
  rules: ValidationRule[];
  loc: string;
};

export type ReturnType = {
  typeName: Literal<string>;
  isUnknown: boolean;
  isArray: boolean;
  isLocal: boolean;
  rules: ValidationRule[];
  loc: string;
};

export type RequiredRule = {
  id: 'required';
};

export type StringMaxLengthRule = {
  id: 'string-max-length';
  length: Literal<number>;
  loc: string;
};

export type StringMinLengthRule = {
  id: 'string-min-length';
  length: Literal<number>;
  loc: string;
};

export type StringPatternRule = {
  id: 'string-pattern';
  pattern: Literal<string>;
  loc: string;
};

export type StringFormatRule = {
  id: 'string-format';
  format: Literal<string>;
  loc: string;
};

export type StringEnumRule = {
  id: 'string-enum';
  values: Literal<string>[];
  loc: string;
};

export type NumberMultipleOfRule = {
  id: 'number-multiple-of';
  value: Literal<number>;
  loc: string;
};

export type NumberGtRule = {
  id: 'number-gt';
  value: Literal<number>;
  loc: string;
};

export type NumberGteRule = {
  id: 'number-gte';
  value: Literal<number>;
  loc: string;
};

export type NumberLtRule = {
  id: 'number-lt';
  value: Literal<number>;
  loc: string;
};

export type NumberLteRule = {
  id: 'number-lte';
  value: Literal<number>;
  loc: string;
};

export type ArrayMaxItemsRule = {
  id: 'array-max-items';
  max: Literal<number>;
  loc: string;
};

export type ArrayMinItemsRule = {
  id: 'array-min-items';
  min: Literal<number>;
  loc: string;
};

export type ArrayUniqueItemsRule = {
  id: 'array-unique-items';
  required: boolean;
  loc: string;
};

export type ObjectMinPropertiesRule = {
  id: 'object-min-properties';
  min: Literal<number>;
  loc: string;
};

export type ObjectMaxPropertiesRule = {
  id: 'object-max-properties';
  max: Literal<number>;
  loc: string;
};

export type ObjectAdditionalPropertiesRule = {
  id: 'object-additional-properties';
  forbidden: true;
  loc: string;
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
