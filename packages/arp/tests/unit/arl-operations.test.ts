import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { binarySemantic, createARP, fileTransport, textSemantic } from "../../src/index.js";

const TEST_DIR = join(process.cwd(), ".test-arp-operations");

describe("ARL operations", () => {
  beforeEach(async () => {
    await mkdir(TEST_DIR, { recursive: true });
  });

  afterEach(async () => {
    await rm(TEST_DIR, { recursive: true, force: true });
  });

  describe("arl.resolve()", () => {
    it("resolves text file content", async () => {
      const testFile = join(TEST_DIR, "test.txt");
      await writeFile(testFile, "Hello, ARP!");

      const arp = createARP({
        transports: [fileTransport],
        semantics: [textSemantic],
      });

      const arl = arp.parse(`arp:text:file://${testFile}`);
      const resource = await arl.resolve();

      expect(resource.type).toBe("text");
      expect(resource.content).toBe("Hello, ARP!");
      expect(resource.meta.semantic).toBe("text");
      expect(resource.meta.transport).toBe("file");
    });

    it("resolves binary file content", async () => {
      const testFile = join(TEST_DIR, "test.bin");
      const binaryData = Buffer.from([0x01, 0x02, 0x03, 0x04]);
      await writeFile(testFile, binaryData);

      const arp = createARP({
        transports: [fileTransport],
        semantics: [binarySemantic],
      });

      const arl = arp.parse(`arp:binary:file://${testFile}`);
      const resource = await arl.resolve();

      expect(resource.type).toBe("binary");
      expect(Buffer.isBuffer(resource.content)).toBe(true);
      expect(resource.content).toEqual(binaryData);
    });

    it("includes metadata in resolved resource", async () => {
      const testFile = join(TEST_DIR, "meta-test.txt");
      await writeFile(testFile, "test content");

      const arp = createARP({
        transports: [fileTransport],
        semantics: [textSemantic],
      });

      const arl = arp.parse(`arp:text:file://${testFile}`);
      const resource = await arl.resolve();

      expect(resource.meta.url).toBe(`arp:text:file://${testFile}`);
      expect(resource.meta.semantic).toBe("text");
      expect(resource.meta.transport).toBe("file");
      expect(resource.meta.location).toBe(testFile);
      expect(resource.meta.size).toBeGreaterThan(0);
      expect(resource.meta.resolvedAt).toBeDefined();
    });
  });

  describe("arl.deposit()", () => {
    it("deposits text content to file", async () => {
      const testFile = join(TEST_DIR, "deposit-test.txt");

      const arp = createARP({
        transports: [fileTransport],
        semantics: [textSemantic],
      });

      const arl = arp.parse(`arp:text:file://${testFile}`);
      await arl.deposit("Deposited content");

      // Verify by resolving
      const resource = await arl.resolve();
      expect(resource.content).toBe("Deposited content");
    });

    it("deposits binary content to file", async () => {
      const testFile = join(TEST_DIR, "deposit-binary.bin");
      const binaryData = Buffer.from([0xde, 0xad, 0xbe, 0xef]);

      const arp = createARP({
        transports: [fileTransport],
        semantics: [binarySemantic],
      });

      const arl = arp.parse(`arp:binary:file://${testFile}`);
      await arl.deposit(binaryData);

      // Verify by resolving
      const resource = await arl.resolve();
      expect(resource.content).toEqual(binaryData);
    });

    it("creates parent directories if needed", async () => {
      const testFile = join(TEST_DIR, "nested", "deep", "file.txt");

      const arp = createARP({
        transports: [fileTransport],
        semantics: [textSemantic],
      });

      const arl = arp.parse(`arp:text:file://${testFile}`);
      await arl.deposit("Nested content");

      const resource = await arl.resolve();
      expect(resource.content).toBe("Nested content");
    });
  });

  describe("arl.exists()", () => {
    it("returns true for existing file", async () => {
      const testFile = join(TEST_DIR, "exists-test.txt");
      await writeFile(testFile, "test");

      const arp = createARP({
        transports: [fileTransport],
        semantics: [textSemantic],
      });

      const arl = arp.parse(`arp:text:file://${testFile}`);
      const exists = await arl.exists();

      expect(exists).toBe(true);
    });

    it("returns false for non-existing file", async () => {
      const testFile = join(TEST_DIR, "non-existing.txt");

      const arp = createARP({
        transports: [fileTransport],
        semantics: [textSemantic],
      });

      const arl = arp.parse(`arp:text:file://${testFile}`);
      const exists = await arl.exists();

      expect(exists).toBe(false);
    });
  });

  describe("arl.delete()", () => {
    it("deletes existing file", async () => {
      const testFile = join(TEST_DIR, "delete-test.txt");
      await writeFile(testFile, "to be deleted");

      const arp = createARP({
        transports: [fileTransport],
        semantics: [textSemantic],
      });

      const arl = arp.parse(`arp:text:file://${testFile}`);

      // Verify exists before delete
      expect(await arl.exists()).toBe(true);

      await arl.delete();

      // Verify deleted
      expect(await arl.exists()).toBe(false);
    });
  });
});
