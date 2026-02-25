import { mkdir, rm, writeFile } from "node:fs/promises";
import type { Server } from "node:http";
import { createServer } from "node:net";
import { join } from "node:path";
import { After, Before, Given, When } from "@cucumber/cucumber";
import { NodeProvider } from "@resourcexjs/node-provider";
import type { ResourceX } from "resourcexjs";
import { createResourceX, setProvider } from "resourcexjs";

setProvider(new NodeProvider());

const TEST_DIR = join(process.cwd(), ".test-bdd-registry-freshness");

interface FreshnessWorld {
  rx: ResourceX;
  server: Server | null;
  serverRx: ResourceX;
  serverPort: number;
  result: unknown;
}

/**
 * Find an available port dynamically.
 */
function findAvailablePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.listen(0, () => {
      const addr = srv.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      srv.close(() => resolve(port));
    });
    srv.on("error", reject);
  });
}

// ============================================
// Hooks
// ============================================

Before({ tags: "@registry-freshness" }, async function (this: FreshnessWorld) {
  await mkdir(TEST_DIR, { recursive: true });
  this.server = null;
  this.result = null;
  this.serverPort = 0;
});

After({ tags: "@registry-freshness" }, async function (this: FreshnessWorld) {
  if (this.server) {
    this.server.close();
    this.server = null;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  try {
    await rm(TEST_DIR, { recursive: true, force: true });
  } catch {
    // Ignore
  }
});

// ============================================
// Helper
// ============================================

async function createAndPushResource(
  serverRx: ResourceX,
  basePath: string,
  locator: string,
  content: string
): Promise<void> {
  const [name, tag] = locator.split(":");
  const dir = join(basePath, `${name}-${tag}-${Date.now()}`);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "content"), content);
  await writeFile(join(dir, "resource.json"), JSON.stringify({ name, type: "text", tag }));
  await serverRx.add(dir);
  await serverRx.push(locator);
}

// ============================================
// Given steps
// ============================================

Given("a local registry server is running", async function (this: FreshnessWorld) {
  const { createRegistryServer } = await import("@resourcexjs/server");
  const { FileSystemRXAStore, FileSystemRXMStore } = await import("@resourcexjs/node-provider");
  const { serve } = await import("@hono/node-server");

  this.serverPort = await findAvailablePort();
  const serverUrl = `http://localhost:${this.serverPort}`;

  const serverDataPath = join(TEST_DIR, "server-data");
  await mkdir(serverDataPath, { recursive: true });

  const app = createRegistryServer({
    rxaStore: new FileSystemRXAStore(join(serverDataPath, "blobs")),
    rxmStore: new FileSystemRXMStore(join(serverDataPath, "manifests")),
  });

  await new Promise<void>((resolve) => {
    this.server = serve({ fetch: app.fetch, port: this.serverPort }, () => resolve());
  });

  // Client-side ResourceX pointing to this local registry
  this.rx = createResourceX({ path: join(TEST_DIR, "client"), registry: serverUrl });

  // Server-side ResourceX for pushing
  this.serverRx = createResourceX({ path: join(TEST_DIR, "server-rx"), registry: serverUrl });
});

Given(
  "I push resource {string} with content {string} to the local registry",
  async function (this: FreshnessWorld, locator: string, content: string) {
    await createAndPushResource(this.serverRx, TEST_DIR, locator, content);
  }
);

Given(
  "I pull {string} from the local registry",
  async function (this: FreshnessWorld, locator: string) {
    await this.rx.pull(locator);
  }
);

// ============================================
// When steps
// ============================================

When(
  "I update resource {string} with content {string} on the local registry",
  async function (this: FreshnessWorld, locator: string, content: string) {
    await createAndPushResource(this.serverRx, TEST_DIR, locator, content);
  }
);

When(
  "I resolve the cached registry resource {string}",
  async function (this: FreshnessWorld, locator: string) {
    // Resolve with registry prefix so freshness check triggers
    const registryLocator = `localhost:${this.serverPort}/${locator}`;
    this.result = await this.rx.resolve(registryLocator);
  }
);

// Then steps reuse "execute should return {string}" from resourcex.steps.ts
