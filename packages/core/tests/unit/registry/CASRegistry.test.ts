import { beforeEach, describe, expect, it } from "bun:test";
import {
  archive,
  CASRegistry,
  MemoryRXAStore,
  MemoryRXMStore,
  manifest,
  resource,
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

      expect(retrieved.manifest.definition.name).toBe("test-resource");
      expect(retrieved.manifest.definition.type).toBe("text");
      expect(retrieved.manifest.definition.tag).toBe("1.0.0");
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

  describe("append", () => {
    it("appends files to an existing resource", async () => {
      // Create initial resource with one file
      const rxr = resource(
        manifest({ name: "my-attachments", type: "binary", tag: "latest" }),
        await archive({ "img1.png": Buffer.from("image-1-data") })
      );
      await registry.put(rxr);

      // Append a second file
      const updated = await registry.append(
        { name: "my-attachments", tag: "latest" },
        { "img2.png": Buffer.from("image-2-data") }
      );

      // Should have both files
      expect(Object.keys(updated.files)).toHaveLength(2);
      expect(updated.files["img1.png"]).toBeDefined();
      expect(updated.files["img2.png"]).toBeDefined();

      // Verify via getFile
      const file1 = await registry.getFile({ name: "my-attachments", tag: "latest" }, "img1.png");
      expect(file1?.toString()).toBe("image-1-data");

      const file2 = await registry.getFile({ name: "my-attachments", tag: "latest" }, "img2.png");
      expect(file2?.toString()).toBe("image-2-data");
    });

    it("overwrites existing file with same name", async () => {
      const rxr = resource(
        manifest({ name: "docs", type: "binary", tag: "latest" }),
        await archive({ "readme.md": Buffer.from("v1") })
      );
      await registry.put(rxr);

      await registry.append({ name: "docs", tag: "latest" }, { "readme.md": Buffer.from("v2") });

      const file = await registry.getFile({ name: "docs", tag: "latest" }, "readme.md");
      expect(file?.toString()).toBe("v2");
    });

    it("throws error for non-existent resource", async () => {
      await expect(
        registry.append({ name: "ghost", tag: "latest" }, { "file.txt": Buffer.from("data") })
      ).rejects.toThrow("not found");
    });

    it("deduplicates appended content", async () => {
      const content = Buffer.from("same-content");

      const rxr = resource(
        manifest({ name: "dedup-test", type: "binary", tag: "latest" }),
        await archive({ "a.txt": content })
      );
      await registry.put(rxr);

      // Append same content under different name
      await registry.append({ name: "dedup-test", tag: "latest" }, { "b.txt": content });

      // Both files should reference the same blob
      const storedRxm = await registry.getStoredManifest({ name: "dedup-test", tag: "latest" });
      expect(storedRxm!.files["a.txt"]).toBe(storedRxm!.files["b.txt"]);
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
      expect(retrieved.manifest.definition.registry).toBeUndefined();
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
      expect(retrieved.manifest.definition.registry).toBe("deepractice.ai");
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
