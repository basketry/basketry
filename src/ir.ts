export type ApiKeySchemeInValue = 'header' | 'query' | 'cookie';

export type HttpArrayFormat = 'csv' | 'ssv' | 'tsv' | 'pipes' | 'multi';

export type HttpLocation = 'header' | 'query' | 'path' | 'formData' | 'body';

export type HttpVerb =
  | 'get'
  | 'post'
  | 'put'
  | 'patch'
  | 'delete'
  | 'head'
  | 'options'
  | 'trace';

export type Primitive =
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

export type ApiKeyScheme = {
  kind: 'ApiKeyScheme';
  type: ApiKeySchemeType;
  deprecated?: TrueLiteral;
  name: StringLiteral;
  description?: StringLiteral[];
  parameter: StringLiteral;
  in: ApiKeySchemeIn;
  loc?: string;
  meta?: MetaValue[];
};

export type ApiKeySchemeIn = {
  value: ApiKeySchemeInValue;
  loc?: string;
};

export type ApiKeySchemeType = {
  value: 'apiKey';
  loc?: string;
};

export type ArrayMaxItemsRule = {
  kind: 'ValidationRule';
  id: 'ArrayMaxItems';
  max: NonNegativeNumberLiteral;
  loc?: string;
};

export type ArrayMinItemsRule = {
  kind: 'ValidationRule';
  id: 'ArrayMinItems';
  min: NonNegativeNumberLiteral;
  loc?: string;
};

export type ArrayUniqueItemsRule = {
  kind: 'ValidationRule';
  id: 'ArrayUniqueItems';
  required: boolean;
  loc?: string;
};

export type BasicScheme = {
  kind: 'BasicScheme';
  type: BasicSchemeType;
  deprecated?: TrueLiteral;
  name: StringLiteral;
  description?: StringLiteral;
  loc?: string;
  meta?: MetaValue[];
};

export type BasicSchemeType = {
  value: 'basic';
  loc?: string;
};

/**
 * A boolean literal
 */
export type BooleanLiteral = {
  kind: 'BooleanLiteral';
  value: boolean;
  loc?: string;
};

/**
 * TODO: don't allow arrays, enums, or other unions in complex unions
 */
export type ComplexUnion = {
  kind: 'ComplexUnion';
  name: StringLiteral;
  members: ComplexValue[];
  loc?: string;
  meta?: MetaValue[];
};

export type ComplexValue = {
  kind: 'ComplexValue';

  /**
   * The name of a type, enum, or union defined in this Service.
   */
  typeName: StringLiteral;
  isArray?: TrueLiteral;
  rules: ValidationRule[];
};

export type ConstantRule = {
  kind: 'ValidationRule';
  id: 'Constant';
  value: ConstantRuleValue;
};

/**
 * TODO: don't allow arrays, enums, or other unions in discriminated unions
 */
export type DiscriminatedUnion = {
  kind: 'DiscriminatedUnion';
  name: StringLiteral;
  discriminator: StringLiteral;
  members: ComplexValue[];
  loc?: string;
  meta?: MetaValue[];
};

export type Enum = {
  kind: 'Enum';
  name: StringLiteral;
  description?: StringLiteral[];
  members: EnumMember[];
  deprecated?: TrueLiteral;
  loc?: string;
  meta?: MetaValue[];
};

export type EnumMember = {
  kind: 'EnumMember';
  content: StringLiteral;
  description?: StringLiteral[];
  deprecated?: TrueLiteral;
  loc?: string;
  meta?: MetaValue[];
};

export type HttpArrayFormatLiteral = {
  kind: 'HttpArrayFormatLiteral';
  value: HttpArrayFormat;
  loc?: string;
};

export type HttpLocationLiteral = {
  kind: 'HttpLocationLiteral';
  value: HttpLocation;
  loc?: string;
};

export type HttpMethod = {
  kind: 'HttpMethod';
  name: StringLiteral;
  verb: HttpVerbLiteral;
  parameters: HttpParameter[];
  successCode: HttpStatusCodeLiteral;
  requestMediaTypes: StringLiteral[];
  responseMediaTypes: StringLiteral[];
  loc?: string;
};

export type HttpParameter = {
  kind: 'HttpParameter';
  name: StringLiteral;
  location: HttpLocationLiteral;
  arrayFormat?: HttpArrayFormatLiteral;
  loc?: string;
};

export type HttpRoute = {
  kind: 'HttpRoute';
  pattern: StringLiteral;
  methods: HttpMethod[];
  loc?: string;
};

export type HttpStatusCodeLiteral = {
  kind: 'HttpStatusCodeLiteral';
  value: number;
  loc?: string;
};

export type HttpVerbLiteral = {
  kind: 'HttpVerbLiteral';
  value: HttpVerb;
  loc?: string;
};

/**
 * An integer literal
 */
export type IntegerLiteral = {
  kind: 'IntegerLiteral';
  value: number;
  loc?: string;
};

export type Interface = {
  kind: 'Interface';
  name: StringLiteral;
  description?: StringLiteral[];
  methods: Method[];
  protocols?: Protocols;
  deprecated?: TrueLiteral;
  meta?: MetaValue[];
};

export type MetaValue = {
  kind: 'MetaValue';
  key: StringLiteral;
  value: UntypedLiteral;
};

export type Method = {
  kind: 'Method';
  name: StringLiteral;
  security: SecurityOption[];
  description?: StringLiteral[];
  parameters: Parameter[];
  returns?: ReturnValue;
  deprecated?: TrueLiteral;
  loc?: string;
  meta?: MetaValue[];
};

/**
 * A string literal
 */
export type NonEmptyStringLiteral = {
  kind: 'NonEmptyStringLiteral';
  value: string;

  /**
   * The location of this in the doc.
   */
  loc?: string;
};

export type NonNegativeIntegerLiteral = {
  kind: 'NonNegativeIntegerLiteral';
  value: number;
  loc?: string;
};

export type NonNegativeNumberLiteral = {
  kind: 'NonNegativeNumberLiteral';
  value: number;
  loc?: string;
};

export type NumberGteRule = {
  kind: 'ValidationRule';
  id: 'NumberGTE';
  value: NumberLiteral;
  loc?: string;
};

export type NumberGtRule = {
  kind: 'ValidationRule';
  id: 'NumberGT';
  value: NumberLiteral;
  loc?: string;
};

/**
 * A number literal
 */
export type NumberLiteral = {
  kind: 'NumberLiteral';
  value: number;
  loc?: string;
};

export type NumberLteRule = {
  kind: 'ValidationRule';
  id: 'NumberLTE';
  value: NumberLiteral;
  loc?: string;
};

export type NumberLtRule = {
  kind: 'ValidationRule';
  id: 'NumberLT';
  value: NumberLiteral;
  loc?: string;
};

export type NumberMultipleOfRule = {
  kind: 'ValidationRule';
  id: 'NumberMultipleOf';
  value: NonNegativeNumberLiteral;
  loc?: string;
};

export type OAuth2AuthorizationCodeFlow = {
  kind: 'OAuth2AuthorizationCodeFlow';
  type: OAuth2AuthorizationCodeFlowType;
  deprecated?: TrueLiteral;
  authorizationUrl: StringLiteral;
  tokenUrl: StringLiteral;
  refreshUrl?: StringLiteral;
  scopes: OAuth2Scope[];
  loc?: string;
  meta?: MetaValue[];
};

export type OAuth2AuthorizationCodeFlowType = {
  value: 'authorizationCode';
  loc?: string;
};

export type OAuth2ClientCredentialsFlow = {
  kind: 'OAuth2ClientCredentialsFlow';
  type: OAuth2ClientCredentialsFlowType;
  deprecated?: TrueLiteral;
  tokenUrl: StringLiteral;
  refreshUrl?: StringLiteral;
  scopes: OAuth2Scope[];
  loc?: string;
  meta?: MetaValue[];
};

export type OAuth2ClientCredentialsFlowType = {
  value: 'clientCredentials';
  loc?: string;
};

export type OAuth2ImplicitFlow = {
  kind: 'OAuth2ImplicitFlow';
  type: OAuth2ImplicitFlowType;
  deprecated?: TrueLiteral;
  authorizationUrl: StringLiteral;
  refreshUrl?: StringLiteral;
  scopes: OAuth2Scope[];
  loc?: string;
  meta?: MetaValue[];
};

export type OAuth2ImplicitFlowType = {
  value: 'implicit';
  loc?: string;
};

export type OAuth2PasswordFlow = {
  kind: 'OAuth2PasswordFlow';
  type: OAuth2PasswordFlowType;
  deprecated?: TrueLiteral;
  tokenUrl: StringLiteral;
  refreshUrl?: StringLiteral;
  scopes: OAuth2Scope[];
  loc?: string;
  meta?: MetaValue[];
};

export type OAuth2PasswordFlowType = {
  value: 'password';
  loc?: string;
};

export type OAuth2Scheme = {
  kind: 'OAuth2Scheme';
  type: OAuth2SchemeType;
  deprecated?: TrueLiteral;
  name: StringLiteral;
  description?: StringLiteral[];
  flows: OAuth2Flow[];
  loc?: string;
  meta?: MetaValue[];
};

export type OAuth2SchemeType = {
  value: 'oauth2';
  loc?: string;
};

export type OAuth2Scope = {
  kind: 'OAuth2Scope';
  name: StringLiteral;
  description: StringLiteral[];
  deprecated?: TrueLiteral;
  loc?: string;
  meta?: MetaValue[];
};

export type ObjectAdditionalPropertiesRule = {
  kind: 'ObjectValidationRule';
  id: 'ObjectAdditionalProperties';
  forbidden: TrueLiteral;
  loc?: string;
};

export type ObjectMaxPropertiesRule = {
  kind: 'ObjectValidationRule';
  id: 'ObjectMaxProperties';
  max: NonNegativeIntegerLiteral;
  loc?: string;
};

export type ObjectMinPropertiesRule = {
  kind: 'ObjectValidationRule';
  id: 'ObjectMinProperties';
  min: NonNegativeIntegerLiteral;
  loc?: string;
};

export type Parameter = {
  kind: 'Parameter';
  name: StringLiteral;
  description?: StringLiteral[];
  value: MemberValue;
  deprecated?: TrueLiteral;
  loc?: string;
  meta?: MetaValue[];
};

export type PrimitiveLiteral = {
  kind: 'PrimitiveLiteral';
  value: Primitive;
  loc?: string;
};

/**
 * TODO: don't allow arrays in primitive unions
 */
export type PrimitiveUnion = {
  kind: 'PrimitiveUnion';
  name: StringLiteral;
  members: PrimitiveValue[];
  loc?: string;
  meta?: MetaValue[];
};

export type PrimitiveValue = {
  kind: 'PrimitiveValue';
  typeName: PrimitiveLiteral;
  isArray?: TrueLiteral;
  constant?: PrimitiveValueConstant;

  /**
   * TODO: add null literal
   */
  default?: PrimitiveValueDefault;
  rules: ValidationRule[];
};

export type Property = {
  kind: 'Property';
  name: StringLiteral;
  description?: StringLiteral[];
  value: MemberValue;
  deprecated?: TrueLiteral;
  loc?: string;
  meta?: MetaValue[];
};

export type Protocols = {
  kind: 'InterfaceProtocols';
  http?: HttpRoute[];
};

export type RequiredRule = {
  kind: 'ValidationRule';
  id: 'Required';
};

export type ReturnValue = {
  kind: 'ReturnValue';
  loc?: string;
  meta?: MetaValue[];
  value: MemberValue;
};

export type SecurityOption = {
  kind: 'SecurityOption';
  schemes: SecurityScheme[];
  loc?: string;
};

/**
 * Intermediate Representation (IR) of a service
 */
export type Service = {
  kind: 'Service';
  basketry: '0.2';
  title: StringLiteral;
  majorVersion: IntegerLiteral;

  /**
   * The path to the original source document for this service. All locations in the Intermediate Representation refer to ranges within this source document.
   */
  sourcePath: string;
  interfaces: Interface[];
  types: Type[];
  enums: Enum[];
  unions: Union[];
  loc?: string;
  meta?: MetaValue[];
};

export type StringEnumRule = {
  kind: 'ValidationRule';
  id: 'StringEnum';
  values: StringLiteral[];
  loc?: string;
};

export type StringFormatRule = {
  kind: 'ValidationRule';
  id: 'StringFormat';
  format: NonEmptyStringLiteral;
  loc?: string;
};

/**
 * A string literal
 */
export type StringLiteral = {
  kind: 'StringLiteral';
  value: string;

  /**
   * The location of this in the doc.
   */
  loc?: string;
};

export type StringMaxLengthRule = {
  kind: 'ValidationRule';
  id: 'StringMaxLength';
  length: NonNegativeIntegerLiteral;
  loc?: string;
};

export type StringMinLengthRule = {
  kind: 'ValidationRule';
  id: 'StringMinLength';
  length: NonNegativeIntegerLiteral;
  loc?: string;
};

export type StringPatternRule = {
  kind: 'ValidationRule';
  id: 'StringPattern';
  pattern: NonEmptyStringLiteral;
  loc?: string;
};

/**
 * A boolean literal whose value is always true
 */
export type TrueLiteral = {
  kind: 'TrueLiteral';
  value: true;
  loc?: string;
};

export type Type = {
  kind: 'Type';
  name: StringLiteral;
  description?: StringLiteral[];
  deprecated?: TrueLiteral;
  properties: Property[];
  rules: ObjectValidationRule[];
  loc?: string;
  meta?: MetaValue[];
};

export type UntypedLiteral = {
  kind: 'UntypedLiteral';
  value: any;
  loc?: string;
};

export type ConstantRuleValue = StringLiteral | NumberLiteral | BooleanLiteral;

export type MemberValue = PrimitiveValue | ComplexValue;

export function isPrimitiveValue(obj: MemberValue): obj is PrimitiveValue {
  return obj.kind === 'PrimitiveValue';
}

export function isComplexValue(obj: MemberValue): obj is ComplexValue {
  return obj.kind === 'ComplexValue';
}

export type OAuth2Flow =
  | OAuth2ImplicitFlow
  | OAuth2PasswordFlow
  | OAuth2ClientCredentialsFlow
  | OAuth2AuthorizationCodeFlow;

export function isOAuth2ImplicitFlow(
  obj: OAuth2Flow,
): obj is OAuth2ImplicitFlow {
  return obj.kind === 'OAuth2ImplicitFlow';
}

export function isOAuth2PasswordFlow(
  obj: OAuth2Flow,
): obj is OAuth2PasswordFlow {
  return obj.kind === 'OAuth2PasswordFlow';
}

export function isOAuth2ClientCredentialsFlow(
  obj: OAuth2Flow,
): obj is OAuth2ClientCredentialsFlow {
  return obj.kind === 'OAuth2ClientCredentialsFlow';
}

export function isOAuth2AuthorizationCodeFlow(
  obj: OAuth2Flow,
): obj is OAuth2AuthorizationCodeFlow {
  return obj.kind === 'OAuth2AuthorizationCodeFlow';
}

export type ObjectValidationRule =
  | ObjectMinPropertiesRule
  | ObjectMaxPropertiesRule
  | ObjectAdditionalPropertiesRule;

export function isObjectMinPropertiesRule(
  obj: ObjectValidationRule,
): obj is ObjectMinPropertiesRule {
  return obj.id === 'ObjectMinProperties';
}

export function isObjectMaxPropertiesRule(
  obj: ObjectValidationRule,
): obj is ObjectMaxPropertiesRule {
  return obj.id === 'ObjectMaxProperties';
}

export function isObjectAdditionalPropertiesRule(
  obj: ObjectValidationRule,
): obj is ObjectAdditionalPropertiesRule {
  return obj.id === 'ObjectAdditionalProperties';
}

export type PrimitiveValueConstant =
  | StringLiteral
  | NumberLiteral
  | BooleanLiteral;

export type PrimitiveValueDefault =
  | StringLiteral
  | NumberLiteral
  | BooleanLiteral;

export type SecurityScheme = BasicScheme | ApiKeyScheme | OAuth2Scheme;

export function isBasicScheme(obj: SecurityScheme): obj is BasicScheme {
  return obj.kind === 'BasicScheme';
}

export function isApiKeyScheme(obj: SecurityScheme): obj is ApiKeyScheme {
  return obj.kind === 'ApiKeyScheme';
}

export function isOAuth2Scheme(obj: SecurityScheme): obj is OAuth2Scheme {
  return obj.kind === 'OAuth2Scheme';
}

export type Union = PrimitiveUnion | ComplexUnion | DiscriminatedUnion;

export function isPrimitiveUnion(obj: Union): obj is PrimitiveUnion {
  return obj.kind === 'PrimitiveUnion';
}

export function isComplexUnion(obj: Union): obj is ComplexUnion {
  return obj.kind === 'ComplexUnion';
}

export function isDiscriminatedUnion(obj: Union): obj is DiscriminatedUnion {
  return obj.kind === 'DiscriminatedUnion';
}

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

export function isRequiredRule(obj: ValidationRule): obj is RequiredRule {
  return obj.id === 'Required';
}

export function isConstantRule(obj: ValidationRule): obj is ConstantRule {
  return obj.id === 'Constant';
}

export function isStringMaxLengthRule(
  obj: ValidationRule,
): obj is StringMaxLengthRule {
  return obj.id === 'StringMaxLength';
}

export function isStringMinLengthRule(
  obj: ValidationRule,
): obj is StringMinLengthRule {
  return obj.id === 'StringMinLength';
}

export function isStringPatternRule(
  obj: ValidationRule,
): obj is StringPatternRule {
  return obj.id === 'StringPattern';
}

export function isStringFormatRule(
  obj: ValidationRule,
): obj is StringFormatRule {
  return obj.id === 'StringFormat';
}

export function isStringEnumRule(obj: ValidationRule): obj is StringEnumRule {
  return obj.id === 'StringEnum';
}

export function isNumberMultipleOfRule(
  obj: ValidationRule,
): obj is NumberMultipleOfRule {
  return obj.id === 'NumberMultipleOf';
}

export function isNumberGtRule(obj: ValidationRule): obj is NumberGtRule {
  return obj.id === 'NumberGT';
}

export function isNumberGteRule(obj: ValidationRule): obj is NumberGteRule {
  return obj.id === 'NumberGTE';
}

export function isNumberLtRule(obj: ValidationRule): obj is NumberLtRule {
  return obj.id === 'NumberLT';
}

export function isNumberLteRule(obj: ValidationRule): obj is NumberLteRule {
  return obj.id === 'NumberLTE';
}

export function isArrayMaxItemsRule(
  obj: ValidationRule,
): obj is ArrayMaxItemsRule {
  return obj.id === 'ArrayMaxItems';
}

export function isArrayMinItemsRule(
  obj: ValidationRule,
): obj is ArrayMinItemsRule {
  return obj.id === 'ArrayMinItems';
}

export function isArrayUniqueItemsRule(
  obj: ValidationRule,
): obj is ArrayUniqueItemsRule {
  return obj.id === 'ArrayUniqueItems';
}
