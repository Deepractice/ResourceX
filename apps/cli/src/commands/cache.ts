/**
 * rx cache - Cache management commands
 */

import { defineCommand } from "citty";
import consola from "consola";
import { getClient } from "../lib/client.js";

const clear = defineCommand({
  meta: {
    name: "clear",
    description: "Clear all cached resources",
  },
  args: {
    registry: {
      type: "string",
      alias: "r",
      description: "Only clear resources from this registry",
    },
  },
  async run({ args }) {
    try {
      const rx = await getClient();
      await rx.clearCache(args.registry);

      if (args.registry) {
        consola.success(`Cleared cache for registry: ${args.registry}`);
      } else {
        consola.success("Cleared all cached resources");
      }
    } catch (error) {
      consola.error(error instanceof Error ? error.message : "Failed to clear cache");
      process.exit(1);
    }
  },
});

export const cache = defineCommand({
  meta: {
    name: "cache",
    description: "Manage cached resources",
  },
  subCommands: {
    clear,
  },
});
