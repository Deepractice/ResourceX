import type { ResourceX } from "resourcexjs";
import { z } from "zod";

export const addTool = {
  name: "add",
  description: `Add a resource from a local directory to ResourceX storage.

The directory must contain:
- resource.json: Metadata file with name, type, and optional tag
- content: The resource content (or other files depending on type)

After adding, the resource can be pushed to a registry.`,

  parameters: z.object({
    path: z
      .string()
      .describe(
        "Path to the resource directory containing resource.json. " +
          "Example: './my-prompt' or '/home/user/prompts/greeting'"
      ),
  }),

  execute:
    (rx: ResourceX) =>
    async ({ path }: { path: string }) => {
      const resource = await rx.add(path);
      return `Added: ${resource.locator}`;
    },
};
