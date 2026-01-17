import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { loadRXC } from "../../../src/content/index.js";

const TEST_DIR = join(process.cwd(), ".test-rxc-load");

describe("loadRXC", () => {
  beforeEach(async () => {
    await mkdir(TEST_DIR, { recursive: true });
  });

  afterEach(async () => {
    await rm(TEST_DIR, { recursive: true, force: true });
  });

  describe("from file", () => {
    it("loads text file", async () => {
      const testFile = join(TEST_DIR, "test.txt");
      await writeFile(testFile, "Hello from file!");

      const rxc = await loadRXC(testFile);
      const text = await rxc.text();

      expect(text).toBe("Hello from file!");
    });

    it("loads binary file", async () => {
      const testFile = join(TEST_DIR, "test.bin");
      const binaryData = Buffer.from([0x01, 0x02, 0x03, 0x04]);
      await writeFile(testFile, binaryData);

      const rxc = await loadRXC(testFile);
      const buffer = await rxc.buffer();

      expect(buffer).toEqual(binaryData);
    });

    it("loads JSON file", async () => {
      const testFile = join(TEST_DIR, "test.json");
      await writeFile(testFile, '{"key": "value"}');

      const rxc = await loadRXC(testFile);
      const json = await rxc.json<{ key: string }>();

      expect(json).toEqual({ key: "value" });
    });

    it("has stream property", async () => {
      const testFile = join(TEST_DIR, "test.txt");
      await writeFile(testFile, "Hello!");

      const rxc = await loadRXC(testFile);

      expect(rxc.stream).toBeDefined();
    });
  });
});
