/* eslint-disable no-undef */
import { Given, When, Then, Before, After } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import { getRegistryServerUrl } from "../../support/registry-server.hooks.js";

function getBaseUrl(): string {
  return getRegistryServerUrl();
}

interface ServerWorld {
  response: Response | null;
  responseBody: unknown;
  manifest: Record<string, unknown> | null;
  archive: Uint8Array | null;
  publishedResources: string[];
}

Before({ tags: "@server" }, async function (this: ServerWorld) {
  this.response = null;
  this.responseBody = null;
  this.manifest = null;
  this.archive = null;
  this.publishedResources = [];
});

After({ tags: "@server" }, async function (this: ServerWorld) {
  // Clean up published resources
  for (const locator of this.publishedResources) {
    try {
      await fetch(`${getBaseUrl()}/api/v1/resource?locator=${encodeURIComponent(locator)}`, {
        method: "DELETE",
      });
    } catch {
      // Ignore cleanup errors
    }
  }
});

// ============================================
// HTTP Request Steps
// ============================================

When("I GET {string}", async function (this: ServerWorld, path: string) {
  this.response = await fetch(`${getBaseUrl()}${path}`);
  try {
    const text = await this.response.clone().text();
    this.responseBody = text ? JSON.parse(text) : null;
  } catch {
    this.responseBody = null;
  }
});

When("I HEAD {string}", async function (this: ServerWorld, path: string) {
  this.response = await fetch(`${getBaseUrl()}${path}`, { method: "HEAD" });
  this.responseBody = null;
});

When("I OPTIONS {string}", async function (this: ServerWorld, path: string) {
  this.response = await fetch(`${getBaseUrl()}${path}`, { method: "OPTIONS" });
  this.responseBody = null;
});

When("I DELETE {string}", async function (this: ServerWorld, path: string) {
  this.response = await fetch(`${getBaseUrl()}${path}`, { method: "DELETE" });
  try {
    const text = await this.response.clone().text();
    this.responseBody = text ? JSON.parse(text) : null;
  } catch {
    this.responseBody = null;
  }
});

When(
  "I POST {string} with multipart:",
  async function (
    this: ServerWorld,
    path: string,
    dataTable: { hashes: () => Array<{ field: string; value: string }> }
  ) {
    const formData = new FormData();
    for (const row of dataTable.hashes()) {
      if (row.value === "<manifest>") {
        formData.append(row.field, JSON.stringify(this.manifest));
      } else if (row.value === "<archive>") {
        formData.append(
          row.field,
          new Blob([this.archive || new Uint8Array()], { type: "application/gzip" }),
          "archive.tar.gz"
        );
      } else {
        formData.append(row.field, row.value);
      }
    }

    this.response = await fetch(`${getBaseUrl()}${path}`, {
      method: "POST",
      body: formData,
    });

    try {
      const text = await this.response.clone().text();
      this.responseBody = text ? JSON.parse(text) : null;
      // Track published resource for cleanup
      if (this.response.status === 201 && (this.responseBody as { locator?: string })?.locator) {
        this.publishedResources.push((this.responseBody as { locator: string }).locator);
      }
    } catch {
      this.responseBody = null;
    }
  }
);

// ============================================
// Response Assertion Steps
// ============================================

Then("the response status should be {int}", function (this: ServerWorld, status: number) {
  assert.ok(this.response, "No response received");
  assert.equal(this.response.status, status);
});

Then(
  "the response should contain:",
  function (
    this: ServerWorld,
    dataTable: { hashes: () => Array<{ field: string; value: string }> }
  ) {
    assert.ok(this.responseBody, "No response body");
    const body = this.responseBody as Record<string, unknown>;
    for (const row of dataTable.hashes()) {
      const expected = row.value.startsWith("[") ? JSON.parse(row.value) : row.value;
      assert.deepEqual(body[row.field], expected, `Field ${row.field} mismatch`);
    }
  }
);

Then(
  "the response should be JSON with:",
  function (
    this: ServerWorld,
    dataTable: { hashes: () => Array<{ field: string; value: string }> }
  ) {
    assert.ok(this.responseBody, "No response body");
    const body = this.responseBody as Record<string, unknown>;
    for (const row of dataTable.hashes()) {
      assert.equal(String(body[row.field] ?? "null"), row.value, `Field ${row.field} mismatch`);
    }
  }
);

Then("the response should contain error {string}", function (this: ServerWorld, errorMsg: string) {
  assert.ok(this.responseBody, "No response body");
  const body = this.responseBody as { error?: string };
  assert.ok(body.error, "No error field in response");
  assert.ok(body.error.includes(errorMsg), `Error "${body.error}" does not contain "${errorMsg}"`);
});

Then("the response should contain {int} results", function (this: ServerWorld, count: number) {
  assert.ok(Array.isArray(this.responseBody), "Response is not an array");
  assert.equal((this.responseBody as unknown[]).length, count);
});

Then(
  "the response Content-Type should be {string}",
  function (this: ServerWorld, contentType: string) {
    assert.ok(this.response, "No response");
    assert.equal(this.response.headers.get("content-type"), contentType);
  }
);

Then("the response should be a valid tar.gz archive", async function (this: ServerWorld) {
  assert.ok(this.response, "No response");
  const buffer = await this.response.arrayBuffer();
  // Check gzip magic number (1f 8b)
  const bytes = new Uint8Array(buffer);
  assert.ok(bytes.length >= 2, "Response too short for gzip");
  assert.equal(bytes[0], 0x1f, "Invalid gzip magic byte 1");
  assert.equal(bytes[1], 0x8b, "Invalid gzip magic byte 2");
});

Then("the response should have header {string}", function (this: ServerWorld, headerName: string) {
  assert.ok(this.response, "No response");
  assert.ok(this.response.headers.has(headerName), `Missing header: ${headerName}`);
});

Then(
  "the response should have header {string} with value {string}",
  function (this: ServerWorld, headerName: string, headerValue: string) {
    assert.ok(this.response, "No response");
    assert.equal(this.response.headers.get(headerName), headerValue);
  }
);

// ============================================
// Setup Steps
// ============================================

Given(
  "a published resource {string} with content {string}",
  async function (this: ServerWorld, locator: string, content: string) {
    // Parse locator to get manifest fields
    const match = locator.match(/^(?:([^/]+)\/)?(?:([^/]+)\/)?([^.@]+)\.([^@]+)@(.+)$/);
    assert.ok(match, `Invalid locator format: ${locator}`);

    const [, domain, path, name, type, version] = match;

    const manifest = {
      domain: domain || "localhost",
      path: path || undefined,
      name,
      type,
      version,
    };

    // Create a simple tar.gz with content (mock for now)
    const archive = new TextEncoder().encode(content);

    const formData = new FormData();
    formData.append("manifest", JSON.stringify(manifest));
    formData.append("archive", new Blob([archive], { type: "application/gzip" }), "archive.tar.gz");

    const response = await fetch(`${getBaseUrl()}/api/v1/publish`, {
      method: "POST",
      body: formData,
    });

    assert.equal(response.status, 201, `Failed to publish resource: ${await response.text()}`);
    this.publishedResources.push(locator);
  }
);

Given("a published resource {string}", async function (this: ServerWorld, locator: string) {
  // Parse locator to get manifest fields
  const match = locator.match(/^(?:([^/]+)\/)?(?:([^/]+)\/)?([^.@]+)\.([^@]+)@(.+)$/);
  assert.ok(match, `Invalid locator format: ${locator}`);

  const [, domain, path, name, type, version] = match;

  const manifest = {
    domain: domain || "localhost",
    path: path || undefined,
    name,
    type,
    version,
  };

  const formData = new FormData();
  formData.append("manifest", JSON.stringify(manifest));
  formData.append(
    "archive",
    new Blob([new Uint8Array()], { type: "application/gzip" }),
    "archive.tar.gz"
  );

  const response = await fetch(`${getBaseUrl()}/api/v1/publish`, {
    method: "POST",
    body: formData,
  });

  assert.equal(response.status, 201, `Failed to publish resource: ${await response.text()}`);
  this.publishedResources.push(locator);
});

Given(
  "published resources:",
  async function (this: ServerWorld, dataTable: { hashes: () => Array<{ locator: string }> }) {
    for (const row of dataTable.hashes()) {
      const match = row.locator.match(/^(?:([^/]+)\/)?(?:([^/]+)\/)?([^.@]+)\.([^@]+)@(.+)$/);
      assert.ok(match, `Invalid locator format: ${row.locator}`);

      const [, domain, path, name, type, version] = match;

      const manifest = {
        domain: domain || "localhost",
        path: path || undefined,
        name,
        type,
        version,
      };

      const formData = new FormData();
      formData.append("manifest", JSON.stringify(manifest));
      formData.append(
        "archive",
        new Blob([new Uint8Array()], { type: "application/gzip" }),
        "archive.tar.gz"
      );

      const response = await fetch(`${getBaseUrl()}/api/v1/publish`, {
        method: "POST",
        body: formData,
      });

      assert.equal(response.status, 201);
      this.publishedResources.push(row.locator);
    }
  }
);

Given("{int} published resources", async function (this: ServerWorld, count: number) {
  for (let i = 0; i < count; i++) {
    const locator = `resource-${i}.text@1.0.0`;
    const manifest = {
      name: `resource-${i}`,
      type: "text",
      version: "1.0.0",
    };

    const formData = new FormData();
    formData.append("manifest", JSON.stringify(manifest));
    formData.append(
      "archive",
      new Blob([new Uint8Array()], { type: "application/gzip" }),
      "archive.tar.gz"
    );

    const response = await fetch(`${getBaseUrl()}/api/v1/publish`, {
      method: "POST",
      body: formData,
    });

    assert.equal(response.status, 201);
    this.publishedResources.push(locator);
  }
});

Given(
  "I have a resource manifest:",
  function (
    this: ServerWorld,
    dataTable: { hashes: () => Array<{ field: string; value: string }> }
  ) {
    this.manifest = {};
    for (const row of dataTable.hashes()) {
      this.manifest[row.field] = row.value;
    }
  }
);

Given("I have an archive with content {string}", function (this: ServerWorld, content: string) {
  this.archive = new TextEncoder().encode(content);
});

Then("the resource {string} should exist", async function (this: ServerWorld, locator: string) {
  const response = await fetch(
    `${getBaseUrl()}/api/v1/resource?locator=${encodeURIComponent(locator)}`,
    { method: "HEAD" }
  );
  assert.equal(response.status, 200, `Resource ${locator} does not exist`);
});

Then("the resource {string} should not exist", async function (this: ServerWorld, locator: string) {
  const response = await fetch(
    `${getBaseUrl()}/api/v1/resource?locator=${encodeURIComponent(locator)}`,
    { method: "HEAD" }
  );
  assert.equal(response.status, 404, `Resource ${locator} still exists`);
});

When(
  "I publish {string} with content {string}",
  async function (this: ServerWorld, locator: string, content: string) {
    const match = locator.match(/^(?:([^/]+)\/)?(?:([^/]+)\/)?([^.@]+)\.([^@]+)@(.+)$/);
    assert.ok(match, `Invalid locator format: ${locator}`);

    const [, domain, path, name, type, version] = match;

    const manifest = {
      domain: domain || "localhost",
      path: path || undefined,
      name,
      type,
      version,
    };

    const formData = new FormData();
    formData.append("manifest", JSON.stringify(manifest));
    formData.append(
      "archive",
      new Blob([new TextEncoder().encode(content)], { type: "application/gzip" }),
      "archive.tar.gz"
    );

    this.response = await fetch(`${getBaseUrl()}/api/v1/publish`, {
      method: "POST",
      body: formData,
    });

    this.publishedResources.push(locator);
  }
);

Then(
  "extracting the archive should yield {string}",
  async function (this: ServerWorld, expectedContent: string) {
    assert.ok(this.response, "No response");
    const buffer = await this.response.arrayBuffer();
    const text = new TextDecoder().decode(buffer);
    assert.ok(
      text.includes(expectedContent),
      `Archive content "${text}" does not contain "${expectedContent}"`
    );
  }
);
