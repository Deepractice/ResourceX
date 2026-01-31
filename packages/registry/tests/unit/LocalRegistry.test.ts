import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { join } from "node:path";
import { rm, mkdir } from "node:fs/promises";
import { execSync } from "node:child_process";
import { createRegistry, RegistryError } from "../../src/index.js";
import { define, manifest, archive, resource, locate } from "@resourcexjs/core";
import type { RXR, RXD } from "@resourcexjs/core";

const TEST_DIR = join(process.cwd(), ".test-registry");

// Check if srt is available in the environment
function isSrtAvailable(): boolean {
  try {
    execSync("which srt", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

const SRT_AVAILABLE = isSrtAvailable();

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
      const rxd: RXD = {
        domain: "localhost",
        name: "alias-test",
        type: "txt", // Using alias
        version: "1.0.0",
      };
      const rxm = manifest(rxd);
      const rxa = await archive({ content: Buffer.from("Hello via alias!") });
      const rxr = resource(rxm, rxa);

      await registry.add(rxr);

      const resolved = await registry.resolve("localhost/alias-test.txt@1.0.0");
      const content = await resolved.execute();
      expect(content).toBe("Hello via alias!");
    });

    it("supports config as alias for json", async () => {
      const registry = createRegistry({ path: TEST_DIR });
      const rxd: RXD = {
        domain: "localhost",
        name: "config-test",
        type: "config", // Using alias
        version: "1.0.0",
      };
      const rxm = manifest(rxd);
      const rxa = await archive({ content: Buffer.from('{"key": "value"}') });
      const rxr = resource(rxm, rxa);

      await registry.add(rxr);

      const resolved = await registry.resolve<void, { key: string }>(
        "localhost/config-test.config@1.0.0"
      );
      const json = await resolved.execute();
      expect(json.key).toBe("value");
    });

    it("supports bin as alias for binary", async () => {
      const registry = createRegistry({ path: TEST_DIR });
      const rxd: RXD = {
        domain: "localhost",
        name: "binary-test",
        type: "bin", // Using alias
        version: "1.0.0",
      };
      const binaryData = Buffer.from([0x01, 0x02, 0x03, 0x04]);
      const rxm = manifest(rxd);
      const rxa = await archive({ content: binaryData });
      const rxr = resource(rxm, rxa);

      await registry.add(rxr);

      // Note: binary type returns Uint8Array (cross-platform), not Buffer
      // JSON serialization converts Uint8Array to object, so we compare values
      const resolved = await registry.resolve<void, Record<string, number>>(
        "localhost/binary-test.bin@1.0.0"
      );
      const content = await resolved.execute();
      expect(Object.values(content)).toEqual([0x01, 0x02, 0x03, 0x04]);
    });
  });

  describe("supportType", () => {
    it("supports dynamically registered type", async () => {
      const registry = createRegistry({ path: TEST_DIR });

      // Define a custom bundled type using ResolveContext (ctx)
      // ctx has: { manifest, files: Record<string, Uint8Array> }
      const customType = {
        name: "prompt",
        description: "AI prompt type",
        code: `
          ({
            async resolve(ctx, args) {
              const content = ctx.files["content"];
              return new TextDecoder().decode(content);
            }
          })
        `,
      };

      registry.supportType(customType);

      const rxd: RXD = {
        domain: "localhost",
        name: "greet",
        type: "prompt",
        version: "1.0.0",
      };
      const rxm = manifest(rxd);
      const rxa = await archive({ content: Buffer.from("Hello, {{name}}!") });
      const rxr = resource(rxm, rxa);

      await registry.add(rxr);

      const resolved = await registry.resolve("localhost/greet.prompt@1.0.0");
      const content = await resolved.execute();
      expect(content).toBe("Hello, {{name}}!");
    });
  });

  describe("isolator", () => {
    it.skipIf(!SRT_AVAILABLE)("executes with srt isolator", async () => {
      const registry = createRegistry({ path: TEST_DIR, isolator: "srt" });
      const rxr = await createTestRXR("srt-test", "SRT Sandbox Test");

      await registry.add(rxr);

      const resolved = await registry.resolve("localhost/srt-test.text@1.0.0");
      const content = await resolved.execute();
      expect(content).toBe("SRT Sandbox Test");
    });

    it.skipIf(!SRT_AVAILABLE)("executes json type with srt isolator", async () => {
      const registry = createRegistry({ path: TEST_DIR, isolator: "srt" });
      const rxd: RXD = {
        domain: "localhost",
        name: "srt-json",
        type: "json",
        version: "1.0.0",
      };
      const rxm = manifest(rxd);
      const rxa = await archive({ content: Buffer.from('{"message": "hello from srt"}') });
      const rxr = resource(rxm, rxa);

      await registry.add(rxr);

      const resolved = await registry.resolve<void, { message: string }>(
        "localhost/srt-json.json@1.0.0"
      );
      const json = await resolved.execute();
      expect(json.message).toBe("hello from srt");
    });

    it.skipIf(!SRT_AVAILABLE)("executes custom type with srt isolator", async () => {
      const registry = createRegistry({ path: TEST_DIR, isolator: "srt" });

      // Register custom type
      registry.supportType({
        name: "calculator",
        description: "Calculator type",
        schema: {
          type: "object",
          properties: {
            a: { type: "number" },
            b: { type: "number" },
          },
        },
        code: `
          ({
            async resolve(ctx, args) {
              return args.a + args.b;
            }
          })
        `,
      });

      const rxd: RXD = {
        domain: "localhost",
        name: "add",
        type: "calculator",
        version: "1.0.0",
      };
      const rxm = manifest(rxd);
      const rxa = await archive({ content: Buffer.from("calculator") });
      const rxr = resource(rxm, rxa);

      await registry.add(rxr);

      const resolved = await registry.resolve<{ a: number; b: number }, number>(
        "localhost/add.calculator@1.0.0"
      );
      const result = await resolved.execute({ a: 10, b: 20 });
      expect(result).toBe(30);
    });
  });
});
