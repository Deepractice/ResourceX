/**
 * Resource Resolution
 * End-to-end flow: URL parse → Transport fetch → Semantic parse
 */

import { parseARP } from "./parser.js";
import { getTransportHandler } from "./transport/index.js";
import { getSemanticHandler, type Resource, type ParseContext } from "./semantic/index.js";

/**
 * Resolve an ARP URL to a resource
 *
 * @example
 * const resource = await resolve("arp:text:https://example.com/file.txt");
 * // { type: "text", content: "...", meta: { ... } }
 */
export async function resolve(url: string): Promise<Resource> {
  const fetchedAt = new Date();

  // 1. Parse URL
  const parsed = parseARP(url);

  // 2. Get handlers
  const transportHandler = getTransportHandler(parsed.transport);
  const semanticHandler = getSemanticHandler(parsed.semantic);

  // 3. Fetch raw content
  const content = await transportHandler.fetch(parsed.location);

  // 4. Build context for semantic handler
  const context: ParseContext = {
    url,
    semantic: parsed.semantic,
    transport: parsed.transport,
    location: parsed.location,
    fetchedAt,
  };

  // 5. Parse and return
  return semanticHandler.parse(content, context);
}
