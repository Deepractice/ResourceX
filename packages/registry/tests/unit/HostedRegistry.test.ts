import { describe, it, expect, beforeEach } from "bun:test";
import { MemoryStorage } from "@resourcexjs/storage";
import { HostedRegistry, RegistryError } from "../../src/index.js";
import { manifest, archive, resource, parse } from "@resourcexjs/core";
import type { RXR, RXD } from "@resourcexjs/core";

async function createTestRXR(name: string, content: string): Promise<RXR> {
  const rxd: RXD = {
    domain: "localhost",
    name,
    type: "text",
    version: "1.0.0",
  };
  const rxm = manifest(rxd);
  const rxa = await archive({ content: Buffer.from(content) });
  return resource(rxm, rxa);
}

describe("HostedRegistry", () => {
  let storage: MemoryStorage;
  let registry: HostedRegistry;

  beforeEach(() => {
    storage = new MemoryStorage();
    registry = new HostedRegistry(storage);
  });

  describe("put and get", () => {
    it("stores and retrieves a resource", async () => {
      const rxr = await createTestRXR("hello", "Hello World!");

      await registry.put(rxr);

      const retrieved = await registry.get(rxr.locator);
      expect(retrieved.manifest.name).toBe("hello");
      expect(retrieved.manifest.type).toBe("text");
      expect(retrieved.manifest.version).toBe("1.0.0");
    });

    it("throws error for non-existent resource", async () => {
      const rxl = parse("localhost/not-exist.text@1.0.0");

      await expect(registry.get(rxl)).rejects.toThrow(RegistryError);
      await expect(registry.get(rxl)).rejects.toThrow("not found");
    });
  });

  describe("has", () => {
    it("returns true for existing resource", async () => {
      const rxr = await createTestRXR("exists", "content");
      await registry.put(rxr);

      const exists = await registry.has(rxr.locator);
      expect(exists).toBe(true);
    });

    it("returns false for non-existing resource", async () => {
      const rxl = parse("localhost/not-exist.text@1.0.0");

      const exists = await registry.has(rxl);
      expect(exists).toBe(false);
    });
  });

  describe("remove", () => {
    it("removes a resource", async () => {
      const rxr = await createTestRXR("to-delete", "content");
      await registry.put(rxr);
      expect(await registry.has(rxr.locator)).toBe(true);

      await registry.remove(rxr.locator);
      expect(await registry.has(rxr.locator)).toBe(false);
    });
  });

  describe("list", () => {
    it("lists all resources", async () => {
      await registry.put(await createTestRXR("one", "1"));
      await registry.put(await createTestRXR("two", "2"));
      await registry.put(await createTestRXR("three", "3"));

      const results = await registry.list();
      expect(results).toHaveLength(3);
    });

    it("filters by query", async () => {
      await registry.put(await createTestRXR("hello", "1"));
      await registry.put(await createTestRXR("world", "2"));
      await registry.put(await createTestRXR("hello-world", "3"));

      const results = await registry.list({ query: "hello" });
      expect(results).toHaveLength(2);
    });

    it("supports pagination", async () => {
      await registry.put(await createTestRXR("a", "1"));
      await registry.put(await createTestRXR("b", "2"));
      await registry.put(await createTestRXR("c", "3"));

      const page1 = await registry.list({ limit: 2 });
      expect(page1).toHaveLength(2);

      const page2 = await registry.list({ limit: 2, offset: 2 });
      expect(page2).toHaveLength(1);
    });
  });

  describe("resources with path", () => {
    it("stores resource with path", async () => {
      const rxd: RXD = {
        domain: "example.com",
        path: "tools/ai",
        name: "helper",
        type: "text",
        version: "1.0.0",
      };
      const rxm = manifest(rxd);
      const rxa = await archive({ content: Buffer.from("helper content") });
      const rxr = resource(rxm, rxa);

      await registry.put(rxr);

      const retrieved = await registry.get(rxr.locator);
      expect(retrieved.manifest.domain).toBe("example.com");
      expect(retrieved.manifest.path).toBe("tools/ai");
      expect(retrieved.manifest.name).toBe("helper");
    });
  });
});
