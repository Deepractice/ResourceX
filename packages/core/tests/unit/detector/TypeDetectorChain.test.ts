import { describe, expect, test } from "bun:test";
import { TypeDetectorChain } from "~/detector/TypeDetectorChain.js";
import type { TypeDetectionResult, TypeDetector } from "~/detector/types.js";

describe("TypeDetectorChain", () => {
  test("create() returns chain with built-in detectors", () => {
    const chain = TypeDetectorChain.create();
    // resource.json should be detected
    const files = {
      "resource.json": Buffer.from(JSON.stringify({ name: "test", type: "text" })),
      content: Buffer.from("hello"),
    };
    const result = chain.detect(files, "/path");
    expect(result.type).toBe("text");
    expect(result.name).toBe("test");
  });

  test("detects SKILL.md with built-in SkillDetector", () => {
    const chain = TypeDetectorChain.create();
    const files = {
      "SKILL.md": Buffer.from("# My Skill\ncontent"),
    };
    const result = chain.detect(files, "/path/to/my-skill");
    expect(result.type).toBe("skill");
    expect(result.name).toBe("my-skill");
  });

  test("resource.json takes priority over SKILL.md", () => {
    const chain = TypeDetectorChain.create();
    const files = {
      "resource.json": Buffer.from(JSON.stringify({ name: "explicit", type: "text" })),
      "SKILL.md": Buffer.from("# Skill\ncontent"),
    };
    const result = chain.detect(files, "/path");
    expect(result.type).toBe("text");
    expect(result.name).toBe("explicit");
  });

  test("throws when no detector matches", () => {
    const chain = TypeDetectorChain.create();
    const files = {
      "random.txt": Buffer.from("hello"),
    };
    expect(() => chain.detect(files, "/path/to/unknown")).toThrow("Cannot detect resource type");
  });

  test("register() adds custom detector after built-ins", () => {
    const chain = TypeDetectorChain.create();

    const customDetector: TypeDetector = {
      name: "custom",
      detect(files, _source): TypeDetectionResult | null {
        if (files["custom.yaml"]) {
          return { type: "custom", name: "detected" };
        }
        return null;
      },
    };
    chain.register(customDetector);

    const files = {
      "custom.yaml": Buffer.from("key: value"),
    };
    const result = chain.detect(files, "/path");
    expect(result.type).toBe("custom");
    expect(result.name).toBe("detected");
  });

  test("built-in detectors still win over custom", () => {
    const chain = TypeDetectorChain.create();

    const customDetector: TypeDetector = {
      name: "custom",
      detect(): TypeDetectionResult | null {
        return { type: "custom", name: "always" };
      },
    };
    chain.register(customDetector);

    const files = {
      "resource.json": Buffer.from(JSON.stringify({ name: "builtin", type: "text" })),
      content: Buffer.from("hello"),
    };
    const result = chain.detect(files, "/path");
    expect(result.type).toBe("text");
    expect(result.name).toBe("builtin");
  });
});
