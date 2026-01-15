/**
 * Bun Build Script for resourcexjs
 */

import { dts } from "bun-dts";

const outdir = "./dist";

await Bun.$`rm -rf ${outdir}`;

console.log("Building resourcexjs\n");

const result = await Bun.build({
  entrypoints: ["src/index.ts"],
  outdir,
  format: "esm",
  target: "node",
  sourcemap: "external",
  minify: false,
  plugins: [dts()],
});

if (!result.success) {
  console.error("Build failed:");
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

console.log(`Build complete: ${result.outputs.length} files`);
