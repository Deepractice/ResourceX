/**
 * CLI configuration management
 */

import { homedir } from "node:os";
import { join } from "node:path";

export interface Config {
  path: string;
  domain: string;
  registry?: string;
}

const CONFIG_PATH = join(homedir(), ".resourcex", "config.json");
const DEFAULT_CONFIG: Config = {
  path: join(homedir(), ".resourcex"),
  domain: "localhost",
};

export async function getConfig(): Promise<Config> {
  try {
    const file = Bun.file(CONFIG_PATH);
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
  const dir = join(homedir(), ".resourcex");
  await Bun.$`mkdir -p ${dir}`.quiet();

  await Bun.write(CONFIG_PATH, JSON.stringify(config, null, 2));
}

export async function listConfig(): Promise<Config> {
  return getConfig();
}
