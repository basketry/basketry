import { run } from './engine';
import { File, Output } from './types';

import { setParser } from './test-modules/parser';
import { setFiles } from './test-modules/generator';
import { setViolations as setRuleViolations } from './test-modules/rule';
import { withGitattributes } from './helpers';

describe('engine', () => {
  beforeEach(() => {
    setParser(() => ({
      service: {
        kind: 'Service',
        basketry: '0.2',
        title: { kind: 'StringLiteral', value: 'test' },
        majorVersion: { kind: 'IntegerLiteral', value: 1 },
        sourcePath: 'overwritten.ext',
        interfaces: [],
        types: [],
        enums: [],
        unions: [],
        loc: '0;0;0',
      },
      violations: [],
    }));
    setRuleViolations([]);
    setFiles([]);
  });

  it('works on the happy path', () => {
    // ARRANGE
    const files: File[] = [
      { path: ['some', 'path'], contents: 'some content' },
    ];

    setFiles(files);

    // ACT
    const result = run({
      sourcePath: 'some-file.ext',
      sourceContent: 'some content',
      configPath: 'some-config.ext',
      parser: 'src/test-modules/parser',
      generators: ['src/test-modules/generator'],
      rules: [],
      validate: false,
    });

    // ASSERT
    expect(result).toEqual<Output>({
      violations: [],
      errors: [],
      files: withGitattributes(files),
    });
  });

  it('works when a generator is supplied with generator-specific options', () => {
    // ARRANGE
    const files: File[] = [
      { path: ['some', 'path'], contents: 'some content' },
    ];

    setFiles(files);

    // ACT
    const result = run({
      sourcePath: 'some-file.ext',
      sourceContent: 'some content',
      configPath: 'some-config.ext',
      parser: 'src/test-modules/parser',
      generators: [
        'src/test-modules/generator',
        {
          generator: 'src/test-modules/generator-that-takes-options',
          options: { foo: 'bar' },
        },
      ],
      rules: [],
      validate: false,
    });

    // ASSERT
    expect(result).toEqual<Output>({
      violations: [],
      errors: [],
      files: withGitattributes([
        ...files,
        {
          path: ['with', 'options'],
          contents: '{"foo":"bar"}',
        },
      ]),
    });
  });

  it('works when a generator is supplied with common options', () => {
    // ARRANGE
    const files: File[] = [
      { path: ['some', 'path'], contents: 'some content' },
    ];

    setFiles(files);

    // ACT
    const result = run({
      sourcePath: 'some-file.ext',
      sourceContent: 'some content',
      configPath: 'some-config.ext',
      parser: 'src/test-modules/parser',
      generators: [
        'src/test-modules/generator',
        'src/test-modules/generator-that-takes-options',
      ],
      rules: [],
      validate: false,
      options: { foo: 'bar' },
    });

    // ASSERT
    expect(result).toEqual<Output>({
      violations: [],
      errors: [],
      files: withGitattributes([
        ...files,
        {
          path: ['with', 'options'],
          contents: '{"foo":"bar"}',
        },
      ]),
    });
  });

  it('works when a generator is supplied with generator-specific options that override common options', () => {
    // ARRANGE
    const files: File[] = [
      { path: ['some', 'path'], contents: 'some content' },
    ];

    setFiles(files);

    // ACT
    const result = run({
      sourcePath: 'some-file.ext',
      sourceContent: 'some content',
      configPath: 'some-config.ext',
      parser: 'src/test-modules/parser',
      generators: [
        'src/test-modules/generator',
        {
          generator: 'src/test-modules/generator-that-takes-options',
          options: { foo: 'not bar' },
        },
      ],
      rules: [],
      validate: false,
      options: { foo: 'bar' },
    });

    // ASSERT
    expect(result).toEqual<Output>({
      violations: [],
      errors: [],
      files: withGitattributes([
        ...files,
        {
          path: ['with', 'options'],
          contents: '{"foo":"not bar"}',
        },
      ]),
    });
  });

  it('works when a generator is supplied with generator-specific options that extend common options', () => {
    // ARRANGE
    const files: File[] = [
      { path: ['some', 'path'], contents: 'some content' },
    ];

    setFiles(files);

    // ACT
    const result = run({
      sourcePath: 'some-file.ext',
      sourceContent: 'some content',
      configPath: 'some-config.ext',
      parser: 'src/test-modules/parser',
      generators: [
        'src/test-modules/generator',
        {
          generator: 'src/test-modules/generator-that-takes-options',
          options: { fiz: 'buz' },
        },
      ],
      rules: [],
      validate: false,
      options: { foo: 'bar' },
    });

    // ASSERT
    expect(result).toEqual<Output>({
      violations: [],
      errors: [],
      files: withGitattributes([
        ...files,
        {
          path: ['with', 'options'],
          contents: '{"foo":"bar","fiz":"buz"}',
        },
      ]),
    });
  });

  it('works when a rule is supplied with options', () => {
    // ARRANGE
    const files: File[] = [
      { path: ['some', 'path'], contents: 'some content' },
    ];

    setFiles(files);

    // ACT
    const result = run({
      sourcePath: 'some-file.ext',
      sourceContent: 'some content',
      configPath: 'some-config.ext',
      parser: 'src/test-modules/parser',
      generators: ['src/test-modules/generator'],
      rules: [
        {
          rule: 'src/test-modules/rule-that-takes-options',
          options: { severity: 'info', foo: 'bar' },
        },
      ],
      validate: false,
    });

    // ASSERT
    expect(result).toEqual<Output>({
      violations: [
        {
          code: 'rule-that-takes-options',
          message: '{"severity":"info","foo":"bar"}',
          severity: 'info',
          range: {
            end: {
              column: 1,
              line: 1,
              offset: 0,
            },
            start: {
              column: 1,
              line: 1,
              offset: 0,
            },
          },
          sourcePath: 'some-file.ext',
        },
      ],
      errors: [],
      files: withGitattributes(files),
    });
  });

  it('returns an error when the parser module throws', () => {
    // ACT
    const result = run({
      sourcePath: 'some-file.ext',
      sourceContent: 'some content',
      configPath: 'some-config.ext',
      parser: 'src/test-modules/module-that-throws',
      generators: ['src/test-modules/generator'],
      rules: ['src/test-modules/rule'],
      validate: false,
    });

    // ASSERT
    expect(result).toEqual<Output>({
      violations: [],
      errors: [
        {
          code: 'MODULE_ERROR',
          message:
            'Error loading module "src/test-modules/module-that-throws".',
          filepath: 'some-config.ext',
        },
      ],
      files: [],
    });
  });

  it('returns an error when a generator module throws', () => {
    // ACT
    const result = run({
      sourcePath: 'some-file.ext',
      sourceContent: 'some content',
      configPath: 'some-config.ext',
      parser: 'src/test-modules/parser',
      generators: ['src/test-modules/module-that-throws'],
      rules: ['src/test-modules/rule'],
      validate: false,
    });

    // ASSERT
    expect(result).toEqual<Output>({
      violations: [],
      errors: [
        {
          code: 'MODULE_ERROR',
          message:
            'Error loading module "src/test-modules/module-that-throws".',
          filepath: 'some-config.ext',
        },
      ],
      files: [],
    });
  });

  it('returns an error when a rule module throws', () => {
    // ACT
    const result = run({
      sourcePath: 'some-file.ext',
      sourceContent: 'some content',
      configPath: 'some-config.ext',
      parser: 'src/test-modules/parser',
      generators: ['src/test-modules/generator'],
      rules: ['src/test-modules/module-that-throws'],
      validate: false,
    });

    // ASSERT
    expect(result).toEqual<Output>({
      violations: [],
      errors: [
        {
          code: 'MODULE_ERROR',
          message:
            'Error loading module "src/test-modules/module-that-throws".',
          filepath: 'some-config.ext',
        },
      ],
      files: [],
    });
  });

  it('returns an error when the parser function throws', () => {
    // ACT
    const result = run({
      sourcePath: 'some-file.ext',
      sourceContent: 'some content',
      configPath: 'some-config.ext',
      parser: 'src/test-modules/parser-that-throws',
      generators: ['src/test-modules/generator'],
      rules: ['src/test-modules/rule'],
      validate: false,
    });

    // ASSERT
    expect(result).toEqual<Output>({
      violations: [],
      errors: [
        {
          code: 'PARSER_ERROR',
          message: 'Unhandled exception running parser',
          filepath: 'some-file.ext',
        },
      ],
      files: [],
    });
  });

  it('returns an error when a generator function throws', () => {
    // ACT
    const result = run({
      sourcePath: 'some-file.ext',
      sourceContent: 'some content',
      configPath: 'some-config.ext',
      parser: 'src/test-modules/parser',
      generators: ['src/test-modules/generator-that-throws'],
      rules: ['src/test-modules/rule'],
      validate: false,
    });

    // ASSERT
    expect(result).toEqual<Output>({
      violations: [],
      errors: [
        {
          code: 'GENERATOR_ERROR',
          message: 'Unhandled exception running generator',
        },
      ],
      files: [],
    });
  });

  it('returns an error when a rule function throws', () => {
    // ACT
    const result = run({
      sourcePath: 'some-file.ext',
      sourceContent: 'some content',
      configPath: 'some-config.ext',
      parser: 'src/test-modules/parser',
      generators: ['src/test-modules/generator'],
      rules: ['src/test-modules/rule-that-throws'],
      validate: false,
    });

    // ASSERT
    expect(result).toEqual<Output>({
      violations: [],
      errors: [
        {
          code: 'RULE_ERROR',
          message: 'Unhandled exception running rule',
        },
      ],
      files: [],
    });
  });

  it('returns errors when the parser function returns an invalid service', () => {
    // ACT
    const result = run({
      sourcePath: 'some-file.ext',
      sourceContent: 'some content',
      configPath: 'some-config.ext',
      parser: 'src/test-modules/invalid-parser',
      generators: ['src/test-modules/generator'],
      rules: ['src/test-modules/rule'],
      validate: false,
    });

    // ASSERT
    expect(result).toEqual<Output>({
      violations: [],
      errors: [
        {
          code: 'PARSER_ERROR',
          message: "Invalid IR: `#` must have required property 'kind'",
        },
        {
          code: 'PARSER_ERROR',
          message: "Invalid IR: `#` must have required property 'title'",
        },
        {
          code: 'PARSER_ERROR',
          message: "Invalid IR: `#` must have required property 'majorVersion'",
        },
        {
          code: 'PARSER_ERROR',
          message: "Invalid IR: `#` must have required property 'types'",
        },
        {
          code: 'PARSER_ERROR',
          message: "Invalid IR: `#` must have required property 'enums'",
        },
        {
          code: 'PARSER_ERROR',
          message: "Invalid IR: `#` must have required property 'unions'",
        },
        {
          code: 'PARSER_ERROR',
          message: 'Invalid IR: `#` must NOT have additional properties',
        },
        {
          code: 'PARSER_ERROR',
          message: 'Invalid IR: `#/basketry` must be equal to constant',
        },
        {
          code: 'PARSER_ERROR',
          message:
            "Invalid IR: `#/interfaces/0` must have required property 'kind'",
        },
        {
          code: 'PARSER_ERROR',
          message:
            "Invalid IR: `#/interfaces/0` must have required property 'name'",
        },
        {
          code: 'PARSER_ERROR',
          message:
            "Invalid IR: `#/interfaces/0` must have required property 'methods'",
        },
        {
          code: 'PARSER_ERROR',
          message:
            'Invalid IR: `#/interfaces/0` must NOT have additional properties',
        },
      ],
      files: [],
    });
  });

  it('returns only unique rule violations', () => {
    // ACT
    const result = run({
      sourcePath: 'some-file.ext',
      sourceContent: 'some content',
      configPath: 'some-config.ext',
      parser: 'src/test-modules/parser',
      generators: ['src/test-modules/generator'],
      rules: ['src/test-modules/rule-that-returns-duplicate-violations'],
      validate: false,
    });

    // ASSERT
    expect(result.violations.length).toEqual(1);
  });
});
