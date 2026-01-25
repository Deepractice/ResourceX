import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { join } from "node:path";
import { rm, mkdir } from "node:fs/promises";
import { createRegistry, RegistryError } from "../../src/index.js";
import { createRXM, createRXA, parseRXL } from "@resourcexjs/core";
import type { RXR } from "@resourcexjs/core";

const TEST_DIR = join(process.cwd(), ".test-registry");

async function createTestRXR(name: string, content: string): Promise<RXR> {
  const manifest = createRXM({
    domain: "localhost",
    name,
    type: "text",
    version: "1.0.0",
  });

  return {
    locator: parseRXL(manifest.toLocator()),
    manifest,
    archive: await createRXA({ content }),
  };
}

describe("LocalRegistry", () => {
  beforeEach(async () => {
    await mkdir(TEST_DIR, { recursive: true });
  });

  afterEach(async () => {
    await rm(TEST_DIR, { recursive: true, force: true });
  });

  describe("add", () => {
    it("adds a resource to local registry", async () => {
      const registry = createRegistry({ path: TEST_DIR });
      const rxr = await createTestRXR("test-prompt", "Hello, {{name}}!");

      await registry.add(rxr);

      const exists = await registry.exists("localhost/test-prompt.text@1.0.0");
      expect(exists).toBe(true);
    });
  });

  describe("resolve", () => {
    it("resolves a linked resource", async () => {
      const registry = createRegistry({ path: TEST_DIR });
      const rxr = await createTestRXR("hello", "Hello World!");

      await registry.add(rxr);

      const resolved = await registry.resolve("localhost/hello.text@1.0.0");

      // Access via resource field
      expect(resolved.resource.manifest.name).toBe("hello");
      expect(resolved.resource.manifest.type).toBe("text");

      // Can also use execute() to get content
      const content = await resolved.execute();
      expect(content).toBe("Hello World!");
    });

    it("throws error for non-existent resource", async () => {
      const registry = createRegistry({ path: TEST_DIR });

      await expect(registry.resolve("localhost/not-exist.text@1.0.0")).rejects.toThrow(
        RegistryError
      );
      await expect(registry.resolve("localhost/not-exist.text@1.0.0")).rejects.toThrow("not found");
    });
  });

  describe("exists", () => {
    it("returns true for existing resource", async () => {
      const registry = createRegistry({ path: TEST_DIR });
      const rxr = await createTestRXR("exists-test", "content");

      await registry.add(rxr);

      const exists = await registry.exists("localhost/exists-test.text@1.0.0");
      expect(exists).toBe(true);
    });

    it("returns false for non-existing resource", async () => {
      const registry = createRegistry({ path: TEST_DIR });

      const exists = await registry.exists("localhost/not-exist.text@1.0.0");
      expect(exists).toBe(false);
    });
  });

  describe("delete", () => {
    it("deletes a linked resource", async () => {
      const registry = createRegistry({ path: TEST_DIR });
      const rxr = await createTestRXR("to-delete", "content");

      await registry.add(rxr);
      expect(await registry.exists("localhost/to-delete.text@1.0.0")).toBe(true);

      await registry.delete("localhost/to-delete.text@1.0.0");
      expect(await registry.exists("localhost/to-delete.text@1.0.0")).toBe(false);
    });
  });

  describe("type aliases", () => {
    it("supports txt as alias for text", async () => {
      const registry = createRegistry({ path: TEST_DIR });
      const manifest = createRXM({
        domain: "localhost",
        name: "alias-test",
        type: "txt", // Using alias
        version: "1.0.0",
      });
      const rxr: RXR = {
        locator: parseRXL(manifest.toLocator()),
        manifest,
        archive: await createRXA({ content: "Hello via alias!" }),
      };

      await registry.add(rxr);

      const resolved = await registry.resolve("localhost/alias-test.txt@1.0.0");
      const content = await resolved.execute();
      expect(content).toBe("Hello via alias!");
    });

    it("supports config as alias for json", async () => {
      const registry = createRegistry({ path: TEST_DIR });
      const manifest = createRXM({
        domain: "localhost",
        name: "config-test",
        type: "config", // Using alias
        version: "1.0.0",
      });
      const rxr: RXR = {
        locator: parseRXL(manifest.toLocator()),
        manifest,
        archive: await createRXA({ content: '{"key": "value"}' }),
      };

      await registry.add(rxr);

      const resolved = await registry.resolve<void, { key: string }>(
        "localhost/config-test.config@1.0.0"
      );
      const json = await resolved.execute();
      expect(json.key).toBe("value");
    });

    it("supports bin as alias for binary", async () => {
      const registry = createRegistry({ path: TEST_DIR });
      const manifest = createRXM({
        domain: "localhost",
        name: "binary-test",
        type: "bin", // Using alias
        version: "1.0.0",
      });
      const binaryData = Buffer.from([0x01, 0x02, 0x03, 0x04]);
      const rxr: RXR = {
        locator: parseRXL(manifest.toLocator()),
        manifest,
        archive: await createRXA({ content: binaryData }),
      };

      await registry.add(rxr);

      const resolved = await registry.resolve<void, Buffer>("localhost/binary-test.bin@1.0.0");
      const content = await resolved.execute();
      expect(content).toEqual(binaryData);
    });
  });

  describe("supportType", () => {
    it("supports dynamically registered type", async () => {
      const registry = createRegistry({ path: TEST_DIR });

      // Define a custom bundled type
      const customType = {
        name: "prompt",
        description: "AI prompt type",
        code: `
          ({
            async resolve(rxr) {
              const pkg = await rxr.archive.extract();
              const buffer = await pkg.file("content");
              return buffer.toString("utf-8");
            }
          })
        `,
        sandbox: "none" as const,
      };

      registry.supportType(customType);

      const manifest = createRXM({
        domain: "localhost",
        name: "greet",
        type: "prompt",
        version: "1.0.0",
      });
      const rxr: RXR = {
        locator: parseRXL(manifest.toLocator()),
        manifest,
        archive: await createRXA({ content: "Hello, {{name}}!" }),
      };

      await registry.add(rxr);

      const resolved = await registry.resolve("localhost/greet.prompt@1.0.0");
      const content = await resolved.execute();
      expect(content).toBe("Hello, {{name}}!");
    });
  });
});
