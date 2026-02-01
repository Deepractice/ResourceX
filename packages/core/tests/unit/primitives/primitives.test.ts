import { describe, it, expect } from "bun:test";
import {
  define,
  manifest,
  archive,
  locate,
  resource,
  extract,
} from "../../../src/model/index.js";
import type { RXD, RXM, RXL, RXA, RXR } from "../../../src/model/index.js";

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

      expect(rxm.registry).toBe("deepractice.ai");
      expect(rxm.path).toBe("assistants");
      expect(rxm.name).toBe("my-prompt");
      expect(rxm.type).toBe("prompt");
      expect(rxm.tag).toBe("1.0.0");
    });

    it("creates RXM from minimal RXD", () => {
      const rxm = manifest(minimalRXD);

      expect(rxm.registry).toBeUndefined();
      expect(rxm.path).toBeUndefined();
      expect(rxm.name).toBe("simple");
      expect(rxm.type).toBe("text");
      expect(rxm.tag).toBe("0.1.0");
    });

    it("ignores extended fields from RXD", () => {
      const rxd = define({
        name: "tool",
        type: "tool",
        version: "1.0.0",
        description: "A tool",
        author: "sean",
      });
      const rxm = manifest(rxd);

      expect(rxm.name).toBe("tool");
      // RXM should not have description or author
      expect((rxm as Record<string, unknown>).description).toBeUndefined();
      expect((rxm as Record<string, unknown>).author).toBeUndefined();
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

  describe("locate(rxm) → RXL", () => {
    it("creates RXL from RXM with all fields", () => {
      const rxm = manifest(sampleRXD);
      const rxl = locate(rxm);

      expect(rxl.registry).toBe("deepractice.ai");
      expect(rxl.path).toBe("assistants");
      expect(rxl.name).toBe("my-prompt");
      expect(rxl.tag).toBe("1.0.0");
    });

    it("creates RXL from minimal RXM", () => {
      const rxm = manifest(minimalRXD);
      const rxl = locate(rxm);

      expect(rxl.registry).toBeUndefined();
      expect(rxl.path).toBeUndefined();
      expect(rxl.name).toBe("simple");
      expect(rxl.tag).toBe("0.1.0");
    });
  });

  describe("resource(rxm, rxa) → RXR", () => {
    it("creates RXR from RXM and RXA", async () => {
      const rxm = manifest(sampleRXD);
      const rxa = await archive({ content: Buffer.from("Hello") });
      const rxr = resource(rxm, rxa);

      expect(rxr.manifest).toBe(rxm);
      expect(rxr.archive).toBe(rxa);
      expect(rxr.locator).toBeDefined();
      expect(rxr.locator.name).toBe("my-prompt");
    });

    it("RXR locator matches manifest", async () => {
      const rxm = manifest(sampleRXD);
      const rxa = await archive({ content: Buffer.from("Hello") });
      const rxr = resource(rxm, rxa);

      expect(rxr.locator.registry).toBe(rxr.manifest.registry);
      expect(rxr.locator.name).toBe(rxr.manifest.name);
      expect(rxr.locator.tag).toBe(rxr.manifest.tag);
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
