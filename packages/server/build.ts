/**
 * Bun Build Script for @resourcexjs/server
 */

import { dts } from "bun-dts";
import { rejectNodeBuiltins } from "../../tools/browser-target.ts";

const pkg = await Bun.file("./package.json").json();
const outdir = "./dist";

await Bun.$`rm -rf ${outdir}`;

console.log(`Building @resourcexjs/server v${pkg.version}\n`);

const result = await Bun.build({
  entrypoints: ["src/index.ts"],
  outdir,
  format: "esm",
  target: "browser",
  sourcemap: "external",
  minify: false,
  plugins: [rejectNodeBuiltins, dts()],
  external: ["@resourcexjs/core", "hono"],
});

if (!result.success) {
  console.error("Build failed:");
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

console.log(`Build complete: ${result.outputs.length} files`);
