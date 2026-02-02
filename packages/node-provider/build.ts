/**
 * Bun Build Script for @resourcexjs/node-provider
 */

import { dts } from "bun-dts";

const pkg = await Bun.file("./package.json").json();
const outdir = "./dist";

await Bun.$`rm -rf ${outdir}`;

console.log(`Building @resourcexjs/node-provider v${pkg.version}\n`);

const result = await Bun.build({
  entrypoints: ["src/index.ts"],
  outdir,
  format: "esm",
  target: "node",
  sourcemap: "external",
  minify: false,
  plugins: [dts()],
  external: ["@resourcexjs/core"],
});

if (!result.success) {
  console.error("Build failed:");
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

console.log(`Build complete: ${result.outputs.length} files`);
