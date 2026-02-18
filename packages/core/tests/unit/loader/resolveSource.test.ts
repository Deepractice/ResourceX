import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { TypeDetectionResult, TypeDetector } from "~/detector/types.js";
import { resolveSource } from "~/loader/resolveSource.js";
import { extract } from "~/model/index.js";

const TEST_DIR = join(import.meta.dir, ".test-resolve-source");

beforeEach(async () => {
  await mkdir(TEST_DIR, { recursive: true });
});

afterEach(async () => {
  await rm(TEST_DIR, { recursive: true, force: true });
});

describe("resolveSource", () => {
  test("resolves folder with resource.json", async () => {
    const dir = join(TEST_DIR, "with-resource-json");
    await mkdir(dir, { recursive: true });
    await writeFile(
      join(dir, "resource.json"),
      JSON.stringify({ name: "hello", type: "text", tag: "1.0.0" })
    );
    await writeFile(join(dir, "content"), "Hello World!");

    const rxr = await resolveSource(dir);
    expect(rxr.manifest.definition.name).toBe("hello");
    expect(rxr.manifest.definition.type).toBe("text");
    expect(rxr.manifest.definition.tag).toBe("1.0.0");

    const files = await extract(rxr.archive);
    expect(new TextDecoder().decode(files.content)).toBe("Hello World!");
    // resource.json should be excluded from archive
    expect(files["resource.json"]).toBeUndefined();
  });

  test("resolves folder with SKILL.md (auto-detect)", async () => {
    const dir = join(TEST_DIR, "my-skill");
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "SKILL.md"), "# My Skill\nDo something useful");

    const rxr = await resolveSource(dir);
    expect(rxr.manifest.definition.name).toBe("my-skill");
    expect(rxr.manifest.definition.type).toBe("skill");

    const files = await extract(rxr.archive);
    // SKILL.md should be IN the archive (it's content)
    expect(files["SKILL.md"]).toBeDefined();
  });

  test("resource.json takes priority over SKILL.md", async () => {
    const dir = join(TEST_DIR, "both");
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "resource.json"), JSON.stringify({ name: "explicit", type: "text" }));
    await writeFile(join(dir, "SKILL.md"), "# Skill\ncontent");

    const rxr = await resolveSource(dir);
    expect(rxr.manifest.definition.name).toBe("explicit");
    expect(rxr.manifest.definition.type).toBe("text");
  });

  test("throws for non-existent directory", async () => {
    await expect(resolveSource(join(TEST_DIR, "nope"))).rejects.toThrow("Cannot load source");
  });

  test("throws when no detector matches", async () => {
    const dir = join(TEST_DIR, "unknown");
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "random.txt"), "hello");

    await expect(resolveSource(dir)).rejects.toThrow("Cannot detect resource type");
  });

  test("uses custom detector", async () => {
    const dir = join(TEST_DIR, "custom");
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "prompt.txt"), "You are a helpful assistant");

    const promptDetector: TypeDetector = {
      name: "prompt",
      detect(files, _source): TypeDetectionResult | null {
        if (files["prompt.txt"]) {
          return { type: "text", name: "auto-prompt" };
        }
        return null;
      },
    };

    const rxr = await resolveSource(dir, { detectors: [promptDetector] });
    expect(rxr.manifest.definition.name).toBe("auto-prompt");
    expect(rxr.manifest.definition.type).toBe("text");
  });
});
