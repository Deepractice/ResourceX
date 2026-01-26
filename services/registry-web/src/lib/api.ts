const API_BASE = process.env.REGISTRY_API_URL || "/api";

export interface ResourceManifest {
  domain: string;
  path: string | null;
  name: string;
  type: string;
  version: string;
}

export async function searchResources(query?: string, limit = 100, offset = 0): Promise<string[]> {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  params.set("limit", String(limit));
  params.set("offset", String(offset));

  const res = await fetch(`${API_BASE}/v1/search?${params}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`Search failed: ${res.status}`);
  }

  return res.json();
}

export async function getResource(locator: string): Promise<ResourceManifest> {
  const res = await fetch(`${API_BASE}/v1/resource?locator=${encodeURIComponent(locator)}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error("Resource not found");
    }
    throw new Error(`Failed to get resource: ${res.status}`);
  }

  return res.json();
}

export async function resourceExists(locator: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/v1/resource?locator=${encodeURIComponent(locator)}`, {
    method: "HEAD",
  });
  return res.ok;
}

export function getContentUrl(locator: string): string {
  return `${API_BASE}/v1/content?locator=${encodeURIComponent(locator)}`;
}

export function parseLocator(locator: string): {
  domain: string;
  path?: string;
  name: string;
  type: string;
  version: string;
} {
  // Format: [domain/][path/]name.type@version
  const atIndex = locator.lastIndexOf("@");
  const version = locator.slice(atIndex + 1);
  const rest = locator.slice(0, atIndex);

  const dotIndex = rest.lastIndexOf(".");
  const type = rest.slice(dotIndex + 1);
  const beforeType = rest.slice(0, dotIndex);

  const parts = beforeType.split("/");

  if (parts.length === 1) {
    return { domain: "localhost", name: parts[0], type, version };
  }

  if (parts.length === 2) {
    return { domain: parts[0], name: parts[1], type, version };
  }

  return {
    domain: parts[0],
    path: parts.slice(1, -1).join("/"),
    name: parts[parts.length - 1],
    type,
    version,
  };
}
