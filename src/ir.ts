/** @deprecated Use {@link Scalar}. This type will be removed in a future version. */
export type Literal<T extends string | number | boolean | null> = {
  value: T;
  loc?: string;
};

export type Scalar<T extends string | number | boolean | null> = {
  value: T;
  loc?: string;
};

export type Primitive =
  | 'null'
  | 'string'
  | 'number'
  | 'integer'
  | 'long'
  | 'float'
  | 'double'
  | 'boolean'
  | 'date'
  | 'date-time'
  | 'binary'
  | 'untyped';

/**
 * Intermediate Representation (IR) of a service
 */
export type Service = {
  kind: 'Service';
  basketry: '1.1-rc';
  title: Scalar<string>;
  majorVersion: Scalar<number>;
  /** The path to the original source document for this service. All locations in the Intermediate Representation refer to ranges within this source document. */
  sourcePath: string;
  interfaces: Interface[];
  types: Type[];
  enums: Enum[];
  unions: Union[];
  loc?: string;
  meta?: Meta;
};

export type Type = {
  kind: 'Type';
  name: Scalar<string>;
  description?: Scalar<string> | Scalar<string>[];
  deprecated?: Scalar<true>;
  properties: Property[];
  rules: ObjectValidationRule[];
  loc?: string;
  meta?: Meta;
};

export type Enum = {
  kind: 'Enum';
  name: Scalar<string>;
  description?: Scalar<string> | Scalar<string>[];
  deprecated?: Scalar<true>;
  values: EnumValue[];
  loc?: string;
  meta?: Meta;
};

export type EnumValue = {
  kind: 'EnumValue';
  content: Scalar<string>;
  description?: Scalar<string> | Scalar<string>[];
  deprecated?: Scalar<true>;
  loc?: string;
  meta?: Meta;
};

export type Union = {
  kind: 'Union';
  name: Scalar<string>;
  members: TypedValue[];
  loc?: string;
  meta?: Meta;
};

export type PrimitiveValue = {
  typeName: Scalar<Primitive>;
  isArray: boolean;
  isPrimitive: true;
  constant?: Scalar<string | number | boolean>;
  default?: Scalar<string | number | boolean | null>;
  rules: ValidationRule[];
};

export type CustomValue = {
  typeName: Scalar<string>;
  isArray: boolean;
  isPrimitive: false;
  rules: ValidationRule[];
};

export type TypedValue = PrimitiveValue | CustomValue;

export type Property = {
  kind: 'Property';
  name: Scalar<string>;
  description?: Scalar<string> | Scalar<string>[];
  deprecated?: Scalar<true>;
  loc?: string;
  meta?: Meta;
} & TypedValue;

export type Interface = {
  kind: 'Interface';
  name: Scalar<string>;
  description?: Scalar<string> | Scalar<string>[];
  deprecated?: Scalar<true>;
  methods: Method[];
  protocols: {
    http: HttpPath[];
  };
  meta?: Meta;
};

export type HttpPath = {
  kind: 'HttpPath';
  path: Scalar<string>;
  methods: HttpMethod[];
  loc?: string;
  meta?: Meta;
};

export type HttpMethod = {
  kind: 'HttpMethod';
  name: Scalar<string>;
  verb: Scalar<
    'get' | 'post' | 'put' | 'patch' | 'delete' | 'head' | 'options' | 'trace'
  >;
  parameters: HttpParameter[];
  successCode: Scalar<number>;
  requestMediaType?: Scalar<string>;
  responseMediaType?: Scalar<string>;
  loc?: string;
};

export type HttpParameter = {
  kind: 'HttpParameter';
  name: Scalar<string>;
  in: Scalar<'header' | 'query' | 'path' | 'formData' | 'body'>;
  array?: Scalar<'csv' | 'ssv' | 'tsv' | 'pipes' | 'multi'>;
  loc?: string;
};

export type Method = {
  kind: 'Method';
  name: Scalar<string>;
  security: SecurityOption[];
  description?: Scalar<string> | Scalar<string>[];
  deprecated?: Scalar<true>;
  parameters: Parameter[];
  returnType: ReturnType | undefined;
  loc?: string;
  meta?: Meta;
};

export type SecurityOption = SecurityScheme[];

export type SecurityScheme = BasicScheme | ApiKeyScheme | OAuth2Scheme;

export type BasicScheme = {
  kind: 'BasicScheme';
  type: Scalar<'basic'>;
  name: Scalar<string>;
  description?: Scalar<string>;
  deprecated?: Scalar<true>;
  loc?: string;
  meta?: Meta;
};

export type ApiKeyScheme = {
  kind: 'ApiKeyScheme';
  type: Scalar<'apiKey'>;
  name: Scalar<string>;
  description?: Scalar<string>;
  deprecated?: Scalar<true>;
  parameter: Scalar<string>;
  in: Scalar<'header' | 'query' | 'cookie'>;
  loc?: string;
  meta?: Meta;
};

export type OAuth2Scheme = {
  kind: 'OAuth2Scheme';
  type: Scalar<'oauth2'>;
  name: Scalar<string>;
  description?: Scalar<string>;
  deprecated?: Scalar<true>;
  flows: OAuth2Flow[];
  loc?: string;
  meta?: Meta;
};

export type OAuth2Flow =
  | OAuth2ImplicitFlow
  | OAuth2PasswordFlow
  | OAuth2ClientCredentialsFlow
  | OAuth2AuthorizationCodeFlow;

export type OAuth2ImplicitFlow = {
  kind: 'OAuth2ImplicitFlow';
  type: Scalar<'implicit'>;
  deprecated?: Scalar<true>;
  authorizationUrl: Scalar<string>;
  refreshUrl?: Scalar<string>;
  scopes: OAuth2Scope[];
  loc?: string;
  meta?: Meta;
};

export type OAuth2PasswordFlow = {
  kind: 'OAuth2PasswordFlow';
  type: Scalar<'password'>;
  deprecated?: Scalar<true>;
  tokenUrl: Scalar<string>;
  refreshUrl?: Scalar<string>;
  scopes: OAuth2Scope[];
  loc?: string;
  meta?: Meta;
};

export type OAuth2ClientCredentialsFlow = {
  kind: 'OAuth2ClientCredentialsFlow';
  type: Scalar<'clientCredentials'>;
  deprecated?: Scalar<true>;
  tokenUrl: Scalar<string>;
  refreshUrl?: Scalar<string>;
  scopes: OAuth2Scope[];
  loc?: string;
  meta?: Meta;
};

export type OAuth2AuthorizationCodeFlow = {
  kind: 'OAuth2AuthorizationCodeFlow';
  type: Scalar<'authorizationCode'>;
  deprecated?: Scalar<true>;
  authorizationUrl: Scalar<string>;
  tokenUrl: Scalar<string>;
  refreshUrl?: Scalar<string>;
  scopes: OAuth2Scope[];
  loc?: string;
  meta?: Meta;
};

export type OAuth2Scope = {
  kind: 'OAuth2Scope';
  name: Scalar<string>;
  description: Scalar<string>;
  deprecated?: Scalar<true>;
  loc?: string;
  meta?: Meta;
};

export type Parameter = {
  kind: 'Parameter';
  name: Scalar<string>;
  description?: Scalar<string> | Scalar<string>[];
  deprecated?: Scalar<true>;
  loc?: string;
  meta?: Meta;
} & TypedValue;

export type ReturnType = {
  kind: 'ReturnType';
  loc?: string;
  meta?: Meta;
} & TypedValue;

export type Meta = MetaValue[];

export type MetaValue = {
  key: Scalar<string>;
  value: { value: any; loc?: string };
};

export type RequiredRule = {
  kind: 'ValidationRule';
  id: 'required';
};

export type ConstantRule = {
  kind: 'ValidationRule';
  id: 'constant';
  value: Scalar<string | number | boolean>;
};

export type StringMaxLengthRule = {
  kind: 'ValidationRule';
  id: 'string-max-length';
  length: Scalar<number>;
  loc?: string;
};

export type StringMinLengthRule = {
  kind: 'ValidationRule';
  id: 'string-min-length';
  length: Scalar<number>;
  loc?: string;
};

export type StringPatternRule = {
  kind: 'ValidationRule';
  id: 'string-pattern';
  pattern: Scalar<string>;
  loc?: string;
};

export type StringFormatRule = {
  kind: 'ValidationRule';
  id: 'string-format';
  format: Scalar<string>;
  loc?: string;
};

export type StringEnumRule = {
  kind: 'ValidationRule';
  id: 'string-enum';
  values: Scalar<string>[];
  loc?: string;
};

export type NumberMultipleOfRule = {
  kind: 'ValidationRule';
  id: 'number-multiple-of';
  value: Scalar<number>;
  loc?: string;
};

export type NumberGtRule = {
  kind: 'ValidationRule';
  id: 'number-gt';
  value: Scalar<number>;
  loc?: string;
};

export type NumberGteRule = {
  kind: 'ValidationRule';
  id: 'number-gte';
  value: Scalar<number>;
  loc?: string;
};

export type NumberLtRule = {
  kind: 'ValidationRule';
  id: 'number-lt';
  value: Scalar<number>;
  loc?: string;
};

export type NumberLteRule = {
  kind: 'ValidationRule';
  id: 'number-lte';
  value: Scalar<number>;
  loc?: string;
};

export type ArrayMaxItemsRule = {
  kind: 'ValidationRule';
  id: 'array-max-items';
  max: Scalar<number>;
  loc?: string;
};

export type ArrayMinItemsRule = {
  kind: 'ValidationRule';
  id: 'array-min-items';
  min: Scalar<number>;
  loc?: string;
};

export type ArrayUniqueItemsRule = {
  kind: 'ValidationRule';
  id: 'array-unique-items';
  required: boolean;
  loc?: string;
};

export type ObjectMinPropertiesRule = {
  kind: 'ObjectValidationRule';
  id: 'object-min-properties';
  min: Scalar<number>;
  loc?: string;
};

export type ObjectMaxPropertiesRule = {
  kind: 'ObjectValidationRule';
  id: 'object-max-properties';
  max: Scalar<number>;
  loc?: string;
};

export type ObjectAdditionalPropertiesRule = {
  kind: 'ObjectValidationRule';
  id: 'object-additional-properties';
  forbidden: true;
  loc?: string;
};

export type ValidationRule =
  | RequiredRule
  | ConstantRule
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
