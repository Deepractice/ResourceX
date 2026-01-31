import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { join } from "node:path";
import { rm, mkdir } from "node:fs/promises";
import { FileSystemStorage, MemoryStorage, StorageError } from "../../src/index.js";

const TEST_DIR = join(process.cwd(), ".test-storage");

describe("MemoryStorage", () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
  });

  it("puts and gets data", async () => {
    const data = Buffer.from("hello world");
    await storage.put("test/key", data);

    const result = await storage.get("test/key");
    expect(result.toString()).toBe("hello world");
  });

  it("throws on get non-existent key", async () => {
    await expect(storage.get("not/exist")).rejects.toThrow(StorageError);
    await expect(storage.get("not/exist")).rejects.toThrow("not found");
  });

  it("checks existence", async () => {
    expect(await storage.exists("test/key")).toBe(false);

    await storage.put("test/key", Buffer.from("data"));

    expect(await storage.exists("test/key")).toBe(true);
  });

  it("deletes data", async () => {
    await storage.put("test/key", Buffer.from("data"));
    expect(await storage.exists("test/key")).toBe(true);

    await storage.delete("test/key");
    expect(await storage.exists("test/key")).toBe(false);
  });

  it("lists keys", async () => {
    await storage.put("a/b/c", Buffer.from("1"));
    await storage.put("a/b/d", Buffer.from("2"));
    await storage.put("a/e", Buffer.from("3"));
    await storage.put("f", Buffer.from("4"));

    const all = await storage.list();
    expect(all.sort()).toEqual(["a/b/c", "a/b/d", "a/e", "f"]);

    const prefixed = await storage.list("a/b");
    expect(prefixed.sort()).toEqual(["a/b/c", "a/b/d"]);
  });

  it("clears all data", async () => {
    await storage.put("a", Buffer.from("1"));
    await storage.put("b", Buffer.from("2"));
    expect(storage.size()).toBe(2);

    storage.clear();
    expect(storage.size()).toBe(0);
  });
});

describe("FileSystemStorage", () => {
  let storage: FileSystemStorage;

  beforeEach(async () => {
    await mkdir(TEST_DIR, { recursive: true });
    storage = new FileSystemStorage(TEST_DIR);
  });

  afterEach(async () => {
    await rm(TEST_DIR, { recursive: true, force: true });
  });

  it("puts and gets data", async () => {
    const data = Buffer.from("hello world");
    await storage.put("test/key.txt", data);

    const result = await storage.get("test/key.txt");
    expect(result.toString()).toBe("hello world");
  });

  it("throws on get non-existent key", async () => {
    await expect(storage.get("not/exist.txt")).rejects.toThrow(StorageError);
    await expect(storage.get("not/exist.txt")).rejects.toThrow("not found");
  });

  it("checks existence", async () => {
    expect(await storage.exists("test/key.txt")).toBe(false);

    await storage.put("test/key.txt", Buffer.from("data"));

    expect(await storage.exists("test/key.txt")).toBe(true);
  });

  it("deletes data", async () => {
    await storage.put("test/key.txt", Buffer.from("data"));
    expect(await storage.exists("test/key.txt")).toBe(true);

    await storage.delete("test/key.txt");
    expect(await storage.exists("test/key.txt")).toBe(false);
  });

  it("lists keys", async () => {
    await storage.put("a/b/c.txt", Buffer.from("1"));
    await storage.put("a/b/d.txt", Buffer.from("2"));
    await storage.put("a/e.txt", Buffer.from("3"));
    await storage.put("f.txt", Buffer.from("4"));

    const all = await storage.list();
    expect(all.sort()).toEqual(["a/b/c.txt", "a/b/d.txt", "a/e.txt", "f.txt"]);

    const prefixed = await storage.list("a/b");
    expect(prefixed.sort()).toEqual(["a/b/c.txt", "a/b/d.txt"]);
  });

  it("creates nested directories automatically", async () => {
    await storage.put("deep/nested/path/file.txt", Buffer.from("nested"));

    const result = await storage.get("deep/nested/path/file.txt");
    expect(result.toString()).toBe("nested");
  });
});
