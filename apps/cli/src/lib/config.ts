/**
 * CLI configuration management
 *
 * Supports multi-registry configuration (Maven-style).
 * Backward compatible with old single "registry" field.
 */

import { RX_HOME, PATHS } from "./paths.js";

export interface RegistryEntry {
  name: string;
  url: string;
  default?: boolean;
}

export interface Config {
  path: string;
  /** @deprecated Use registries[] instead. Kept for backward compatibility. */
  registry?: string;
  registries?: RegistryEntry[];
}

/**
 * Read raw config from file, apply env overrides, and auto-migrate old format.
 */
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

  // Auto-migrate old single registry to registries array
  if (fileConfig.registry && !fileConfig.registries) {
    fileConfig.registries = [{ name: "default", url: fileConfig.registry, default: true }];
    delete fileConfig.registry;
  }

  // Environment variables take precedence over config file
  const envRegistry = process.env.RX_REGISTRY;
  let registry: string | undefined;
  if (envRegistry !== undefined) {
    registry = envRegistry || undefined;
  } else {
    const defaultEntry = fileConfig.registries?.find((r) => r.default);
    registry = defaultEntry?.url;
  }

  return {
    path: process.env.RX_HOME || fileConfig.path || RX_HOME,
    registry,
    registries: fileConfig.registries ?? [],
  };
}

export async function setConfig(key: keyof Config, value: string): Promise<void> {
  const config = await getConfig();
  (config as unknown as Record<string, string>)[key] = value;

  // Ensure directory exists
  await Bun.$`mkdir -p ${RX_HOME}`.quiet();

  await Bun.write(PATHS.config, JSON.stringify(config, null, 2));
}

export async function listConfig(): Promise<Config> {
  return getConfig();
}

// ============================================
// Registry management
// ============================================

async function readRawConfig(): Promise<Partial<Config>> {
  try {
    const file = Bun.file(PATHS.config);
    if (await file.exists()) {
      return await file.json();
    }
  } catch {
    // Ignore
  }
  return {};
}

async function writeConfig(config: Partial<Config>): Promise<void> {
  await Bun.$`mkdir -p ${RX_HOME}`.quiet();
  // Only persist path and registries, not the derived registry field
  const { registry: _, ...toWrite } = config;
  await Bun.write(PATHS.config, JSON.stringify(toWrite, null, 2));
}

function migrateConfig(config: Partial<Config>): Partial<Config> {
  if (config.registry && !config.registries) {
    config.registries = [{ name: "default", url: config.registry, default: true }];
    delete config.registry;
  }
  return config;
}

export async function addRegistry(name: string, url: string, setDefault?: boolean): Promise<void> {
  const raw = migrateConfig(await readRawConfig());
  const registries = raw.registries ?? [];

  if (registries.some((r) => r.name === name)) {
    throw new Error(`Registry "${name}" already exists`);
  }

  // First registry or explicitly set as default
  const isDefault = setDefault || registries.length === 0;

  if (isDefault) {
    for (const r of registries) r.default = false;
  }

  registries.push({ name, url, default: isDefault });
  raw.registries = registries;
  await writeConfig(raw);
}

export async function removeRegistry(name: string): Promise<void> {
  const raw = migrateConfig(await readRawConfig());
  const registries = raw.registries ?? [];
  const idx = registries.findIndex((r) => r.name === name);

  if (idx === -1) {
    throw new Error(`Registry "${name}" not found`);
  }

  registries.splice(idx, 1);
  raw.registries = registries;
  await writeConfig(raw);
}

export async function setDefaultRegistry(name: string): Promise<void> {
  const raw = migrateConfig(await readRawConfig());
  const registries = raw.registries ?? [];
  const entry = registries.find((r) => r.name === name);

  if (!entry) {
    throw new Error(`Registry "${name}" not found`);
  }

  for (const r of registries) r.default = r.name === name;
  raw.registries = registries;
  await writeConfig(raw);
}

export async function getRegistries(): Promise<RegistryEntry[]> {
  const raw = migrateConfig(await readRawConfig());
  return raw.registries ?? [];
}

export async function getRegistryByName(name: string): Promise<RegistryEntry | undefined> {
  const registries = await getRegistries();
  return registries.find((r) => r.name === name);
}

export async function getDefaultRegistry(): Promise<RegistryEntry | undefined> {
  const registries = await getRegistries();
  return registries.find((r) => r.default);
}
