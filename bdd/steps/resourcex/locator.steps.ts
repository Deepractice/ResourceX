import { Given, When, Then } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import type { RXL } from "resourcexjs";

interface LocatorWorld {
  rxl: RXL | null;
}

Given("I have access to resourcexjs", async function (this: LocatorWorld) {
  const { parse } = await import("resourcexjs");
  assert.ok(parse, "parse should be defined");
});

When("I parse locator {string}", async function (this: LocatorWorld, locator: string) {
  const { parse } = await import("resourcexjs");
  this.rxl = parse(locator);
});

Then("rxl name should be {string}", function (this: LocatorWorld, expected: string) {
  assert.ok(this.rxl, "RXL should be defined");
  assert.equal(this.rxl.name, expected);
});

Then("rxl domain should be {string}", function (this: LocatorWorld, expected: string) {
  assert.ok(this.rxl, "RXL should be defined");
  assert.equal(this.rxl.domain, expected);
});

Then("rxl domain should be undefined", function (this: LocatorWorld) {
  assert.ok(this.rxl, "RXL should be defined");
  assert.equal(this.rxl.domain, undefined);
});

Then("rxl path should be {string}", function (this: LocatorWorld, expected: string) {
  assert.ok(this.rxl, "RXL should be defined");
  assert.equal(this.rxl.path, expected);
});

Then("rxl path should be undefined", function (this: LocatorWorld) {
  assert.ok(this.rxl, "RXL should be defined");
  assert.equal(this.rxl.path, undefined);
});

Then("rxl type should be {string}", function (this: LocatorWorld, expected: string) {
  assert.ok(this.rxl, "RXL should be defined");
  assert.equal(this.rxl.type, expected);
});

Then("rxl type should be undefined", function (this: LocatorWorld) {
  assert.ok(this.rxl, "RXL should be defined");
  assert.equal(this.rxl.type, undefined);
});

Then("rxl version should be {string}", function (this: LocatorWorld, expected: string) {
  assert.ok(this.rxl, "RXL should be defined");
  assert.equal(this.rxl.version, expected);
});

Then("rxl version should be undefined", function (this: LocatorWorld) {
  assert.ok(this.rxl, "RXL should be defined");
  assert.equal(this.rxl.version, undefined);
});

Then("rxl toString should return {string}", function (this: LocatorWorld, expected: string) {
  assert.ok(this.rxl, "RXL should be defined");
  assert.equal(this.rxl.toString(), expected);
});
