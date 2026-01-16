import { describe, it, expect } from "bun:test";
import {
  textHandler,
  getSemanticHandler,
  registerSemanticHandler,
} from "../../src/semantic/index.js";
import { SemanticError } from "../../src/errors.js";
import type { SemanticHandler, Resource, SemanticContext } from "../../src/semantic/types.js";
import type { TransportHandler, TransportCapabilities } from "../../src/transport/types.js";

describe("Semantic Handlers", () => {
  // Mock transport handler for testing
  const createMockTransport = (
    content: Buffer,
    options?: {
      canWrite?: boolean;
      canDelete?: boolean;
      written?: { location: string; content: Buffer }[];
      deleted?: string[];
    }
  ): TransportHandler => {
    const written = options?.written ?? [];
    const deleted = options?.deleted ?? [];

    return {
      name: "mock",
      capabilities: {
        canRead: true,
        canWrite: options?.canWrite ?? false,
        canList: false,
        canDelete: options?.canDelete ?? false,
        canStat: false,
      },
      read: async () => content,
      write: options?.canWrite
        ? async (location: string, content: Buffer) => {
            written.push({ location, content });
          }
        : undefined,
      delete: options?.canDelete
        ? async (location: string) => {
            deleted.push(location);
          }
        : undefined,
    };
  };

  const createContext = (overrides?: Partial<SemanticContext>): SemanticContext => ({
    url: "arp:text:https://example.com/file.txt",
    semantic: "text",
    transport: "https",
    location: "example.com/file.txt",
    timestamp: new Date("2025-01-15T00:00:00Z"),
    ...overrides,
  });

  describe("textHandler", () => {
    it("has correct name", () => {
      expect(textHandler.name).toBe("text");
    });

    describe("resolve", () => {
      it("resolves buffer to text resource", async () => {
        const content = Buffer.from("Hello, World!");
        const transport = createMockTransport(content);
        const context = createContext();

        const result = await textHandler.resolve(transport, "example.com/file.txt", context);

        expect(result.type).toBe("text");
        expect(result.content).toBe("Hello, World!");
      });

      it("includes correct meta", async () => {
        const content = Buffer.from("Test content");
        const transport = createMockTransport(content);
        const context = createContext();

        const result = await textHandler.resolve(transport, "example.com/file.txt", context);

        expect(result.meta.url).toBe("arp:text:https://example.com/file.txt");
        expect(result.meta.semantic).toBe("text");
        expect(result.meta.transport).toBe("https");
        expect(result.meta.location).toBe("example.com/file.txt");
        expect(result.meta.size).toBe(12);
        expect(result.meta.encoding).toBe("utf-8");
        expect(result.meta.mimeType).toBe("text/plain");
        expect(result.meta.resolvedAt).toBe("2025-01-15T00:00:00.000Z");
      });

      it("handles empty content", async () => {
        const content = Buffer.from("");
        const transport = createMockTransport(content);
        const context = createContext();

        const result = await textHandler.resolve(transport, "example.com/file.txt", context);

        expect(result.content).toBe("");
        expect(result.meta.size).toBe(0);
      });

      it("handles unicode content", async () => {
        const content = Buffer.from("你好世界 🌍");
        const transport = createMockTransport(content);
        const context = createContext();

        const result = await textHandler.resolve(transport, "example.com/file.txt", context);

        expect(result.content).toBe("你好世界 🌍");
      });

      it("handles multiline content", async () => {
        const content = Buffer.from("line1\nline2\nline3");
        const transport = createMockTransport(content);
        const context = createContext();

        const result = await textHandler.resolve(transport, "example.com/file.txt", context);

        expect(result.content).toBe("line1\nline2\nline3");
      });
    });

    describe("deposit", () => {
      it("deposits text content", async () => {
        const written: { location: string; content: Buffer }[] = [];
        const transport = createMockTransport(Buffer.from(""), { canWrite: true, written });
        const context = createContext();

        await textHandler.deposit(transport, "example.com/file.txt", "Hello, World!", context);

        expect(written.length).toBe(1);
        expect(written[0].location).toBe("example.com/file.txt");
        expect(written[0].content.toString()).toBe("Hello, World!");
      });

      it("throws when transport does not support write", async () => {
        const transport = createMockTransport(Buffer.from(""), { canWrite: false });
        const context = createContext();

        await expect(
          textHandler.deposit(transport, "example.com/file.txt", "content", context)
        ).rejects.toThrow(SemanticError);
        await expect(
          textHandler.deposit(transport, "example.com/file.txt", "content", context)
        ).rejects.toThrow("does not support write");
      });
    });

    describe("exists", () => {
      it("uses transport exists if available", async () => {
        const transport: TransportHandler = {
          name: "mock",
          capabilities: {
            canRead: true,
            canWrite: false,
            canList: false,
            canDelete: false,
            canStat: false,
          },
          read: async () => Buffer.from(""),
          exists: async () => true,
        };
        const context = createContext();

        const result = await textHandler.exists!(transport, "example.com/file.txt", context);

        expect(result).toBe(true);
      });

      it("falls back to read when exists not available", async () => {
        const transport = createMockTransport(Buffer.from("content"));
        const context = createContext();

        const result = await textHandler.exists!(transport, "example.com/file.txt", context);

        expect(result).toBe(true);
      });
    });

    describe("delete", () => {
      it("deletes using transport", async () => {
        const deleted: string[] = [];
        const transport = createMockTransport(Buffer.from(""), { canDelete: true, deleted });
        const context = createContext();

        await textHandler.delete!(transport, "example.com/file.txt", context);

        expect(deleted).toContain("example.com/file.txt");
      });

      it("throws when transport does not support delete", async () => {
        const transport = createMockTransport(Buffer.from(""), { canDelete: false });
        const context = createContext();

        await expect(
          textHandler.delete!(transport, "example.com/file.txt", context)
        ).rejects.toThrow(SemanticError);
        await expect(
          textHandler.delete!(transport, "example.com/file.txt", context)
        ).rejects.toThrow("does not support delete");
      });
    });
  });

  describe("getSemanticHandler", () => {
    it("returns text handler", () => {
      const handler = getSemanticHandler("text");
      expect(handler.name).toBe("text");
    });

    it("throws on unsupported semantic", () => {
      expect(() => getSemanticHandler("unknown")).toThrow(SemanticError);
      expect(() => getSemanticHandler("unknown")).toThrow("Unsupported semantic");
    });
  });

  describe("registerSemanticHandler", () => {
    it("registers custom handler", async () => {
      const customHandler: SemanticHandler = {
        name: "custom-semantic",
        resolve: async (transport, location, context) => ({
          type: "custom-semantic",
          content: (await transport.read(location)).toString(),
          meta: {
            url: context.url,
            semantic: context.semantic,
            transport: context.transport,
            location: context.location,
            size: 0,
            resolvedAt: context.timestamp.toISOString(),
          },
        }),
      };

      registerSemanticHandler(customHandler);

      const handler = getSemanticHandler("custom-semantic");
      expect(handler.name).toBe("custom-semantic");
    });
  });
});
