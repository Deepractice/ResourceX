import { describe, it, expect, beforeEach } from "bun:test";
import { TypeHandlerChain, ResourceTypeError, textType } from "../../src/index.js";
import type { ResourceType } from "../../src/types.js";
import { createRXM, createRXA, parseRXL, type RXR } from "@resourcexjs/core";

describe("TypeHandlerChain", () => {
  let chain: TypeHandlerChain;

  beforeEach(() => {
    chain = TypeHandlerChain.create();
  });

  describe("create", () => {
    it("creates a new instance with builtin types", () => {
      const instance = TypeHandlerChain.create();
      expect(instance.canHandle("text")).toBe(true);
      expect(instance.canHandle("json")).toBe(true);
      expect(instance.canHandle("binary")).toBe(true);
    });

    it("creates independent instances", () => {
      const instance1 = TypeHandlerChain.create();
      const instance2 = TypeHandlerChain.create();

      const customType: ResourceType = {
        name: "custom",
        description: "Custom type",
        resolver: textType.resolver,
      };

      instance1.register(customType);

      expect(instance1.canHandle("custom")).toBe(true);
      expect(instance2.canHandle("custom")).toBe(false);
    });
  });

  describe("builtin types", () => {
    it("has builtin types registered automatically", () => {
      expect(chain.canHandle("text")).toBe(true);
      expect(chain.canHandle("json")).toBe(true);
      expect(chain.canHandle("binary")).toBe(true);
    });

    it("supports builtin type aliases", () => {
      expect(chain.canHandle("txt")).toBe(true);
      expect(chain.canHandle("plaintext")).toBe(true);
      expect(chain.canHandle("config")).toBe(true);
      expect(chain.canHandle("manifest")).toBe(true);
      expect(chain.canHandle("bin")).toBe(true);
    });
  });

  describe("register", () => {
    it("registers an extension type", () => {
      const customType: ResourceType = {
        name: "custom",
        description: "Custom type",
        resolver: textType.resolver,
      };

      chain.register(customType);

      expect(chain.canHandle("custom")).toBe(true);
    });

    it("registers extension type aliases", () => {
      const customType: ResourceType = {
        name: "prompt",
        aliases: ["deepractice-prompt"],
        description: "Prompt type",
        resolver: textType.resolver,
      };

      chain.register(customType);

      expect(chain.canHandle("prompt")).toBe(true);
      expect(chain.canHandle("deepractice-prompt")).toBe(true);
    });

    it("throws error when registering duplicate type name", () => {
      const customType: ResourceType = {
        name: "text", // conflicts with builtin
        description: "Duplicate",
        resolver: textType.resolver,
      };

      expect(() => chain.register(customType)).toThrow(ResourceTypeError);
      expect(() => chain.register(customType)).toThrow("already registered");
    });
  });

  describe("canHandle", () => {
    it("returns true for registered types", () => {
      expect(chain.canHandle("text")).toBe(true);
      expect(chain.canHandle("txt")).toBe(true);
    });

    it("returns false for unregistered types", () => {
      expect(chain.canHandle("unknown")).toBe(false);
    });
  });

  describe("getHandler", () => {
    it("returns handler for registered type", () => {
      const handler = chain.getHandler("text");
      expect(handler).toBeDefined();
      expect(handler?.name).toBe("text");
    });

    it("returns handler for alias", () => {
      const handler = chain.getHandler("txt");
      expect(handler).toBeDefined();
      expect(handler?.name).toBe("text");
    });

    it("returns undefined for unregistered type", () => {
      const handler = chain.getHandler("unknown");
      expect(handler).toBeUndefined();
    });
  });

  describe("resolve", () => {
    it("resolves text resource to structured result", async () => {
      const manifest = createRXM({
        domain: "localhost",
        name: "test",
        type: "text",
        version: "1.0.0",
      });
      const rxr: RXR = {
        locator: parseRXL(manifest.toLocator()),
        manifest,
        archive: await createRXA({ content: "Hello" }),
      };

      const result = await chain.resolve<void, string>(rxr);

      expect(typeof result).toBe("object");
      expect(typeof result.execute).toBe("function");
      expect(result.schema).toBeUndefined();
      expect(result.resource).toBe(rxr);
      expect(await result.execute()).toBe("Hello");
    });

    it("resolves json resource to structured result", async () => {
      const manifest = createRXM({
        domain: "localhost",
        name: "test",
        type: "json",
        version: "1.0.0",
      });
      const rxr: RXR = {
        locator: parseRXL(manifest.toLocator()),
        manifest,
        archive: await createRXA({ content: '{"key": "value"}' }),
      };

      const result = await chain.resolve<void, { key: string }>(rxr);

      expect(typeof result).toBe("object");
      expect(typeof result.execute).toBe("function");
      expect(result.schema).toBeUndefined();
      expect(result.resource).toBe(rxr);
      expect(await result.execute()).toEqual({ key: "value" });
    });

    it("throws error for unsupported type", async () => {
      const manifest = createRXM({
        domain: "localhost",
        name: "test",
        type: "unknown",
        version: "1.0.0",
      });
      const rxr: RXR = {
        locator: parseRXL(manifest.toLocator()),
        manifest,
        archive: await createRXA({ content: "test" }),
      };

      await expect(chain.resolve(rxr)).rejects.toThrow(ResourceTypeError);
    });
  });

  describe("clearExtensions", () => {
    it("clears extension types but keeps builtins", () => {
      const customType: ResourceType = {
        name: "custom",
        description: "Custom type",
        resolver: textType.resolver,
      };

      chain.register(customType);
      expect(chain.canHandle("custom")).toBe(true);

      chain.clearExtensions();

      // Extension cleared
      expect(chain.canHandle("custom")).toBe(false);

      // Builtins still available
      expect(chain.canHandle("text")).toBe(true);
      expect(chain.canHandle("json")).toBe(true);
      expect(chain.canHandle("binary")).toBe(true);
    });
  });
});
