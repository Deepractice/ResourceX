import { When, Given, Then, Before, After } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import { readFile, rm } from "node:fs/promises";
import { join } from "node:path";

interface DepositWorld {
  url: string;
  content: string | Buffer | Uint8Array | ArrayBuffer | number[];
  result: { type: string; content: unknown; meta?: Record<string, unknown> } | null;
  error: Error | null;
}

Before({ tags: "@deposit" }, async function (this: DepositWorld) {
  this.result = null;
  this.error = null;
  this.content = "";
});

After({ tags: "@deposit" }, async function () {
  // Clean up test files
  try {
    await rm(join(process.cwd(), "bdd/test-data"), { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
});

Given("content {string}", function (this: DepositWorld, content: string) {
  this.content = content;
});

When("deposit the content", async function (this: DepositWorld) {
  try {
    const { createARP, fileTransport, httpsTransport, textSemantic, binarySemantic } =
      await import("resourcexjs/arp");
    const arp = createARP({
      transports: [fileTransport, httpsTransport],
      semantics: [textSemantic, binarySemantic],
    });
    let url = this.url;
    if (url.includes("file://./")) {
      url = url.replace("file://./", `file://./bdd/`);
    }
    const arl = arp.parse(url);
    await arl.deposit(this.content);
  } catch (e) {
    this.error = e as Error;
  }
});

Then("should succeed without error", function (this: DepositWorld) {
  assert.ok(!this.error, `Expected no error, got: ${this.error?.message}`);
});

Then("file {string} should contain {string}", async function (filePath: string, expected: string) {
  const fullPath = join(process.cwd(), "bdd", filePath);
  const content = await readFile(fullPath, "utf-8");
  assert.ok(content.includes(expected), `File should contain "${expected}", got: ${content}`);
});
