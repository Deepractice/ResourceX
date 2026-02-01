import {
  createRegistry,
  handlePublish,
  handleGetResource,
  handleHeadResource,
  handleDeleteResource,
  handleGetContent,
  handleSearch,
  ENDPOINTS,
} from "@resourcexjs/server";

export const runtime = "nodejs";

const registry = createRegistry({
  storagePath: process.env.STORAGE_PATH || "./data",
});

function getLocatorFromPath(pathname: string, endpoint: string): string | null {
  const prefix = `${endpoint}/`;
  if (pathname.startsWith(prefix)) {
    return decodeURIComponent(pathname.slice(prefix.length));
  }
  return null;
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // GET /api/v1/health
  if (pathname === ENDPOINTS.health) {
    return Response.json({ status: "ok" });
  }

  // GET /api/v1/resource/:locator
  const resourceLocator = getLocatorFromPath(pathname, ENDPOINTS.resource);
  if (resourceLocator) {
    return handleGetResource(resourceLocator, registry);
  }

  // GET /api/v1/content/:locator
  const contentLocator = getLocatorFromPath(pathname, ENDPOINTS.content);
  if (contentLocator) {
    return handleGetContent(contentLocator, registry);
  }

  // GET /api/v1/search
  if (pathname === ENDPOINTS.search) {
    const query = url.searchParams.get("q") ?? undefined;
    const limit = parseInt(url.searchParams.get("limit") ?? "100", 10);
    const offset = parseInt(url.searchParams.get("offset") ?? "0", 10);
    return handleSearch(query, limit, offset, registry);
  }

  return Response.json({ error: "Not found" }, { status: 404 });
}

export async function POST(request: Request): Promise<Response> {
  const url = new URL(request.url);

  // POST /api/v1/publish
  if (url.pathname === ENDPOINTS.publish) {
    return handlePublish(request, registry);
  }

  return Response.json({ error: "Not found" }, { status: 404 });
}

export async function HEAD(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const locator = getLocatorFromPath(url.pathname, ENDPOINTS.resource);

  if (locator) {
    return handleHeadResource(locator, registry);
  }

  return new Response(null, { status: 404 });
}

export async function DELETE(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const locator = getLocatorFromPath(url.pathname, ENDPOINTS.resource);

  if (locator) {
    return handleDeleteResource(locator, registry);
  }

  return Response.json({ error: "Not found" }, { status: 404 });
}
