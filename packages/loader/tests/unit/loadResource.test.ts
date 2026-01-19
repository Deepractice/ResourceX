import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { join } from "node:path";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { loadResource, FolderLoader, type ResourceLoader } from "../../src/index.js";
import { ResourceXError } from "@resourcexjs/core";
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

      expect(rxr.manifest.domain).toBe("localhost");
      expect(rxr.manifest.name).toBe("test-resource");
      expect(rxr.manifest.type).toBe("text");
      expect(rxr.manifest.version).toBe("1.0.0");
      expect(rxr.locator.toString()).toBe("localhost/test-resource.text@1.0.0");
      expect(await rxr.content.text()).toBe("Hello, World!");
    });

    it("loads resource with custom domain", async () => {
      const resourceDir = join(TEST_DIR, "custom-domain");
      await mkdir(resourceDir, { recursive: true });

      await writeFile(
        join(resourceDir, "resource.json"),
        JSON.stringify({
          domain: "example.com",
          name: "resource",
          type: "json",
          version: "2.0.0",
        })
      );

      await writeFile(join(resourceDir, "content"), '{"key": "value"}');

      const rxr = await loadResource(resourceDir);

      expect(rxr.manifest.domain).toBe("example.com");
      expect(rxr.locator.toString()).toBe("example.com/resource.json@2.0.0");
    });

    it("loads resource with path", async () => {
      const resourceDir = join(TEST_DIR, "with-path");
      await mkdir(resourceDir, { recursive: true });

      await writeFile(
        join(resourceDir, "resource.json"),
        JSON.stringify({
          domain: "localhost",
          path: "utils/helpers",
          name: "formatter",
          type: "text",
          version: "1.0.0",
        })
      );

      await writeFile(join(resourceDir, "content"), "content");

      const rxr = await loadResource(resourceDir);

      expect(rxr.manifest.path).toBe("utils/helpers");
      expect(rxr.locator.toString()).toBe("localhost/utils/helpers/formatter.text@1.0.0");
    });

    it("throws error if resource.json is missing", async () => {
      const resourceDir = join(TEST_DIR, "no-manifest");
      await mkdir(resourceDir, { recursive: true });
      await writeFile(join(resourceDir, "content"), "content");

      await expect(loadResource(resourceDir)).rejects.toThrow(ResourceXError);
      await expect(loadResource(resourceDir)).rejects.toThrow("Cannot load resource from");
    });

    it("throws error if content is missing", async () => {
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
      await expect(loadResource(resourceDir)).rejects.toThrow("Cannot load resource from");
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
      await expect(loadResource(resourceDir)).rejects.toThrow("missing required field 'name'");
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
      await expect(loadResource(resourceDir)).rejects.toThrow("missing required field 'type'");
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
      await expect(loadResource(resourceDir)).rejects.toThrow("missing required field 'version'");
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
  });

  describe("with custom loader", () => {
    it("uses custom loader when provided", async () => {
      class MockLoader implements ResourceLoader {
        canLoad(_source: string): boolean {
          return true;
        }

        async load(source: string): Promise<RXR> {
          const { createRXM, createRXC, parseRXL } = await import("@resourcexjs/core");
          const manifest = createRXM({
            domain: "mock.com",
            name: source,
            type: "text",
            version: "1.0.0",
          });

          return {
            locator: parseRXL(manifest.toLocator()),
            manifest,
            content: createRXC("mocked content"),
          };
        }
      }

      const rxr = await loadResource("any-source", { loader: new MockLoader() });

      expect(rxr.manifest.domain).toBe("mock.com");
      expect(rxr.manifest.name).toBe("any-source");
      expect(await rxr.content.text()).toBe("mocked content");
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
    it("returns true for valid resource folder", async () => {
      const resourceDir = join(TEST_DIR, "valid-resource");
      await mkdir(resourceDir, { recursive: true });
      await writeFile(join(resourceDir, "resource.json"), "{}");
      await writeFile(join(resourceDir, "content"), "content");

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

    it("returns false if content is missing", async () => {
      const resourceDir = join(TEST_DIR, "no-content");
      await mkdir(resourceDir, { recursive: true });
      await writeFile(join(resourceDir, "resource.json"), "{}");

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

      const buffer = await rxr.content.buffer();
      expect(buffer).toEqual(binaryData);
    });
  });
});
