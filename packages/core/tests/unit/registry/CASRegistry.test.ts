import { describe, it, expect, beforeEach } from "bun:test";
import {
  CASRegistry,
  MemoryRXAStore,
  MemoryRXMStore,
  archive,
  manifest,
  resource,
  format,
} from "../../../src/index.js";

describe("CASRegistry", () => {
  let rxaStore: MemoryRXAStore;
  let rxmStore: MemoryRXMStore;
  let registry: CASRegistry;

  beforeEach(() => {
    rxaStore = new MemoryRXAStore();
    rxmStore = new MemoryRXMStore();
    registry = new CASRegistry(rxaStore, rxmStore);
  });

  describe("put and get", () => {
    it("stores and retrieves a resource", async () => {
      // Create a test resource
      const rxm = manifest({
        name: "test-resource",
        type: "text",
        tag: "1.0.0",
      });
      const rxa = await archive({
        "content.txt": Buffer.from("Hello, World!"),
      });
      const rxr = resource(rxm, rxa);

      // Store it
      await registry.put(rxr);

      // Retrieve it
      const retrieved = await registry.get({
        name: "test-resource",
        tag: "1.0.0",
      });

      expect(retrieved.manifest.name).toBe("test-resource");
      expect(retrieved.manifest.type).toBe("text");
      expect(retrieved.manifest.tag).toBe("1.0.0");
    });

    it("deduplicates identical content", async () => {
      // Create two resources with the same content
      const content = Buffer.from("Same content!");

      const rxr1 = resource(
        manifest({ name: "resource-1", type: "text", tag: "1.0.0" }),
        await archive({ "content.txt": content })
      );

      const rxr2 = resource(
        manifest({ name: "resource-2", type: "text", tag: "1.0.0" }),
        await archive({ "content.txt": content })
      );

      await registry.put(rxr1);
      await registry.put(rxr2);

      // Should only have 1 blob (content is deduplicated)
      const blobs = await rxaStore.list();
      expect(blobs.length).toBe(1);

      // But 2 manifests
      const manifests = await rxmStore.search({});
      expect(manifests.length).toBe(2);
    });

    it("throws error for non-existent resource", async () => {
      await expect(registry.get({ name: "non-existent", tag: "1.0.0" })).rejects.toThrow(
        "not found"
      );
    });
  });

  describe("has", () => {
    it("returns true for existing resource", async () => {
      const rxr = resource(
        manifest({ name: "exists", type: "text", tag: "1.0.0" }),
        await archive({ "content.txt": Buffer.from("Hello") })
      );
      await registry.put(rxr);

      const exists = await registry.has({ name: "exists", tag: "1.0.0" });
      expect(exists).toBe(true);
    });

    it("returns false for non-existing resource", async () => {
      const exists = await registry.has({ name: "not-exists", tag: "1.0.0" });
      expect(exists).toBe(false);
    });
  });

  describe("remove", () => {
    it("removes a resource", async () => {
      const rxr = resource(
        manifest({ name: "to-remove", type: "text", tag: "1.0.0" }),
        await archive({ "content.txt": Buffer.from("Goodbye") })
      );
      await registry.put(rxr);

      await registry.remove({ name: "to-remove", tag: "1.0.0" });

      const exists = await registry.has({ name: "to-remove", tag: "1.0.0" });
      expect(exists).toBe(false);
    });
  });

  describe("list", () => {
    it("lists all resources", async () => {
      await registry.put(
        resource(
          manifest({ name: "resource-a", type: "text", tag: "1.0.0" }),
          await archive({ content: Buffer.from("A") })
        )
      );
      await registry.put(
        resource(
          manifest({ name: "resource-b", type: "json", tag: "2.0.0" }),
          await archive({ content: Buffer.from("B") })
        )
      );

      const results = await registry.list();
      expect(results.length).toBe(2);
    });

    it("filters by query", async () => {
      await registry.put(
        resource(
          manifest({ name: "hello-world", type: "text", tag: "1.0.0" }),
          await archive({ content: Buffer.from("A") })
        )
      );
      await registry.put(
        resource(
          manifest({ name: "goodbye-world", type: "text", tag: "1.0.0" }),
          await archive({ content: Buffer.from("B") })
        )
      );

      const results = await registry.list({ query: "hello" });
      expect(results.length).toBe(1);
      expect(results[0].name).toBe("hello-world");
    });
  });

  describe("gc", () => {
    it("removes orphaned blobs", async () => {
      // Add a resource
      const rxr = resource(
        manifest({ name: "temp", type: "text", tag: "1.0.0" }),
        await archive({ "content.txt": Buffer.from("Temp content") })
      );
      await registry.put(rxr);

      // Remove the manifest but leave the blob
      await registry.remove({ name: "temp", tag: "1.0.0" });

      // Before GC, blob should still exist
      const blobsBefore = await rxaStore.list();
      expect(blobsBefore.length).toBe(1);

      // Run GC
      const deleted = await registry.gc();
      expect(deleted).toBe(1);

      // After GC, blob should be gone
      const blobsAfter = await rxaStore.list();
      expect(blobsAfter.length).toBe(0);
    });
  });

  describe("local vs cached resources", () => {
    it("stores local resource (no registry)", async () => {
      const rxr = resource(
        manifest({ name: "local", type: "text", tag: "1.0.0" }),
        await archive({ content: Buffer.from("Local") })
      );
      await registry.put(rxr);

      const retrieved = await registry.get({ name: "local", tag: "1.0.0" });
      expect(retrieved.manifest.registry).toBeUndefined();
    });

    it("stores cached resource (with registry)", async () => {
      const rxr = resource(
        manifest({
          name: "cached",
          type: "text",
          tag: "1.0.0",
          registry: "deepractice.ai",
        }),
        await archive({ content: Buffer.from("Cached") })
      );
      await registry.put(rxr);

      const retrieved = await registry.get({
        name: "cached",
        tag: "1.0.0",
        registry: "deepractice.ai",
      });
      expect(retrieved.manifest.registry).toBe("deepractice.ai");
    });

    it("clears cache by registry", async () => {
      // Add local and cached resources
      await registry.put(
        resource(
          manifest({ name: "local", type: "text", tag: "1.0.0" }),
          await archive({ content: Buffer.from("Local") })
        )
      );
      await registry.put(
        resource(
          manifest({
            name: "cached",
            type: "text",
            tag: "1.0.0",
            registry: "example.com",
          }),
          await archive({ content: Buffer.from("Cached") })
        )
      );

      // Clear cache for example.com
      await registry.clearCache("example.com");

      // Local should still exist
      const localExists = await registry.has({ name: "local", tag: "1.0.0" });
      expect(localExists).toBe(true);

      // Cached should be gone
      const cachedExists = await registry.has({
        name: "cached",
        tag: "1.0.0",
        registry: "example.com",
      });
      expect(cachedExists).toBe(false);
    });
  });
});
