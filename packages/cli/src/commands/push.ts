/**
 * rx push <locator> - Push local resource to remote registry
 */

import { defineCommand } from "citty";
import consola from "consola";
import { getClient } from "../lib/client.js";
import { getConfig } from "../lib/config.js";

export const push = defineCommand({
  meta: {
    name: "push",
    description: "Push local resource to remote registry",
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
      const config = await getConfig();
      if (!config.registry) {
        consola.error("No registry configured. Use: rx config set registry <url>");
        process.exit(1);
      }

      const rx = await getClient();
      await rx.push(args.locator);
      consola.success(`Pushed: ${args.locator}`);
    } catch (error) {
      consola.error(error instanceof Error ? error.message : "Failed to push resource");
      process.exit(1);
    }
  },
});
