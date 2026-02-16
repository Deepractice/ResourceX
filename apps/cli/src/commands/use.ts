/**
 * rx ingest <source> - Ingest and execute resource from any source
 */

import { defineCommand } from "citty";
import consola from "consola";
import { getClient } from "../lib/client.js";

export const ingest = defineCommand({
  meta: {
    name: "ingest",
    description: "Ingest and execute resource from any source (directory path or locator)",
  },
  args: {
    source: {
      type: "positional",
      description: "Resource source (directory path or locator, e.g., ./my-skill or hello:1.0.0)",
      required: true,
    },
  },
  async run({ args }) {
    try {
      const rx = await getClient();
      const result = await rx.ingest(args.source);

      // Output the result
      if (typeof result === "string") {
        console.log(result);
      } else if (result instanceof Uint8Array) {
        process.stdout.write(result);
      } else {
        console.log(JSON.stringify(result, null, 2));
      }
    } catch (error) {
      consola.error(error instanceof Error ? error.message : "Failed to ingest resource");
      process.exit(1);
    }
  },
});
