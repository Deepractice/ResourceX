import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { ResourceX } from "../../src/index.js";
import { createResourceX, RegistryError } from "../../src/index.js";

const TEST_DIR = join(process.cwd(), ".test-resourcex");
const DEV_DIR = join(process.cwd(), ".test-dev-resource");

async function createDevResource(name: string, type: string, content: string): Promise<string> {
  const resourceDir = join(DEV_DIR, name);
  await mkdir(resourceDir, { recursive: true });

  const resourceJson = {
    name,
    type,
    tag: "1.0.0",
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

  describe("add", () => {
    it("adds resource from directory", async () => {
      const devPath = await createDevResource("hello", "text", "Hello World!");
      await rx.add(devPath);

      expect(await rx.has("hello:1.0.0")).toBe(true);
    });

    it("uses default domain", async () => {
      const rxWithDomain = createResourceX({
        path: TEST_DIR,
        domain: "mycompany.com",
      });

      const devPath = await createDevResource("test", "text", "content");
      await rxWithDomain.add(devPath);

      // Should be stored with mycompany.com domain
      expect(await rxWithDomain.has("test:1.0.0")).toBe(true);
    });
  });

  describe("link", () => {
    it("links development directory", async () => {
      const devPath = await createDevResource("dev-prompt", "text", "Dev content");
      await rx.link(devPath);

      expect(await rx.has("dev-prompt:1.0.0")).toBe(true);
    });
  });

  describe("has", () => {
    it("returns true for existing resource", async () => {
      const devPath = await createDevResource("exists", "text", "content");
      await rx.add(devPath);

      expect(await rx.has("exists:1.0.0")).toBe(true);
    });

    it("returns false for non-existing resource", async () => {
      expect(await rx.has("not-exist:1.0.0")).toBe(false);
    });
  });

  describe("remove", () => {
    it("removes a resource", async () => {
      const devPath = await createDevResource("to-remove", "text", "content");
      await rx.add(devPath);
      expect(await rx.has("to-remove:1.0.0")).toBe(true);

      await rx.remove("to-remove:1.0.0");
      expect(await rx.has("to-remove:1.0.0")).toBe(false);
    });
  });

  describe("resolve", () => {
    it("resolves a text resource", async () => {
      const devPath = await createDevResource("greeting", "text", "Hello!");
      await rx.add(devPath);

      const result = await rx.resolve("greeting:1.0.0");
      const content = await result.execute();
      expect(content).toBe("Hello!");
    });

    it("resolves a json resource", async () => {
      const devPath = await createDevResource("config", "json", '{"key": "value"}');
      await rx.add(devPath);

      const result = await rx.resolve<{ key: string }>("config:1.0.0");
      const content = await result.execute();
      expect(content.key).toBe("value");
    });

    it("throws error for non-existent resource", async () => {
      await expect(rx.resolve("not-exist:1.0.0")).rejects.toThrow(RegistryError);
      await expect(rx.resolve("not-exist:1.0.0")).rejects.toThrow("not found");
    });

    it("linked resources take priority over added", async () => {
      // Add first
      const addPath = await createDevResource("priority", "text", "Added content");
      await rx.add(addPath);

      // Then link different content
      const linkPath = join(DEV_DIR, "priority-linked");
      await mkdir(linkPath, { recursive: true });
      await writeFile(
        join(linkPath, "resource.json"),
        JSON.stringify({ name: "priority", type: "text", tag: "1.0.0" })
      );
      await writeFile(join(linkPath, "content"), "Linked content");
      await rx.link(linkPath);

      // Resolve should return linked version
      const result = await rx.resolve("priority:1.0.0");
      const content = await result.execute();
      expect(content).toBe("Linked content");
    });
  });

  describe("search", () => {
    it("searches resources by query", async () => {
      await rx.add(await createDevResource("alpha", "text", "1"));
      await rx.add(await createDevResource("beta", "text", "2"));
      await rx.add(await createDevResource("alpha-two", "text", "3"));

      const results = await rx.search("alpha");
      expect(results).toHaveLength(2);
    });

    it("returns all resources without query", async () => {
      await rx.add(await createDevResource("x", "text", "1"));
      await rx.add(await createDevResource("y", "text", "2"));

      const results = await rx.search();
      expect(results).toHaveLength(2);
    });
  });

  describe("supportType", () => {
    it("adds custom type support", async () => {
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

      const devPath = join(DEV_DIR, "upper");
      await mkdir(devPath, { recursive: true });
      await writeFile(
        join(devPath, "resource.json"),
        JSON.stringify({ name: "test", type: "uppercase", tag: "1.0.0" })
      );
      await writeFile(join(devPath, "content"), "hello");
      await rx.add(devPath);

      const result = await rx.resolve("test:1.0.0");
      const content = await result.execute();
      expect(content).toBe("HELLO");
    });
  });

  describe("push/pull", () => {
    it("push throws error without registry configured", async () => {
      const devPath = await createDevResource("test", "text", "content");

      await expect(rx.push(devPath)).rejects.toThrow("Registry URL not configured");
    });

    it("pull throws error without registry configured", async () => {
      await expect(rx.pull("test:1.0.0")).rejects.toThrow("Registry URL not configured");
    });
  });

  describe("locator normalization", () => {
    it("adds default domain to short locator", async () => {
      const rxWithDomain = createResourceX({
        path: TEST_DIR,
        domain: "example.com",
      });

      const devPath = await createDevResource("test", "text", "content");
      await rxWithDomain.add(devPath);

      // Short locator should work
      expect(await rxWithDomain.has("test:1.0.0")).toBe(true);
    });

    it("preserves explicit domain in locator", async () => {
      const rxWithDomain = createResourceX({
        path: TEST_DIR,
        domain: "default.com",
      });

      // This would fail if we try to use explicit domain that doesn't exist
      expect(await rxWithDomain.has("other.com/test:1.0.0")).toBe(false);
    });
  });
});
