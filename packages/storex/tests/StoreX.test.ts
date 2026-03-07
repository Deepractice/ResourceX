import { beforeEach, describe, expect, it } from "bun:test";
import {
  archive,
  CASRegistry,
  MemoryRXAStore,
  MemoryRXMStore,
  manifest,
  resource,
} from "@resourcexjs/core";
import { createStoreX, type StoreX } from "../src/index";

describe("StoreX", () => {
  let store: StoreX;
  let cas: CASRegistry;

  beforeEach(() => {
    cas = new CASRegistry(new MemoryRXAStore(), new MemoryRXMStore());
    store = createStoreX({ registry: cas });
  });

  describe("list", () => {
    it("lists all resources", async () => {
      await cas.put(
        resource(
          manifest({ name: "img-pack", type: "binary", tag: "latest" }),
          await archive({ "photo.png": Buffer.from("png-data") })
        )
      );

      const results = await store.list();
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("img-pack");
      expect(results[0].type).toBe("binary");
      expect(results[0].files).toEqual(["photo.png"]);
    });

    it("filters by query", async () => {
      await cas.put(
        resource(
          manifest({ name: "issue-5-files", type: "binary", tag: "latest" }),
          await archive({ "a.png": Buffer.from("a") })
        )
      );
      await cas.put(
        resource(
          manifest({ name: "my-skill", type: "skill", tag: "latest" }),
          await archive({ "SKILL.md": Buffer.from("# Skill") })
        )
      );

      const results = await store.list("issue");
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("issue-5-files");
    });
  });

  describe("getFile", () => {
    it("retrieves a single file by locator and path", async () => {
      await cas.put(
        resource(
          manifest({ name: "attachments", type: "binary", tag: "latest" }),
          await archive({ "screenshot.png": Buffer.from("image-bytes") })
        )
      );

      const file = await store.getFile("attachments", "screenshot.png");
      expect(file?.toString()).toBe("image-bytes");
    });

    it("returns null for non-existent file", async () => {
      await cas.put(
        resource(
          manifest({ name: "attachments", type: "binary", tag: "latest" }),
          await archive({ "a.txt": Buffer.from("a") })
        )
      );

      const file = await store.getFile("attachments", "nope.txt");
      expect(file).toBeNull();
    });
  });

  describe("append", () => {
    it("appends files to an existing resource", async () => {
      await cas.put(
        resource(
          manifest({ name: "issue-3", type: "binary", tag: "latest" }),
          await archive({ "img1.png": Buffer.from("first") })
        )
      );

      const updated = await store.append("issue-3", {
        "img2.png": Buffer.from("second"),
      });

      expect(Object.keys(updated.files)).toHaveLength(2);

      // Verify both files are accessible
      const f1 = await store.getFile("issue-3", "img1.png");
      const f2 = await store.getFile("issue-3", "img2.png");
      expect(f1?.toString()).toBe("first");
      expect(f2?.toString()).toBe("second");
    });
  });

  describe("getManifest", () => {
    it("returns manifest metadata", async () => {
      await cas.put(
        resource(
          manifest({ name: "docs", type: "text", tag: "1.0.0", description: "My docs" }),
          await archive({ "readme.md": Buffer.from("Hello") })
        )
      );

      const m = await store.getManifest("docs:1.0.0");
      expect(m).not.toBeNull();
      expect(m!.name).toBe("docs");
      expect(m!.description).toBe("My docs");
    });

    it("returns null for non-existent resource", async () => {
      const m = await store.getManifest("ghost:1.0.0");
      expect(m).toBeNull();
    });
  });

  describe("has", () => {
    it("returns true for existing resource", async () => {
      await cas.put(
        resource(
          manifest({ name: "exists", type: "text", tag: "latest" }),
          await archive({ "a.txt": Buffer.from("a") })
        )
      );

      expect(await store.has("exists")).toBe(true);
    });

    it("returns false for non-existing resource", async () => {
      expect(await store.has("nope")).toBe(false);
    });
  });

  describe("put", () => {
    it("stores a complete resource", async () => {
      const rxr = resource(
        manifest({ name: "new-resource", type: "binary", tag: "latest" }),
        await archive({ "data.bin": Buffer.from("binary-data") })
      );

      await store.put(rxr);

      const file = await store.getFile("new-resource", "data.bin");
      expect(file?.toString()).toBe("binary-data");
    });
  });

  describe("remove", () => {
    it("removes a resource", async () => {
      await cas.put(
        resource(
          manifest({ name: "temp", type: "text", tag: "latest" }),
          await archive({ "a.txt": Buffer.from("a") })
        )
      );

      await store.remove("temp");
      expect(await store.has("temp")).toBe(false);
    });
  });
});
