import { describe, it, expect } from "bun:test";
import {
  textHandler,
  getSemanticHandler,
  registerSemanticHandler,
} from "../../src/semantic/index.js";
import { SemanticError } from "../../src/errors.js";
import type { SemanticHandler, Resource, ParseContext } from "../../src/semantic/types.js";

describe("Semantic Handlers", () => {
  const createContext = (overrides?: Partial<ParseContext>): ParseContext => ({
    url: "arp:text:https://example.com/file.txt",
    semantic: "text",
    transport: "https",
    location: "example.com/file.txt",
    fetchedAt: new Date("2025-01-15T00:00:00Z"),
    ...overrides,
  });

  describe("textHandler", () => {
    it("has correct type", () => {
      expect(textHandler.type).toBe("text");
    });

    it("parses buffer to text resource", () => {
      const content = Buffer.from("Hello, World!");
      const context = createContext();

      const result = textHandler.parse(content, context);

      expect(result.type).toBe("text");
      expect(result.content).toBe("Hello, World!");
    });

    it("includes correct meta", () => {
      const content = Buffer.from("Test content");
      const context = createContext();

      const result = textHandler.parse(content, context);

      expect(result.meta.url).toBe("arp:text:https://example.com/file.txt");
      expect(result.meta.semantic).toBe("text");
      expect(result.meta.transport).toBe("https");
      expect(result.meta.location).toBe("example.com/file.txt");
      expect(result.meta.size).toBe(12);
      expect(result.meta.encoding).toBe("utf-8");
      expect(result.meta.mimeType).toBe("text/plain");
      expect(result.meta.fetchedAt).toBe("2025-01-15T00:00:00.000Z");
    });

    it("handles empty content", () => {
      const content = Buffer.from("");
      const context = createContext();

      const result = textHandler.parse(content, context);

      expect(result.content).toBe("");
      expect(result.meta.size).toBe(0);
    });

    it("handles unicode content", () => {
      const content = Buffer.from("你好世界 🌍");
      const context = createContext();

      const result = textHandler.parse(content, context);

      expect(result.content).toBe("你好世界 🌍");
    });

    it("handles multiline content", () => {
      const content = Buffer.from("line1\nline2\nline3");
      const context = createContext();

      const result = textHandler.parse(content, context);

      expect(result.content).toBe("line1\nline2\nline3");
    });
  });

  describe("getSemanticHandler", () => {
    it("returns text handler", () => {
      const handler = getSemanticHandler("text");
      expect(handler.type).toBe("text");
    });

    it("throws on unsupported semantic", () => {
      expect(() => getSemanticHandler("unknown")).toThrow(SemanticError);
      expect(() => getSemanticHandler("unknown")).toThrow("Unsupported semantic");
    });
  });

  describe("registerSemanticHandler", () => {
    it("registers custom handler", () => {
      const customHandler: SemanticHandler = {
        type: "custom-semantic",
        parse: (content: Buffer, context: ParseContext): Resource => ({
          type: "custom-semantic",
          content: content.toString(),
          meta: {
            url: context.url,
            semantic: context.semantic,
            transport: context.transport,
            location: context.location,
            size: content.length,
            fetchedAt: context.fetchedAt.toISOString(),
          },
        }),
      };

      registerSemanticHandler(customHandler);

      const handler = getSemanticHandler("custom-semantic");
      expect(handler.type).toBe("custom-semantic");
    });
  });
});
