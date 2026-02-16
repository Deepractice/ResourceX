import type { ResourceX } from "resourcexjs";
import { z } from "zod";

export const ingestTool = {
  name: "ingest",
  description: `Ingest a resource from any source and return its content.

This is the primary way to get a resource. It:
1. Accepts directory paths, URLs, or locators
2. Auto-detects resource type from file patterns
3. Stores in CAS and executes the resolver
4. Returns the result

Examples:
- ingest("hello-prompt:1.0.0") → resolves from CAS
- ingest("./my-skill") → detects, packs, stores, executes
- ingest("registry.example.com/tool:1.0.0") → pulls from registry and executes`,

  parameters: z.object({
    source: z
      .string()
      .describe(
        "Resource source: directory path, URL, or locator. " +
          "Examples: './my-skill', 'my-prompt:1.0.0', " +
          "'registry.example.com/shared-prompt:1.0.0'"
      ),
  }),

  execute:
    (rx: ResourceX) =>
    async ({ source }: { source: string }) => {
      const result = await rx.ingest(source);

      if (typeof result === "string") {
        return result;
      }

      return JSON.stringify(result, null, 2);
    },
};
