/**
 * rx push <locator> - Push local resource to remote registry
 */

import { defineCommand } from "citty";
import consola from "consola";
import { getClient } from "../lib/client.js";
import { getConfig, getRegistryByName } from "../lib/config.js";

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
    registry: {
      type: "string",
      alias: "r",
      description: "Registry name or URL (overrides default)",
    },
  },
  async run({ args }) {
    try {
      let registryUrl: string | undefined;

      if (args.registry) {
        // Try to resolve as registry name first, fallback to URL
        const entry = await getRegistryByName(args.registry);
        registryUrl = entry ? entry.url : args.registry;
      } else {
        // Use default registry
        const config = await getConfig();
        registryUrl = config.registry;
      }

      if (!registryUrl) {
        consola.error(
          "No registry configured. Use: rx registry add <name> <url> or --registry <name|url>"
        );
        process.exit(1);
      }

      const rx = await getClient({ registry: registryUrl });
      await rx.push(args.locator);
      consola.success(`Pushed: ${args.locator}`);
    } catch (error) {
      consola.error(error instanceof Error ? error.message : "Failed to push resource");
      process.exit(1);
    }
  },
});
