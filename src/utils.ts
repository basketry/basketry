import { readFile } from 'fs/promises';
import { join, resolve } from 'path';
import { BasketryError, GlobalConfig, LocalConfig } from '.';
import { validateConfig } from './config-validator';

export type ResolveOptions = { cwd?: string };

export async function resolveConfig(
  configPath: string | undefined,
  options?: ResolveOptions,
): Promise<{
  value: string[];
  errors: BasketryError[];
}> {
  const value: string[] = [];
  const errors: BasketryError[] = [];
  let path: string | undefined;
  try {
    if (configPath?.length) {
      path = options?.cwd ? resolve(options.cwd, configPath) : configPath;
      const config = validateConfig(
        JSON.parse((await readFile(path)).toString()),
      );
      errors.push(...config.errors);

      if (isLocalConfig(config.value)) {
        value.push(path);
      } else if (isGlobalConfig(config.value)) {
        value.push(...config.value.configs);
      }
    }
  } catch (ex) {
    console.error(ex);
    // TOOD: look for ENOENT
    // TOOD: look for SyntaxError
    errors.push({
      code: 'CONFIG_ERROR',
      message: 'Unhandled exception resolving config', // TODO: Use ex
      filepath: path,
    });
  }

  return { value, errors };
}

export async function getConfigs(
  configPath: string | undefined,
  options?: ResolveOptions,
): Promise<{
  value: LocalConfig[];
  errors: BasketryError[];
}> {
  const value: LocalConfig[] = [];
  const errors: BasketryError[] = [];

  try {
    const resolved = await resolveConfig(configPath);
    if (resolved.errors) errors.push(...resolved.errors);

    const buffers = await Promise.all(
      resolved.value.map((uri) =>
        readFile(options?.cwd ? resolve(options.cwd, uri) : uri),
      ),
    );

    const localConfigs = buffers
      .map((x) => JSON.parse(x.toString()))
      .filter(isLocalConfig);

    value.push(...localConfigs);
  } catch (ex) {
    // TOOD: look for ENOENT
    // TOOD: look for SyntaxError
    errors.push({
      code: 'CONFIG_ERROR',
      message: 'Unhandled exception loading configs', // TODO: Use ex
      filepath: configPath,
    });
  }

  return { value, errors };
}

export function isLocalConfig(
  config: LocalConfig | GlobalConfig | undefined,
): config is LocalConfig {
  return config?.['configs'] === undefined;
}

export function isGlobalConfig(
  config: LocalConfig | GlobalConfig | undefined,
): config is LocalConfig {
  return config?.['configs'] !== undefined;
}
