import type { ResourceX } from "resourcexjs";
import { createResourceX } from "resourcexjs";
import { z } from "zod";

export const pushTool = {
  name: "push",
  description: `Publish a local resource to a remote registry.

The resource must exist locally (added with 'add' command).

After pushing:
- Other users can pull the resource using the full locator
- Example: registry.example.com/my-prompt:1.0.0

Note: Registry must be specified either via:
- The 'registry' parameter
- RESOURCEX_REGISTRY environment variable`,

  parameters: z.object({
    locator: z
      .string()
      .describe("Locator of the local resource to push. " + "Example: 'my-prompt:1.0.0'"),
    registry: z
      .string()
      .optional()
      .describe(
        "Target registry URL. " +
          "Example: 'http://localhost:3000' or 'https://registry.example.com'. " +
          "If not specified, uses RESOURCEX_REGISTRY environment variable."
      ),
  }),

  execute:
    (rx: ResourceX, defaultRegistry?: string) =>
    async ({ locator, registry }: { locator: string; registry?: string }) => {
      const targetRegistry = registry || defaultRegistry;

      if (!targetRegistry) {
        return [
          "Error: No registry specified.",
          "",
          "Please either:",
          "  - Provide registry parameter: push(locator, registry)",
          "  - Set RESOURCEX_REGISTRY environment variable",
        ].join("\n");
      }

      // If a different registry is specified, create a new client with that registry
      // but keep the same storage path
      if (registry && registry !== defaultRegistry) {
        const storagePath = process.env.RESOURCEX_PATH;
        const client = createResourceX({ registry, path: storagePath });
        await client.push(locator);
      } else {
        await rx.push(locator);
      }

      return `Pushed: ${locator} → ${targetRegistry}`;
    },
};
