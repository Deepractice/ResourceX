import { describe, it, expect } from "bun:test";
import { parseARP } from "../../src/parser.js";
import { ParseError } from "../../src/errors.js";

describe("parseARP", () => {
  describe("valid URLs", () => {
    it("parses standard ARP URL", () => {
      const result = parseARP("arp:text:https://example.com/file.txt");

      expect(result.semantic).toBe("text");
      expect(result.transport).toBe("https");
      expect(result.location).toBe("example.com/file.txt");
    });

    it("parses URL with http transport", () => {
      const result = parseARP("arp:text:http://localhost:3000/data");

      expect(result.semantic).toBe("text");
      expect(result.transport).toBe("http");
      expect(result.location).toBe("localhost:3000/data");
    });

    it("parses URL with file transport", () => {
      const result = parseARP("arp:config:file://./config/settings.json");

      expect(result.semantic).toBe("config");
      expect(result.transport).toBe("file");
      expect(result.location).toBe("./config/settings.json");
    });

    it("parses URL with query parameters", () => {
      const result = parseARP("arp:prompt:arr://deepractice@assistant?lang=zh");

      expect(result.semantic).toBe("prompt");
      expect(result.transport).toBe("arr");
      expect(result.location).toBe("deepractice@assistant?lang=zh");
    });

    it("parses URL with complex path", () => {
      const result = parseARP("arp:tool:https://cdn.example.com/v1/tools/parser.wasm");

      expect(result.semantic).toBe("tool");
      expect(result.transport).toBe("https");
      expect(result.location).toBe("cdn.example.com/v1/tools/parser.wasm");
    });
  });

  describe("invalid URLs", () => {
    it("throws ParseError for missing arp: prefix", () => {
      expect(() => parseARP("text:https://example.com")).toThrow(ParseError);
      expect(() => parseARP("text:https://example.com")).toThrow('must start with "arp:"');
    });

    it("throws ParseError for missing :// separator", () => {
      expect(() => parseARP("arp:text:https:example.com")).toThrow(ParseError);
      expect(() => parseARP("arp:text:https:example.com")).toThrow('missing "://"');
    });

    it("throws ParseError for missing transport", () => {
      expect(() => parseARP("arp:text:://example.com")).toThrow(ParseError);
      expect(() => parseARP("arp:text:://example.com")).toThrow("transport type cannot be empty");
    });

    it("throws ParseError for missing semantic", () => {
      expect(() => parseARP("arp::https://example.com")).toThrow(ParseError);
      expect(() => parseARP("arp::https://example.com")).toThrow("semantic type cannot be empty");
    });

    it("throws ParseError for missing location", () => {
      expect(() => parseARP("arp:text:https://")).toThrow(ParseError);
      expect(() => parseARP("arp:text:https://")).toThrow("location cannot be empty");
    });

    it("throws ParseError for missing semantic:transport format", () => {
      expect(() => parseARP("arp:texthttps://example.com")).toThrow(ParseError);
      expect(() => parseARP("arp:texthttps://example.com")).toThrow("must have exactly 2 types");
    });

    it("includes original URL in error", () => {
      const url = "invalid-url";
      try {
        parseARP(url);
      } catch (error) {
        expect(error).toBeInstanceOf(ParseError);
        expect((error as ParseError).url).toBe(url);
      }
    });
  });
});
