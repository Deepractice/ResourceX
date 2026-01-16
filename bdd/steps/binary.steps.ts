/**
 * Binary semantic step definitions
 */
import { Given, Then, Before, After } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import { mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { dirname, join } from "node:path";

interface BinaryWorld {
  url: string;
  content: Buffer | Uint8Array | ArrayBuffer | number[];
  result: { type: string; content: unknown; meta?: Record<string, unknown> } | null;
  error: Error | null;
}

/**
 * Parse bytes array string like "[0x48, 0x45, 0x4C, 0x4C, 0x4F]" or "[72, 69, 76]"
 */
function parseBytes(bytesStr: string): number[] {
  // Remove brackets and split by comma
  const inner = bytesStr.replace(/^\[|\]$/g, "").trim();
  if (!inner) return [];
  return inner.split(",").map((s) => {
    const trimmed = s.trim();
    // Handle hex (0x48) or decimal (72)
    return trimmed.startsWith("0x") ? parseInt(trimmed, 16) : parseInt(trimmed, 10);
  });
}

Before({ tags: "@binary" }, async function (this: BinaryWorld) {
  this.result = null;
  this.error = null;
});

After({ tags: "@binary" }, async function () {
  // Clean up test files
  try {
    await rm(join(process.cwd(), "bdd/test-data"), { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
});

// Given steps for creating binary test files
Given(
  /^local binary file "([^"]*)" with bytes (\[.*\])$/,
  async function (filePath: string, bytesStr: string) {
    const bytes = parseBytes(bytesStr);
    const fullPath = join(process.cwd(), "bdd", filePath);
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, Buffer.from(bytes));
  }
);

// Given steps for different binary input types
Given(/^binary content from bytes (\[.*\])$/, function (this: BinaryWorld, bytesStr: string) {
  const bytes = parseBytes(bytesStr);
  this.content = Buffer.from(bytes);
});

Given(/^Uint8Array content from bytes (\[.*\])$/, function (this: BinaryWorld, bytesStr: string) {
  const bytes = parseBytes(bytesStr);
  this.content = new Uint8Array(bytes);
});

Given(/^ArrayBuffer content from bytes (\[.*\])$/, function (this: BinaryWorld, bytesStr: string) {
  const bytes = parseBytes(bytesStr);
  this.content = new Uint8Array(bytes).buffer;
});

Given(/^number array content (\[.*\])$/, function (this: BinaryWorld, bytesStr: string) {
  const bytes = parseBytes(bytesStr);
  this.content = bytes;
});

// Then steps for binary assertions
Then("content should be Buffer", function (this: BinaryWorld) {
  assert.ok(this.result, `Failed: ${this.error?.message}`);
  const content = (this.result as { content: unknown }).content;
  assert.ok(Buffer.isBuffer(content), `Content should be Buffer, got: ${typeof content}`);
});

Then(/^content bytes should be (\[.*\])$/, function (this: BinaryWorld, bytesStr: string) {
  assert.ok(this.result, `Failed: ${this.error?.message}`);
  const content = (this.result as { content: Buffer }).content;
  assert.ok(Buffer.isBuffer(content), "Content should be Buffer");
  const expected = Buffer.from(parseBytes(bytesStr));
  assert.ok(
    content.equals(expected),
    `Content bytes mismatch. Expected: ${expected.toString("hex")}, Got: ${content.toString("hex")}`
  );
});

Then(
  /^file "([^"]*)" bytes should be (\[.*\])$/,
  async function (filePath: string, bytesStr: string) {
    const fullPath = join(process.cwd(), "bdd", filePath);
    const content = await readFile(fullPath);
    const expected = Buffer.from(parseBytes(bytesStr));
    assert.ok(
      content.equals(expected),
      `File bytes mismatch. Expected: ${expected.toString("hex")}, Got: ${content.toString("hex")}`
    );
  }
);
