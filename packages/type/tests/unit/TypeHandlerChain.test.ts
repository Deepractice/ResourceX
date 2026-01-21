import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import {
  TypeHandlerChain,
  globalTypeHandlerChain,
  ResourceTypeError,
  textType,
  jsonType,
  binaryType,
} from "../../src/index.js";
import type { RXR, ResourceType } from "../../src/types.js";
import { createRXM, createRXC, parseRXL } from "@resourcexjs/core";

describe("TypeHandlerChain (global singleton)", () => {
  // Clean up extension types after each test
  afterEach(() => {
    globalTypeHandlerChain.clearExtensions();
  });

  describe("builtin types", () => {
    it("has builtin types registered automatically", () => {
      expect(globalTypeHandlerChain.canHandle("text")).toBe(true);
      expect(globalTypeHandlerChain.canHandle("json")).toBe(true);
      expect(globalTypeHandlerChain.canHandle("binary")).toBe(true);
    });

    it("supports builtin type aliases", () => {
      expect(globalTypeHandlerChain.canHandle("txt")).toBe(true);
      expect(globalTypeHandlerChain.canHandle("plaintext")).toBe(true);
      expect(globalTypeHandlerChain.canHandle("config")).toBe(true);
      expect(globalTypeHandlerChain.canHandle("manifest")).toBe(true);
      expect(globalTypeHandlerChain.canHandle("bin")).toBe(true);
    });
  });

  describe("register", () => {
    it("registers an extension type", () => {
      const customType: ResourceType = {
        name: "custom",
        description: "Custom type",
        serializer: textType.serializer,
        resolver: textType.resolver,
      };

      globalTypeHandlerChain.register(customType);

      expect(globalTypeHandlerChain.canHandle("custom")).toBe(true);
    });

    it("registers extension type aliases", () => {
      const customType: ResourceType = {
        name: "prompt",
        aliases: ["deepractice-prompt"],
        description: "Prompt type",
        serializer: textType.serializer,
        resolver: textType.resolver,
      };

      globalTypeHandlerChain.register(customType);

      expect(globalTypeHandlerChain.canHandle("prompt")).toBe(true);
      expect(globalTypeHandlerChain.canHandle("deepractice-prompt")).toBe(true);
    });

    it("throws error when registering duplicate type name", () => {
      const customType: ResourceType = {
        name: "text", // conflicts with builtin
        description: "Duplicate",
        serializer: textType.serializer,
        resolver: textType.resolver,
      };

      expect(() => globalTypeHandlerChain.register(customType)).toThrow(ResourceTypeError);
      expect(() => globalTypeHandlerChain.register(customType)).toThrow("already registered");
    });
  });

  describe("canHandle", () => {
    it("returns true for registered types", () => {
      expect(globalTypeHandlerChain.canHandle("text")).toBe(true);
      expect(globalTypeHandlerChain.canHandle("txt")).toBe(true);
    });

    it("returns false for unregistered types", () => {
      expect(globalTypeHandlerChain.canHandle("unknown")).toBe(false);
    });
  });

  describe("getHandler", () => {
    it("returns handler for registered type", () => {
      const handler = globalTypeHandlerChain.getHandler("text");
      expect(handler).toBeDefined();
      expect(handler?.name).toBe("text");
    });

    it("returns handler for alias", () => {
      const handler = globalTypeHandlerChain.getHandler("txt");
      expect(handler).toBeDefined();
      expect(handler?.name).toBe("text");
    });

    it("returns undefined for unregistered type", () => {
      const handler = globalTypeHandlerChain.getHandler("unknown");
      expect(handler).toBeUndefined();
    });
  });

  describe("serialize", () => {
    it("serializes text resource", async () => {
      const manifest = createRXM({
        domain: "localhost",
        name: "test",
        type: "text",
        version: "1.0.0",
      });
      const rxr: RXR = {
        locator: parseRXL(manifest.toLocator()),
        manifest,
        content: await createRXC({ content: "Hello, World!" }),
      };

      const buffer = await globalTypeHandlerChain.serialize(rxr);

      // Buffer is tar.gz format, check it's valid gzip
      expect(buffer[0]).toBe(0x1f);
      expect(buffer[1]).toBe(0x8b);
    });

    it("serializes json resource", async () => {
      const manifest = createRXM({
        domain: "localhost",
        name: "test",
        type: "json",
        version: "1.0.0",
      });
      const rxr: RXR = {
        locator: parseRXL(manifest.toLocator()),
        manifest,
        content: await createRXC({ content: '{"key": "value"}' }),
      };

      const buffer = await globalTypeHandlerChain.serialize(rxr);

      // Buffer is tar.gz format
      expect(buffer[0]).toBe(0x1f);
      expect(buffer[1]).toBe(0x8b);
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
        content: await createRXC({ content: "test" }),
      };

      await expect(globalTypeHandlerChain.serialize(rxr)).rejects.toThrow(ResourceTypeError);
      await expect(globalTypeHandlerChain.serialize(rxr)).rejects.toThrow(
        "Unsupported resource type"
      );
    });
  });

  describe("deserialize", () => {
    it("deserializes text resource", async () => {
      const manifest = createRXM({
        domain: "localhost",
        name: "test",
        type: "text",
        version: "1.0.0",
      });
      // Create a proper tar.gz buffer
      const originalRxc = await createRXC({ content: "Hello, World!" });
      const data = await originalRxc.buffer();

      const rxr = await globalTypeHandlerChain.deserialize(data, manifest);

      const contentBuffer = await rxr.content.file("content");
      expect(contentBuffer.toString()).toBe("Hello, World!");
    });

    it("deserializes using alias", async () => {
      const manifest = createRXM({
        domain: "localhost",
        name: "test",
        type: "txt", // Using alias
        version: "1.0.0",
      });
      const originalRxc = await createRXC({ content: "Via alias" });
      const data = await originalRxc.buffer();

      const rxr = await globalTypeHandlerChain.deserialize(data, manifest);

      const contentBuffer = await rxr.content.file("content");
      expect(contentBuffer.toString()).toBe("Via alias");
    });

    it("throws error for unsupported type", async () => {
      const manifest = createRXM({
        domain: "localhost",
        name: "test",
        type: "unknown",
        version: "1.0.0",
      });
      const originalRxc = await createRXC({ content: "test" });
      const data = await originalRxc.buffer();

      await expect(globalTypeHandlerChain.deserialize(data, manifest)).rejects.toThrow(
        ResourceTypeError
      );
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
        content: await createRXC({ content: "Hello" }),
      };

      const result = await globalTypeHandlerChain.resolve<void, string>(rxr);

      expect(typeof result).toBe("object");
      expect(typeof result.execute).toBe("function");
      expect(result.schema).toBeUndefined();
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
        content: await createRXC({ content: '{"key": "value"}' }),
      };

      const result = await globalTypeHandlerChain.resolve<void, { key: string }>(rxr);

      expect(typeof result).toBe("object");
      expect(typeof result.execute).toBe("function");
      expect(result.schema).toBeUndefined();
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
        content: await createRXC({ content: "test" }),
      };

      await expect(globalTypeHandlerChain.resolve(rxr)).rejects.toThrow(ResourceTypeError);
    });
  });

  describe("clearExtensions", () => {
    it("clears extension types but keeps builtins", () => {
      const customType: ResourceType = {
        name: "custom",
        description: "Custom type",
        serializer: textType.serializer,
        resolver: textType.resolver,
      };

      globalTypeHandlerChain.register(customType);
      expect(globalTypeHandlerChain.canHandle("custom")).toBe(true);

      globalTypeHandlerChain.clearExtensions();

      // Extension cleared
      expect(globalTypeHandlerChain.canHandle("custom")).toBe(false);

      // Builtins still available
      expect(globalTypeHandlerChain.canHandle("text")).toBe(true);
      expect(globalTypeHandlerChain.canHandle("json")).toBe(true);
      expect(globalTypeHandlerChain.canHandle("binary")).toBe(true);
    });
  });
});
