/**
 * Bun Build Script for @resourcexjs/cli
 */

const pkg = await Bun.file("./package.json").json();
const outdir = "./dist";

await Bun.$`rm -rf ${outdir}`;

console.log(`Building @resourcexjs/cli v${pkg.version}\n`);

const result = await Bun.build({
  entrypoints: ["src/index.ts"],
  outdir,
  format: "esm",
  target: "bun",
  sourcemap: "external",
  minify: false,
  external: ["resourcexjs", "@resourcexjs/server"],
});

if (!result.success) {
  console.error("Build failed:");
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

// Add shebang to the output file
const indexPath = `${outdir}/index.js`;
const content = await Bun.file(indexPath).text();
await Bun.write(indexPath, `#!/usr/bin/env bun\n${content}`);

// Make executable
await Bun.$`chmod +x ${indexPath}`;

console.log(`Build complete: ${result.outputs.length} files`);
