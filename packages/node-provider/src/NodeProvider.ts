/**
 * NodeProvider - Node.js/Bun implementation of ResourceXProvider.
 *
 * Uses filesystem for blob storage and JSON files for manifest storage.
 */

import { homedir } from "node:os";
import { join } from "node:path";
import type {
  ResourceXProvider,
  ProviderConfig,
  ProviderStores,
  SourceLoader,
} from "@resourcexjs/core";
import { FolderLoader, FolderSourceLoader } from "@resourcexjs/core";
import { FileSystemRXAStore } from "./FileSystemRXAStore.js";
import { FileSystemRXMStore } from "./FileSystemRXMStore.js";

const DEFAULT_BASE_PATH = `${homedir()}/.resourcex`;

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
}
