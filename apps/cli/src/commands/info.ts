/**
 * rx info <locator> - Show detailed resource information
 */

import { defineCommand } from "citty";
import consola from "consola";
import { getClient } from "../lib/client.js";

export const info = defineCommand({
  meta: {
    name: "info",
    description: "Show detailed resource information",
  },
  args: {
    locator: {
      type: "positional",
      description: "Resource locator (e.g., hello:1.0.0)",
      required: true,
    },
  },
  async run({ args }) {
    try {
      const rx = await getClient();
      const resource = await rx.info(args.locator);

      console.log();
      console.log(`  ${resource.name}:${resource.version}`);
      console.log(`  ${"─".repeat(40)}`);
      console.log();
      console.log(`  Locator:  ${resource.locator}`);
      if (resource.registry) {
        console.log(`  Registry: ${resource.registry}`);
      }
      if (resource.path) {
        console.log(`  Path:     ${resource.path}`);
      }
      console.log(`  Name:     ${resource.name}`);
      console.log(`  Type:     ${resource.type}`);
      console.log(`  Version:  ${resource.version}`);
      console.log();

      if (resource.files?.length) {
        console.log(`  Files:`);
        printFileTree(resource.files);
      }
      console.log();
    } catch (error) {
      consola.error(error instanceof Error ? error.message : "Resource not found");
      process.exit(1);
    }
  },
});

/**
 * Print files as a tree structure
 */
function printFileTree(files: string[]): void {
  // Sort files for consistent output
  const sorted = [...files].sort();

  // Build tree structure
  const tree: Record<string, string[]> = {};
  const rootFiles: string[] = [];

  for (const file of sorted) {
    const parts = file.split("/");
    if (parts.length === 1) {
      rootFiles.push(file);
    } else {
      const dir = parts[0];
      const rest = parts.slice(1).join("/");
      if (!tree[dir]) {
        tree[dir] = [];
      }
      tree[dir].push(rest);
    }
  }

  // Print root files
  const dirs = Object.keys(tree).sort();
  const allItems = [...dirs, ...rootFiles];

  for (let i = 0; i < allItems.length; i++) {
    const item = allItems[i];
    const isLast = i === allItems.length - 1;
    const prefix = isLast ? "└── " : "├── ";

    if (tree[item]) {
      // It's a directory
      console.log(`      ${prefix}${item}/`);
      printSubTree(tree[item], isLast ? "    " : "│   ");
    } else {
      // It's a file
      console.log(`      ${prefix}${item}`);
    }
  }
}

function printSubTree(files: string[], indent: string): void {
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const isLast = i === files.length - 1;
    const prefix = isLast ? "└── " : "├── ";
    console.log(`      ${indent}${prefix}${file}`);
  }
}
