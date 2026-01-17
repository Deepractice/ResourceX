import { Given, When, Then } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import type { RXM } from "resourcexjs";

interface ManifestWorld {
  rxm: RXM | null;
  error: Error | null;
}

Given("I have access to resourcexjs manifest", async function (this: ManifestWorld) {
  const { createRXM } = await import("resourcexjs");
  assert.ok(createRXM, "createRXM should be defined");
});

When(
  "I parse manifest with domain {string}, name {string}, type {string}, version {string}",
  async function (
    this: ManifestWorld,
    domain: string,
    name: string,
    type: string,
    version: string
  ) {
    const { createRXM } = await import("resourcexjs");
    this.rxm = createRXM({ domain, name, type, version });
  }
);

When(
  "I parse manifest with domain {string}, path {string}, name {string}, type {string}, version {string}",
  async function (
    this: ManifestWorld,
    domain: string,
    path: string,
    name: string,
    type: string,
    version: string
  ) {
    const { createRXM } = await import("resourcexjs");
    this.rxm = createRXM({ domain, path, name, type, version });
  }
);

When(
  "I parse manifest with domain {string}, name {string}, type {string}, version {string}, resolver {string}",
  async function (
    this: ManifestWorld,
    domain: string,
    name: string,
    type: string,
    version: string,
    resolver: string
  ) {
    const { createRXM } = await import("resourcexjs");
    this.rxm = createRXM({ domain, name, type, version, resolver });
  }
);

When(
  "I parse manifest with domain {string}, path {string}, name {string}, type {string}, version {string}, resolver {string}",
  async function (
    this: ManifestWorld,
    domain: string,
    path: string,
    name: string,
    type: string,
    version: string,
    resolver: string
  ) {
    const { createRXM } = await import("resourcexjs");
    this.rxm = createRXM({ domain, path, name, type, version, resolver });
  }
);

When("I parse manifest without domain", async function (this: ManifestWorld) {
  const { createRXM } = await import("resourcexjs");
  try {
    this.rxm = createRXM({ name: "test", type: "prompt", version: "1.0.0" });
  } catch (e) {
    this.error = e as Error;
  }
});

When("I parse manifest without name", async function (this: ManifestWorld) {
  const { createRXM } = await import("resourcexjs");
  try {
    this.rxm = createRXM({ domain: "test.com", type: "prompt", version: "1.0.0" });
  } catch (e) {
    this.error = e as Error;
  }
});

When("I parse manifest without type", async function (this: ManifestWorld) {
  const { createRXM } = await import("resourcexjs");
  try {
    this.rxm = createRXM({ domain: "test.com", name: "test", version: "1.0.0" });
  } catch (e) {
    this.error = e as Error;
  }
});

When("I parse manifest without version", async function (this: ManifestWorld) {
  const { createRXM } = await import("resourcexjs");
  try {
    this.rxm = createRXM({ domain: "test.com", name: "test", type: "prompt" });
  } catch (e) {
    this.error = e as Error;
  }
});

Then("rxm domain should be {string}", function (this: ManifestWorld, expected: string) {
  assert.ok(this.rxm, "RXM should be defined");
  assert.equal(this.rxm.domain, expected);
});

Then("rxm path should be {string}", function (this: ManifestWorld, expected: string) {
  assert.ok(this.rxm, "RXM should be defined");
  assert.equal(this.rxm.path, expected);
});

Then("rxm path should be undefined", function (this: ManifestWorld) {
  assert.ok(this.rxm, "RXM should be defined");
  assert.equal(this.rxm.path, undefined);
});

Then("rxm name should be {string}", function (this: ManifestWorld, expected: string) {
  assert.ok(this.rxm, "RXM should be defined");
  assert.equal(this.rxm.name, expected);
});

Then("rxm type should be {string}", function (this: ManifestWorld, expected: string) {
  assert.ok(this.rxm, "RXM should be defined");
  assert.equal(this.rxm.type, expected);
});

Then("rxm version should be {string}", function (this: ManifestWorld, expected: string) {
  assert.ok(this.rxm, "RXM should be defined");
  assert.equal(this.rxm.version, expected);
});

Then("rxm resolver should be {string}", function (this: ManifestWorld, expected: string) {
  assert.ok(this.rxm, "RXM should be defined");
  assert.equal(this.rxm.resolver, expected);
});

Then("rxm resolver should be undefined", function (this: ManifestWorld) {
  assert.ok(this.rxm, "RXM should be defined");
  assert.equal(this.rxm.resolver, undefined);
});

Then("rxm toLocator should return {string}", function (this: ManifestWorld, expected: string) {
  assert.ok(this.rxm, "RXM should be defined");
  assert.equal(this.rxm.toLocator(), expected);
});

Then(
  "should throw ManifestError with message {string}",
  async function (this: ManifestWorld, expectedMessage: string) {
    const { ManifestError } = await import("resourcexjs");
    assert.ok(this.error, "Error should have been thrown");
    assert.ok(
      this.error instanceof ManifestError,
      `Expected ManifestError but got ${this.error.name}`
    );
    assert.ok(
      this.error.message.includes(expectedMessage),
      `Expected message to include "${expectedMessage}"`
    );
  }
);
