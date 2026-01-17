import { When, Then } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import type { ARL } from "resourcexjs/arp";

interface ParserWorld {
  url: string;
  arl: ARL | null;
  error: Error | null;
}

When("parse the URL", async function (this: ParserWorld) {
  try {
    const {
      createARP,
      fileTransport,
      httpsTransport,
      httpTransport,
      textSemantic,
      binarySemantic,
    } = await import("resourcexjs/arp");
    const arp = createARP({
      transports: [fileTransport, httpsTransport, httpTransport],
      semantics: [textSemantic, binarySemantic],
    });
    this.arl = arp.parse(this.url);
  } catch (e) {
    this.error = e as Error;
  }
});

Then("semantic should be {string}", function (this: ParserWorld, expected: string) {
  assert.ok(this.arl, `Parse failed: ${this.error?.message}`);
  assert.equal(this.arl.semantic, expected);
});

Then("transport should be {string}", function (this: ParserWorld, expected: string) {
  assert.ok(this.arl, `Parse failed: ${this.error?.message}`);
  assert.equal(this.arl.transport, expected);
});

Then("location should be {string}", function (this: ParserWorld, expected: string) {
  assert.ok(this.arl, `Parse failed: ${this.error?.message}`);
  assert.equal(this.arl.location, expected);
});
