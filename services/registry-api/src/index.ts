/* eslint-disable no-undef */
import { Hono } from "hono";
import { cors } from "hono/cors";
import { drizzle } from "drizzle-orm/d1";
import { eq, like, desc } from "drizzle-orm";
import { resources } from "./db/schema.js";

type Bindings = {
  DB: D1Database;
  BUCKET: R2Bucket;
  ENVIRONMENT: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// CORS middleware
app.use("*", cors());

// ============================================
// GET /api/v1/resource - Get manifest
// ============================================

app.get("/api/v1/resource", async (c) => {
  const locator = c.req.query("locator");
  if (!locator) {
    return c.json({ error: "locator is required" }, 400);
  }

  const db = drizzle(c.env.DB);
  const result = await db
    .select({
      domain: resources.domain,
      path: resources.path,
      name: resources.name,
      type: resources.type,
      version: resources.version,
    })
    .from(resources)
    .where(eq(resources.locator, locator))
    .get();

  if (!result) {
    return c.json({ error: "not found" }, 404);
  }

  return c.json(result);
});

// ============================================
// HEAD /api/v1/resource - Check existence
// ============================================

app.on("HEAD", "/api/v1/resource", async (c) => {
  const locator = c.req.query("locator");
  if (!locator) {
    return c.body(null, 400);
  }

  const db = drizzle(c.env.DB);
  const result = await db
    .select({ locator: resources.locator })
    .from(resources)
    .where(eq(resources.locator, locator))
    .get();

  return c.body(null, result ? 200 : 404);
});

// ============================================
// GET /api/v1/content - Get archive
// ============================================

app.get("/api/v1/content", async (c) => {
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
// GET /api/v1/search - Search resources
// ============================================

app.get("/api/v1/search", async (c) => {
  const query = c.req.query("q") || "";
  const limit = parseInt(c.req.query("limit") || "100", 10);
  const offset = parseInt(c.req.query("offset") || "0", 10);

  const db = drizzle(c.env.DB);

  let queryBuilder = db
    .select({ locator: resources.locator })
    .from(resources)
    .orderBy(desc(resources.createdAt))
    .limit(limit)
    .offset(offset);

  if (query) {
    queryBuilder = queryBuilder.where(like(resources.locator, `%${query}%`)) as typeof queryBuilder;
  }

  const results = await queryBuilder.all();

  return c.json(results.map((r) => r.locator));
});

// ============================================
// POST /api/v1/publish - Publish resource
// ============================================

app.post("/api/v1/publish", async (c) => {
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

  const db = drizzle(c.env.DB);
  const bucket = c.env.BUCKET;

  // Store manifest in D1
  await db
    .insert(resources)
    .values({
      locator,
      domain,
      path,
      name,
      type,
      version,
    })
    .onConflictDoUpdate({
      target: resources.locator,
      set: {
        domain,
        path,
        name,
        type,
        version,
        createdAt: new Date().toISOString(),
      },
    });

  // Store archive in R2
  const key = `${locator}/archive.tar.gz`;
  await bucket.put(key, await archiveFile.arrayBuffer());

  return c.json({ locator }, 201);
});

// ============================================
// DELETE /api/v1/resource - Delete resource
// ============================================

app.delete("/api/v1/resource", async (c) => {
  const locator = c.req.query("locator");
  if (!locator) {
    return c.json({ error: "locator is required" }, 400);
  }

  const db = drizzle(c.env.DB);
  const bucket = c.env.BUCKET;

  // Check if exists
  const result = await db
    .select({ locator: resources.locator })
    .from(resources)
    .where(eq(resources.locator, locator))
    .get();

  if (!result) {
    return c.json({ error: "not found" }, 404);
  }

  // Delete from D1
  await db.delete(resources).where(eq(resources.locator, locator));

  // Delete from R2
  const key = `${locator}/archive.tar.gz`;
  await bucket.delete(key);

  return c.body(null, 204);
});

export default app;
