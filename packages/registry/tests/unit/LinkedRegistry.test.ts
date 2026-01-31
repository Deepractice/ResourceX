import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { join } from "node:path";
import { rm, mkdir, writeFile } from "node:fs/promises";
import { LinkedRegistry, RegistryError } from "../../src/index.js";
import { parse } from "@resourcexjs/core";

const TEST_DIR = join(process.cwd(), ".test-linked-registry");
const DEV_DIR = join(process.cwd(), ".test-dev-resource");

describe("LinkedRegistry", () => {
  let registry: LinkedRegistry;

  beforeEach(async () => {
    await mkdir(TEST_DIR, { recursive: true });
    await mkdir(DEV_DIR, { recursive: true });
    registry = new LinkedRegistry(TEST_DIR);
  });

  afterEach(async () => {
    await rm(TEST_DIR, { recursive: true, force: true });
    await rm(DEV_DIR, { recursive: true, force: true });
  });

  async function createDevResource(name: string, content: string): Promise<string> {
    const resourceDir = join(DEV_DIR, name);
    await mkdir(resourceDir, { recursive: true });

    // Create resource.json
    const resourceJson = {
      registry: "localhost",
      name,
      type: "text",
      version: "1.0.0",
    };
    await writeFile(join(resourceDir, "resource.json"), JSON.stringify(resourceJson, null, 2));

    // Create content file
    await writeFile(join(resourceDir, "content"), content);

    return resourceDir;
  }

  describe("link", () => {
    it("creates a symlink to dev directory", async () => {
      const devPath = await createDevResource("my-prompt", "Hello, {{name}}!");

      const rxl = await registry.link(devPath);

      expect(rxl.name).toBe("my-prompt");
      expect(rxl.tag).toBe("1.0.0");
      expect(await registry.has(rxl)).toBe(true);
    });

    it("returns RXL of linked resource", async () => {
      const devPath = await createDevResource("test-resource", "content");

      const rxl = await registry.link(devPath);

      expect(rxl.registry).toBe("localhost");
      expect(rxl.name).toBe("test-resource");
      expect(rxl.tag).toBe("1.0.0");
    });
  });

  describe("get", () => {
    it("loads resource from linked directory", async () => {
      const devPath = await createDevResource("hello", "Hello World!");
      await registry.link(devPath);

      const rxl = parse("localhost/hello:1.0.0");
      const rxr = await registry.get(rxl);

      expect(rxr.manifest.name).toBe("hello");
      expect(rxr.manifest.type).toBe("text");
    });

    it("throws error for non-linked resource", async () => {
      const rxl = parse("localhost/not-linked:1.0.0");

      await expect(registry.get(rxl)).rejects.toThrow(RegistryError);
      await expect(registry.get(rxl)).rejects.toThrow("not found");
    });
  });

  describe("put", () => {
    it("throws error - put not supported for LinkedRegistry", async () => {
      const devPath = await createDevResource("test", "content");
      await registry.link(devPath);
      const rxl = parse("localhost/test:1.0.0");
      const rxr = await registry.get(rxl);

      await expect(registry.put(rxr)).rejects.toThrow(RegistryError);
      await expect(registry.put(rxr)).rejects.toThrow("does not support put");
    });
  });

  describe("unlink", () => {
    it("removes symlink", async () => {
      const devPath = await createDevResource("to-unlink", "content");
      const rxl = await registry.link(devPath);
      expect(await registry.has(rxl)).toBe(true);

      await registry.unlink(rxl);
      expect(await registry.has(rxl)).toBe(false);
    });
  });

  describe("list", () => {
    it("lists linked resources", async () => {
      await registry.link(await createDevResource("one", "1"));
      await registry.link(await createDevResource("two", "2"));

      const results = await registry.list();
      expect(results).toHaveLength(2);
    });

    it("returns empty array when no links exist", async () => {
      const results = await registry.list();
      expect(results).toHaveLength(0);
    });
  });
});
