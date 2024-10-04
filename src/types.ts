import { Service } from './ir';

export type Config = LocalConfig | GlobalConfig;

export type LocalConfig<
  TOptions extends NamespacedBasketryOptions = NamespacedBasketryOptions,
> = {
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
  options?: TOptions;
};

export interface NamespacedBasketryOptions {
  basketry?: BasketryOptions;
  [x: string | number | symbol]: unknown;
}

export type BasketryOptions = {
  command?: string;
  docs?: string;
  subfolder?: string;
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
  generator: string | Generator;
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
  rule: string | Rule;
  /** Options passed only to this Rule. */
  options?: any;
};

export type Rule = (
  /** The Intermediate Representation (IR) of the service */
  service: Service,
  options?: any,
) => Violation[];

export type Generator = (service: Service, options?: any) => File[];

export type FileStatus =
  | 'added'
  | 'modified'
  | 'removed'
  | 'no-change'
  | 'error';

export type EngineEvents = {
  onError?: (error: BasketryError) => void;
  onViolation?: (violation: Violation, line: string) => void;
};

export type EngineInput = {
  sourcePath: string;
  sourceContent: string;
  parser: Parser;
  rules: Rule[];
  generators: Generator[];
  output?: string;
  options?: any;
};

/** @deprecated */
export type LegacyInput = {
  sourcePath: string;
  sourceContent: string;
  configPath?: string;
  parser: string | Parser;
  rules: (string | Rule | RuleOptions)[];
  generators: (string | Generator | GeneratorOptions)[];
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
  parser?: string | Parser;
  rules?: (string | Rule | RuleOptions)[];
  generators?: (string | Generator | GeneratorOptions)[];
  validate?: boolean;
  output?: string;
  options?: any;
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
