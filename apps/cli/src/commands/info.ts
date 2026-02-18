/**
 * rx info <locator> - Show detailed resource information
 */

import { defineCommand } from "citty";
import consola from "consola";
import type { FileEntry, FileTree } from "resourcexjs";
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
      const { definition, source } = resource;

      console.log();
      console.log(`  ${definition.name}:${definition.tag}`);
      console.log(`  ${"─".repeat(40)}`);
      console.log();
      console.log(`  Locator:  ${resource.locator}`);
      if (definition.registry) {
        console.log(`  Registry: ${definition.registry}`);
      }
      if (definition.path) {
        console.log(`  Path:     ${definition.path}`);
      }
      console.log(`  Name:     ${definition.name}`);
      console.log(`  Type:     ${definition.type}`);
      console.log(`  Tag:      ${definition.tag}`);
      if (definition.description) {
        console.log(`  Desc:     ${definition.description}`);
      }
      if (definition.author) {
        console.log(`  Author:   ${definition.author}`);
      }
      console.log();

      if (source.files && Object.keys(source.files).length > 0) {
        console.log(`  Files:`);
        printFileTree(source.files);
      }

      if (source.preview) {
        console.log();
        console.log(`  Preview:`);
        const lines = source.preview.split("\n").slice(0, 5);
        for (const line of lines) {
          console.log(`    ${line}`);
        }
      }
      console.log();
    } catch (error) {
      consola.error(error instanceof Error ? error.message : "Resource not found");
      process.exit(1);
    }
  },
});

/**
 * Check if a FileTree value is a FileEntry (leaf node).
 */
function isFileEntry(value: FileEntry | FileTree): value is FileEntry {
  return "size" in value && typeof (value as FileEntry).size === "number";
}

/**
 * Print structured file tree.
 */
function printFileTree(tree: FileTree, indent = ""): void {
  const entries = Object.entries(tree);

  for (let i = 0; i < entries.length; i++) {
    const [name, value] = entries[i];
    const isLast = i === entries.length - 1;
    const prefix = isLast ? "└── " : "├── ";
    const childIndent = indent + (isLast ? "    " : "│   ");

    if (isFileEntry(value)) {
      console.log(`      ${indent}${prefix}${name} (${formatSize(value.size)})`);
    } else {
      console.log(`      ${indent}${prefix}${name}`);
      printFileTree(value, childIndent);
    }
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
