import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { join } from "node:path";
import { rm, mkdir, writeFile } from "node:fs/promises";
import { createResourceX, manifest, archive, resource, RegistryError } from "../../src/index.js";
import type { ResourceX, RXR, RXD } from "../../src/index.js";

const TEST_DIR = join(process.cwd(), ".test-resourcex");
const DEV_DIR = join(process.cwd(), ".test-dev-resource");

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

async function createDevResource(name: string, content: string): Promise<string> {
  const resourceDir = join(DEV_DIR, name);
  await mkdir(resourceDir, { recursive: true });

  const resourceJson = {
    domain: "localhost",
    name,
    type: "text",
    version: "1.0.0",
  };
  await writeFile(join(resourceDir, "resource.json"), JSON.stringify(resourceJson, null, 2));
  await writeFile(join(resourceDir, "content"), content);

  return resourceDir;
}

describe("ResourceX", () => {
  let rx: ResourceX;

  beforeEach(async () => {
    await mkdir(TEST_DIR, { recursive: true });
    await mkdir(DEV_DIR, { recursive: true });
    rx = createResourceX({ path: TEST_DIR });
  });

  afterEach(async () => {
    await rm(TEST_DIR, { recursive: true, force: true });
    await rm(DEV_DIR, { recursive: true, force: true });
  });

  describe("Level 1: Core API", () => {
    describe("save", () => {
      it("saves a localhost resource", async () => {
        const rxr = await createTestRXR("hello", "Hello World!");
        await rx.save(rxr);

        expect(await rx.has("localhost/hello.text@1.0.0")).toBe(true);
      });
    });

    describe("get", () => {
      it("gets a saved resource", async () => {
        const rxr = await createTestRXR("test", "Test content");
        await rx.save(rxr);

        const retrieved = await rx.get("localhost/test.text@1.0.0");
        expect(retrieved.manifest.name).toBe("test");
        expect(retrieved.manifest.type).toBe("text");
      });

      it("throws error for non-existent resource", async () => {
        await expect(rx.get("localhost/not-exist.text@1.0.0")).rejects.toThrow(RegistryError);
        await expect(rx.get("localhost/not-exist.text@1.0.0")).rejects.toThrow("not found");
      });
    });

    describe("resolve", () => {
      it("resolves a text resource", async () => {
        const rxr = await createTestRXR("greeting", "Hello!");
        await rx.save(rxr);

        const resolved = await rx.resolve("localhost/greeting.text@1.0.0");
        expect(resolved.resource.manifest.name).toBe("greeting");

        const result = await resolved.execute();
        expect(result).toBe("Hello!");
      });

      it("resolves a json resource", async () => {
        const rxd: RXD = {
          domain: "localhost",
          name: "config",
          type: "json",
          version: "1.0.0",
        };
        const rxm = manifest(rxd);
        const rxa = await archive({ content: Buffer.from('{"key": "value"}') });
        const rxr = resource(rxm, rxa);

        await rx.save(rxr);

        const resolved = await rx.resolve<void, { key: string }>("localhost/config.json@1.0.0");
        const result = await resolved.execute();
        expect(result.key).toBe("value");
      });
    });
  });

  describe("Level 2: CRUD API", () => {
    describe("has", () => {
      it("returns true for existing resource", async () => {
        const rxr = await createTestRXR("exists", "content");
        await rx.save(rxr);

        expect(await rx.has("localhost/exists.text@1.0.0")).toBe(true);
      });

      it("returns false for non-existing resource", async () => {
        expect(await rx.has("localhost/not-exist.text@1.0.0")).toBe(false);
      });
    });

    describe("remove", () => {
      it("removes a resource", async () => {
        const rxr = await createTestRXR("to-remove", "content");
        await rx.save(rxr);
        expect(await rx.has("localhost/to-remove.text@1.0.0")).toBe(true);

        await rx.remove("localhost/to-remove.text@1.0.0");
        expect(await rx.has("localhost/to-remove.text@1.0.0")).toBe(false);
      });
    });
  });

  describe("Level 3: Dev API", () => {
    describe("link", () => {
      it("links a development directory", async () => {
        const devPath = await createDevResource("dev-prompt", "Dev content");
        await rx.link(devPath);

        const retrieved = await rx.get("localhost/dev-prompt.text@1.0.0");
        expect(retrieved.manifest.name).toBe("dev-prompt");
      });

      it("linked resources take priority over saved", async () => {
        // Save first
        const savedRxr = await createTestRXR("priority", "Saved content");
        await rx.save(savedRxr);

        // Then link
        const devPath = await createDevResource("priority", "Linked content");
        await rx.link(devPath);

        // Get should return linked version
        const resolved = await rx.resolve("localhost/priority.text@1.0.0");
        const result = await resolved.execute();
        expect(result).toBe("Linked content");
      });
    });

    describe("load", () => {
      it("loads resource from directory without saving", async () => {
        const devPath = await createDevResource("load-test", "Load content");

        const rxr = await rx.load(devPath);
        expect(rxr.manifest.name).toBe("load-test");

        // Should not be saved
        expect(await rx.has("localhost/load-test.text@1.0.0")).toBe(false);
      });
    });
  });

  describe("Level 4: Search API", () => {
    describe("search", () => {
      it("searches resources by query", async () => {
        await rx.save(await createTestRXR("alpha", "1"));
        await rx.save(await createTestRXR("beta", "2"));
        await rx.save(await createTestRXR("alpha-two", "3"));

        const results = await rx.search({ query: "alpha" });
        expect(results).toHaveLength(2);
      });

      it("searches with limit", async () => {
        await rx.save(await createTestRXR("a", "1"));
        await rx.save(await createTestRXR("b", "2"));
        await rx.save(await createTestRXR("c", "3"));

        const results = await rx.search({ limit: 2 });
        expect(results).toHaveLength(2);
      });

      it("returns all resources without options", async () => {
        await rx.save(await createTestRXR("x", "1"));
        await rx.save(await createTestRXR("y", "2"));

        const results = await rx.search();
        expect(results).toHaveLength(2);
      });
    });
  });

  describe("Level 5: Extension API", () => {
    describe("supportType", () => {
      it("adds custom type support", async () => {
        // Register custom type that uppercases content
        rx.supportType({
          name: "uppercase",
          description: "Uppercase text",
          code: `({
            async resolve(ctx) {
              const content = ctx.files["content"];
              return new TextDecoder().decode(content).toUpperCase();
            }
          })`,
        });

        const rxd: RXD = {
          domain: "localhost",
          name: "test",
          type: "uppercase",
          version: "1.0.0",
        };
        const rxm = manifest(rxd);
        const rxa = await archive({ content: Buffer.from("hello") });
        const rxr = resource(rxm, rxa);

        await rx.save(rxr);

        const resolved = await rx.resolve("localhost/test.uppercase@1.0.0");
        const result = await resolved.execute();
        expect(result).toBe("HELLO");
      });
    });
  });

  describe("Storage routing", () => {
    it("localhost resources go to hosted", async () => {
      const rxr = await createTestRXR("local", "content");
      await rx.save(rxr);

      // Should be in hosted directory
      expect(await rx.has("localhost/local.text@1.0.0")).toBe(true);
    });
  });
});
