[![main](https://github.com/basketry/basketry/workflows/build/badge.svg?branch=main&event=push)](https://github.com/basketry/basketry/actions?query=workflow%3Abuild+branch%3Amain+event%3Apush)
[![master](https://img.shields.io/npm/v/basketry)](https://www.npmjs.com/package/basketry)

# 🧺 Basketry

Generate service-oriented code from popular API definition languages.

## Quick Start

The following example converts a "Swagger" doc into Typescript types.

### Install packages

Install the following: `npm install --save-dev basketry @basketry/swagger-2 @basketry/typescript`

### Config

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

### Generate code

Run the script: `npm run basketry`

When the script is run, basketry will parse the source file (`src/petstore.json`) using the specified parser (`@basketry/swagger-2`) and then run each specified generator (in this case only `@basketry/typescript`) writing the output folder (`src`).

You can also run Basketry in watch mode by passing the `-w` option: `npm run basketry -- -w`. While in watch mode, Basketry will re-run all generators whenever the source file is updated.

---

Generated with [generator-ts-console](https://www.npmjs.com/package/generator-ts-console)
