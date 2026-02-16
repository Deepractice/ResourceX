/**
 * ResourceX Registry Hono Server
 *
 * Ready-to-use Hono app implementing the ResourceX Registry Protocol.
 */

import type { RXAStore, RXMStore } from "@resourcexjs/core";
import { CASRegistry } from "@resourcexjs/core";
import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  handleDeleteResource,
  handleGetContent,
  handleGetResource,
  handleHeadResource,
  handlePublish,
  handleSearch,
} from "./handlers.js";
import { ENDPOINTS } from "./protocol.js";

export interface RegistryServerConfig {
  /**
   * RXA Store (blob storage).
   */
  rxaStore: RXAStore;

  /**
   * RXM Store (manifest storage).
   */
  rxmStore: RXMStore;

  /**
   * Base path for API routes.
   * @default ""
   */
  basePath?: string;

  /**
   * Enable CORS.
   * @default true
   */
  cors?: boolean;
}

/**
 * Create a registry server Hono app.
 */
export function createRegistryServer(config: RegistryServerConfig): Hono {
  const basePath = config.basePath ?? "";
  const enableCors = config.cors ?? true;

  const registry = new CASRegistry(config.rxaStore, config.rxmStore);

  const app = new Hono().basePath(basePath);

  if (enableCors) {
    app.use("*", cors());
  }

  // Health check
  app.get(ENDPOINTS.health, (c) => c.json({ status: "ok" }));

  // POST /publish
  app.post(ENDPOINTS.publish, async (c) => {
    return handlePublish(c.req.raw, registry);
  });

  // GET /resource/:locator
  app.get(`${ENDPOINTS.resource}/:locator`, async (c) => {
    const locator = decodeURIComponent(c.req.param("locator"));
    return handleGetResource(locator, registry);
  });

  // HEAD /resource/:locator
  app.on("HEAD", `${ENDPOINTS.resource}/:locator`, async (c) => {
    const locator = decodeURIComponent(c.req.param("locator"));
    return handleHeadResource(locator, registry);
  });

  // DELETE /resource/:locator
  app.delete(`${ENDPOINTS.resource}/:locator`, async (c) => {
    const locator = decodeURIComponent(c.req.param("locator"));
    return handleDeleteResource(locator, registry);
  });

  // GET /content/:locator
  app.get(`${ENDPOINTS.content}/:locator`, async (c) => {
    const locator = decodeURIComponent(c.req.param("locator"));
    return handleGetContent(locator, registry);
  });

  // GET /search
  app.get(ENDPOINTS.search, async (c) => {
    const query = c.req.query("q");
    const limit = parseInt(c.req.query("limit") ?? "100", 10);
    const offset = parseInt(c.req.query("offset") ?? "0", 10);
    return handleSearch(query, limit, offset, registry);
  });

  return app;
}
