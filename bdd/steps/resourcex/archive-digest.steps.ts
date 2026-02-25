import { strict as assert } from "node:assert";
import { Then, When } from "@cucumber/cucumber";
import type { Resource } from "resourcexjs";

interface ArchiveDigestWorld {
  info: Resource | null;
  rememberedDigest: string | null;
}

// ============================================
// When steps
// ============================================

When("I remember the archive digest", function (this: ArchiveDigestWorld) {
  assert.ok(this.info, "No info result");
  const digest = (this.info.archive as { digest?: string }).digest;
  assert.ok(digest, "No archive digest to remember");
  this.rememberedDigest = digest;
});

// ============================================
// Then steps
// ============================================

Then("archive digest should be present", function (this: ArchiveDigestWorld) {
  assert.ok(this.info, "No info result");
  const digest = (this.info.archive as { digest?: string }).digest;
  assert.ok(digest, "Archive digest should be present");
});

Then(
  "archive digest should start with {string}",
  function (this: ArchiveDigestWorld, prefix: string) {
    assert.ok(this.info, "No info result");
    const digest = (this.info.archive as { digest?: string }).digest;
    assert.ok(digest, "Archive digest should be present");
    assert.ok(
      digest.startsWith(prefix),
      `Expected digest to start with "${prefix}", got "${digest}"`
    );
  }
);

Then("archive digest should equal the remembered digest", function (this: ArchiveDigestWorld) {
  assert.ok(this.info, "No info result");
  const digest = (this.info.archive as { digest?: string }).digest;
  assert.ok(digest, "Archive digest should be present");
  assert.ok(this.rememberedDigest, "No remembered digest");
  assert.equal(digest, this.rememberedDigest);
});

Then("archive digest should not equal the remembered digest", function (this: ArchiveDigestWorld) {
  assert.ok(this.info, "No info result");
  const digest = (this.info.archive as { digest?: string }).digest;
  assert.ok(digest, "Archive digest should be present");
  assert.ok(this.rememberedDigest, "No remembered digest");
  assert.notEqual(digest, this.rememberedDigest);
});
