/**
 * rx unlink <locator> - Unlink development directory
 */

import { defineCommand } from "citty";
import consola from "consola";
import { getClient } from "../lib/client.js";

export const unlink = defineCommand({
  meta: {
    name: "unlink",
    description: "Unlink development directory",
  },
  args: {
    locator: {
      type: "positional",
      description: "Resource locator (e.g., hello:1.0.0)",
      required: true,
    },
  },
  async run({ args }) {
    try {
      const rx = await getClient();
      await rx.unlink(args.locator);
      consola.success(`Unlinked: ${args.locator}`);
    } catch (error) {
      consola.error(error instanceof Error ? error.message : "Failed to unlink resource");
      process.exit(1);
    }
  },
});
