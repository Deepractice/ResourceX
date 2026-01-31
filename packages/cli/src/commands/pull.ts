/**
 * rx pull <locator> - Pull resource from remote registry to local cache
 */

import { defineCommand } from "citty";
import consola from "consola";
import { getClient } from "../lib/client.js";
import { getConfig } from "../lib/config.js";

export const pull = defineCommand({
  meta: {
    name: "pull",
    description: "Pull resource from remote registry to local cache",
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
      await rx.pull(args.locator);
      consola.success(`Pulled: ${args.locator}`);
    } catch (error) {
      consola.error(error instanceof Error ? error.message : "Failed to pull resource");
      process.exit(1);
    }
  },
});
