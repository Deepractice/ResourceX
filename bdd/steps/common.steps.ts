/**
 * Common step definitions shared across all tests
 */
import { Then } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";

interface CommonWorld {
  commandOutput: string;
  commandExitCode: number;
}

// ============================================
// Common Then steps
// ============================================

Then("the command should succeed", async function (this: CommonWorld) {
  assert.equal(
    this.commandExitCode,
    0,
    `Command should succeed but got exit code ${this.commandExitCode}. Output: ${this.commandOutput}`
  );
});

Then("the command should fail", async function (this: CommonWorld) {
  assert.notEqual(this.commandExitCode, 0, "Command should fail");
});

Then("the output should contain {string}", async function (this: CommonWorld, expected: string) {
  assert.ok(
    this.commandOutput.includes(expected),
    `Output should contain "${expected}" but got: ${this.commandOutput}`
  );
});

Then(
  "the output should not contain {string}",
  async function (this: CommonWorld, notExpected: string) {
    assert.ok(
      !this.commandOutput.includes(notExpected),
      `Output should not contain "${notExpected}" but got: ${this.commandOutput}`
    );
  }
);
