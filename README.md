[![main](https://github.com/basketry/basketry/workflows/build/badge.svg?branch=main&event=push)](https://github.com/basketry/basketry/actions?query=workflow%3Abuild+branch%3Amain+event%3Apush)
[![master](https://img.shields.io/npm/v/basketry)](https://www.npmjs.com/package/basketry)

# 🧺 Basketry

Generate service-oriented code from popular API definition languages.

## Quick Start

The following example converts a "Swagger" doc into Typescript types:

1. Save `https://petstore.swagger.io/v2/swagger.json` as `petstore.json` in the root of your project.
1. Install packages: `npm install -g basketry @basketry/swagger-2 @basketry/typescript`
1. Generate code: `basketry --source petstore.json --parser @basketry/swagger-2 --generators @basketry/typescript --output src`

When the last step is run, basketry will parse the source file (`petstore.json`) using the specified parser (`@basketry/swagger-2`) and then run each specified generator (in this case only `@basketry/typescript`) writing the output folder (`src`).

## Config file

You can alternatively use a config file rather than having to pass command line arguments.

Add `basketry.config.json` to the root of your project:

```json
{
  "parser": "@basketry/swagger-2",
  "generators": ["@basketry/typescript"],
  "source": "src/petstore.json",
  "output": "src"
}
```

Add the following script to `package.json`:

```json
"scripts": {
  "basketry": "basketry"
}
```

Now you can generate code by running `npm run basketry`. Note that you can mix and match CLI arguments and config file settings—CLI arguments will override the config file if the same setting is specified in both places.

## CLI Usage

Code can be generated using the `basketry` command.

### Source file

Use `-s`, `--source` to supply the source file path:

```
basketry --source src/petstore.json
```

Or pipe contents in via stdio:

```
cat src/petstore.json | basketry
```

Note that if a source parameter is provided _and_ data is piped in via `stdin`, the content from `stdin` will be parsed, but any violations will still point to the file located at the source path. This can be useful to validate dirty versions of a file prior to the file being saved and thus accessible by reading from the file system.

`stdin` cannot be used with multiple configs. You can, however, still pass a child config as an argument:

```
cat src/petstore/service.json | basketry --config src/petstore/basketry.config.json
```

### Parser

Use `-p`, `--parser` to specify the parser to use:

```
basketry --parser @basketry/swagger-2
```

See the "How does it work?" section below for info on what values can be used as a parser string.

### Generators

Use `-g`, `--generators` to specify one or more generator to use:

```
basketry --generators @basketry/typescript
```

```
basketry --generators @basketry/typescript @basketry/typescript-validators
```

See the "How does it work?" section below for info on what values can be used as a generator string.

### Output directory

Use `-o`, `--output` to specify the path to the output folder. Writes to the current working directory if omitted and config is not found.

```
basketry --output src
```

All generated files will be written to the specified `output` directory. Some generators may write files to a subdirectory within the main output directory. (Note that if multiple generators write a file with the same file name, only one of the files will remain.)

### Config file

Use `-c`, `--config` to specify Path to the config file. (Defaults to `basketry.conifg.json` in the root of your project.)

```
basketry --config some-other-name.json
```

All generated files will be written to the specified `output` directory. Some generators may write files to a subdirectory within the main output directory. (Note that if multiple generators write a file with the same file name, only one of the files will remain.)

### Watch mode

Use `-w`, `--watch` to run in watch mode. In watch mode, `--source` must be specified (you can't pipe to stdio). Running in watch mode will immediately generate output file and then update the output file on each subsequent change to the source SDL file.

```
basketry --source src/petstore.json --watch
```

You can also run Basketry in watch mode by passing the `-w` option to an npm script: `npm run basketry -- -w`. While in watch mode, Basketry will re-run all rules and generators whenever the source file is updated.

### Validate only

Use `-v`, `--validate` to only run the parser and rules but skip file generation:

```
basketry --validate
```

### JSON output

Normally, the CLI will output human readable progress, results, and pretty-printed errors. Use `-j`, `--json` to output JSON-formatted output to `stdout`:

```
basketry --json
```

Note that `--json` cannot be used with `--watch`.

## How does it work?

Internally, basketry is a plugable pipeline that translates a service from a Service Definition Language (SDL) to one or more programatic or human readable langugages. The first step is to use a Parser to convert and SDL in an Intermediate Representation (IR) of the service. In the second step, this IR is passed to one or more Generators which convert the IR into the final target language.

Basketry coordinates the pipeline and writes the resulting output to the file system. It also exposes an lightweight set of types and tools to build custom Parsers and Generators. By decoupling the SDL parsing and code generating steps, Parsers and Generators can be easily mixed and matched.

### Parser

A "Parser" is a JavaScript module whose default export is a parsing function that converts in input SDL into the intermediate representation of a Service:

```ts
type Parser = (content: string, path: string) => { service: Service };

const parser: Parser = (content, path) => {
  // Parser implementation goes here
};

export default parser;
```

### Generators

A "Generator" is a JavaScript module whose default export is a generator function that converts in input intermediate representation of the service into one or more files:

```ts
type Generator = (service: Service) => File[];

const generator: Generator = (service) => {
  // Generator implementation goes here
};

export default generator;
```

### Rules

A "Rule" is a JavaScript module whose default export is a rule function that looks at the intermediate representation of a service and returns an array of any rule violations:

```ts
type Rule = (service: Service, path: string) => Violation[];

const rule: Rule = (service, path) => {
  // Rule implementation goes here
};

export default rule;
```

Rules can be used to enforce specific opinions about service design. For example, a rule could enforce names and types for paging parameters. Another rule might establish a naming convention for method and types.

Note that rules are run against the Intermediate Representation (IR); therefore, any rule may be used with any Basketry parser. The IR contains source map data which allows the violations to point to specific ranges of the source Serivce Definition without needing to implement the same rule for each SDL.

### Using parsers, generators, and rules

Any string that can be used to "require" a CommonJS module can be used to specify a parser, generator, or rule.

For example, any parser (as described above) that can be required with `const myParser = require('./path/to/my/parser')` can be used with Basketry with `basketry --parser ./path/to/my/parser`. This applies to both modules defined within your project and packages installed from NPM. If it can be required from within your project, it can be used as a Parser, Generator, or Rule.

Although Basketry is written in the JavaScript family of languages, it can be used to generate code in any language.

## Advanced Usage

### Multiple configs

Basketry can generate multiple service interfaces from a single source file. However, there may be times where developers need to create multiple configurations within a single repository. Doing so allows for stricter modularity between services and more fine grained control over configuration settings.

To use multiple configurations, provide an array of the config file locations in the root configuration (`your-project/basketry.config.json`):

```json
{
  "configs": [
    "src/petstore/basketry.config.json",
    "src/swapi/basketry.config.json"
  ]
}
```

Each of the child configuations will be "normal" configuations that specify the source, parser, rules, generators, and output. Child configs can not contain further children—all configs must be specified in the top-level parent.

Running basketry against project will _everything_ in all of the specified folders. You can still run against only one child by passing the config path as an arg:

```
basketry --config src/petstore/basketry.config.json
```

---

## For contributors:

### Run this project

1.  Install packages: `npm ci`
1.  Build the code: `npm run build`
1.  Run it! `npm start`

Note that the `lint` script is run prior to `build`. Auto-fixable linting or formatting errors may be fixed by running `npm run fix`.

### Create and run tests

1.  Add tests by creating files with the `.test.ts` suffix
1.  Run the tests: `npm t`
1.  Test coverage can be viewed at `/coverage/lcov-report/index.html`

### Publish a new package version

1. Ensure latest code is published on the `main` branch.
1. Create the new version number with `npm version {major|minor|patch}`
1. Push the branch and the version tag: `git push origin main --follow-tags`

The [publish workflow](https://github.com/basketry/basketry/actions/workflows/publish.yml) will build and pack the new version then push the package to NPM. Note that publishing requires write access to the `main` branch.

---

Generated with [generator-ts-console](https://www.npmjs.com/package/generator-ts-console)
