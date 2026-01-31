/**
 * rx server - Start registry API server
 */

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
      default: "./data",
    },
  },
  async run({ args }) {
    const port = parseInt(args.port, 10);
    const storagePath = args.storage;

    const { createRegistryServer } = await import("@resourcexjs/server");
    const { serve } = await import("@hono/node-server");

    const app = createRegistryServer({ storagePath });

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
