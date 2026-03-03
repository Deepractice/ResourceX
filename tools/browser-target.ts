/**
 * Bun.build plugin that rejects Node.js built-in imports.
 *
 * Use this in packages that must be environment-agnostic (core, arp, resourcexjs, server).
 * Any `node:*` import will cause the build to fail with a clear error message.
 */

import type { BunPlugin } from "bun";

export const rejectNodeBuiltins: BunPlugin = {
  name: "reject-node-builtins",
  setup(build) {
    build.onResolve({ filter: /^node:/ }, (args) => {
      throw new Error(
        `[browser-target] "${args.path}" is not allowed.\n` +
          `  Importing Node.js built-ins violates the environment-agnostic contract.\n` +
          `  Move this dependency to @resourcexjs/node-provider or use a Web API alternative.\n` +
          `  Importer: ${args.importer}`
      );
    });
  },
};
