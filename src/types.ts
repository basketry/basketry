export type Config = LocalConfig | GlobalConfig;

export type LocalConfig = {
  /** CommonJS module that contains the Parser function */
  parser: string;
  /** Array of CommonJS modules that contain Rule functions */
  rules?: string[];
  /** Array of CommonJS modules that contain Generator functions */
  generators: (string | GeneratorOptions)[];
  /** The source Service Definition used to generate service code */
  source?: string;
  /** The folder in which to output all generated files. */
  output?: string;
  /** Common options passed only to all generators. These common options will be overridden by generator-specific options. */
  options?: any;
};

export type GlobalConfig = {
  configs: string[];
};

export type Options = {
  /** CommonJS module that contains the Parser function */
  parser: string;
  /** Array of CommonJS modules that contain Rule functions */
  rules: (string | RuleOptions)[];
  /** Array of CommonJS modules that contain Generator functions */
  generators: (string | GeneratorOptions)[];
  sourceName: string;
  sourceContent: string;
};

export type GeneratorOptions = {
  /** CommonJS module that contain a Generator function */
  generator: string;
  /** Options passed only to this generator. These generator-specific options will override common options. */
  options?: any;
};

export type Parser = (
  /** The content of the source SDL as text */
  sourceContent: string,
  /**
   * The path to the source SDL on the file system. This path is used for
   * generating Violations that point to a specific range within the SDL file.
   */
  sourcePath: string,
) => {
  /** The Intermediate Representation (IR) of the source SDL */
  service: Service;
  /**
   * Any violations that are specific to the source SDL. These may include violations
   * that prevented a valid Intermediate Representation (IR) from being generated.
   * General violations (not specific to the SDL) should be generated by {@link Rule Rules} rather than a Parser.
   */
  violations: Violation[];
};

export type RuleOptions = {
  rule: string;
  /** Options passed only to this Rule. */
  options?: any;
};

export type Rule = (
  /** The Intermediate Representation (IR) of the service */
  service: Service,
  /**
   * The path to the source SDL on the file system. This path is used for
   * generating Violations that point to a specific range within the original SDL file.
   */
  sourcePath: string,
  options?: any,
) => Violation[];

export type Generator = (service: Service, options?: any) => File[];

export type FileStatus = 'added' | 'modified' | 'no-change' | 'error';

export type Input = {
  sourcePath: string;
  sourceContent: string;
  configPath?: string;
  parser: string;
  rules: (string | RuleOptions)[];
  generators: (string | GeneratorOptions)[];
  validate: boolean;
  output?: string;
  /** Common options passed only to all generators. These common options will be overridden by generator-specific options. */
  options?: any;
};

export type Output = {
  violations: Violation[];
  errors: BasketryError[];
  files: File[];
};

export type CliOutput = {
  violations: Violation[];
  errors: BasketryError[];
  files: Record<string, FileStatus>;
  perf?: PerfEvent[];
};

export type PerfEvent = {
  readonly duration: number;
  readonly name: string;
  readonly startTime: number;
  readonly entryType: string;
  readonly detail?: string | null | undefined;
};

export type Overrides = {
  sourcePath?: string;
  sourceContent?: string;
  parser?: string;
  rules?: (string | RuleOptions)[];
  generators?: (string | GeneratorOptions)[];
  validate?: boolean;
  output?: string;
};

export type BasketryError = {
  code:
    | 'PARSER_ERROR'
    | 'RULE_ERROR'
    | 'GENERATOR_ERROR'
    | 'CONFIG_ERROR'
    | 'SOURCE_ERROR'
    | 'FATAL_ERROR'
    | 'MODULE_ERROR'
    | 'MISSING_PARAMETER'
    | 'WRITE_ERROR';
  message: string;
  filepath?: string;
};

export type File = {
  path: string[];
  contents: string;
};

export type Severity = 'info' | 'warning' | 'error';

export type Violation = {
  sourcePath: string;
  range: Range;
  message: string;
  severity: Severity;
  code: string;
  link?: string;
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
  | 'untyped';

/**
 * Intermediate Representation (IR) of a service
 */
export type Service = {
  basketry: '1';
  title: Literal<string>;
  majorVersion: Literal<number>;
  /** The path to the original source document for this service. All locations in the Intermediate Representation refer to ranges within this source document. */
  sourcePath: string;
  interfaces: Interface[];
  types: Type[];
  enums: Enum[];
  unions: Union[];
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

export type Union = {
  name: Literal<string>;
  members: TypedValue[];
  loc: string;
};

export type PrimitiveValue = {
  typeName: Literal<Primitive>;
  isArray: boolean;
  isPrimitive: true;
  rules: ValidationRule[];
};

export type CustomValue = {
  typeName: Literal<string>;
  isArray: boolean;
  isPrimitive: false;
  rules: ValidationRule[];
};

export type TypedValue = PrimitiveValue | CustomValue;

export type Property = {
  name: Literal<string>;
  description?: Literal<string> | Literal<string>[];
  loc: string;
} & TypedValue;

export type Interface = {
  name: string;
  description?: string;
  methods: Method[];
  protocols: {
    http: HttpPath[];
  };
};

export type HttpPath = {
  path: Literal<string>;
  methods: HttpMethod[];
  loc: string;
};

export type HttpMethod = {
  name: Literal<string>;
  verb: Literal<
    'get' | 'post' | 'put' | 'patch' | 'delete' | 'head' | 'options' | 'trace'
  >;
  parameters: HttpParameter[];
  successCode: Literal<number>;
  loc: string;
};

export type HttpParameter = {
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
  loc: string;
} & TypedValue;

export type ReturnType = {
  loc: string;
} & TypedValue;

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
