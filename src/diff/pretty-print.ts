import { lower, sentence } from 'case';
import chalk from 'chalk';
import {
  ChangeInfo,
  isEnumChangeInfo,
  isInterfaceChangeInfo,
  isMethodChangeInfo,
  isParameterChangeInfo,
  isPropertyChangeInfo,
  isRuleChangeInfo,
  RuleContext,
} from '.';

const major = chalk.bgRedBright.black.bold(' BREAKING ');
const minor = ' CHANGES  ';
const patch = chalk.gray(' OTHER    ');
let prefix = major;

export function prettyPrint(changes: ChangeInfo[]): void {
  const majorChanges = changes.filter((change) => change.category === 'major');
  const minorChanges = changes.filter((change) => change.category === 'minor');
  const patchChanges = changes.filter((change) => change.category === 'patch');

  log();

  if (majorChanges.length) {
    prefix = major;
    log('Breaking changes:');
    prettyPrintByService(majorChanges);
    log();
  }

  if (minorChanges.length) {
    prefix = minor;
    log('Non-breaking changes:');
    prettyPrintByService(minorChanges);
    log();
  }

  if (patchChanges.length) {
    prefix = patch;
    log('Other changes:');
    prettyPrintByService(patchChanges);
    log();
  }

  prefix = '';
  log(chalk.bold(`Total changes:          ${changes.length}`));
  const breakingText = `  Breaking changes:     ${majorChanges.length}`;
  log(majorChanges.length ? chalk.redBright.bold(breakingText) : breakingText);
  log(`  Non-breaking changes: ${minorChanges.length}`);
  log(`  Other changes:        ${patchChanges.length}`);
  log();
}

function prettyPrintByService(changes: ChangeInfo[]): void {
  for (const [service, serviceChanges] of groupBy(changes, getService)) {
    log(`${service} ${chalk.gray('(service)')}`);
    prettyPrintByInterface(serviceChanges);
    prettyPrintByType(serviceChanges);
    prettyPrintByEnum(serviceChanges);
  }
}

function prettyPrintByInterface(changes: ChangeInfo[]): void {
  for (const [int, intChanges] of groupBy(changes, getInterface)) {
    log(`  ${int} ${chalk.gray('(interface)')}`);

    for (const change of intChanges.filter(isInterfaceChangeInfo)) {
      printChange(change, 4);
    }

    prettyPrintByMethod(intChanges);
  }
}

function prettyPrintByMethod(changes: ChangeInfo[]): void {
  for (const [method, methodChanges] of groupBy(changes, getMethod)) {
    if (methodChanges.length === 1 && methodChanges[0].target === 'method') {
      printChange(methodChanges[0], 4);
    } else {
      log(`    ${method} ${chalk.gray('(method)')}`);

      for (const change of methodChanges.filter(isMethodChangeInfo)) {
        printChange(change, 6);
      }

      prettyPrintByParameter(methodChanges);
    }
  }
}

function prettyPrintByParameter(changes: ChangeInfo[]): void {
  for (const [parameter, parameterChanges] of groupBy(changes, getParameter)) {
    if (
      parameterChanges.length === 1 &&
      parameterChanges[0].target === 'parameter'
    ) {
      printChange(parameterChanges[0], 6);
    } else {
      const ctx = isRuleChangeInfo(parameterChanges[0])
        ? parameterChanges[0].b?.context || parameterChanges[0].a?.context
        : undefined;
      const required =
        ctx?.scope !== 'return-type' ? ctx?.required === true : false;
      log(
        `      ${parameter} ${chalk.gray(
          `(${required ? 'requred' : 'optional'} parameter)`,
        )}`,
      );

      for (const change of parameterChanges.filter(isParameterChangeInfo)) {
        printChange(change, 6);
      }

      for (const change of parameterChanges.filter(isRuleChangeInfo)) {
        printChange(change, 8);
      }
    }
  }
}

function prettyPrintByType(changes: ChangeInfo[]): void {
  for (const [type, typeChanges] of groupBy(changes, getType)) {
    if (
      typeChanges.length === 1 &&
      (typeChanges[0].target === 'input-type' ||
        typeChanges[0].target === 'output-type')
    ) {
      printChange(typeChanges[0], 4);
    } else {
      log(`  ${type} ${chalk.gray('(type)')}`);

      prettyPrintByProperty(typeChanges);
    }
  }
}

function prettyPrintByProperty(changes: ChangeInfo[]): void {
  for (const [property, propertyChanges] of groupBy(changes, getProperty)) {
    if (
      propertyChanges.length === 1 &&
      (propertyChanges[0].target === 'input-property' ||
        propertyChanges[0].target === 'output-property')
    ) {
      printChange(propertyChanges[0], 4);
    } else {
      const ctx = isRuleChangeInfo(propertyChanges[0])
        ? propertyChanges[0].b?.context || propertyChanges[0].a?.context
        : undefined;
      const required =
        ctx?.scope !== 'return-type' ? ctx?.required === true : false;
      log(
        `    ${property} ${chalk.gray(
          `(${required ? 'requred' : 'optional'} ${lower(ctx!.scope)})`,
        )}`,
      );

      for (const change of propertyChanges.filter(isPropertyChangeInfo)) {
        printChange(change, 4);
      }

      for (const change of propertyChanges.filter(isRuleChangeInfo)) {
        printChange(change, 6);
      }
    }
  }
}

function prettyPrintByEnum(changes: ChangeInfo[]): void {
  for (const [e, enumChanges] of groupBy(changes, getEnum)) {
    if (
      enumChanges.length === 1 &&
      (enumChanges[0].target === 'input-enum' ||
        enumChanges[0].target === 'output-enum')
    ) {
      printChange(enumChanges[0], 2);
    } else {
      log(`  ${e} ${chalk.gray('(enum)')}`);

      for (const change of enumChanges.filter(isEnumChangeInfo)) {
        printChange(change, 4);
      }
    }
  }
}

function getService(change: ChangeInfo): string | undefined {
  const context = change.a?.context || change.b?.context;
  if (!context) return undefined;

  return context.service;
}

function getInterface(change: ChangeInfo): string | undefined {
  const context = change.a?.context || change.b?.context;

  switch (context?.scope) {
    case 'interface':
    case 'method':
    case 'parameter':
    case 'return-type':
      return context.interface;
    default:
      return undefined;
  }
}

function getType(change: ChangeInfo): string | undefined {
  const context = change.a?.context || change.b?.context;

  switch (context?.scope) {
    case 'input-type':
    case 'output-type':
    case 'input-property':
    case 'output-property':
      return context.type;
    default:
      return undefined;
  }
}

function getEnum(change: ChangeInfo): string | undefined {
  const context = change.a?.context || change.b?.context;

  switch (context?.scope) {
    case 'input-enum':
    case 'output-enum':
      return context.enum;
    default:
      return undefined;
  }
}

function getMethod(change: ChangeInfo): string | undefined {
  const context = change.a?.context || change.b?.context;

  switch (context?.scope) {
    case 'method':
    case 'parameter':
    case 'return-type':
      return context.method;
    default:
      return undefined;
  }
}

function getParameter(change: ChangeInfo): string | undefined {
  const context = change.a?.context || change.b?.context;

  switch (context?.scope) {
    case 'parameter':
      return context.parameter;
    default:
      return undefined;
  }
}

function getProperty(change: ChangeInfo): string | undefined {
  const context = change.a?.context || change.b?.context;

  switch (context?.scope) {
    case 'input-property':
    case 'output-property':
      return context.property;
    default:
      return undefined;
  }
}

function groupBy<T>(
  items: T[],
  fn: (item: T) => string | undefined,
): Map<string, T[]> {
  const map: Map<string, T[]> = new Map();

  for (const item of items) {
    const key = fn(item);
    if (!key) continue;

    if (!map.has(key)) map.set(key, []);

    map.get(key)!.push(item);
  }

  return map;
}

function printChange(change: ChangeInfo, indent: number): void {
  const space = ' '.repeat(indent);
  const text = `${change.kind} ${change.target}: ${
    (change.a || change.b)?.value
  }`;

  // const target =
  //   isParameterChangeInfo(change) || isPropertyChangeInfo(change)
  //     ? `${change.b?.context.required ? 'required' : 'optional'}-${
  //         change.target
  //       }`
  //     : change.target;

  switch (change.kind) {
    case 'added':
      log(
        `${chalk.green(`${space}+ ${change.b?.value}`)} ${chalk.gray(
          `(${lower(target(change))})`,
        )}`,
      );
      break;
    case 'removed':
      log(chalk.red(`${space}- ${text}`));
      break;

    case 'increased':
      log(
        `${chalk.blueBright(`${space}++ ${target(change)}:`)} ${chalk.gray(
          `${chalk.gray(`${change.a?.value} =>`)} ${chalk.blueBright(
            change.b?.value,
          )}`,
        )}`,
      );
      break;

    case 'decreased':
      log(
        `${chalk.blueBright(`${space}-- ${target(change)}:`)} ${chalk.gray(
          `${chalk.gray(`${change.a?.value} =>`)} ${chalk.blueBright(
            change.b?.value,
          )}`,
        )}`,
      );
      break;

    case 'changed':
      log(chalk.blueBright(`${space}m ${sentence(target(change))}`));
      log(chalk.red(`${space}  - ${change.a?.value}`));
      log(chalk.green(`${space}  + ${change.b?.value}`));
      break;
  }
}
function target(change: ChangeInfo): string {
  if (isParameterChangeInfo(change) || isPropertyChangeInfo(change)) {
    const kind = change.b?.context.required ? 'required' : 'optional';
    return `${kind}-${change.target}`;
  } else {
    return change.target;
  }
}

function log(msg?: string): void {
  if (msg) {
    console.log(`${prefix} ${msg}`);
  } else {
    console.log();
  }
}
