import { describe, it, expect } from "bun:test";
import { createRXC } from "../../../src/content/index.js";

describe("createRXC", () => {
  describe("from string", () => {
    it("creates RXC from string", () => {
      const rxc = createRXC("Hello, World!");
      expect(rxc).toBeDefined();
    });

    it("returns text content", async () => {
      const rxc = createRXC("Hello, World!");
      const text = await rxc.text();
      expect(text).toBe("Hello, World!");
    });

    it("returns buffer content", async () => {
      const rxc = createRXC("Hello, World!");
      const buffer = await rxc.buffer();
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.toString()).toBe("Hello, World!");
    });

    it("returns json content", async () => {
      const rxc = createRXC('{"name": "test"}');
      const json = await rxc.json<{ name: string }>();
      expect(json).toEqual({ name: "test" });
    });

    it("has stream property", () => {
      const rxc = createRXC("Hello, World!");
      expect(rxc.stream).toBeDefined();
    });

    it("can read from stream", async () => {
      const rxc = createRXC("Hello, World!");
      const reader = rxc.stream.getReader();
      const chunks: Uint8Array[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }

      const result = Buffer.concat(chunks).toString();
      expect(result).toBe("Hello, World!");
    });
  });

  describe("from Buffer", () => {
    it("creates RXC from Buffer", () => {
      const buffer = Buffer.from("Hello, Buffer!");
      const rxc = createRXC(buffer);
      expect(rxc).toBeDefined();
    });

    it("returns text content", async () => {
      const buffer = Buffer.from("Hello, Buffer!");
      const rxc = createRXC(buffer);
      const text = await rxc.text();
      expect(text).toBe("Hello, Buffer!");
    });

    it("returns buffer content", async () => {
      const buffer = Buffer.from([0x01, 0x02, 0x03]);
      const rxc = createRXC(buffer);
      const result = await rxc.buffer();
      expect(result).toEqual(buffer);
    });
  });

  describe("from ReadableStream", () => {
    it("creates RXC from ReadableStream", () => {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode("Hello, Stream!"));
          controller.close();
        },
      });
      const rxc = createRXC(stream);
      expect(rxc).toBeDefined();
    });

    it("returns text content", async () => {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode("Hello, Stream!"));
          controller.close();
        },
      });
      const rxc = createRXC(stream);
      const text = await rxc.text();
      expect(text).toBe("Hello, Stream!");
    });
  });

  describe("content can only be consumed once", () => {
    it("throws error on second text() call", async () => {
      const rxc = createRXC("Hello");
      await rxc.text();
      await expect(rxc.text()).rejects.toThrow();
    });

    it("throws error if stream already consumed", async () => {
      const rxc = createRXC("Hello");
      await rxc.text();
      expect(() => rxc.stream.getReader()).toThrow();
    });
  });
});
