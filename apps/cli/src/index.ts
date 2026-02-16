#!/usr/bin/env bun
/**
 * ResourceX CLI - rx command
 */

import { defineCommand, runMain } from "citty";
import { add } from "./commands/add.js";
import { cache } from "./commands/cache.js";
import { config } from "./commands/config.js";
import { info } from "./commands/info.js";
import { list } from "./commands/list.js";
import { pull } from "./commands/pull.js";
import { push } from "./commands/push.js";
import { registry } from "./commands/registry.js";
import { remove } from "./commands/remove.js";
import { search } from "./commands/search.js";
import { server } from "./commands/server.js";
import { ingest } from "./commands/use.js";

const main = defineCommand({
  meta: {
    name: "rx",
    version: "0.1.0",
    description: "ResourceX CLI - Manage AI Agent resources",
  },
  subCommands: {
    add,
    list,
    info,
    remove,
    push,
    pull,
    search,
    ingest,
    config,
    registry,
    cache,
    server,
  },
});

runMain(main);
