/**
 * rx use <locator> - Use and execute resource
 */

import { defineCommand } from "citty";
import consola from "consola";
import { getClient } from "../lib/client.js";

export const use = defineCommand({
  meta: {
    name: "use",
    description: "Use and execute resource",
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
      const executable = await rx.use(args.locator);
      const result = await executable.execute();

      // Output the result
      if (typeof result === "string") {
        console.log(result);
      } else if (result instanceof Uint8Array) {
        process.stdout.write(result);
      } else {
        console.log(JSON.stringify(result, null, 2));
      }
    } catch (error) {
      consola.error(error instanceof Error ? error.message : "Failed to use resource");
      process.exit(1);
    }
  },
});
