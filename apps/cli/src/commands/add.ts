/**
 * rx add <path> - Add resource from directory to local storage
 */

import { defineCommand } from "citty";
import consola from "consola";
import { getClient } from "../lib/client.js";

export const add = defineCommand({
  meta: {
    name: "add",
    description: "Add resource from directory to local storage",
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
      const resource = await rx.add(args.path);

      consola.success(`Added resource:\n`);
      console.log(`  Locator:  ${resource.locator}`);
      console.log(`  Name:     ${resource.definition.name}`);
      console.log(`  Type:     ${resource.definition.type}`);
      console.log(`  Tag:      ${resource.definition.tag}`);
    } catch (error) {
      consola.error(error instanceof Error ? error.message : "Failed to add resource");
      process.exit(1);
    }
  },
});
