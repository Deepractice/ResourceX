#!/usr/bin/env bun
/**
 * ResourceX CLI - rx command
 */

import { defineCommand, runMain } from "citty";
import { add } from "./commands/add.js";
import { link } from "./commands/link.js";
import { unlink } from "./commands/unlink.js";
import { list } from "./commands/list.js";
import { info } from "./commands/info.js";
import { remove } from "./commands/remove.js";
import { push } from "./commands/push.js";
import { pull } from "./commands/pull.js";
import { search } from "./commands/search.js";
import { resolve } from "./commands/resolve.js";
import { config } from "./commands/config.js";
import { server } from "./commands/server.js";
import { cache } from "./commands/cache.js";

const main = defineCommand({
  meta: {
    name: "rx",
    version: "0.1.0",
    description: "ResourceX CLI - Manage AI Agent resources",
  },
  subCommands: {
    add,
    link,
    unlink,
    list,
    info,
    remove,
    push,
    pull,
    search,
    resolve,
    config,
    cache,
    server,
  },
});

runMain(main);
