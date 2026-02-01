import { build } from "bun";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync("./package.json", "utf-8"));
console.log(`Building ${pkg.name} v${pkg.version}\n`);

await build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  target: "node",
  format: "esm",
  minify: false,
  sourcemap: "external",
  external: [
    "resourcexjs",
    // Optional schema validators from xsschema (used by fastmcp)
    "@valibot/to-json-schema",
    "sury",
    "effect",
  ],
});

console.log("Build complete: dist/index.js");
