/**
 * ARP URL Parser
 * Format: arp:{semantic}:{transport}://{location}
 */

import { ParseError } from "./errors.js";

export interface ParsedARP {
  semantic: string;
  transport: string;
  location: string;
}

/**
 * Parse an ARP URL into its components
 *
 * @example
 * parseARP("arp:text:https://example.com/file.txt")
 * // { semantic: "text", transport: "https", location: "example.com/file.txt" }
 */
export function parseARP(url: string): ParsedARP {
  // 1. Check protocol prefix
  if (!url.startsWith("arp:")) {
    throw new ParseError(`Invalid ARP URL: must start with "arp:"`, url);
  }

  const content = url.substring(4); // Remove "arp:"

  // 2. Find :// separator
  const separatorIndex = content.indexOf("://");
  if (separatorIndex === -1) {
    throw new ParseError(`Invalid ARP URL: missing "://"`, url);
  }

  const typePart = content.substring(0, separatorIndex);
  const location = content.substring(separatorIndex + 3);

  // 3. Split type part by :
  const colonIndex = typePart.indexOf(":");
  if (colonIndex === -1) {
    throw new ParseError(`Invalid ARP URL: must have exactly 2 types (semantic:transport)`, url);
  }

  const semantic = typePart.substring(0, colonIndex);
  const transport = typePart.substring(colonIndex + 1);

  // 4. Validate non-empty
  if (!semantic) {
    throw new ParseError(`Invalid ARP URL: semantic type cannot be empty`, url);
  }
  if (!transport) {
    throw new ParseError(`Invalid ARP URL: transport type cannot be empty`, url);
  }
  if (!location) {
    throw new ParseError(`Invalid ARP URL: location cannot be empty`, url);
  }

  return { semantic, transport, location };
}
