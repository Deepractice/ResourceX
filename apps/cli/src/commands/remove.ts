/**
 * rx remove <locator> - Remove resource from local storage
 */

import { defineCommand } from "citty";
import consola from "consola";
import { getClient } from "../lib/client.js";

export const remove = defineCommand({
  meta: {
    name: "remove",
    description: "Remove resource from local storage",
  },
  args: {
    locator: {
      type: "positional",
      description: "Resource locator (e.g., hello.text@1.0.0)",
      required: true,
    },
  },
  async run({ args }) {
    try {
      const rx = await getClient();

      const exists = await rx.has(args.locator);
      if (!exists) {
        consola.warn(`Resource not found: ${args.locator}`);
        return;
      }

      await rx.remove(args.locator);
      consola.success(`Removed: ${args.locator}`);
    } catch (error) {
      consola.error(error instanceof Error ? error.message : "Failed to remove resource");
      process.exit(1);
    }
  },
});
