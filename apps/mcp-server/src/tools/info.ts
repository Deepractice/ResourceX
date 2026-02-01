import { z } from "zod";
import type { ResourceX } from "resourcexjs";

export const infoTool = {
  name: "info",
  description: `Get detailed information about a resource.

Returns metadata including:
- name: Resource name
- type: Resource type (text, json, binary, etc.)
- tag: Version tag
- registry: Source registry (if from remote)
- files: List of files in the resource archive

Use this to inspect a resource before using it.`,

  parameters: z.object({
    locator: z
      .string()
      .describe(
        "Resource locator to inspect. " +
          "Examples: 'my-prompt:1.0.0', 'registry.example.com/tool:latest'"
      ),
  }),

  execute:
    (rx: ResourceX) =>
    async ({ locator }: { locator: string }) => {
      const resource = await rx.info(locator);

      const lines = [
        `Name:     ${resource.name}`,
        `Type:     ${resource.type}`,
        `Tag:      ${resource.tag}`,
      ];

      if (resource.registry) {
        lines.push(`Registry: ${resource.registry}`);
      }

      if (resource.path) {
        lines.push(`Path:     ${resource.path}`);
      }

      if (resource.files && resource.files.length > 0) {
        lines.push(`Files:    ${resource.files.join(", ")}`);
      }

      return lines.join("\n");
    },
};
