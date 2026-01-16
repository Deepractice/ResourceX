import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { writeFile, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import type { Server } from "bun";
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
  let testServer: Server;
  let testPort: number;

  beforeAll(() => {
    // Start local HTTP server for testing
    testServer = Bun.serve({
      port: 0, // Random available port
      fetch(req) {
        const url = new URL(req.url);

        if (url.pathname === "/test.txt") {
          return new Response("Test content from server");
        }

        if (url.pathname === "/404") {
          return new Response("Not Found", { status: 404 });
        }

        return new Response("OK");
      },
    });
    testPort = testServer.port;
  });

  afterAll(() => {
    if (testServer) {
      testServer.stop();
    }
  });

  describe("httpsHandler", () => {
    it("has correct name", () => {
      expect(httpsHandler.name).toBe("https");
    });

    it("has correct capabilities", () => {
      expect(httpsHandler.capabilities.canRead).toBe(true);
      expect(httpsHandler.capabilities.canWrite).toBe(false);
      expect(httpsHandler.capabilities.canList).toBe(false);
      expect(httpsHandler.capabilities.canDelete).toBe(false);
    });

    it("reads remote content", async () => {
      const buffer = await httpHandler.read(`localhost:${testPort}/test.txt`);

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.toString()).toBe("Test content from server");
    });

    it("throws TransportError on HTTP error", async () => {
      await expect(httpHandler.read(`localhost:${testPort}/404`)).rejects.toThrow(TransportError);
      await expect(httpHandler.read(`localhost:${testPort}/404`)).rejects.toThrow("HTTP 404");
    });

    it(
      "throws TransportError on network error",
      async () => {
        await expect(httpsHandler.read("invalid.domain.that.does.not.exist/")).rejects.toThrow(
          TransportError
        );
      },
      { timeout: 15000 }
    );
  });

  describe("httpHandler", () => {
    it("has correct name", () => {
      expect(httpHandler.name).toBe("http");
    });

    it("has correct capabilities", () => {
      expect(httpHandler.capabilities.canRead).toBe(true);
      expect(httpHandler.capabilities.canWrite).toBe(false);
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

    it("has correct name", () => {
      expect(fileHandler.name).toBe("file");
    });

    it("has correct capabilities", () => {
      expect(fileHandler.capabilities.canRead).toBe(true);
      expect(fileHandler.capabilities.canWrite).toBe(true);
      expect(fileHandler.capabilities.canList).toBe(true);
      expect(fileHandler.capabilities.canDelete).toBe(true);
      expect(fileHandler.capabilities.canStat).toBe(true);
    });

    describe("read", () => {
      it("reads local file", async () => {
        const buffer = await fileHandler.read(testFile);

        expect(buffer).toBeInstanceOf(Buffer);
        expect(buffer.toString()).toBe(testContent);
      });

      it("throws TransportError on missing file", async () => {
        await expect(fileHandler.read("/nonexistent/file.txt")).rejects.toThrow(TransportError);
        await expect(fileHandler.read("/nonexistent/file.txt")).rejects.toThrow("ENOENT");
      });
    });

    describe("write", () => {
      it("writes to local file", async () => {
        const writeFile = join(testDir, "write-test.txt");
        const content = Buffer.from("written content");

        await fileHandler.write(writeFile, content);

        const readBack = await fileHandler.read(writeFile);
        expect(readBack.toString()).toBe("written content");
      });

      it("creates parent directories", async () => {
        const nestedFile = join(testDir, "nested/dir/file.txt");
        const content = Buffer.from("nested content");

        await fileHandler.write(nestedFile, content);

        const readBack = await fileHandler.read(nestedFile);
        expect(readBack.toString()).toBe("nested content");
      });
    });

    describe("list", () => {
      it("lists directory contents", async () => {
        const entries = await fileHandler.list(testDir);

        expect(entries).toContain("test.txt");
      });

      it("throws TransportError on missing directory", async () => {
        await expect(fileHandler.list("/nonexistent/dir")).rejects.toThrow(TransportError);
      });
    });

    describe("exists", () => {
      it("returns true for existing file", async () => {
        const exists = await fileHandler.exists(testFile);
        expect(exists).toBe(true);
      });

      it("returns false for non-existing file", async () => {
        const exists = await fileHandler.exists("/nonexistent/file.txt");
        expect(exists).toBe(false);
      });
    });

    describe("stat", () => {
      it("returns stat for file", async () => {
        const stat = await fileHandler.stat(testFile);

        expect(stat.size).toBeGreaterThan(0);
        expect(stat.isDirectory).toBe(false);
        expect(stat.modifiedAt).toBeInstanceOf(Date);
      });

      it("returns stat for directory", async () => {
        const stat = await fileHandler.stat(testDir);

        expect(stat.isDirectory).toBe(true);
      });

      it("throws TransportError on missing file", async () => {
        await expect(fileHandler.stat("/nonexistent/file.txt")).rejects.toThrow(TransportError);
      });
    });

    describe("delete", () => {
      it("deletes file", async () => {
        const deleteFile = join(testDir, "to-delete.txt");
        await fileHandler.write(deleteFile, Buffer.from("delete me"));

        expect(await fileHandler.exists(deleteFile)).toBe(true);

        await fileHandler.delete(deleteFile);

        expect(await fileHandler.exists(deleteFile)).toBe(false);
      });

      it("deletes directory recursively", async () => {
        const deleteDir = join(testDir, "to-delete-dir");
        await fileHandler.write(join(deleteDir, "file.txt"), Buffer.from("content"));

        expect(await fileHandler.exists(deleteDir)).toBe(true);

        await fileHandler.delete(deleteDir);

        expect(await fileHandler.exists(deleteDir)).toBe(false);
      });
    });
  });

  describe("getTransportHandler", () => {
    it("returns https handler", () => {
      const handler = getTransportHandler("https");
      expect(handler.name).toBe("https");
    });

    it("returns http handler", () => {
      const handler = getTransportHandler("http");
      expect(handler.name).toBe("http");
    });

    it("returns file handler", () => {
      const handler = getTransportHandler("file");
      expect(handler.name).toBe("file");
    });

    it("throws on unsupported transport", () => {
      expect(() => getTransportHandler("ftp")).toThrow(TransportError);
      expect(() => getTransportHandler("ftp")).toThrow("Unsupported transport");
    });
  });

  describe("registerTransportHandler", () => {
    it("registers custom handler", () => {
      const customHandler: TransportHandler = {
        name: "custom",
        capabilities: {
          canRead: true,
          canWrite: false,
          canList: false,
          canDelete: false,
          canStat: false,
        },
        read: async () => Buffer.from("custom content"),
      };

      registerTransportHandler(customHandler);

      const handler = getTransportHandler("custom");
      expect(handler.name).toBe("custom");
    });
  });
});
