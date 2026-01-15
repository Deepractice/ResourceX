import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { writeFile, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import {
  httpsHandler,
  httpHandler,
  fileHandler,
  getTransportHandler,
  registerTransportHandler,
} from "../../src/transport/index.js";
import { TransportError } from "../../src/errors.js";
import type { TransportHandler } from "../../src/transport/types.js";

describe("Transport Handlers", () => {
  describe("httpsHandler", () => {
    it("has correct type", () => {
      expect(httpsHandler.type).toBe("https");
    });

    it("fetches remote content", async () => {
      const buffer = await httpsHandler.fetch("httpbin.org/robots.txt");

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.toString()).toContain("User-agent");
    });

    it("throws TransportError on HTTP error", async () => {
      await expect(httpsHandler.fetch("httpbin.org/status/404")).rejects.toThrow(TransportError);
      await expect(httpsHandler.fetch("httpbin.org/status/404")).rejects.toThrow("HTTP 404");
    });

    it("throws TransportError on network error", async () => {
      await expect(httpsHandler.fetch("invalid.domain.that.does.not.exist/")).rejects.toThrow(
        TransportError
      );
    });
  });

  describe("httpHandler", () => {
    it("has correct type", () => {
      expect(httpHandler.type).toBe("http");
    });
  });

  describe("fileHandler", () => {
    const testDir = join(process.cwd(), "tests/unit/.tmp");
    const testFile = join(testDir, "test.txt");
    const testContent = "Hello from test file";

    beforeAll(async () => {
      await mkdir(testDir, { recursive: true });
      await writeFile(testFile, testContent);
    });

    afterAll(async () => {
      await rm(testDir, { recursive: true, force: true });
    });

    it("has correct type", () => {
      expect(fileHandler.type).toBe("file");
    });

    it("reads local file", async () => {
      const buffer = await fileHandler.fetch(testFile);

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.toString()).toBe(testContent);
    });

    it("throws TransportError on missing file", async () => {
      await expect(fileHandler.fetch("/nonexistent/file.txt")).rejects.toThrow(TransportError);
      await expect(fileHandler.fetch("/nonexistent/file.txt")).rejects.toThrow("ENOENT");
    });
  });

  describe("getTransportHandler", () => {
    it("returns https handler", () => {
      const handler = getTransportHandler("https");
      expect(handler.type).toBe("https");
    });

    it("returns http handler", () => {
      const handler = getTransportHandler("http");
      expect(handler.type).toBe("http");
    });

    it("returns file handler", () => {
      const handler = getTransportHandler("file");
      expect(handler.type).toBe("file");
    });

    it("throws on unsupported transport", () => {
      expect(() => getTransportHandler("ftp")).toThrow(TransportError);
      expect(() => getTransportHandler("ftp")).toThrow("Unsupported transport");
    });
  });

  describe("registerTransportHandler", () => {
    it("registers custom handler", () => {
      const customHandler: TransportHandler = {
        type: "custom",
        fetch: async () => Buffer.from("custom content"),
      };

      registerTransportHandler(customHandler);

      const handler = getTransportHandler("custom");
      expect(handler.type).toBe("custom");
    });
  });
});
