import { describe, test, expect } from "bun:test";
import { ResourceJsonDetector } from "~/detector/ResourceJsonDetector.js";

const detector = new ResourceJsonDetector();

describe("ResourceJsonDetector", () => {
  test("returns null when no resource.json", () => {
    const files = { content: Buffer.from("hello") };
    expect(detector.detect(files, "/path/to/dir")).toBeNull();
  });

  test("detects resource.json with name and type", () => {
    const files = {
      "resource.json": Buffer.from(JSON.stringify({ name: "hello", type: "text" })),
      content: Buffer.from("hello world"),
    };
    const result = detector.detect(files, "/path/to/dir");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("text");
    expect(result!.name).toBe("hello");
    expect(result!.excludeFromContent).toEqual(["resource.json"]);
  });

  test("extracts optional fields", () => {
    const files = {
      "resource.json": Buffer.from(
        JSON.stringify({
          name: "my-tool",
          type: "skill",
          tag: "1.0.0",
          description: "A useful tool",
          author: "Sean",
          registry: "example.com",
          path: "tools",
        })
      ),
      "SKILL.md": Buffer.from("# Tool"),
    };
    const result = detector.detect(files, "/path")!;
    expect(result.tag).toBe("1.0.0");
    expect(result.description).toBe("A useful tool");
    expect(result.author).toBe("Sean");
    expect(result.registry).toBe("example.com");
    expect(result.path).toBe("tools");
  });

  test("maps version to tag", () => {
    const files = {
      "resource.json": Buffer.from(
        JSON.stringify({
          name: "hello",
          type: "text",
          version: "2.0.0",
        })
      ),
      content: Buffer.from("hi"),
    };
    const result = detector.detect(files, "/path")!;
    expect(result.tag).toBe("2.0.0");
  });

  test("returns null for invalid JSON", () => {
    const files = {
      "resource.json": Buffer.from("not json"),
    };
    expect(detector.detect(files, "/path")).toBeNull();
  });

  test("returns null when missing required fields", () => {
    const files = {
      "resource.json": Buffer.from(JSON.stringify({ name: "hello" })),
    };
    expect(detector.detect(files, "/path")).toBeNull();
  });
});
