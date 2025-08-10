import { readFile } from 'fs/promises';
import { dirname, resolve } from 'path';
import { BasketryError, GlobalConfig, LocalConfig } from '.';
import { validateConfig } from './config-validator';

export type ResolveOptions = { cwd?: string };

/**
 * Starts with a single config path and resolves all local configs.
 * The returned values are a list of absolute paths to the local configs.
 */
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
      path = options?.cwd
        ? resolve(options.cwd, configPath)
        : resolve(process.cwd(), configPath);

      const config = validateConfig(
        JSON.parse((await readFile(path)).toString()),
      );
      errors.push(...config.errors);

      if (isLocalConfig(config.value)) {
        value.push(path);
      } else if (isGlobalConfig(config.value)) {
        // Recursively resolve each nested config
        const cwd = options?.cwd || dirname(path);
        for (const nestedConfigPath of config.value.configs) {
          const absoluteNestedConfigPath = resolve(cwd, nestedConfigPath);
          const resolved = await resolveConfig(absoluteNestedConfigPath, {
            cwd: dirname(absoluteNestedConfigPath),
          });
          value.push(...resolved.value);
          errors.push(...resolved.errors);
        }
      }
    }
  } catch (ex) {
    console.error(ex);
    // TOOD: look for ENOENT
    // TOOD: look for SyntaxError
    errors.push({
      code: 'CONFIG_ERROR',
      message: getErrorMessage(ex, 'Unhandled exception resolving config'),
      filepath: path,
    });
  }

  return { value, errors };
}

export async function getConfigs(
  configPath: string | undefined,
  options?: ResolveOptions,
): Promise<{
  value: Map<string, LocalConfig>;
  errors: BasketryError[];
}> {
  const value: Map<string, LocalConfig> = new Map();
  const errors: BasketryError[] = [];

  try {
    const resolved = await resolveConfig(configPath, options);
    if (resolved.errors) errors.push(...resolved.errors);

    for (const absoluteConfigPath of resolved.value) {
      const config = await readFile(absoluteConfigPath);
      const localConfig = validateConfig(JSON.parse(config.toString()));

      if (isLocalConfig(localConfig.value)) {
        value.set(absoluteConfigPath, localConfig.value);
      }
    }
  } catch (ex) {
    // TOOD: look for ENOENT
    // TOOD: look for SyntaxError
    errors.push({
      code: 'CONFIG_ERROR',
      message: getErrorMessage(ex, 'Unhandled exception loading configs'),
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

function getErrorMessage(err: any, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}
