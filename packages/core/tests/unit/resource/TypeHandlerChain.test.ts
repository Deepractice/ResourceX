import { describe, it, expect, beforeEach } from "bun:test";
import {
  TypeHandlerChain,
  createTypeHandlerChain,
  ResourceTypeError,
  textType,
  jsonType,
  binaryType,
} from "../../../src/index.js";
import type { RXR, ResourceType } from "../../../src/index.js";
import { createRXM, createRXC, parseRXL } from "../../../src/index.js";

describe("TypeHandlerChain", () => {
  describe("register", () => {
    it("registers a type", () => {
      const chain = createTypeHandlerChain();
      chain.register(textType);

      expect(chain.canHandle("text")).toBe(true);
    });

    it("registers type aliases", () => {
      const chain = createTypeHandlerChain();
      chain.register(textType);

      expect(chain.canHandle("text")).toBe(true);
      expect(chain.canHandle("txt")).toBe(true);
      expect(chain.canHandle("plaintext")).toBe(true);
    });
  });

  describe("registerAll", () => {
    it("registers multiple types", () => {
      const chain = createTypeHandlerChain();
      chain.registerAll([textType, jsonType, binaryType]);

      expect(chain.canHandle("text")).toBe(true);
      expect(chain.canHandle("json")).toBe(true);
      expect(chain.canHandle("binary")).toBe(true);
    });
  });

  describe("canHandle", () => {
    it("returns true for registered types", () => {
      const chain = createTypeHandlerChain([textType]);

      expect(chain.canHandle("text")).toBe(true);
      expect(chain.canHandle("txt")).toBe(true);
    });

    it("returns false for unregistered types", () => {
      const chain = createTypeHandlerChain([textType]);

      expect(chain.canHandle("unknown")).toBe(false);
    });
  });

  describe("getHandler", () => {
    it("returns handler for registered type", () => {
      const chain = createTypeHandlerChain([textType]);

      const handler = chain.getHandler("text");
      expect(handler).toBeDefined();
      expect(handler?.name).toBe("text");
    });

    it("returns handler for alias", () => {
      const chain = createTypeHandlerChain([textType]);

      const handler = chain.getHandler("txt");
      expect(handler).toBeDefined();
      expect(handler?.name).toBe("text");
    });

    it("returns undefined for unregistered type", () => {
      const chain = createTypeHandlerChain([textType]);

      const handler = chain.getHandler("unknown");
      expect(handler).toBeUndefined();
    });
  });

  describe("serialize", () => {
    it("serializes text resource", async () => {
      const chain = createTypeHandlerChain([textType]);
      const manifest = createRXM({
        domain: "localhost",
        name: "test",
        type: "text",
        version: "1.0.0",
      });
      const rxr: RXR = {
        locator: parseRXL(manifest.toLocator()),
        manifest,
        content: createRXC("Hello, World!"),
      };

      const buffer = await chain.serialize(rxr);

      expect(buffer.toString("utf-8")).toBe("Hello, World!");
    });

    it("serializes json resource", async () => {
      const chain = createTypeHandlerChain([jsonType]);
      const manifest = createRXM({
        domain: "localhost",
        name: "test",
        type: "json",
        version: "1.0.0",
      });
      const rxr: RXR = {
        locator: parseRXL(manifest.toLocator()),
        manifest,
        content: createRXC('{"key": "value"}'),
      };

      const buffer = await chain.serialize(rxr);
      const json = JSON.parse(buffer.toString("utf-8"));

      expect(json.key).toBe("value");
    });

    it("throws error for unsupported type", async () => {
      const chain = createTypeHandlerChain([textType]);
      const manifest = createRXM({
        domain: "localhost",
        name: "test",
        type: "unknown",
        version: "1.0.0",
      });
      const rxr: RXR = {
        locator: parseRXL(manifest.toLocator()),
        manifest,
        content: createRXC("test"),
      };

      await expect(chain.serialize(rxr)).rejects.toThrow(ResourceTypeError);
      await expect(chain.serialize(rxr)).rejects.toThrow("Unsupported resource type");
    });
  });

  describe("deserialize", () => {
    it("deserializes text resource", async () => {
      const chain = createTypeHandlerChain([textType]);
      const manifest = createRXM({
        domain: "localhost",
        name: "test",
        type: "text",
        version: "1.0.0",
      });
      const data = Buffer.from("Hello, World!", "utf-8");

      const rxr = await chain.deserialize(data, manifest);

      expect(await rxr.content.text()).toBe("Hello, World!");
    });

    it("deserializes using alias", async () => {
      const chain = createTypeHandlerChain([textType]);
      const manifest = createRXM({
        domain: "localhost",
        name: "test",
        type: "txt", // Using alias
        version: "1.0.0",
      });
      const data = Buffer.from("Via alias", "utf-8");

      const rxr = await chain.deserialize(data, manifest);

      expect(await rxr.content.text()).toBe("Via alias");
    });

    it("throws error for unsupported type", async () => {
      const chain = createTypeHandlerChain([textType]);
      const manifest = createRXM({
        domain: "localhost",
        name: "test",
        type: "unknown",
        version: "1.0.0",
      });

      await expect(chain.deserialize(Buffer.from("test"), manifest)).rejects.toThrow(
        ResourceTypeError
      );
    });
  });

  describe("resolve", () => {
    it("resolves text resource to string", async () => {
      const chain = createTypeHandlerChain([textType]);
      const manifest = createRXM({
        domain: "localhost",
        name: "test",
        type: "text",
        version: "1.0.0",
      });
      const rxr: RXR = {
        locator: parseRXL(manifest.toLocator()),
        manifest,
        content: createRXC("Hello"),
      };

      const result = await chain.resolve<string>(rxr);

      expect(result).toBe("Hello");
    });

    it("resolves json resource to object", async () => {
      const chain = createTypeHandlerChain([jsonType]);
      const manifest = createRXM({
        domain: "localhost",
        name: "test",
        type: "json",
        version: "1.0.0",
      });
      const rxr: RXR = {
        locator: parseRXL(manifest.toLocator()),
        manifest,
        content: createRXC('{"key": "value"}'),
      };

      const result = await chain.resolve<{ key: string }>(rxr);

      expect(result).toEqual({ key: "value" });
    });

    it("throws error for unsupported type", async () => {
      const chain = createTypeHandlerChain([textType]);
      const manifest = createRXM({
        domain: "localhost",
        name: "test",
        type: "unknown",
        version: "1.0.0",
      });
      const rxr: RXR = {
        locator: parseRXL(manifest.toLocator()),
        manifest,
        content: createRXC("test"),
      };

      await expect(chain.resolve(rxr)).rejects.toThrow(ResourceTypeError);
    });
  });

  describe("createTypeHandlerChain", () => {
    it("creates chain with initial types", () => {
      const chain = createTypeHandlerChain([textType, jsonType]);

      expect(chain.canHandle("text")).toBe(true);
      expect(chain.canHandle("json")).toBe(true);
    });

    it("creates empty chain when no types provided", () => {
      const chain = createTypeHandlerChain();

      expect(chain.canHandle("text")).toBe(false);
    });
  });
});
