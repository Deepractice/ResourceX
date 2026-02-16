import { describe, test, expect } from "bun:test";
import { SkillDetector } from "~/detector/SkillDetector.js";

const detector = new SkillDetector();

describe("SkillDetector", () => {
  test("returns null when no SKILL.md", () => {
    const files = { content: Buffer.from("hello") };
    expect(detector.detect(files, "/path/to/dir")).toBeNull();
  });

  test("detects SKILL.md", () => {
    const files = {
      "SKILL.md": Buffer.from("# My Skill\nDo something useful"),
    };
    const result = detector.detect(files, "/path/to/my-skill");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("skill");
    expect(result!.name).toBe("my-skill");
  });

  test("extracts description from first heading", () => {
    const files = {
      "SKILL.md": Buffer.from("# Build Docker Images\nSome content"),
    };
    const result = detector.detect(files, "/path/to/docker-builder")!;
    expect(result.description).toBe("Build Docker Images");
  });

  test("derives name from directory basename", () => {
    const files = {
      "SKILL.md": Buffer.from("# Skill\ncontent"),
    };
    const result = detector.detect(files, "/home/user/skills/role-management")!;
    expect(result.name).toBe("role-management");
  });

  test("handles SKILL.md without heading", () => {
    const files = {
      "SKILL.md": Buffer.from("No heading here, just content."),
    };
    const result = detector.detect(files, "/path/to/my-skill")!;
    expect(result.description).toBeUndefined();
  });

  test("does not exclude SKILL.md from content", () => {
    const files = {
      "SKILL.md": Buffer.from("# Skill\ncontent"),
    };
    const result = detector.detect(files, "/path/to/skill")!;
    expect(result.excludeFromContent ?? []).toEqual([]);
  });

  test("works with references directory", () => {
    const files = {
      "SKILL.md": Buffer.from("# Skill\ncontent"),
      "references/example.md": Buffer.from("example"),
    };
    const result = detector.detect(files, "/path/to/skill")!;
    expect(result.type).toBe("skill");
  });
});
