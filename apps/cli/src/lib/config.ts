/**
 * CLI configuration management
 */

import { RX_HOME, PATHS } from "./paths.js";

export interface Config {
  path: string;
  registry?: string;
}

export async function getConfig(): Promise<Config> {
  let fileConfig: Partial<Config> = {};

  try {
    const file = Bun.file(PATHS.config);
    if (await file.exists()) {
      fileConfig = await file.json();
    }
  } catch {
    // Ignore errors, use file defaults
  }

  // Environment variables take precedence over config file
  // Note: Empty string from env means "no registry" (explicit unset)
  const envRegistry = process.env.RX_REGISTRY;
  const registry = envRegistry !== undefined ? envRegistry || undefined : fileConfig.registry;

  return {
    path: process.env.RX_HOME || fileConfig.path || RX_HOME,
    registry,
  };
}

export async function setConfig(key: keyof Config, value: string): Promise<void> {
  const config = await getConfig();
  (config as Record<string, string>)[key] = value;

  // Ensure directory exists
  await Bun.$`mkdir -p ${RX_HOME}`.quiet();

  await Bun.write(PATHS.config, JSON.stringify(config, null, 2));
}

export async function listConfig(): Promise<Config> {
  return getConfig();
}
