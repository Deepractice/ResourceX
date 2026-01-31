/**
 * rx search <query> - Search remote registry
 */

import { defineCommand } from "citty";
import consola from "consola";
import { getConfig } from "../lib/config.js";
import { buildSearchUrl, type SearchResponse } from "@resourcexjs/server";

export const search = defineCommand({
  meta: {
    name: "search",
    description: "Search remote registry",
  },
  args: {
    query: {
      type: "positional",
      description: "Search query",
      required: true,
    },
    limit: {
      type: "string",
      description: "Maximum results",
      default: "20",
    },
  },
  async run({ args }) {
    try {
      const config = await getConfig();
      if (!config.registry) {
        consola.error("No registry configured. Use: rx config set registry <url>");
        process.exit(1);
      }

      const url = buildSearchUrl(config.registry, {
        q: args.query,
        limit: Number(args.limit),
      });

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = (await response.json()) as SearchResponse;

      if (data.results.length === 0) {
        consola.info("No resources found");
        return;
      }

      consola.info(`Found ${data.total} resource(s):\n`);
      for (const item of data.results) {
        console.log(`  ${item.locator}`);
        if (item.type) {
          console.log(`    type: ${item.type}`);
        }
      }
    } catch (error) {
      consola.error(error instanceof Error ? error.message : "Search failed");
      process.exit(1);
    }
  },
});
