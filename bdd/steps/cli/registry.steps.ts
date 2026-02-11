/**
 * Step definitions for registry management tests
 *
 * Registry tests don't pass RX_REGISTRY env var to CLI subprocess.
 * Setting noRegistryConfigured=true makes runRxCommand omit RX_REGISTRY,
 * which causes CLI to fall through to config.json registries.
 */

import { Given, Before } from "@cucumber/cucumber";
import { join } from "node:path";
import { rm, mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const MONOREPO_ROOT = join(process.cwd(), "..");
const TEST_BASE = join(MONOREPO_ROOT, ".test-bdd-cli");
const TEST_RX_HOME = join(TEST_BASE, "rx-home");

interface RegistryWorld {
  commandOutput: string;
  commandExitCode: number;
  resourceDir: string | null;
  noRegistryConfigured: boolean;
}

interface RegistryConfig {
  registries?: Array<{ name: string; url: string; default?: boolean }>;
  registry?: string;
}

async function readConfigFile(): Promise<RegistryConfig> {
  const configPath = join(TEST_RX_HOME, "config.json");
  try {
    if (existsSync(configPath)) {
      const content = await readFile(configPath, "utf-8");
      return JSON.parse(content);
    }
  } catch {
    // No config
  }
  return {};
}

async function writeConfigFile(config: RegistryConfig): Promise<void> {
  const configPath = join(TEST_RX_HOME, "config.json");
  await mkdir(TEST_RX_HOME, { recursive: true });
  await writeFile(configPath, JSON.stringify(config, null, 2));
}

Before({ tags: "@registry" }, async function (this: RegistryWorld) {
  // Registry tests use config file, not RX_REGISTRY env var
  this.noRegistryConfigured = true;
});

Given(
  "a registry {string} is configured with url {string}",
  async function (this: RegistryWorld, name: string, url: string) {
    const config = await readConfigFile();
    const registries = config.registries ?? [];

    registries.push({ name, url });

    // First registry becomes default
    if (registries.length === 1) {
      registries[0].default = true;
    }

    config.registries = registries;
    await writeConfigFile(config);
  }
);

Given(
  "a registry {string} is configured with url {string} as default",
  async function (this: RegistryWorld, name: string, url: string) {
    const config = await readConfigFile();
    const registries = config.registries ?? [];

    // Clear existing defaults
    for (const r of registries) r.default = false;

    registries.push({ name, url, default: true });
    config.registries = registries;
    await writeConfigFile(config);
  }
);

Given("an old config with registry {string}", async function (this: RegistryWorld, url: string) {
  await writeConfigFile({ registry: url });
});
