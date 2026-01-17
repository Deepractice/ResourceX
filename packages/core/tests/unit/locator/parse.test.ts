import { describe, it, expect } from "bun:test";
import { parseRXL } from "../../../src/locator/index.js";

describe("parseRXL", () => {
  describe("name only", () => {
    it("parses simple name", () => {
      const rxl = parseRXL("assistant");

      expect(rxl.name).toBe("assistant");
      expect(rxl.domain).toBeUndefined();
      expect(rxl.path).toBeUndefined();
      expect(rxl.type).toBeUndefined();
      expect(rxl.version).toBeUndefined();
    });
  });

  describe("name with type", () => {
    it("parses name.type", () => {
      const rxl = parseRXL("assistant.prompt");

      expect(rxl.name).toBe("assistant");
      expect(rxl.type).toBe("prompt");
    });

    it("parses name with multi-word type", () => {
      const rxl = parseRXL("my-tool.tool");

      expect(rxl.name).toBe("my-tool");
      expect(rxl.type).toBe("tool");
    });
  });

  describe("name with version", () => {
    it("parses name@version", () => {
      const rxl = parseRXL("assistant@1.0.0");

      expect(rxl.name).toBe("assistant");
      expect(rxl.version).toBe("1.0.0");
    });

    it("parses name.type@version", () => {
      const rxl = parseRXL("assistant.prompt@1.0.0");

      expect(rxl.name).toBe("assistant");
      expect(rxl.type).toBe("prompt");
      expect(rxl.version).toBe("1.0.0");
    });

    it("parses version with pre-release tag", () => {
      const rxl = parseRXL("assistant@1.0.0-beta.1");

      expect(rxl.name).toBe("assistant");
      expect(rxl.version).toBe("1.0.0-beta.1");
    });
  });

  describe("with domain", () => {
    it("parses domain/name", () => {
      const rxl = parseRXL("deepractice.ai/assistant");

      expect(rxl.domain).toBe("deepractice.ai");
      expect(rxl.name).toBe("assistant");
      expect(rxl.path).toBeUndefined();
    });

    it("parses domain/name.type", () => {
      const rxl = parseRXL("deepractice.ai/assistant.prompt");

      expect(rxl.domain).toBe("deepractice.ai");
      expect(rxl.name).toBe("assistant");
      expect(rxl.type).toBe("prompt");
    });

    it("parses domain/name@version", () => {
      const rxl = parseRXL("deepractice.ai/assistant@1.0.0");

      expect(rxl.domain).toBe("deepractice.ai");
      expect(rxl.name).toBe("assistant");
      expect(rxl.version).toBe("1.0.0");
    });

    it("parses full: domain/name.type@version", () => {
      const rxl = parseRXL("deepractice.ai/assistant.prompt@1.0.0");

      expect(rxl.domain).toBe("deepractice.ai");
      expect(rxl.name).toBe("assistant");
      expect(rxl.type).toBe("prompt");
      expect(rxl.version).toBe("1.0.0");
    });
  });

  describe("with path", () => {
    it("parses domain/path/name", () => {
      const rxl = parseRXL("deepractice.ai/sean/assistant");

      expect(rxl.domain).toBe("deepractice.ai");
      expect(rxl.path).toBe("sean");
      expect(rxl.name).toBe("assistant");
    });

    it("parses domain/path/path/name (nested path)", () => {
      const rxl = parseRXL("deepractice.ai/org/team/assistant");

      expect(rxl.domain).toBe("deepractice.ai");
      expect(rxl.path).toBe("org/team");
      expect(rxl.name).toBe("assistant");
    });

    it("parses full: domain/path/name.type@version", () => {
      const rxl = parseRXL("deepractice.ai/sean/assistant.prompt@1.0.0");

      expect(rxl.domain).toBe("deepractice.ai");
      expect(rxl.path).toBe("sean");
      expect(rxl.name).toBe("assistant");
      expect(rxl.type).toBe("prompt");
      expect(rxl.version).toBe("1.0.0");
    });
  });

  describe("localhost", () => {
    it("parses localhost/name", () => {
      const rxl = parseRXL("localhost/assistant");

      expect(rxl.domain).toBe("localhost");
      expect(rxl.name).toBe("assistant");
    });

    it("parses localhost/path/name", () => {
      const rxl = parseRXL("localhost/my-project/assistant");

      expect(rxl.domain).toBe("localhost");
      expect(rxl.path).toBe("my-project");
      expect(rxl.name).toBe("assistant");
    });
  });

  describe("github.com", () => {
    it("parses github.com/user/name", () => {
      const rxl = parseRXL("github.com/user/assistant");

      expect(rxl.domain).toBe("github.com");
      expect(rxl.path).toBe("user");
      expect(rxl.name).toBe("assistant");
    });

    it("parses github.com/org/repo/name.type@version", () => {
      const rxl = parseRXL("github.com/org/repo/assistant.tool@2.0.0");

      expect(rxl.domain).toBe("github.com");
      expect(rxl.path).toBe("org/repo");
      expect(rxl.name).toBe("assistant");
      expect(rxl.type).toBe("tool");
      expect(rxl.version).toBe("2.0.0");
    });
  });

  describe("toString", () => {
    it("reconstructs simple name", () => {
      const rxl = parseRXL("assistant");
      expect(rxl.toString()).toBe("assistant");
    });

    it("reconstructs name.type", () => {
      const rxl = parseRXL("assistant.prompt");
      expect(rxl.toString()).toBe("assistant.prompt");
    });

    it("reconstructs name@version", () => {
      const rxl = parseRXL("assistant@1.0.0");
      expect(rxl.toString()).toBe("assistant@1.0.0");
    });

    it("reconstructs full locator", () => {
      const rxl = parseRXL("deepractice.ai/sean/assistant.prompt@1.0.0");
      expect(rxl.toString()).toBe("deepractice.ai/sean/assistant.prompt@1.0.0");
    });
  });
});
