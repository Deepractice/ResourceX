import { describe, it, expect } from "bun:test";
import { createRXM } from "../../../src/manifest/index.js";
import { ManifestError } from "../../../src/errors.js";

describe("createRXM", () => {
  describe("valid manifest", () => {
    it("parses minimal manifest", () => {
      const rxm = createRXM({
        domain: "deepractice.ai",
        name: "assistant",
        type: "prompt",
        version: "1.0.0",
      });

      expect(rxm.domain).toBe("deepractice.ai");
      expect(rxm.name).toBe("assistant");
      expect(rxm.type).toBe("prompt");
      expect(rxm.version).toBe("1.0.0");
      expect(rxm.path).toBeUndefined();
      expect(rxm.resolver).toBeUndefined();
    });

    it("parses manifest with path", () => {
      const rxm = createRXM({
        domain: "deepractice.ai",
        path: "sean",
        name: "assistant",
        type: "prompt",
        version: "1.0.0",
      });

      expect(rxm.domain).toBe("deepractice.ai");
      expect(rxm.path).toBe("sean");
      expect(rxm.name).toBe("assistant");
    });

    it("parses manifest with nested path", () => {
      const rxm = createRXM({
        domain: "deepractice.ai",
        path: "org/team",
        name: "assistant",
        type: "prompt",
        version: "1.0.0",
      });

      expect(rxm.path).toBe("org/team");
    });

    it("parses manifest with resolver", () => {
      const rxm = createRXM({
        domain: "deepractice.ai",
        name: "assistant",
        type: "prompt",
        version: "1.0.0",
        resolver: "openai",
      });

      expect(rxm.resolver).toBe("openai");
    });

    it("parses full manifest", () => {
      const rxm = createRXM({
        domain: "deepractice.ai",
        path: "sean",
        name: "assistant",
        type: "prompt",
        version: "1.0.0",
        resolver: "claude",
      });

      expect(rxm.domain).toBe("deepractice.ai");
      expect(rxm.path).toBe("sean");
      expect(rxm.name).toBe("assistant");
      expect(rxm.type).toBe("prompt");
      expect(rxm.version).toBe("1.0.0");
      expect(rxm.resolver).toBe("claude");
    });
  });

  describe("invalid manifest", () => {
    it("throws error for missing domain", () => {
      expect(() =>
        createRXM({
          name: "assistant",
          type: "prompt",
          version: "1.0.0",
        })
      ).toThrow(ManifestError);
      expect(() =>
        createRXM({
          name: "assistant",
          type: "prompt",
          version: "1.0.0",
        })
      ).toThrow("domain is required");
    });

    it("throws error for missing name", () => {
      expect(() =>
        createRXM({
          domain: "deepractice.ai",
          type: "prompt",
          version: "1.0.0",
        })
      ).toThrow(ManifestError);
      expect(() =>
        createRXM({
          domain: "deepractice.ai",
          type: "prompt",
          version: "1.0.0",
        })
      ).toThrow("name is required");
    });

    it("throws error for missing type", () => {
      expect(() =>
        createRXM({
          domain: "deepractice.ai",
          name: "assistant",
          version: "1.0.0",
        })
      ).toThrow(ManifestError);
      expect(() =>
        createRXM({
          domain: "deepractice.ai",
          name: "assistant",
          version: "1.0.0",
        })
      ).toThrow("type is required");
    });

    it("throws error for missing version", () => {
      expect(() =>
        createRXM({
          domain: "deepractice.ai",
          name: "assistant",
          type: "prompt",
        })
      ).toThrow(ManifestError);
      expect(() =>
        createRXM({
          domain: "deepractice.ai",
          name: "assistant",
          type: "prompt",
        })
      ).toThrow("version is required");
    });
  });

  describe("toLocator", () => {
    it("returns locator string without path", () => {
      const rxm = createRXM({
        domain: "deepractice.ai",
        name: "assistant",
        type: "prompt",
        version: "1.0.0",
      });

      expect(rxm.toLocator()).toBe("deepractice.ai/assistant.prompt@1.0.0");
    });

    it("returns locator string with path", () => {
      const rxm = createRXM({
        domain: "deepractice.ai",
        path: "sean",
        name: "assistant",
        type: "prompt",
        version: "1.0.0",
      });

      expect(rxm.toLocator()).toBe("deepractice.ai/sean/assistant.prompt@1.0.0");
    });

    it("returns locator string with nested path", () => {
      const rxm = createRXM({
        domain: "deepractice.ai",
        path: "org/team",
        name: "assistant",
        type: "prompt",
        version: "1.0.0",
      });

      expect(rxm.toLocator()).toBe("deepractice.ai/org/team/assistant.prompt@1.0.0");
    });
  });

  describe("toJSON", () => {
    it("returns JSON object", () => {
      const rxm = createRXM({
        domain: "deepractice.ai",
        path: "sean",
        name: "assistant",
        type: "prompt",
        version: "1.0.0",
        resolver: "openai",
      });

      expect(rxm.toJSON()).toEqual({
        domain: "deepractice.ai",
        path: "sean",
        name: "assistant",
        type: "prompt",
        version: "1.0.0",
        resolver: "openai",
      });
    });

    it("omits undefined fields", () => {
      const rxm = createRXM({
        domain: "deepractice.ai",
        name: "assistant",
        type: "prompt",
        version: "1.0.0",
      });

      const json = rxm.toJSON();
      expect(json).toEqual({
        domain: "deepractice.ai",
        name: "assistant",
        type: "prompt",
        version: "1.0.0",
      });
      expect("path" in json).toBe(false);
      expect("resolver" in json).toBe(false);
    });
  });
});
