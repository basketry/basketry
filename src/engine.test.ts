import { Engine } from './engine';
import { File } from './types';

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
        sourcePaths: ['overwritten.ext'],
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

  it('works on the happy path', async () => {
    // ARRANGE
    const files: File[] = [
      { path: ['some', 'path'], contents: 'some content' },
    ];

    setFiles(files);

    const {
      engines: [engine],
      errors,
    } = await Engine.load({
      sourcePath: 'some-file.ext',
      sourceContent: 'some content',
      parser: 'src/test-modules/parser',
      generators: ['src/test-modules/generator'],
      rules: [],
      validate: false,
    });
    expect(engine).toBeDefined();
    expect(errors).toEqual([]);

    // ACT
    await engine.runParser();
    await engine.runRules();
    await engine.runGenerators();

    // ASSERT
    expect(engine.violations).toEqual([]);
    expect(engine.errors).toEqual([]);
    expect(engine.files).toEqual(withGitattributes(files));
  });

  it('works when a generator is supplied with generator-specific options', async () => {
    // ARRANGE
    const files: File[] = [
      { path: ['some', 'path'], contents: 'some content' },
    ];

    setFiles(files);

    const {
      engines: [engine],
      errors,
    } = await Engine.load({
      sourcePath: 'some-file.ext',
      sourceContent: 'some content',
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
    expect(engine).toBeDefined();
    expect(errors).toEqual([]);

    // ACT
    await engine.runParser();
    await engine.runRules();
    await engine.runGenerators();

    // ASSERT
    expect(engine.violations).toEqual([]);
    expect(engine.errors).toEqual([]);
    expect(engine.files).toEqual(
      withGitattributes([
        ...files,
        {
          path: ['with', 'options'],
          contents: '{"foo":"bar"}',
        },
      ]),
    );
  });

  it('works when a generator is supplied with common options', async () => {
    // ARRANGE
    const files: File[] = [
      { path: ['some', 'path'], contents: 'some content' },
    ];

    setFiles(files);

    const {
      engines: [engine],
      errors,
    } = await Engine.load({
      sourcePath: 'some-file.ext',
      sourceContent: 'some content',
      parser: 'src/test-modules/parser',
      generators: [
        'src/test-modules/generator',
        'src/test-modules/generator-that-takes-options',
      ],
      rules: [],
      validate: false,
      options: { foo: 'bar' },
    });
    expect(engine).toBeDefined();
    expect(errors).toEqual([]);

    // ACT
    await engine.runParser();
    await engine.runRules();
    await engine.runGenerators();

    // ASSERT
    expect(engine.violations).toEqual([]);
    expect(engine.errors).toEqual([]);
    expect(engine.files).toEqual(
      withGitattributes([
        ...files,
        {
          path: ['with', 'options'],
          contents: '{"foo":"bar"}',
        },
      ]),
    );
  });

  it('works when a generator is supplied with generator-specific options that override common options', async () => {
    // ARRANGE
    const files: File[] = [
      { path: ['some', 'path'], contents: 'some content' },
    ];

    setFiles(files);

    const {
      engines: [engine],
      errors,
    } = await Engine.load({
      sourcePath: 'some-file.ext',
      sourceContent: 'some content',
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
    expect(engine).toBeDefined();
    expect(errors).toEqual([]);

    // ACT
    await engine.runParser();
    await engine.runRules();
    await engine.runGenerators();

    // ASSERT
    expect(engine.violations).toEqual([]);
    expect(engine.errors).toEqual([]);
    expect(engine.files).toEqual(
      withGitattributes([
        ...files,
        {
          path: ['with', 'options'],
          contents: '{"foo":"not bar"}',
        },
      ]),
    );
  });

  it('works when a generator is supplied with generator-specific options that extend common options', async () => {
    // ARRANGE
    const files: File[] = [
      { path: ['some', 'path'], contents: 'some content' },
    ];

    setFiles(files);

    const {
      engines: [engine],
      errors,
    } = await Engine.load({
      sourcePath: 'some-file.ext',
      sourceContent: 'some content',
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
    expect(engine).toBeDefined();
    expect(errors).toEqual([]);

    // ACT
    await engine.runParser();
    await engine.runRules();
    await engine.runGenerators();

    // ASSERT
    expect(engine.violations).toEqual([]);
    expect(engine.errors).toEqual([]);
    expect(engine.files).toEqual(
      withGitattributes([
        ...files,
        {
          path: ['with', 'options'],
          contents: '{"foo":"bar","fiz":"buz"}',
        },
      ]),
    );
  });

  it('works when a rule is supplied with options', async () => {
    // ARRANGE
    const files: File[] = [
      { path: ['some', 'path'], contents: 'some content' },
    ];

    setFiles(files);

    const {
      engines: [engine],
      errors,
    } = await Engine.load({
      sourcePath: 'some-file.ext',
      sourceContent: 'some content',
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
    expect(engine).toBeDefined();
    expect(errors).toEqual([]);

    // ACT
    await engine.runParser();
    await engine.runRules();
    await engine.runGenerators();

    // ASSERT
    expect(engine.violations).toEqual([
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
    ]);
    expect(engine.errors).toEqual([]);
    expect(engine.files).toEqual(withGitattributes(files));
  });

  it('returns an error when the parser module throws', async () => {
    // ARRANGE
    const {
      engines: [engine],
      errors,
    } = await Engine.load({
      sourcePath: 'some-file.ext',
      sourceContent: 'some content',
      parser: 'src/test-modules/module-that-throws',
      generators: ['src/test-modules/generator'],
      rules: ['src/test-modules/rule'],
      validate: false,
    });
    expect(engine).toBeDefined();
    expect(errors).toEqual([]);

    // ACT
    await engine.runParser();
    await engine.runRules();
    await engine.runGenerators();

    // ASSERT
    expect(engine.violations).toEqual([]);
    expect(engine.errors).toEqual([
      {
        code: 'MODULE_ERROR',
        message: 'Error loading module "src/test-modules/module-that-throws".',
        filepath: undefined, // This would be the config path, but it's not set in this test
      },
    ]);
    expect(engine.files).toEqual([]);
  });

  it('returns an error when a generator module throws', async () => {
    // ARRANGE
    const {
      engines: [engine],
      errors,
    } = await Engine.load({
      sourcePath: 'some-file.ext',
      sourceContent: 'some content',
      parser: 'src/test-modules/parser',
      generators: ['src/test-modules/module-that-throws'],
      rules: ['src/test-modules/rule'],
      validate: false,
    });
    expect(engine).toBeDefined();
    expect(errors).toEqual([]);

    // ACT
    await engine.runParser();
    await engine.runRules();
    await engine.runGenerators();

    // ASSERT
    expect(engine.violations).toEqual([]);
    expect(engine.errors).toEqual([
      {
        code: 'MODULE_ERROR',
        message: 'Error loading module "src/test-modules/module-that-throws".',
        filepath: undefined, // This would be the config path, but it's not set in this test
      },
    ]);
    expect(engine.files).toEqual([]);
  });

  it('returns an error when a rule module throws', async () => {
    // ARRANGE
    const {
      engines: [engine],
      errors,
    } = await Engine.load({
      sourcePath: 'some-file.ext',
      sourceContent: 'some content',
      parser: 'src/test-modules/parser',
      generators: ['src/test-modules/generator'],
      rules: ['src/test-modules/module-that-throws'],
      validate: false,
    });
    expect(engine).toBeDefined();
    expect(errors).toEqual([]);

    // ACT
    await engine.runParser();
    await engine.runRules();
    await engine.runGenerators();

    // ASSERT
    expect(engine.violations).toEqual([]);
    expect(engine.errors).toEqual([
      {
        code: 'MODULE_ERROR',
        message: 'Error loading module "src/test-modules/module-that-throws".',
        filepath: undefined, // This would be the config path, but it's not set in this test
      },
    ]);
    expect(engine.files).toEqual([]);
  });

  it('returns an error when the parser function throws', async () => {
    // ARRANGE
    const {
      engines: [engine],
      errors,
    } = await Engine.load({
      sourcePath: 'some-file.ext',
      sourceContent: 'some content',
      parser: 'src/test-modules/parser-that-throws',
      generators: ['src/test-modules/generator'],
      rules: ['src/test-modules/rule'],
      validate: false,
    });
    expect(engine).toBeDefined();
    expect(errors).toEqual([]);

    // ACT
    await engine.runParser();
    await engine.runRules();
    await engine.runGenerators();

    // ASSERT
    expect(engine.violations).toEqual([]);
    expect(engine.errors).toEqual([
      {
        code: 'PARSER_ERROR',
        message: 'Test error',
        filepath: 'some-file.ext',
      },
    ]);
    expect(engine.files).toEqual([]);
  });

  it('returns an error when a generator function throws', async () => {
    // ARRANGE
    const {
      engines: [engine],
      errors,
    } = await Engine.load({
      sourcePath: 'some-file.ext',
      sourceContent: 'some content',
      parser: 'src/test-modules/parser',
      generators: ['src/test-modules/generator-that-throws'],
      rules: ['src/test-modules/rule'],
      validate: false,
    });
    expect(engine).toBeDefined();
    expect(errors).toEqual([]);

    // ACT
    await engine.runParser();
    await engine.runRules();
    await engine.runGenerators();

    // ASSERT
    expect(engine.violations).toEqual([]);
    expect(engine.errors).toEqual([
      {
        code: 'GENERATOR_ERROR',
        message: 'Test error',
      },
    ]);
    expect(engine.files).toEqual([]);
  });

  it('returns an error when a rule function throws', async () => {
    // ARRANGE
    const {
      engines: [engine],
      errors,
    } = await Engine.load({
      sourcePath: 'some-file.ext',
      sourceContent: 'some content',
      parser: 'src/test-modules/parser',
      generators: ['src/test-modules/generator'],
      rules: ['src/test-modules/rule-that-throws'],
      validate: false,
    });
    expect(engine).toBeDefined();
    expect(errors).toEqual([]);

    // ACT
    await engine.runParser();
    await engine.runRules();
    await engine.runGenerators();

    // ASSERT
    expect(engine.violations).toEqual([]);
    expect(engine.errors).toEqual([
      {
        code: 'RULE_ERROR',
        message: 'Test error',
      },
    ]);
    expect(engine.files).toEqual([]);
  });

  it('returns errors when the parser function returns an invalid service', async () => {
    // ARRANGE
    const {
      engines: [engine],
      errors,
    } = await Engine.load({
      sourcePath: 'some-file.ext',
      sourceContent: 'some content',
      parser: 'src/test-modules/invalid-parser',
      generators: ['src/test-modules/generator'],
      rules: ['src/test-modules/rule'],
      validate: false,
    });
    expect(engine).toBeDefined();
    expect(errors).toEqual([]);

    // ACT
    await engine.runParser();
    await engine.runRules();
    await engine.runGenerators();

    // ASSERT
    expect(engine.violations).toEqual([]);
    expect(engine.errors).toEqual([
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
    ]);
    expect(engine.files).toEqual([]);
  });

  it('returns only unique rule violations', async () => {
    // ARRANGE
    const {
      engines: [engine],
      errors,
    } = await Engine.load({
      sourcePath: 'some-file.ext',
      sourceContent: 'some content',
      parser: 'src/test-modules/parser',
      generators: ['src/test-modules/generator'],
      rules: ['src/test-modules/rule-that-returns-duplicate-violations'],
      validate: false,
    });
    expect(engine).toBeDefined();
    expect(errors).toEqual([]);

    // ACT
    await engine.runParser();
    await engine.runRules();
    await engine.runGenerators();

    // ASSERT
    expect(engine.violations.length).toEqual(1);
  });
});
