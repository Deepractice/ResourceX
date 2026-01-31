import { describe, it, expect, beforeEach } from "bun:test";
import { MemoryStorage } from "@resourcexjs/storage";
import { MirrorRegistry, RegistryError } from "../../src/index.js";
import { manifest, archive, resource, parse } from "@resourcexjs/core";
import type { RXR, RXD } from "@resourcexjs/core";

async function createTestRXR(domain: string, name: string, content: string): Promise<RXR> {
  const rxd: RXD = {
    domain,
    name,
    type: "text",
    version: "1.0.0",
  };
  const rxm = manifest(rxd);
  const rxa = await archive({ content: Buffer.from(content) });
  return resource(rxm, rxa);
}

describe("MirrorRegistry", () => {
  let storage: MemoryStorage;
  let registry: MirrorRegistry;

  beforeEach(() => {
    storage = new MemoryStorage();
    registry = new MirrorRegistry(storage);
  });

  describe("put and get", () => {
    it("caches and retrieves a resource", async () => {
      const rxr = await createTestRXR("deepractice.ai", "hello", "Hello World!");

      await registry.put(rxr);

      const retrieved = await registry.get(rxr.locator);
      expect(retrieved.manifest.domain).toBe("deepractice.ai");
      expect(retrieved.manifest.name).toBe("hello");
    });

    it("throws error for cache miss", async () => {
      const rxl = parse("deepractice.ai/not-cached.text@1.0.0");

      await expect(registry.get(rxl)).rejects.toThrow(RegistryError);
      await expect(registry.get(rxl)).rejects.toThrow("not found in cache");
    });
  });

  describe("clear", () => {
    it("clears all cached resources", async () => {
      await registry.put(await createTestRXR("domain1.com", "a", "1"));
      await registry.put(await createTestRXR("domain2.com", "b", "2"));
      expect(storage.size()).toBe(4); // 2 manifests + 2 archives

      await registry.clear();
      expect(storage.size()).toBe(0);
    });

    it("clears resources from specific domain", async () => {
      await registry.put(await createTestRXR("domain1.com", "a", "1"));
      await registry.put(await createTestRXR("domain2.com", "b", "2"));

      await registry.clear("domain1.com");

      // domain1.com should be cleared
      const rxl1 = parse("domain1.com/a.text@1.0.0");
      expect(await registry.has(rxl1)).toBe(false);

      // domain2.com should still exist
      const rxl2 = parse("domain2.com/b.text@1.0.0");
      expect(await registry.has(rxl2)).toBe(true);
    });
  });

  describe("list", () => {
    it("lists cached resources", async () => {
      await registry.put(await createTestRXR("example.com", "one", "1"));
      await registry.put(await createTestRXR("example.com", "two", "2"));

      const results = await registry.list();
      expect(results).toHaveLength(2);
    });

    it("filters by query", async () => {
      await registry.put(await createTestRXR("example.com", "hello", "1"));
      await registry.put(await createTestRXR("other.com", "world", "2"));

      const results = await registry.list({ query: "example" });
      expect(results).toHaveLength(1);
      expect(results[0].domain).toBe("example.com");
    });
  });
});
