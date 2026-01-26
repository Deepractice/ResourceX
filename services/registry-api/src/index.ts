/* eslint-disable no-undef */
import { Hono } from "hono";
import { cors } from "hono/cors";

type Bindings = {
  DB: D1Database;
  BUCKET: R2Bucket;
  ENVIRONMENT: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// CORS middleware
app.use("*", cors());

// ============================================
// GET /v1/resource - Get manifest
// ============================================

app.get("/v1/resource", async (c) => {
  const locator = c.req.query("locator");
  if (!locator) {
    return c.json({ error: "locator is required" }, 400);
  }

  const db = c.env.DB;
  const result = await db
    .prepare("SELECT domain, path, name, type, version FROM resources WHERE locator = ?")
    .bind(locator)
    .first();

  if (!result) {
    return c.json({ error: "not found" }, 404);
  }

  return c.json(result);
});

// ============================================
// HEAD /v1/resource - Check existence
// ============================================

app.on("HEAD", "/v1/resource", async (c) => {
  const locator = c.req.query("locator");
  if (!locator) {
    return c.body(null, 400);
  }

  const db = c.env.DB;
  const result = await db
    .prepare("SELECT 1 FROM resources WHERE locator = ?")
    .bind(locator)
    .first();

  return c.body(null, result ? 200 : 404);
});

// ============================================
// GET /v1/content - Get archive
// ============================================

app.get("/v1/content", async (c) => {
  const locator = c.req.query("locator");
  if (!locator) {
    return c.json({ error: "locator is required" }, 400);
  }

  const bucket = c.env.BUCKET;
  const key = `${locator}/archive.tar.gz`;
  const object = await bucket.get(key);

  if (!object) {
    return c.json({ error: "not found" }, 404);
  }

  return new Response(object.body, {
    headers: {
      "Content-Type": "application/gzip",
      "Access-Control-Allow-Origin": "*",
    },
  });
});

// ============================================
// GET /v1/search - Search resources
// ============================================

app.get("/v1/search", async (c) => {
  const query = c.req.query("q") || "";
  const limit = parseInt(c.req.query("limit") || "100", 10);
  const offset = parseInt(c.req.query("offset") || "0", 10);

  const db = c.env.DB;

  let sql = "SELECT locator FROM resources";
  const params: string[] = [];

  if (query) {
    sql += " WHERE locator LIKE ?";
    params.push(`%${query}%`);
  }

  sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(String(limit), String(offset));

  const results = await db
    .prepare(sql)
    .bind(...params)
    .all();

  return c.json(results.results?.map((r) => r.locator) || []);
});

// ============================================
// POST /v1/publish - Publish resource
// ============================================

app.post("/v1/publish", async (c) => {
  const formData = await c.req.formData();
  const manifestStr = formData.get("manifest");
  const archive = formData.get("archive");

  if (!manifestStr) {
    return c.json({ error: "manifest is required" }, 400);
  }

  if (!archive || typeof archive === "string") {
    return c.json({ error: "archive is required" }, 400);
  }

  const archiveFile = archive as unknown as { arrayBuffer(): Promise<ArrayBuffer> };

  let manifest: {
    domain?: string;
    path?: string;
    name: string;
    type: string;
    version: string;
  };

  try {
    manifest = JSON.parse(manifestStr as string);
  } catch {
    return c.json({ error: "invalid manifest JSON" }, 400);
  }

  const domain = manifest.domain || "localhost";
  const path = manifest.path || null;
  const { name, type, version } = manifest;

  // Build locator
  let locator = "";
  if (domain !== "localhost") {
    locator += domain + "/";
    if (path) {
      locator += path + "/";
    }
  }
  locator += `${name}.${type}@${version}`;

  const db = c.env.DB;
  const bucket = c.env.BUCKET;

  // Store manifest in D1
  await db
    .prepare(
      `INSERT OR REPLACE INTO resources (locator, domain, path, name, type, version, created_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
    )
    .bind(locator, domain, path, name, type, version)
    .run();

  // Store archive in R2
  const key = `${locator}/archive.tar.gz`;
  await bucket.put(key, await archiveFile.arrayBuffer());

  return c.json({ locator }, 201);
});

// ============================================
// DELETE /v1/resource - Delete resource
// ============================================

app.delete("/v1/resource", async (c) => {
  const locator = c.req.query("locator");
  if (!locator) {
    return c.json({ error: "locator is required" }, 400);
  }

  const db = c.env.DB;
  const bucket = c.env.BUCKET;

  // Check if exists
  const result = await db
    .prepare("SELECT 1 FROM resources WHERE locator = ?")
    .bind(locator)
    .first();

  if (!result) {
    return c.json({ error: "not found" }, 404);
  }

  // Delete from D1
  await db.prepare("DELETE FROM resources WHERE locator = ?").bind(locator).run();

  // Delete from R2
  const key = `${locator}/archive.tar.gz`;
  await bucket.delete(key);

  return c.body(null, 204);
});

export default app;
