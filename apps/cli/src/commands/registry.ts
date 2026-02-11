/**
 * rx registry - Manage registry configurations
 */

import { defineCommand } from "citty";
import consola from "consola";
import { addRegistry, removeRegistry, setDefaultRegistry, getRegistries } from "../lib/config.js";

const add = defineCommand({
  meta: {
    name: "add",
    description: "Add a registry",
  },
  args: {
    name: {
      type: "positional",
      description: "Registry name",
      required: true,
    },
    url: {
      type: "positional",
      description: "Registry URL",
      required: true,
    },
    default: {
      type: "boolean",
      description: "Set as default registry",
      default: false,
    },
  },
  async run({ args }) {
    try {
      await addRegistry(args.name, args.url, args.default);
      const registries = await getRegistries();
      const entry = registries.find((r) => r.name === args.name);
      const marker = entry?.default ? " (default)" : "";
      consola.success(`Added registry: ${args.name} → ${args.url}${marker}`);
    } catch (error) {
      consola.error(error instanceof Error ? error.message : "Failed to add registry");
      process.exit(1);
    }
  },
});

const remove = defineCommand({
  meta: {
    name: "remove",
    description: "Remove a registry",
  },
  args: {
    name: {
      type: "positional",
      description: "Registry name",
      required: true,
    },
  },
  async run({ args }) {
    try {
      await removeRegistry(args.name);
      consola.success(`Removed registry: ${args.name}`);
    } catch (error) {
      consola.error(error instanceof Error ? error.message : "Failed to remove registry");
      process.exit(1);
    }
  },
});

const listCmd = defineCommand({
  meta: {
    name: "list",
    description: "List all configured registries",
  },
  async run() {
    const registries = await getRegistries();

    if (registries.length === 0) {
      consola.info("No registries configured. Use: rx registry add <name> <url>");
      return;
    }

    consola.info("Registries:\n");
    for (const r of registries) {
      const marker = r.default ? " (default)" : "";
      console.log(`  ${r.name}\t${r.url}${marker}`);
    }
  },
});

const defaultCmd = defineCommand({
  meta: {
    name: "default",
    description: "Set default registry",
  },
  args: {
    name: {
      type: "positional",
      description: "Registry name",
      required: true,
    },
  },
  async run({ args }) {
    try {
      await setDefaultRegistry(args.name);
      consola.success(`Default registry set to: ${args.name}`);
    } catch (error) {
      consola.error(error instanceof Error ? error.message : "Failed to set default");
      process.exit(1);
    }
  },
});

export const registry = defineCommand({
  meta: {
    name: "registry",
    description: "Manage registry configurations",
  },
  subCommands: {
    add,
    remove,
    list: listCmd,
    default: defaultCmd,
  },
});
