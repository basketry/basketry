[![main](https://github.com/basketry/basketry/workflows/build/badge.svg?branch=main&event=push)](https://github.com/basketry/basketry/actions?query=workflow%3Abuild+branch%3Amain+event%3Apush)
[![master](https://img.shields.io/npm/v/basketry)](https://www.npmjs.com/package/basketry)

# 🧺 Basketry

Generate service-oriented code from popular API definition languages.

See the [project wiki](https://github.com/basketry/basketry/wiki) for a complete set of documentation and articles.

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

## `generate` command

Generate code with the `basketry generate` command or just `basketry`.

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

Use `-g`, `--generators` to specify one or more generators to use:

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

### Validate only (deprecated)

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

## `validate` command

Validate the source per the supplied rules with the `basketry validate` command (previously `basketry --validate`). This command will run the parser and rules, but will not generate any files.

This command takes the same `source`, `parser`, `rules`, `config`, `json`, and `perf` arguments as the `generate` command.

```
basketry validate --json
```

## `clean` command

Remove previously generated files with the `basketry clean` command.

This command takes the same `config` and `output` arguments as the `generate` command.

```
basketry clean
```

## `ci` command

Verify that:

1. Re-running the generator does not produce any changes to generated files
1. There are no rule violations
1. There are no errors encountered when running any of the pipeline components

This command is designed to run in a Continuous Integration pipeline to ensure that the generator has been run and that there haven't been any manual changes made to any generated files. If any of those three checks find something, the process will exit with a non-zero code.

(Note that the changes that _only_ affect the version number in the generated file header will be ignored.)

### Severity filter

Use `--severity` to specify the minimum rule violation severity level that will fail the command:

```
basketry ci --severity error
```

The default severity level is `warning`. This means that both `error` and `warning` severity levels will cause the command to exit with a non-zero code. Valid values are `error`, `warning`, and `info`.

### Other arguments

This command takes the same `source`, `parser`, `rules`, `config`, `json`, and `perf` arguments as the `generate` command.

## `diff` command

Compare two versions of a service definition with the `basketry diff` command.

This command takes the same `source`, `parser`, and `config` arguments as the `generate` command.

The command compares the source file specified in the config with a reference source file path passed as an argument. The command assumes that the reference source file describes the service as it currently exists in a production environment and that the source file specified in the config describes the proposed new definition. Breaking changes are determined based on the proposed changes compared to the current production state.

```
basketry diff petstore-prod.json
```

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
