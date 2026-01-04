/**
 * Configuration file management for PLP Registry CLI
 *
 * Config is stored at ~/.plp/config.json
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { ConfigError } from './errors.js';
import { REGISTRY_URL } from './http.js';

export interface PlpConfig {
  registryUrl: string;
  slug?: string;
  installationHash?: string;
  deploymentHash?: string;
}

const DEFAULT_CONFIG: PlpConfig = {
  registryUrl: REGISTRY_URL,
};

/**
 * Get the default config directory path
 */
export function getConfigDir(): string {
  return join(homedir(), '.plp');
}

/**
 * Get the config file path
 *
 * @param customPath - Optional custom path (overrides default)
 * @returns Absolute path to config file
 */
export function getConfigPath(customPath?: string): string {
  if (customPath) {
    return customPath;
  }
  return join(getConfigDir(), 'config.json');
}

/**
 * Ensure the config directory exists
 */
async function ensureConfigDir(configPath: string): Promise<void> {
  const dir = dirname(configPath);
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true, mode: 0o700 });
  }
}

/**
 * Read the config file
 *
 * @param customPath - Optional custom config file path
 * @returns Config object (defaults if file doesn't exist)
 * @throws {ConfigError} If file exists but is invalid
 */
export async function readConfig(customPath?: string): Promise<PlpConfig> {
  const configPath = getConfigPath(customPath);

  if (!existsSync(configPath)) {
    return { ...DEFAULT_CONFIG };
  }

  try {
    const content = await readFile(configPath, 'utf-8');
    const parsed = JSON.parse(content) as unknown;

    if (!parsed || typeof parsed !== 'object') {
      throw new ConfigError(`Invalid config file format at ${configPath}`);
    }

    return { ...DEFAULT_CONFIG, ...parsed as Partial<PlpConfig> };
  } catch (error) {
    if (error instanceof ConfigError) {
      throw error;
    }
    if (error instanceof SyntaxError) {
      throw new ConfigError(`Invalid JSON in config file at ${configPath}`);
    }
    throw new ConfigError(
      `Failed to read config file: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Write the config file
 *
 * @param config - Config object to write
 * @param customPath - Optional custom config file path
 * @throws {ConfigError} If write fails
 */
export async function writeConfig(
  config: PlpConfig,
  customPath?: string
): Promise<void> {
  const configPath = getConfigPath(customPath);

  try {
    await ensureConfigDir(configPath);
    const content = JSON.stringify(config, null, 2) + '\n';
    await writeFile(configPath, content, { encoding: 'utf-8', mode: 0o600 });
  } catch (error) {
    throw new ConfigError(
      `Failed to write config file: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Update specific fields in the config file
 *
 * @param updates - Partial config with fields to update
 * @param customPath - Optional custom config file path
 * @returns Updated config object
 */
export async function updateConfig(
  updates: Partial<PlpConfig>,
  customPath?: string
): Promise<PlpConfig> {
  const current = await readConfig(customPath);
  const updated = { ...current, ...updates };
  await writeConfig(updated, customPath);
  return updated;
}

/**
 * Validate that required config fields are present
 *
 * @param config - Config object to validate
 * @param required - Array of required field names
 * @throws {ConfigError} If any required fields are missing
 */
export function validateConfig(
  config: PlpConfig,
  required: (keyof PlpConfig)[]
): void {
  const missing = required.filter((key) => !config[key]);

  if (missing.length > 0) {
    const fields = missing.join(', ');
    const hint = missing.includes('installationHash')
      ? "Run 'plp-registry install' first."
      : missing.includes('deploymentHash')
        ? "Run 'plp-registry activate' first."
        : '';

    throw new ConfigError(`Missing required config: ${fields}. ${hint}`.trim());
  }
}

/**
 * Check if config file exists
 */
export function configExists(customPath?: string): boolean {
  return existsSync(getConfigPath(customPath));
}
