/**
 * rx config - Manage CLI configuration
 */

import { defineCommand } from "citty";
import consola from "consola";
import { getConfig, setConfig, type Config } from "../lib/config.js";

const set = defineCommand({
  meta: {
    name: "set",
    description: "Set configuration value",
  },
  args: {
    key: {
      type: "positional",
      description: "Configuration key (path, domain, registry)",
      required: true,
    },
    value: {
      type: "positional",
      description: "Configuration value",
      required: true,
    },
  },
  async run({ args }) {
    const validKeys = ["path", "domain", "registry"];
    if (!validKeys.includes(args.key)) {
      consola.error(`Invalid key: ${args.key}. Valid keys: ${validKeys.join(", ")}`);
      process.exit(1);
    }

    await setConfig(args.key as keyof Config, args.value);
    consola.success(`Set ${args.key} = ${args.value}`);
  },
});

const list = defineCommand({
  meta: {
    name: "list",
    description: "List configuration",
  },
  async run() {
    const config = await getConfig();
    consola.info("Configuration:\n");
    console.log(`  path:     ${config.path}`);
    console.log(`  domain:   ${config.domain}`);
    console.log(`  registry: ${config.registry || "(not set)"}`);
  },
});

export const config = defineCommand({
  meta: {
    name: "config",
    description: "Manage CLI configuration",
  },
  subCommands: {
    set,
    list,
  },
});
