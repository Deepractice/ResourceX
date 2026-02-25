import { strict as assert } from "node:assert";
import { Given, Then, When } from "@cucumber/cucumber";
import type { RXI } from "resourcexjs";
import { format, parse } from "resourcexjs";

interface DigestWorld {
  parsed: RXI | null;
  identifier: RXI | null;
  formatted: string | null;
}

// ============================================
// When steps — parse
// ============================================

When("I parse {string}", function (this: DigestWorld, locator: string) {
  this.parsed = parse(locator);
});

// ============================================
// Then steps — parsed assertions
// ============================================

Then("parsed name should be {string}", function (this: DigestWorld, expected: string) {
  assert.ok(this.parsed, "No parsed result");
  assert.equal(this.parsed.name, expected);
});

Then("parsed tag should be {string}", function (this: DigestWorld, expected: string) {
  assert.ok(this.parsed, "No parsed result");
  assert.equal(this.parsed.tag, expected);
});

Then("parsed digest should be {string}", function (this: DigestWorld, expected: string) {
  assert.ok(this.parsed, "No parsed result");
  assert.equal(this.parsed.digest, expected);
});

Then("parsed digest should be absent", function (this: DigestWorld) {
  assert.ok(this.parsed, "No parsed result");
  assert.equal(this.parsed.digest, undefined);
});

Then("parsed registry should be {string}", function (this: DigestWorld, expected: string) {
  assert.ok(this.parsed, "No parsed result");
  assert.equal(this.parsed.registry, expected);
});

// ============================================
// Given steps — format
// ============================================

Given(
  "an identifier with name {string} tag {string} and digest {string}",
  function (this: DigestWorld, name: string, tag: string, digest: string) {
    this.identifier = { name, tag, digest };
  }
);

Given(
  "an identifier with name {string} tag {string} and no digest",
  function (this: DigestWorld, name: string, tag: string) {
    this.identifier = { name, tag };
  }
);

// ============================================
// When steps — format
// ============================================

When("I format the identifier", function (this: DigestWorld) {
  assert.ok(this.identifier, "No identifier set");
  this.formatted = format(this.identifier);
});

// ============================================
// Then steps — format assertions
// ============================================

Then("formatted locator should be {string}", function (this: DigestWorld, expected: string) {
  assert.equal(this.formatted, expected);
});
