import { describe, expect, it } from "bun:test";
import type { RXD } from "../../../src/model/index.js";
import { archive, define, extract, locate, manifest, resource } from "../../../src/model/index.js";

describe("primitives", () => {
  // Sample RXD for tests
  const sampleRXD: RXD = {
    name: "my-prompt",
    type: "prompt",
    tag: "1.0.0",
    registry: "deepractice.ai",
    path: "assistants",
  };

  const minimalRXD: RXD = {
    name: "simple",
    type: "text",
    tag: "0.1.0",
  };

  describe("manifest(rxd) → RXM", () => {
    it("creates RXM from RXD with all fields", () => {
      const rxm = manifest(sampleRXD);

      expect(rxm.definition.registry).toBe("deepractice.ai");
      expect(rxm.definition.path).toBe("assistants");
      expect(rxm.definition.name).toBe("my-prompt");
      expect(rxm.definition.type).toBe("prompt");
      expect(rxm.definition.tag).toBe("1.0.0");
      expect(rxm.archive).toEqual({});
      expect(rxm.source).toEqual({});
    });

    it("creates RXM from minimal RXD", () => {
      const rxm = manifest(minimalRXD);

      expect(rxm.definition.registry).toBeUndefined();
      expect(rxm.definition.path).toBeUndefined();
      expect(rxm.definition.name).toBe("simple");
      expect(rxm.definition.type).toBe("text");
      expect(rxm.definition.tag).toBe("0.1.0");
    });

    it("includes extended fields from RXD in definition", () => {
      const rxd = define({
        name: "tool",
        type: "tool",
        tag: "1.0.0",
        description: "A tool",
        author: "sean",
      });
      const rxm = manifest(rxd);

      expect(rxm.definition.name).toBe("tool");
      expect(rxm.definition.description).toBe("A tool");
      expect(rxm.definition.author).toBe("sean");
    });
  });

  describe("archive(files) → RXA", () => {
    it("creates RXA from single file", async () => {
      const files = {
        "content.txt": Buffer.from("Hello World"),
      };
      const rxa = await archive(files);

      expect(rxa).toBeDefined();
      const buffer = await rxa.buffer();
      expect(Buffer.isBuffer(buffer)).toBe(true);
    });

    it("creates RXA from multiple files", async () => {
      const files = {
        "index.ts": Buffer.from("export default 1"),
        "README.md": Buffer.from("# Hello"),
      };
      const rxa = await archive(files);

      expect(rxa).toBeDefined();
      const buffer = await rxa.buffer();
      expect(buffer.length).toBeGreaterThan(0);
    });

    it("creates RXA from nested file paths", async () => {
      const files = {
        "src/index.ts": Buffer.from("main"),
        "src/utils/helper.ts": Buffer.from("helper"),
      };
      const rxa = await archive(files);

      expect(rxa).toBeDefined();
    });

    it("creates RXA from empty files object", async () => {
      const files = {};
      const rxa = await archive(files);

      expect(rxa).toBeDefined();
    });
  });

  describe("locate(rxm) → RXI", () => {
    it("creates RXI from RXM with all fields", () => {
      const rxm = manifest(sampleRXD);
      const rxi = locate(rxm);

      expect(rxi.registry).toBe("deepractice.ai");
      expect(rxi.path).toBe("assistants");
      expect(rxi.name).toBe("my-prompt");
      expect(rxi.tag).toBe("1.0.0");
    });

    it("creates RXI from minimal RXM", () => {
      const rxm = manifest(minimalRXD);
      const rxi = locate(rxm);

      expect(rxi.registry).toBeUndefined();
      expect(rxi.path).toBeUndefined();
      expect(rxi.name).toBe("simple");
      expect(rxi.tag).toBe("0.1.0");
    });
  });

  describe("resource(rxm, rxa) → RXR", () => {
    it("creates RXR from RXM and RXA", async () => {
      const rxm = manifest(sampleRXD);
      const rxa = await archive({ content: Buffer.from("Hello") });
      const rxr = resource(rxm, rxa);

      expect(rxr.manifest).toBe(rxm);
      expect(rxr.archive).toBe(rxa);
      expect(rxr.identifier).toBeDefined();
      expect(rxr.identifier.name).toBe("my-prompt");
    });

    it("RXR identifier matches manifest definition", async () => {
      const rxm = manifest(sampleRXD);
      const rxa = await archive({ content: Buffer.from("Hello") });
      const rxr = resource(rxm, rxa);

      expect(rxr.identifier.registry).toBe(rxr.manifest.definition.registry);
      expect(rxr.identifier.name).toBe(rxr.manifest.definition.name);
      expect(rxr.identifier.tag).toBe(rxr.manifest.definition.tag);
    });
  });

  describe("extract(rxa) → Record<string, Buffer>", () => {
    it("extracts single file from RXA", async () => {
      const originalFiles = {
        "content.txt": Buffer.from("Hello World"),
      };
      const rxa = await archive(originalFiles);
      const files = await extract(rxa);

      expect(files["content.txt"]).toBeDefined();
      expect(files["content.txt"].toString()).toBe("Hello World");
    });

    it("extracts multiple files from RXA", async () => {
      const originalFiles = {
        "a.txt": Buffer.from("aaa"),
        "b.txt": Buffer.from("bbb"),
      };
      const rxa = await archive(originalFiles);
      const files = await extract(rxa);

      expect(Object.keys(files).length).toBe(2);
      expect(files["a.txt"].toString()).toBe("aaa");
      expect(files["b.txt"].toString()).toBe("bbb");
    });

    it("extracts nested files from RXA", async () => {
      const originalFiles = {
        "src/index.ts": Buffer.from("main"),
        "src/utils/helper.ts": Buffer.from("helper"),
      };
      const rxa = await archive(originalFiles);
      const files = await extract(rxa);

      expect(files["src/index.ts"].toString()).toBe("main");
      expect(files["src/utils/helper.ts"].toString()).toBe("helper");
    });

    it("roundtrip: archive → extract preserves content", async () => {
      const originalFiles = {
        "data.json": Buffer.from('{"key": "value"}'),
        "README.md": Buffer.from("# Title\n\nContent"),
      };
      const rxa = await archive(originalFiles);
      const extractedFiles = await extract(rxa);

      expect(extractedFiles["data.json"].toString()).toBe('{"key": "value"}');
      expect(extractedFiles["README.md"].toString()).toBe("# Title\n\nContent");
    });
  });
});
