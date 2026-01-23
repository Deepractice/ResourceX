/**
 * Cloudflare Worker for deepractice.dev well-known endpoints
 */

const WELL_KNOWN_RESOURCEX = {
  version: "1.0",
  registries: ["git@github.com:Deepractice/Registry.git"],
};

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Handle /.well-known/resourcex
    if (url.pathname === "/.well-known/resourcex") {
      return new Response(JSON.stringify(WELL_KNOWN_RESOURCEX, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // 404 for other paths
    return new Response("Not Found", { status: 404 });
  },
};
