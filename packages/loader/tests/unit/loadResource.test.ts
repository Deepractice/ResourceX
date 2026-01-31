import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { join } from "node:path";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { loadResource, FolderLoader, type ResourceLoader } from "../../src/index.js";
import { ResourceXError, extract, manifest, archive, resource, parse } from "@resourcexjs/core";
import type { RXR } from "@resourcexjs/core";

const TEST_DIR = join(process.cwd(), ".test-load-resource");

describe("loadResource", () => {
  beforeEach(async () => {
    await mkdir(TEST_DIR, { recursive: true });
  });

  afterEach(async () => {
    await rm(TEST_DIR, { recursive: true, force: true });
  });

  describe("with default FolderLoader", () => {
    it("loads a valid resource from folder", async () => {
      const resourceDir = join(TEST_DIR, "my-resource");
      await mkdir(resourceDir, { recursive: true });

      // Create resource.json
      await writeFile(
        join(resourceDir, "resource.json"),
        JSON.stringify({
          name: "test-resource",
          type: "text",
          version: "1.0.0",
        })
      );

      // Create content
      await writeFile(join(resourceDir, "content"), "Hello, World!");

      const rxr = await loadResource(resourceDir);

      expect(rxr.manifest.registry).toBeUndefined();
      expect(rxr.manifest.name).toBe("test-resource");
      expect(rxr.manifest.type).toBe("text");
      expect(rxr.manifest.version).toBe("1.0.0");

      const files = await extract(rxr.archive);
      expect(files["content"].toString()).toBe("Hello, World!");
    });

    it("loads resource with custom registry", async () => {
      const resourceDir = join(TEST_DIR, "custom-registry");
      await mkdir(resourceDir, { recursive: true });

      await writeFile(
        join(resourceDir, "resource.json"),
        JSON.stringify({
          registry: "example.com",
          name: "resource",
          type: "json",
          version: "2.0.0",
        })
      );

      await writeFile(join(resourceDir, "content"), '{"key": "value"}');

      const rxr = await loadResource(resourceDir);

      expect(rxr.manifest.registry).toBe("example.com");
    });

    it("loads resource with path", async () => {
      const resourceDir = join(TEST_DIR, "with-path");
      await mkdir(resourceDir, { recursive: true });

      await writeFile(
        join(resourceDir, "resource.json"),
        JSON.stringify({
          path: "utils/helpers",
          name: "formatter",
          type: "text",
          version: "1.0.0",
        })
      );

      await writeFile(join(resourceDir, "content"), "content");

      const rxr = await loadResource(resourceDir);

      expect(rxr.manifest.path).toBe("utils/helpers");
    });

    it("throws error if resource.json is missing", async () => {
      const resourceDir = join(TEST_DIR, "no-manifest");
      await mkdir(resourceDir, { recursive: true });
      await writeFile(join(resourceDir, "content"), "content");

      await expect(loadResource(resourceDir)).rejects.toThrow(ResourceXError);
      await expect(loadResource(resourceDir)).rejects.toThrow("Cannot load resource from");
    });

    it("throws error if no content files exist", async () => {
      const resourceDir = join(TEST_DIR, "no-content");
      await mkdir(resourceDir, { recursive: true });
      await writeFile(
        join(resourceDir, "resource.json"),
        JSON.stringify({
          name: "test",
          type: "text",
          version: "1.0.0",
        })
      );

      await expect(loadResource(resourceDir)).rejects.toThrow(ResourceXError);
      await expect(loadResource(resourceDir)).rejects.toThrow("No content files found");
    });

    it("throws error if resource.json has invalid JSON", async () => {
      const resourceDir = join(TEST_DIR, "invalid-json");
      await mkdir(resourceDir, { recursive: true });
      await writeFile(join(resourceDir, "resource.json"), "{ invalid json }");
      await writeFile(join(resourceDir, "content"), "content");

      await expect(loadResource(resourceDir)).rejects.toThrow(ResourceXError);
      await expect(loadResource(resourceDir)).rejects.toThrow("Invalid JSON");
    });

    it("throws error if resource.json is missing required field: name", async () => {
      const resourceDir = join(TEST_DIR, "missing-name");
      await mkdir(resourceDir, { recursive: true });
      await writeFile(
        join(resourceDir, "resource.json"),
        JSON.stringify({
          type: "text",
          version: "1.0.0",
        })
      );
      await writeFile(join(resourceDir, "content"), "content");

      await expect(loadResource(resourceDir)).rejects.toThrow(ResourceXError);
      await expect(loadResource(resourceDir)).rejects.toThrow("name is required");
    });

    it("throws error if resource.json is missing required field: type", async () => {
      const resourceDir = join(TEST_DIR, "missing-type");
      await mkdir(resourceDir, { recursive: true });
      await writeFile(
        join(resourceDir, "resource.json"),
        JSON.stringify({
          name: "test",
          version: "1.0.0",
        })
      );
      await writeFile(join(resourceDir, "content"), "content");

      await expect(loadResource(resourceDir)).rejects.toThrow(ResourceXError);
      await expect(loadResource(resourceDir)).rejects.toThrow("type is required");
    });

    it("throws error if resource.json is missing required field: version", async () => {
      const resourceDir = join(TEST_DIR, "missing-version");
      await mkdir(resourceDir, { recursive: true });
      await writeFile(
        join(resourceDir, "resource.json"),
        JSON.stringify({
          name: "test",
          type: "text",
        })
      );
      await writeFile(join(resourceDir, "content"), "content");

      await expect(loadResource(resourceDir)).rejects.toThrow(ResourceXError);
      await expect(loadResource(resourceDir)).rejects.toThrow("version is required");
    });

    it("throws error for non-existent path", async () => {
      await expect(loadResource("/non/existent/path")).rejects.toThrow(ResourceXError);
      await expect(loadResource("/non/existent/path")).rejects.toThrow("Cannot load resource from");
    });

    it("throws error for file instead of directory", async () => {
      const filePath = join(TEST_DIR, "not-a-directory.txt");
      await writeFile(filePath, "content");

      await expect(loadResource(filePath)).rejects.toThrow(ResourceXError);
      await expect(loadResource(filePath)).rejects.toThrow("Cannot load resource from");
    });

    it("loads resource with multiple files", async () => {
      const resourceDir = join(TEST_DIR, "multi-file");
      await mkdir(resourceDir, { recursive: true });

      await writeFile(
        join(resourceDir, "resource.json"),
        JSON.stringify({
          name: "multi",
          type: "text",
          version: "1.0.0",
        })
      );

      await writeFile(join(resourceDir, "index.ts"), "export default 1");
      await writeFile(join(resourceDir, "styles.css"), "body {}");

      const rxr = await loadResource(resourceDir);

      const files = await extract(rxr.archive);
      expect(Object.keys(files).length).toBe(2);
      expect(files["index.ts"].toString()).toBe("export default 1");
      expect(files["styles.css"].toString()).toBe("body {}");
    });

    it("loads resource with nested directory", async () => {
      const resourceDir = join(TEST_DIR, "nested");
      await mkdir(join(resourceDir, "src", "utils"), { recursive: true });

      await writeFile(
        join(resourceDir, "resource.json"),
        JSON.stringify({
          name: "nested",
          type: "text",
          version: "1.0.0",
        })
      );

      await writeFile(join(resourceDir, "src", "index.ts"), "main");
      await writeFile(join(resourceDir, "src", "utils", "helper.ts"), "helper");

      const rxr = await loadResource(resourceDir);

      const files = await extract(rxr.archive);
      expect(Object.keys(files).length).toBe(2);
      expect(files["src/index.ts"].toString()).toBe("main");
      expect(files["src/utils/helper.ts"].toString()).toBe("helper");
    });
  });

  describe("with custom loader", () => {
    it("uses custom loader when provided", async () => {
      class MockLoader implements ResourceLoader {
        canLoad(_source: string): boolean {
          return true;
        }

        async load(source: string): Promise<RXR> {
          const rxm = manifest({
            registry: "mock.com",
            name: source,
            type: "text",
            version: "1.0.0",
          });
          const rxa = await archive({ content: Buffer.from("mocked content") });
          return resource(rxm, rxa);
        }
      }

      const rxr = await loadResource("any-source", { loader: new MockLoader() });

      expect(rxr.manifest.registry).toBe("mock.com");
      expect(rxr.manifest.name).toBe("any-source");
      const files = await extract(rxr.archive);
      expect(files["content"].toString()).toBe("mocked content");
    });

    it("throws error if custom loader cannot load source", async () => {
      class FailingLoader implements ResourceLoader {
        canLoad(_source: string): boolean {
          return false;
        }

        async load(_source: string): Promise<RXR> {
          throw new Error("Should not be called");
        }
      }

      await expect(loadResource("source", { loader: new FailingLoader() })).rejects.toThrow(
        ResourceXError
      );
      await expect(loadResource("source", { loader: new FailingLoader() })).rejects.toThrow(
        "Cannot load resource from"
      );
    });
  });
});

describe("FolderLoader", () => {
  beforeEach(async () => {
    await mkdir(TEST_DIR, { recursive: true });
  });

  afterEach(async () => {
    await rm(TEST_DIR, { recursive: true, force: true });
  });

  describe("canLoad", () => {
    it("returns true for valid resource folder with resource.json", async () => {
      const resourceDir = join(TEST_DIR, "valid-resource");
      await mkdir(resourceDir, { recursive: true });
      await writeFile(join(resourceDir, "resource.json"), "{}");
      await writeFile(join(resourceDir, "content"), "content");

      const loader = new FolderLoader();
      expect(await loader.canLoad(resourceDir)).toBe(true);
    });

    it("returns true even without content file (only needs resource.json)", async () => {
      const resourceDir = join(TEST_DIR, "manifest-only");
      await mkdir(resourceDir, { recursive: true });
      await writeFile(join(resourceDir, "resource.json"), "{}");
      // Note: load() will fail later if no content files exist

      const loader = new FolderLoader();
      expect(await loader.canLoad(resourceDir)).toBe(true);
    });

    it("returns false if not a directory", async () => {
      const filePath = join(TEST_DIR, "file.txt");
      await writeFile(filePath, "content");

      const loader = new FolderLoader();
      expect(await loader.canLoad(filePath)).toBe(false);
    });

    it("returns false if resource.json is missing", async () => {
      const resourceDir = join(TEST_DIR, "no-manifest");
      await mkdir(resourceDir, { recursive: true });
      await writeFile(join(resourceDir, "content"), "content");

      const loader = new FolderLoader();
      expect(await loader.canLoad(resourceDir)).toBe(false);
    });

    it("returns false for non-existent path", async () => {
      const loader = new FolderLoader();
      expect(await loader.canLoad("/non/existent/path")).toBe(false);
    });
  });

  describe("load", () => {
    it("loads binary content correctly", async () => {
      const resourceDir = join(TEST_DIR, "binary-resource");
      await mkdir(resourceDir, { recursive: true });

      await writeFile(
        join(resourceDir, "resource.json"),
        JSON.stringify({
          name: "binary",
          type: "binary",
          version: "1.0.0",
        })
      );

      const binaryData = Buffer.from([0x01, 0x02, 0x03, 0x04]);
      await writeFile(join(resourceDir, "content"), binaryData);

      const loader = new FolderLoader();
      const rxr = await loader.load(resourceDir);

      const files = await extract(rxr.archive);
      expect(Buffer.from(files["content"])).toEqual(binaryData);
    });
  });
});
