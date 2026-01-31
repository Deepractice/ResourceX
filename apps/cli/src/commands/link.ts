/**
 * rx link <path> - Link resource directory for development
 */

import { defineCommand } from "citty";
import consola from "consola";
import { getClient } from "../lib/client.js";

export const link = defineCommand({
  meta: {
    name: "link",
    description: "Link resource directory for development",
  },
  args: {
    path: {
      type: "positional",
      description: "Path to resource directory",
      required: true,
    },
  },
  async run({ args }) {
    try {
      const rx = await getClient();
      await rx.link(args.path);
      consola.success(`Linked: ${args.path}`);
    } catch (error) {
      consola.error(error instanceof Error ? error.message : "Failed to link resource");
      process.exit(1);
    }
  },
});
