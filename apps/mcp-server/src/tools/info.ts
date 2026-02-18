import type { ResourceX } from "resourcexjs";
import { z } from "zod";

export const infoTool = {
  name: "info",
  description: `Get detailed information about a resource.

Returns metadata including:
- definition: name, type, tag, description, author, registry
- source: file tree with sizes, content preview
- archive: packaging metadata

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
      const { definition, source } = resource;

      const lines = [
        `Name:     ${definition.name}`,
        `Type:     ${definition.type}`,
        `Tag:      ${definition.tag}`,
      ];

      if (definition.registry) {
        lines.push(`Registry: ${definition.registry}`);
      }

      if (definition.path) {
        lines.push(`Path:     ${definition.path}`);
      }

      if (definition.description) {
        lines.push(`Desc:     ${definition.description}`);
      }

      if (definition.author) {
        lines.push(`Author:   ${definition.author}`);
      }

      if (source.files) {
        const fileNames = collectFileNames(source.files);
        if (fileNames.length > 0) {
          lines.push(`Files:    ${fileNames.join(", ")}`);
        }
      }

      if (source.preview) {
        lines.push("");
        lines.push(`Preview:`);
        lines.push(source.preview.split("\n").slice(0, 5).join("\n"));
      }

      return lines.join("\n");
    },
};

/**
 * Collect flat file names from a FileTree for display.
 */
function collectFileNames(tree: Record<string, unknown>, prefix = ""): string[] {
  const names: string[] = [];
  for (const [key, value] of Object.entries(tree)) {
    if (value && typeof value === "object" && "size" in value) {
      names.push(`${prefix}${key}`);
    } else if (value && typeof value === "object") {
      names.push(...collectFileNames(value as Record<string, unknown>, `${prefix}${key}`));
    }
  }
  return names;
}
