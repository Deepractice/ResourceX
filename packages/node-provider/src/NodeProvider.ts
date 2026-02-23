/**
 * NodeProvider - Node.js/Bun implementation of ResourceXProvider.
 *
 * Uses filesystem for blob storage and JSON files for manifest storage.
 */

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type {
  ProviderConfig,
  ProviderDefaults,
  ProviderStores,
  ResourceXProvider,
  SourceLoader,
} from "@resourcexjs/core";
import { FolderLoader, FolderSourceLoader } from "@resourcexjs/core";
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

  createLoader(_config: ProviderConfig): FolderLoader {
    return new FolderLoader();
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
}
