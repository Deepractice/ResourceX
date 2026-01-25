import { readFile } from "node:fs/promises";
import { resolve, isAbsolute } from "node:path";
import type { BundledType, SandboxType, JSONSchema } from "./types.js";

/**
 * ResourceType source file structure.
 * This is what users write in their .type.ts files.
 */
interface ResourceTypeSource {
  name: string;
  aliases?: string[];
  description: string;
  schema?: JSONSchema;
  sandbox?: SandboxType;
  resolve: (rxr: unknown) => Promise<unknown>;
}

/**
 * Bundle a resource type from a source file.
 *
 * @param sourcePath - Path to the .type.ts file
 * @param basePath - Base path for resolving relative paths (defaults to cwd)
 * @returns BundledType ready for registry
 *
 * @example
 * ```typescript
 * const promptType = await bundleResourceType("./prompt.type.ts");
 * ```
 */
export async function bundleResourceType(
  sourcePath: string,
  basePath?: string
): Promise<BundledType> {
  // Resolve path
  const fullPath = isAbsolute(sourcePath)
    ? sourcePath
    : resolve(basePath ?? process.cwd(), sourcePath);

  // Read source file
  const source = await readFile(fullPath, "utf-8");

  // Bundle using Bun.build
  // @ts-expect-error - Bun global is available at runtime
  const result = await Bun.build({
    stdin: {
      contents: source,
      resolveDir: resolve(fullPath, ".."),
      loader: "ts",
    },
    target: "bun",
    format: "esm",
    minify: false,
  });

  if (!result.success) {
    const errors = result.logs.map((log: { message: string }) => log.message).join("\n");
    throw new Error(`Failed to bundle ${sourcePath}: ${errors}`);
  }

  // Get bundled code
  const bundledCode = await result.outputs[0].text();

  // Extract metadata by evaluating the module
  // We need to import dynamically to get the metadata
  const tempModule = await import(fullPath);
  const typeSource: ResourceTypeSource = tempModule.default;

  if (!typeSource.name) {
    throw new Error(`Resource type at ${sourcePath} must have a name`);
  }

  if (typeof typeSource.resolve !== "function") {
    throw new Error(`Resource type at ${sourcePath} must have a resolve function`);
  }

  return {
    name: typeSource.name,
    aliases: typeSource.aliases,
    description: typeSource.description ?? "",
    schema: typeSource.schema,
    code: bundledCode,
    sandbox: typeSource.sandbox ?? "none",
  };
}
