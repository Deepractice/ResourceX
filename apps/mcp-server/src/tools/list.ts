import type { ResourceX } from "resourcexjs";
import { z } from "zod";

export const listTool = {
  name: "list",
  description: `List all locally available resources.

Shows resources from:
- Local storage (added with 'add')
- Cache (pulled from registries)
- Linked directories (development links)

Optionally filter by keyword.`,

  parameters: z.object({
    query: z.string().optional().describe("Optional filter keyword to narrow results"),
  }),

  execute:
    (rx: ResourceX) =>
    async ({ query }: { query?: string }) => {
      const results = await rx.search(query);

      if (results.length === 0) {
        return query ? `No local resources matching "${query}"` : "No local resources found";
      }

      return `Local resources (${results.length}):\n\n${results.join("\n")}`;
    },
};
