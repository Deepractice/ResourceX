import { describe, it, expect } from "bun:test";
import { createRXC } from "../../../src/content/index.js";

describe("createRXC", () => {
  describe("from files record", () => {
    it("creates RXC from single file", async () => {
      const rxc = await createRXC({ content: "Hello, World!" });
      expect(rxc).toBeDefined();
    });

    it("returns file content", async () => {
      const rxc = await createRXC({ content: "Hello, World!" });
      const buffer = await rxc.file("content");
      expect(buffer.toString()).toBe("Hello, World!");
    });

    it("returns all files", async () => {
      const rxc = await createRXC({
        "index.ts": "export default 1",
        "styles.css": "body {}",
      });
      const files = await rxc.files();
      expect(files.size).toBe(2);
      expect(files.get("index.ts")?.toString()).toBe("export default 1");
      expect(files.get("styles.css")?.toString()).toBe("body {}");
    });

    it("supports nested paths", async () => {
      const rxc = await createRXC({
        "src/index.ts": "main",
        "src/utils/helper.ts": "helper",
      });
      const files = await rxc.files();
      expect(files.size).toBe(2);
      expect(files.get("src/index.ts")?.toString()).toBe("main");
      expect(files.get("src/utils/helper.ts")?.toString()).toBe("helper");
    });

    it("supports Buffer values", async () => {
      const data = Buffer.from([0x01, 0x02, 0x03]);
      const rxc = await createRXC({ content: data });
      const buffer = await rxc.file("content");
      expect(buffer).toEqual(data);
    });

    it("supports Uint8Array values", async () => {
      const data = new Uint8Array([0x01, 0x02, 0x03]);
      const rxc = await createRXC({ content: data });
      const buffer = await rxc.file("content");
      expect(buffer).toEqual(Buffer.from(data));
    });
  });

  describe("from archive buffer", () => {
    it("creates RXC from existing archive", async () => {
      // First create an archive
      const original = await createRXC({ content: "Hello" });
      const archiveBuffer = await original.buffer();

      // Then restore from archive
      const restored = await createRXC({ archive: archiveBuffer });
      const buffer = await restored.file("content");
      expect(buffer.toString()).toBe("Hello");
    });

    it("preserves all files when restoring from archive", async () => {
      const original = await createRXC({
        "a.txt": "aaa",
        "b.txt": "bbb",
      });
      const archiveBuffer = await original.buffer();

      const restored = await createRXC({ archive: archiveBuffer });
      const files = await restored.files();
      expect(files.size).toBe(2);
      expect(files.get("a.txt")?.toString()).toBe("aaa");
      expect(files.get("b.txt")?.toString()).toBe("bbb");
    });
  });

  describe("buffer()", () => {
    it("returns tar.gz buffer", async () => {
      const rxc = await createRXC({ content: "test" });
      const buffer = await rxc.buffer();
      // Check gzip magic bytes
      expect(buffer[0]).toBe(0x1f);
      expect(buffer[1]).toBe(0x8b);
    });
  });

  describe("stream", () => {
    it("has stream property", async () => {
      const rxc = await createRXC({ content: "Hello" });
      expect(rxc.stream).toBeDefined();
    });

    it("can read from stream", async () => {
      const rxc = await createRXC({ content: "Hello" });
      const reader = rxc.stream.getReader();
      const chunks: Uint8Array[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }

      const result = Buffer.concat(chunks);
      // Should be gzip format
      expect(result[0]).toBe(0x1f);
      expect(result[1]).toBe(0x8b);
    });
  });

  describe("error handling", () => {
    it("throws error for non-existent file", async () => {
      const rxc = await createRXC({ content: "Hello" });
      await expect(rxc.file("not-exist")).rejects.toThrow("file not found");
    });
  });
});
