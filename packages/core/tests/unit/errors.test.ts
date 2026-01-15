import { describe, it, expect } from "bun:test";
import { ResourceXError, ParseError, TransportError, SemanticError } from "../../src/errors.js";

describe("Error Classes", () => {
  describe("ResourceXError", () => {
    it("creates error with message", () => {
      const error = new ResourceXError("test error");

      expect(error.message).toBe("test error");
      expect(error.name).toBe("ResourceXError");
      expect(error).toBeInstanceOf(Error);
    });

    it("supports error cause option", () => {
      const cause = new Error("original error");
      const error = new ResourceXError("wrapped error", { cause });

      expect(error.cause).toBe(cause);
    });
  });

  describe("ParseError", () => {
    it("creates error with message and url", () => {
      const error = new ParseError("invalid url", "arp:bad:url");

      expect(error.message).toBe("invalid url");
      expect(error.name).toBe("ParseError");
      expect(error.url).toBe("arp:bad:url");
    });

    it("extends ResourceXError", () => {
      const error = new ParseError("test");

      expect(error).toBeInstanceOf(ResourceXError);
      expect(error).toBeInstanceOf(Error);
    });

    it("url is optional", () => {
      const error = new ParseError("test");

      expect(error.url).toBeUndefined();
    });
  });

  describe("TransportError", () => {
    it("creates error with message and transport", () => {
      const error = new TransportError("network failed", "https");

      expect(error.message).toBe("network failed");
      expect(error.name).toBe("TransportError");
      expect(error.transport).toBe("https");
    });

    it("extends ResourceXError", () => {
      const error = new TransportError("test");

      expect(error).toBeInstanceOf(ResourceXError);
      expect(error).toBeInstanceOf(Error);
    });

    it("supports error cause", () => {
      const cause = new Error("connection refused");
      const error = new TransportError("network failed", "https", { cause });

      expect(error.cause).toBe(cause);
    });

    it("transport is optional", () => {
      const error = new TransportError("test");

      expect(error.transport).toBeUndefined();
    });
  });

  describe("SemanticError", () => {
    it("creates error with message and semantic", () => {
      const error = new SemanticError("parse failed", "json");

      expect(error.message).toBe("parse failed");
      expect(error.name).toBe("SemanticError");
      expect(error.semantic).toBe("json");
    });

    it("extends ResourceXError", () => {
      const error = new SemanticError("test");

      expect(error).toBeInstanceOf(ResourceXError);
      expect(error).toBeInstanceOf(Error);
    });

    it("supports error cause", () => {
      const cause = new SyntaxError("unexpected token");
      const error = new SemanticError("parse failed", "json", { cause });

      expect(error.cause).toBe(cause);
    });

    it("semantic is optional", () => {
      const error = new SemanticError("test");

      expect(error.semantic).toBeUndefined();
    });
  });

  describe("Error Hierarchy", () => {
    it("all errors can be caught as ResourceXError", () => {
      const errors = [
        new ParseError("parse"),
        new TransportError("transport"),
        new SemanticError("semantic"),
      ];

      for (const error of errors) {
        expect(error).toBeInstanceOf(ResourceXError);
      }
    });
  });
});
