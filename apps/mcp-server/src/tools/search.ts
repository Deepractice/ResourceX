import type { ResourceX } from "resourcexjs";
import { z } from "zod";

export const searchTool = {
  name: "search",
  description: `Search for AI resources (prompts, tools, agents) by keyword.

Returns a list of matching resource locators that can be used with resolve().

Examples:
- search("code review") → find code review related prompts
- search("translator") → find translation tools
- search("") → list all available resources`,

  parameters: z.object({
    query: z.string().describe("Search keyword. Use empty string to list all resources."),
  }),

  execute:
    (rx: ResourceX) =>
    async ({ query }: { query: string }) => {
      const results = await rx.search(query || undefined);

      if (results.length === 0) {
        return query
          ? `No resources found matching "${query}"`
          : "No resources found in local storage";
      }

      return `Found ${results.length} resource(s):\n\n${results.join("\n")}`;
    },
};
