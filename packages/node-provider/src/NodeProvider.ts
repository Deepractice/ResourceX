/**
 * NodeProvider - Node.js/Bun implementation of ResourceXProvider.
 *
 * Uses filesystem for blob storage and JSON files for manifest storage.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import type {
  ProviderConfig,
  ProviderDefaults,
  ProviderStores,
  RegistryEntry,
  ResourceXProvider,
  SourceLoader,
} from "@resourcexjs/core";
import { FolderSourceLoader } from "@resourcexjs/core";
import { FileSystemRXAStore } from "./FileSystemRXAStore.js";
import { FileSystemRXMStore } from "./FileSystemRXMStore.js";

const DEFAULT_BASE_PATH = `${homedir()}/.deepractice/resourcex`;

/**
 * Node.js/Bun provider for ResourceX.
 *
 * Storage structure:
 * - ~/.resourcex/blobs/     - Content-addressable blob storage
 * - ~/.resourcex/manifests/ - Manifest JSON files
 */
export class NodeProvider implements ResourceXProvider {
  readonly platform = "node";

  createStores(config: ProviderConfig): ProviderStores {
    const basePath = (config.path as string) ?? DEFAULT_BASE_PATH;

    return {
      rxaStore: new FileSystemRXAStore(join(basePath, "blobs")),
      rxmStore: new FileSystemRXMStore(join(basePath, "manifests")),
    };
  }

  createSourceLoader(_config: ProviderConfig): SourceLoader {
    return new FolderSourceLoader();
  }

  getDefaults(config: ProviderConfig): ProviderDefaults {
    // 1. Environment variable takes highest priority
    const envRegistry = process.env.RESOURCEX_REGISTRY;
    if (envRegistry) {
      return { registry: envRegistry };
    }

    // 2. Read config.json from storage path
    const basePath = (config.path as string) ?? DEFAULT_BASE_PATH;
    const configPath = join(basePath, "config.json");

    try {
      if (existsSync(configPath)) {
        const raw = JSON.parse(readFileSync(configPath, "utf-8"));

        // Support registries[] array (new format)
        if (raw.registries) {
          const defaultEntry = raw.registries.find((r: { default?: boolean }) => r.default);
          if (defaultEntry?.url) return { registry: defaultEntry.url };
        }

        // Support legacy single registry field
        if (raw.registry) return { registry: raw.registry };
      }
    } catch {
      // Ignore config read errors
    }

    return {};
  }

  private configPath(config: ProviderConfig): string {
    const basePath = (config.path as string) ?? DEFAULT_BASE_PATH;
    return join(basePath, "config.json");
  }

  private readConfig(config: ProviderConfig): { registries?: RegistryEntry[] } {
    const configPath = this.configPath(config);
    try {
      if (existsSync(configPath)) {
        const raw = JSON.parse(readFileSync(configPath, "utf-8"));
        // Auto-migrate old single registry field
        if (raw.registry && !raw.registries) {
          raw.registries = [{ name: "default", url: raw.registry, default: true }];
          delete raw.registry;
        }
        return raw;
      }
    } catch {
      // Ignore
    }
    return {};
  }

  private writeConfig(config: ProviderConfig, data: { registries?: RegistryEntry[] }): void {
    const configPath = this.configPath(config);
    mkdirSync(dirname(configPath), { recursive: true });
    writeFileSync(configPath, JSON.stringify(data, null, 2));
  }

  getRegistries(config: ProviderConfig): RegistryEntry[] {
    return this.readConfig(config).registries ?? [];
  }

  addRegistry(config: ProviderConfig, name: string, url: string, setDefault?: boolean): void {
    const data = this.readConfig(config);
    const registries = data.registries ?? [];

    if (registries.some((r) => r.name === name)) {
      throw new Error(`Registry "${name}" already exists`);
    }

    const isDefault = setDefault || registries.length === 0;
    if (isDefault) {
      for (const r of registries) r.default = false;
    }

    registries.push({ name, url, default: isDefault });
    data.registries = registries;
    this.writeConfig(config, data);
  }

  removeRegistry(config: ProviderConfig, name: string): void {
    const data = this.readConfig(config);
    const registries = data.registries ?? [];
    const idx = registries.findIndex((r) => r.name === name);

    if (idx === -1) {
      throw new Error(`Registry "${name}" not found`);
    }

    registries.splice(idx, 1);
    data.registries = registries;
    this.writeConfig(config, data);
  }

  setDefaultRegistry(config: ProviderConfig, name: string): void {
    const data = this.readConfig(config);
    const registries = data.registries ?? [];
    const entry = registries.find((r) => r.name === name);

    if (!entry) {
      throw new Error(`Registry "${name}" not found`);
    }

    for (const r of registries) r.default = r.name === name;
    data.registries = registries;
    this.writeConfig(config, data);
  }
}
