/**
 * rx list - List local resources
 */

import { defineCommand } from "citty";
import consola from "consola";
import { getClient } from "../lib/client.js";

export const list = defineCommand({
  meta: {
    name: "list",
    description: "List local resources",
  },
  args: {
    query: {
      type: "positional",
      description: "Optional search query",
      required: false,
    },
  },
  async run({ args }) {
    try {
      const rx = await getClient();
      const results = await rx.search(args.query);

      if (results.length === 0) {
        consola.info("No resources found");
        return;
      }

      consola.info(`Found ${results.length} resource(s):\n`);
      for (const locator of results) {
        console.log(`  ${locator}`);
      }
    } catch (error) {
      consola.error(error instanceof Error ? error.message : "Failed to list resources");
      process.exit(1);
    }
  },
});
