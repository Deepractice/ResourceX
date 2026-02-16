/**
 * rx server - Start registry API server
 *
 * Server storage is separate from client (~/.resourcex)
 * Default: ./data (current directory)
 */

import { join } from "node:path";
import { defineCommand } from "citty";
import consola from "consola";

export const server = defineCommand({
  meta: {
    name: "server",
    description: "Start registry API server",
  },
  args: {
    port: {
      type: "string",
      description: "Port to listen on",
      default: "3000",
    },
    storage: {
      type: "string",
      description: "Storage path for resources",
    },
  },
  async run({ args }) {
    const port = parseInt(args.port, 10);
    const storagePath = args.storage || "./data";

    const { createRegistryServer } = await import("@resourcexjs/server");
    const { FileSystemRXAStore, FileSystemRXMStore } = await import("@resourcexjs/node-provider");
    const { serve } = await import("@hono/node-server");

    const app = createRegistryServer({
      rxaStore: new FileSystemRXAStore(join(storagePath, "blobs")),
      rxmStore: new FileSystemRXMStore(join(storagePath, "manifests")),
    });

    consola.info(`Starting registry server...`);
    console.log();
    console.log(`  Port:     ${port}`);
    console.log(`  Storage:  ${storagePath}`);
    console.log();

    serve({ fetch: app.fetch, port }, () => {
      consola.success(`Registry running at http://localhost:${port}`);
      console.log();
      console.log("  Endpoints:");
      console.log("    GET  /health           Health check");
      console.log("    POST /publish          Publish resource");
      console.log("    GET  /resource/:loc    Get manifest");
      console.log("    GET  /content/:loc     Get content");
      console.log("    GET  /search           Search resources");
      console.log();
    });

    // Keep process running
    await new Promise(() => {});
  },
});
