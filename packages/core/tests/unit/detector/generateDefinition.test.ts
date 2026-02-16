import { describe, expect, test } from "bun:test";
import { generateDefinition } from "~/detector/generateDefinition.js";

describe("generateDefinition", () => {
  test("generates RXD from minimal result", () => {
    const rxd = generateDefinition({ type: "text", name: "hello" });
    expect(rxd.name).toBe("hello");
    expect(rxd.type).toBe("text");
  });

  test("generates RXD with all optional fields", () => {
    const rxd = generateDefinition({
      type: "skill",
      name: "my-skill",
      tag: "1.0.0",
      description: "A useful skill",
      author: "Sean",
      registry: "example.com",
      path: "tools",
      license: "MIT",
      keywords: ["ai", "skill"],
      repository: "https://github.com/example/repo",
    });
    expect(rxd.name).toBe("my-skill");
    expect(rxd.type).toBe("skill");
    expect(rxd.tag).toBe("1.0.0");
    expect(rxd.description).toBe("A useful skill");
    expect(rxd.author).toBe("Sean");
  });

  test("tag defaults to undefined when not provided", () => {
    const rxd = generateDefinition({ type: "text", name: "hello" });
    expect(rxd.tag).toBeUndefined();
  });

  test("throws for invalid name", () => {
    expect(() => generateDefinition({ type: "text", name: "" })).toThrow();
  });

  test("throws for invalid type", () => {
    expect(() => generateDefinition({ type: "", name: "hello" })).toThrow();
  });
});
