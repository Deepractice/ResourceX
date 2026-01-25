import type { BundledType, ResolvedResource } from "./types.js";
import type { RXR } from "@resourcexjs/core";
import { ResourceTypeError } from "./errors.js";
import { builtinTypes } from "./builtinTypes.js";

/**
 * TypeHandlerChain - Manages resource type registration and resolution.
 * Uses BundledType for sandbox-compatible execution.
 */
export class TypeHandlerChain {
  private handlers: Map<string, BundledType> = new Map();

  private constructor() {
    // Auto-register builtin types
    for (const type of builtinTypes) {
      this.registerInternal(type);
    }
  }

  /**
   * Create a new TypeHandlerChain instance.
   * Each instance includes all builtin types (text, json, binary).
   */
  static create(): TypeHandlerChain {
    return new TypeHandlerChain();
  }

  /**
   * Internal registration (no duplicate check for builtins).
   */
  private registerInternal(type: BundledType): void {
    this.handlers.set(type.name, type);
    if (type.aliases) {
      for (const alias of type.aliases) {
        this.handlers.set(alias, type);
      }
    }
  }

  /**
   * Register an extension type (public, for user-defined types).
   * @throws ResourceTypeError if type is already registered
   */
  register(type: BundledType): void {
    if (this.handlers.has(type.name)) {
      throw new ResourceTypeError(`Type '${type.name}' is already registered`);
    }
    this.handlers.set(type.name, type);
    if (type.aliases) {
      for (const alias of type.aliases) {
        if (this.handlers.has(alias)) {
          throw new ResourceTypeError(`Alias '${alias}' conflicts with existing type or alias`);
        }
        this.handlers.set(alias, type);
      }
    }
  }

  /**
   * Check if a type is supported.
   */
  canHandle(typeName: string): boolean {
    return this.handlers.has(typeName);
  }

  /**
   * Get handler for a type.
   */
  getHandler(typeName: string): BundledType | undefined {
    return this.handlers.get(typeName);
  }

  /**
   * Get all supported type names (including aliases).
   */
  getSupportedTypes(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Resolve RXR content into structured result object.
   * Returns execute function that runs bundled code when called.
   * @throws ResourceTypeError if type is not supported
   */
  async resolve<TArgs = void, TResult = unknown>(
    rxr: RXR
  ): Promise<ResolvedResource<TArgs, TResult>> {
    const typeName = rxr.manifest.type;
    const handler = this.handlers.get(typeName);

    if (!handler) {
      throw new ResourceTypeError(`Unsupported resource type: ${typeName}`);
    }

    // Return execute function that runs bundled code on each call
    // This allows passing arguments and supports both sync and async results
    return {
      resource: rxr,
      schema: handler.schema,
      execute: async (args?: TArgs) => {
        return this.executeCode<TResult>(handler.code, rxr, args);
      },
    } as ResolvedResource<TArgs, TResult>;
  }

  /**
   * Execute bundled code with RXR context.
   * Currently uses eval for sandbox: "none".
   * Code format: expression that returns { resolve(rxr, args?) } object.
   */
  private async executeCode<TResult>(code: string, rxr: RXR, args?: unknown): Promise<TResult> {
    // Create async function from bundled code
    // Code is an expression like: ({ async resolve(rxr, args) { ... } })
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

    const wrappedCode = `
      const resolver = ${code};
      return resolver.resolve(rxr, args);
    `;

    const fn = new AsyncFunction("rxr", "args", wrappedCode);
    return fn(rxr, args);
  }

  /**
   * Clear all extension types (for testing).
   * Keeps builtin types intact.
   */
  clearExtensions(): void {
    this.handlers.clear();
    for (const type of builtinTypes) {
      this.registerInternal(type);
    }
  }
}
