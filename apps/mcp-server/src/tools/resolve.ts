import { z } from "zod";
import type { ResourceX } from "resourcexjs";

export const resolveTool = {
  name: "resolve",
  description: `Execute a resource and return its content.

This is the primary way to USE a resource. It:
1. Finds the resource (local storage, cache, or registry)
2. Auto-pulls from registry if not found locally
3. Executes the resource resolver
4. Returns the result

Examples:
- resolve("hello-prompt:1.0.0") → returns the prompt content
- resolve("config:latest") → returns the config data
- resolve("registry.example.com/tool:1.0.0") → pulls from registry and executes`,

  parameters: z.object({
    locator: z
      .string()
      .describe(
        "Resource locator in format 'name:tag' or 'registry/name:tag'. " +
          "Examples: 'my-prompt:1.0.0', 'my-prompt' (uses latest), " +
          "'registry.example.com/shared-prompt:1.0.0'"
      ),
  }),

  execute:
    (rx: ResourceX) =>
    async ({ locator }: { locator: string }) => {
      const executable = await rx.resolve(locator);
      const result = await executable.execute();

      if (typeof result === "string") {
        return result;
      }

      return JSON.stringify(result, null, 2);
    },
};
