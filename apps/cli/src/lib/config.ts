/**
 * CLI configuration management
 */

import { RX_HOME, PATHS } from "./paths.js";

export interface Config {
  path: string;
  domain: string;
  registry?: string;
}

const DEFAULT_CONFIG: Config = {
  path: RX_HOME,
  domain: "localhost",
  registry: process.env.RX_REGISTRY,
};

export async function getConfig(): Promise<Config> {
  try {
    const file = Bun.file(PATHS.config);
    if (await file.exists()) {
      const data = await file.json();
      return { ...DEFAULT_CONFIG, ...data };
    }
  } catch {
    // Ignore errors, use default
  }
  return DEFAULT_CONFIG;
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
