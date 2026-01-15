import { When, Then } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";

interface ParserWorld {
  url: string;
  result: {
    semantic: string;
    transport: string;
    location: string;
  } | null;
  error: Error | null;
}

When("parse the URL", async function (this: ParserWorld) {
  try {
    const { createResourceX } = await import("resourcexjs");
    const rx = createResourceX();
    this.result = rx.parse(this.url);
  } catch (e) {
    this.error = e as Error;
  }
});

Then("semantic should be {string}", function (this: ParserWorld, expected: string) {
  assert.ok(this.result, `Parse failed: ${this.error?.message}`);
  assert.equal(this.result.semantic, expected);
});

Then("transport should be {string}", function (this: ParserWorld, expected: string) {
  assert.ok(this.result, `Parse failed: ${this.error?.message}`);
  assert.equal(this.result.transport, expected);
});

Then("location should be {string}", function (this: ParserWorld, expected: string) {
  assert.ok(this.result, `Parse failed: ${this.error?.message}`);
  assert.equal(this.result.location, expected);
});
