import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { NpmSourceLoader } from "~/loader/NpmSourceLoader.js";

const TEST_DIR = join(import.meta.dir, ".test-npm-source-loader");

beforeEach(async () => {
  await mkdir(TEST_DIR, { recursive: true });
});

afterEach(async () => {
  await rm(TEST_DIR, { recursive: true, force: true });
});

describe("NpmSourceLoader", () => {
  const loader = new NpmSourceLoader();

  describe("canLoad", () => {
    test("returns true for npm: prefixed sources", () => {
      expect(loader.canLoad("npm:@deepracticex/rolex-world")).toBe(true);
      expect(loader.canLoad("npm:some-package")).toBe(true);
    });

    test("returns false for non-npm sources", () => {
      expect(loader.canLoad("/some/directory")).toBe(false);
      expect(loader.canLoad("https://github.com/org/repo")).toBe(false);
      expect(loader.canLoad("@scope/package")).toBe(false);
    });
  });

  describe("load", () => {
    test("throws for non-npm source", async () => {
      await expect(loader.load("/some/path")).rejects.toThrow("Not an npm source");
    });

    test("throws for empty package name", async () => {
      await expect(loader.load("npm:")).rejects.toThrow("Empty package name");
    });

    test("throws for unresolvable package", async () => {
      await expect(loader.load("npm:@nonexistent/pkg-xyz-999")).rejects.toThrow(
        "Cannot resolve npm package"
      );
    });

    test("loads files from a real npm package", async () => {
      // Use bun:test itself — it's always available
      const rxs = await loader.load("npm:typescript");
      expect(rxs.source).toBe("npm:typescript");
      expect(rxs.files["package.json"]).toBeDefined();
    });
  });
});
