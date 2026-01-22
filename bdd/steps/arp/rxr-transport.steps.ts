/**
 * RXR Transport step definitions
 * Uses unique step names to avoid conflicts with other step files
 */
import { Given, When, Then, After, Before } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import { join } from "node:path";
import { mkdir, rm } from "node:fs/promises";
import type { Registry, RXR, ARL } from "resourcexjs";
import type { ARP } from "resourcexjs/arp";

const TEST_DIR = join(process.cwd(), ".test-bdd-rxr-transport");

interface RxrTransportWorld {
  registry: Registry | null;
  arp: ARP | null;
  arl: ARL | null;
  result: { type: string; content: unknown; meta?: Record<string, unknown> } | null;
  error: Error | null;
}

Before({ tags: "@rxr-transport" }, async function (this: RxrTransportWorld) {
  this.registry = null;
  this.arp = null;
  this.arl = null;
  this.result = null;
  this.error = null;
});

After({ tags: "@rxr-transport" }, async function () {
  try {
    await rm(TEST_DIR, { recursive: true, force: true });
  } catch {
    // Ignore
  }
});

// ============================================
// Given steps - unique names for @rxr-transport
// ============================================

Given("an ARP instance with RxrTransport", async function (this: RxrTransportWorld) {
  // Create registry if not already set
  if (!this.registry) {
    const { createRegistry } = await import("resourcexjs");
    await mkdir(TEST_DIR, { recursive: true });
    this.registry = createRegistry({ path: TEST_DIR });
  }

  const { createARP, fileTransport, textSemantic, binarySemantic, RxrTransport } =
    await import("resourcexjs/arp");

  const rxrTransport = new RxrTransport(this.registry!);

  this.arp = createARP({
    transports: [fileTransport, rxrTransport],
    semantics: [textSemantic, binarySemantic],
  });
});

// ============================================
// When steps - unique names for @rxr-transport
// ============================================

When("I parse ARP URL {string}", async function (this: RxrTransportWorld, url: string) {
  try {
    this.arl = this.arp!.parse(url);
    this.error = null;
  } catch (e) {
    this.error = e as Error;
    this.arl = null;
  }
});

When("I try to parse ARP URL {string}", async function (this: RxrTransportWorld, url: string) {
  try {
    this.arl = this.arp!.parse(url);
    // Trigger validation by calling exists which will invoke transport
    await this.arl.exists();
    this.error = null;
  } catch (e) {
    this.error = e as Error;
    this.arl = null;
  }
});

When("I resolve the parsed ARL", async function (this: RxrTransportWorld) {
  try {
    this.result = await this.arl!.resolve();
    this.error = null;
  } catch (e) {
    this.error = e as Error;
    this.result = null;
  }
});

When("I try to resolve the parsed ARL", async function (this: RxrTransportWorld) {
  try {
    this.result = await this.arl!.resolve();
    this.error = null;
  } catch (e) {
    this.error = e as Error;
    this.result = null;
  }
});

When("I check if the parsed ARL exists", async function (this: RxrTransportWorld) {
  try {
    const exists = await this.arl!.exists();
    this.result = { type: "exists", content: exists };
    this.error = null;
  } catch (e) {
    this.error = e as Error;
  }
});

When(
  "I try to deposit {string} to the parsed ARL",
  async function (this: RxrTransportWorld, content: string) {
    try {
      await this.arl!.deposit(content);
      this.error = null;
    } catch (e) {
      this.error = e as Error;
    }
  }
);

When("I try to delete the parsed ARL", async function (this: RxrTransportWorld) {
  try {
    await this.arl!.delete();
    this.error = null;
  } catch (e) {
    this.error = e as Error;
  }
});

// ============================================
// Then steps - unique names for @rxr-transport
// ============================================

Then(
  "the resolved content should be {string}",
  function (this: RxrTransportWorld, expected: string) {
    assert.ok(this.result, `Should have result: ${this.error?.message}`);
    assert.equal(this.result.content, expected);
  }
);

Then("the resolved content should be a Buffer", function (this: RxrTransportWorld) {
  assert.ok(this.result, `Should have result: ${this.error?.message}`);
  assert.ok(Buffer.isBuffer(this.result.content), "Content should be a Buffer");
});

Then("a TransportError should be thrown", async function (this: RxrTransportWorld) {
  const { TransportError } = await import("resourcexjs/arp");
  assert.ok(this.error, "Expected an error to be thrown");
  assert.ok(
    this.error instanceof TransportError,
    `Expected TransportError but got ${this.error?.name}: ${this.error?.message}`
  );
});

Then("an error should be thrown", function (this: RxrTransportWorld) {
  assert.ok(this.error, "Expected an error to be thrown");
});

Then(
  "the error message should include {string}",
  function (this: RxrTransportWorld, expected: string) {
    assert.ok(this.error, "Expected an error");
    assert.ok(
      this.error.message.toLowerCase().includes(expected.toLowerCase()),
      `Error message should include "${expected}", got: ${this.error.message}`
    );
  }
);

Then("the exists result should be true", function (this: RxrTransportWorld) {
  assert.ok(this.result, "Should have result");
  assert.equal(this.result.content, true);
});

Then("the exists result should be false", function (this: RxrTransportWorld) {
  assert.ok(this.result, "Should have result");
  assert.equal(this.result.content, false);
});
