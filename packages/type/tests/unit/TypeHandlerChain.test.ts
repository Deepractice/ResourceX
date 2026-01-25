import { describe, it, expect, beforeEach } from "bun:test";
import { TypeHandlerChain, ResourceTypeError } from "../../src/index.js";
import type { BundledType } from "../../src/types.js";

describe("TypeHandlerChain", () => {
  let chain: TypeHandlerChain;

  beforeEach(() => {
    chain = TypeHandlerChain.create();
  });

  describe("create", () => {
    it("creates instance with builtin types by default", () => {
      const instance = TypeHandlerChain.create();
      // Builtin types are included by default
      expect(instance.canHandle("text")).toBe(true);
      expect(instance.canHandle("json")).toBe(true);
      expect(instance.canHandle("binary")).toBe(true);
    });

    it("creates independent instances", () => {
      const instance1 = TypeHandlerChain.create();
      const instance2 = TypeHandlerChain.create();

      const customType: BundledType = {
        name: "custom",
        description: "Custom type",
        code: `
          ({
            async resolve(rxr) {
              const pkg = await rxr.archive.extract();
              const buffer = await pkg.file("content");
              return new TextDecoder().decode(buffer);
            }
          })
        `,
      };

      instance1.register(customType);

      expect(instance1.canHandle("custom")).toBe(true);
      expect(instance2.canHandle("custom")).toBe(false);
    });
  });

  describe("builtin types", () => {
    it("has builtin types by default", () => {
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
      const customType: BundledType = {
        name: "custom",
        description: "Custom type",
        code: `
          ({
            async resolve(rxr) {
              const pkg = await rxr.archive.extract();
              const buffer = await pkg.file("content");
              return new TextDecoder().decode(buffer);
            }
          })
        `,
      };

      chain.register(customType);

      expect(chain.canHandle("custom")).toBe(true);
    });

    it("registers extension type aliases", () => {
      const customType: BundledType = {
        name: "prompt",
        aliases: ["deepractice-prompt"],
        description: "Prompt type",
        code: `
          ({
            async resolve(rxr) {
              const pkg = await rxr.archive.extract();
              const buffer = await pkg.file("content");
              return new TextDecoder().decode(buffer);
            }
          })
        `,
      };

      chain.register(customType);

      expect(chain.canHandle("prompt")).toBe(true);
      expect(chain.canHandle("deepractice-prompt")).toBe(true);
    });

    it("throws error when registering duplicate type name", () => {
      const customType: BundledType = {
        name: "text", // conflicts with already registered builtin
        description: "Duplicate",
        code: `
          ({
            async resolve(rxr) {
              const pkg = await rxr.archive.extract();
              const buffer = await pkg.file("content");
              return new TextDecoder().decode(buffer);
            }
          })
        `,
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
      expect(handler.name).toBe("text");
    });

    it("returns handler for alias", () => {
      const handler = chain.getHandler("txt");
      expect(handler).toBeDefined();
      expect(handler.name).toBe("text");
    });

    it("throws error for unregistered type", () => {
      expect(() => chain.getHandler("unknown")).toThrow(ResourceTypeError);
    });
  });

  describe("getHandlerOrUndefined", () => {
    it("returns handler for registered type", () => {
      const handler = chain.getHandlerOrUndefined("text");
      expect(handler).toBeDefined();
      expect(handler?.name).toBe("text");
    });

    it("returns undefined for unregistered type", () => {
      const handler = chain.getHandlerOrUndefined("unknown");
      expect(handler).toBeUndefined();
    });
  });

  describe("clear", () => {
    it("clears all registered types", () => {
      const customType: BundledType = {
        name: "custom",
        description: "Custom type",
        code: `
          ({
            async resolve(rxr) {
              const pkg = await rxr.archive.extract();
              const buffer = await pkg.file("content");
              return new TextDecoder().decode(buffer);
            }
          })
        `,
      };

      chain.register(customType);
      expect(chain.canHandle("custom")).toBe(true);
      expect(chain.canHandle("text")).toBe(true);

      chain.clear();

      // All types cleared
      expect(chain.canHandle("custom")).toBe(false);
      expect(chain.canHandle("text")).toBe(false);
      expect(chain.canHandle("json")).toBe(false);
      expect(chain.canHandle("binary")).toBe(false);
    });
  });
});
