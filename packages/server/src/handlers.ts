/**
 * ResourceX Registry Handlers
 *
 * Handler functions for Next.js Route Handler or any other framework.
 */

import type { Registry } from "@resourcexjs/core";
import { format, manifest, parse, resource, wrap } from "@resourcexjs/core";
import {
  ERROR_CODES,
  type ErrorResponse,
  type GetResourceResponse,
  PUBLISH_FIELDS,
  type PublishResponse,
  type SearchResponse,
} from "./protocol.js";

// ============================================
// Helper Functions
// ============================================

function jsonResponse<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function errorResponse(error: string, code: string, status: number): Response {
  const body: ErrorResponse = { error, code };
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ============================================
// Handler Functions
// ============================================

/**
 * Handle POST /publish
 */
export async function handlePublish(request: Request, registry: Registry): Promise<Response> {
  try {
    const formData = await request.formData();

    const locatorStr = formData.get(PUBLISH_FIELDS.locator);
    if (!locatorStr || typeof locatorStr !== "string") {
      return errorResponse("Missing locator field", ERROR_CODES.LOCATOR_REQUIRED, 400);
    }

    const manifestFile = formData.get(PUBLISH_FIELDS.manifest);
    if (!manifestFile || typeof manifestFile === "string") {
      return errorResponse("Missing manifest file", ERROR_CODES.MANIFEST_REQUIRED, 400);
    }

    const contentFile = formData.get(PUBLISH_FIELDS.content);
    if (!contentFile || typeof contentFile === "string") {
      return errorResponse("Missing content file", ERROR_CODES.CONTENT_REQUIRED, 400);
    }

    const rxl = parse(locatorStr);
    const manifestText = await manifestFile.text();
    const manifestData = JSON.parse(manifestText);

    // Server stores resources WITHOUT registry prefix
    // The registry is implicit - resources are stored ON this server
    const rxm = manifest({
      registry: undefined, // Do not store registry - this IS the registry
      path: manifestData.path ?? rxl.path,
      name: manifestData.name ?? rxl.name,
      type: manifestData.type, // Type must come from manifest, not locator
      tag: manifestData.tag ?? rxl.tag ?? "latest",
      files: manifestData.files,
    });

    const contentBuffer = Buffer.from(await contentFile.arrayBuffer());
    const rxa = wrap(contentBuffer);
    const rxr = resource(rxm, rxa);

    await registry.put(rxr);

    const response: PublishResponse = { locator: format(rxr.identifier) };
    return jsonResponse(response, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, ERROR_CODES.INTERNAL_ERROR, 500);
  }
}

/**
 * Handle GET /resource/:locator
 */
export async function handleGetResource(locator: string, registry: Registry): Promise<Response> {
  try {
    const rxl = parse(locator);
    // Server lookup without registry - resources stored locally don't have registry prefix
    const localRxl = { ...rxl, registry: undefined };
    const rxr = await registry.get(localRxl);

    const response: GetResourceResponse = {
      registry: rxr.manifest.definition.registry,
      path: rxr.manifest.definition.path,
      name: rxr.manifest.definition.name,
      type: rxr.manifest.definition.type,
      tag: rxr.manifest.definition.tag,
    };
    return jsonResponse(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("not found")) {
      return errorResponse("Resource not found", ERROR_CODES.RESOURCE_NOT_FOUND, 404);
    }
    return errorResponse(message, ERROR_CODES.INTERNAL_ERROR, 500);
  }
}

/**
 * Handle HEAD /resource/:locator
 */
export async function handleHeadResource(locator: string, registry: Registry): Promise<Response> {
  try {
    const rxl = parse(locator);
    const localRxl = { ...rxl, registry: undefined };
    const exists = await registry.has(localRxl);
    return new Response(null, { status: exists ? 200 : 404 });
  } catch {
    return new Response(null, { status: 500 });
  }
}

/**
 * Handle DELETE /resource/:locator
 */
export async function handleDeleteResource(locator: string, registry: Registry): Promise<Response> {
  try {
    const rxl = parse(locator);
    const localRxl = { ...rxl, registry: undefined };
    const exists = await registry.has(localRxl);

    if (!exists) {
      return errorResponse("Resource not found", ERROR_CODES.RESOURCE_NOT_FOUND, 404);
    }

    await registry.remove(localRxl);
    return new Response(null, { status: 204 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, ERROR_CODES.INTERNAL_ERROR, 500);
  }
}

/**
 * Handle GET /content/:locator
 */
export async function handleGetContent(locator: string, registry: Registry): Promise<Response> {
  try {
    const rxl = parse(locator);
    const localRxl = { ...rxl, registry: undefined };
    const rxr = await registry.get(localRxl);
    const buffer = await rxr.archive.buffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/gzip",
        "Content-Disposition": `attachment; filename="archive.tar.gz"`,
        "Content-Length": buffer.byteLength.toString(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("not found")) {
      return errorResponse("Resource not found", ERROR_CODES.RESOURCE_NOT_FOUND, 404);
    }
    return errorResponse(message, ERROR_CODES.INTERNAL_ERROR, 500);
  }
}

/**
 * Handle GET /search
 */
export async function handleSearch(
  query: string | undefined,
  limit: number,
  offset: number,
  registry: Registry
): Promise<Response> {
  try {
    const results = await registry.list({
      query: query || undefined,
      limit,
      offset,
    });

    const response: SearchResponse = {
      results: results.map((rxl) => ({
        locator: format(rxl),
        registry: rxl.registry,
        path: rxl.path,
        name: rxl.name,
        type: "", // Type not in RXI anymore, would need to read manifest
        tag: rxl.tag ?? "latest",
      })),
      total: results.length,
    };
    return jsonResponse(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
