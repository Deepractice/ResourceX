import type { RXR } from "@resourcexjs/core";
import { extract } from "@resourcexjs/core";
import type { IsolatorType, ResolveContext } from "@resourcexjs/type";

/**
 * ResolverExecutor - Executes bundled resolver code in sandbox.
 *
 * Responsibilities:
 * 1. Pre-process RXR → ResolveContext (extract files)
 * 2. Serialize context for sandbox
 * 3. Execute resolver code in sandbox
 * 4. Return result
 */
export interface ResolverExecutor {
  /**
   * Execute resolver code with the given RXR and arguments.
   *
   * @param code - Bundled resolver code string
   * @param rxr - Resource to resolve
   * @param args - Optional arguments for the resolver
   * @returns Result from the resolver
   */
  execute<TResult>(code: string, rxr: RXR, args?: unknown): Promise<TResult>;
}

/**
 * Create a ResolverExecutor for the given isolator type.
 *
 * @param isolator - SandboX isolator type
 * @returns ResolverExecutor instance
 *
 * @example
 * const executor = createResolverExecutor("none");
 * const result = await executor.execute(code, rxr);
 */
export function createResolverExecutor(isolator: IsolatorType): ResolverExecutor {
  return new SandboxResolverExecutor(isolator);
}

/**
 * Convert RXR to ResolveContext (pure data, serializable).
 */
async function toResolveContext(rxr: RXR): Promise<ResolveContext> {
  const filesRecord = await extract(rxr.archive);

  // Convert Record<string, Buffer> to Record<string, Uint8Array>
  const files: Record<string, Uint8Array> = {};
  for (const [path, buffer] of Object.entries(filesRecord)) {
    files[path] = new Uint8Array(buffer);
  }

  return {
    manifest: {
      domain: rxr.manifest.domain,
      path: rxr.manifest.path,
      name: rxr.manifest.name,
      type: rxr.manifest.type,
      version: rxr.manifest.version,
    },
    files,
  };
}

/**
 * Parse bundled code to extract resolver variable name.
 *
 * Code formats:
 * 1. ESM bundled: `// @resolver: varName\n...code...`
 * 2. Legacy object literal: `({ async resolve(ctx, args) { ... } })`
 *
 * @returns { isEsm: boolean, varName?: string }
 */
function parseCodeFormat(code: string): { isEsm: boolean; varName?: string } {
  const match = code.match(/^\/\/\s*@resolver:\s*(\w+)/);
  if (match) {
    return { isEsm: true, varName: match[1] };
  }
  return { isEsm: false };
}

/**
 * SandboX-based ResolverExecutor implementation.
 *
 * Uses SandboX for code execution with configurable isolation levels.
 * Supports both ESM bundled code and legacy object literal format.
 */
class SandboxResolverExecutor implements ResolverExecutor {
  constructor(private readonly isolator: IsolatorType) {}

  async execute<TResult>(code: string, rxr: RXR, args?: unknown): Promise<TResult> {
    // 1. Pre-process: RXR → ResolveContext
    const ctx = await toResolveContext(rxr);

    // 2. Import SandboX
    const { createSandbox } = await import("sandboxxjs");

    const sandbox = createSandbox({
      isolator: this.isolator,
      runtime: "node",
    });

    try {
      // 3. Serialize context and args
      const ctxJson = JSON.stringify(ctx, (_, value) => {
        // Convert Uint8Array to array for JSON serialization
        if (value instanceof Uint8Array) {
          return { __type: "Uint8Array", data: Array.from(value) };
        }
        return value;
      });
      const argsJson = args !== undefined ? JSON.stringify(args) : "undefined";

      // 4. Parse code format
      const { isEsm, varName } = parseCodeFormat(code);

      // 5. Build execution code based on format
      let executionCode: string;

      if (isEsm && varName) {
        // ESM bundled code: variable is already declared, use it directly
        executionCode = `
          ${code}

          (async () => {
            // Deserialize context
            const ctxRaw = ${ctxJson};
            const ctx = {
              manifest: ctxRaw.manifest,
              files: {}
            };
            for (const [path, value] of Object.entries(ctxRaw.files)) {
              ctx.files[path] = new Uint8Array(value.data);
            }

            const args = ${argsJson};

            // Execute resolver using the exported variable
            const result = await ${varName}.resolve(ctx, args);

            // Output result via console.log (execute() returns stdout)
            console.log(JSON.stringify(result));
          })();
        `;
      } else {
        // Legacy object literal format: ({ async resolve(ctx, args) { ... } })
        executionCode = `
          (async () => {
            // Deserialize context
            const ctxRaw = ${ctxJson};
            const ctx = {
              manifest: ctxRaw.manifest,
              files: {}
            };
            for (const [path, value] of Object.entries(ctxRaw.files)) {
              ctx.files[path] = new Uint8Array(value.data);
            }

            const args = ${argsJson};

            // Execute resolver (legacy object literal)
            const resolver = ${code};
            const result = await resolver.resolve(ctx, args);

            // Output result via console.log (execute() returns stdout)
            console.log(JSON.stringify(result));
          })();
        `;
      }

      // 6. Execute in sandbox (script mode - returns stdout)
      const { stdout } = await sandbox.execute(executionCode);

      // 7. Parse stdout and return result
      return JSON.parse(stdout.trim()) as TResult;
    } finally {
      await sandbox.destroy();
    }
  }
}
