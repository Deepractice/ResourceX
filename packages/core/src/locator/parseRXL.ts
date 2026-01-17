import type { RXL } from "./types.js";

class RXLImpl implements RXL {
  readonly domain?: string;
  readonly path?: string;
  readonly name: string;
  readonly type?: string;
  readonly version?: string;

  constructor(parts: {
    domain?: string;
    path?: string;
    name: string;
    type?: string;
    version?: string;
  }) {
    this.domain = parts.domain;
    this.path = parts.path;
    this.name = parts.name;
    this.type = parts.type;
    this.version = parts.version;
  }

  toString(): string {
    let result = "";
    if (this.domain) {
      result += this.domain + "/";
      if (this.path) {
        result += this.path + "/";
      }
    }
    result += this.name;
    if (this.type) {
      result += "." + this.type;
    }
    if (this.version) {
      result += "@" + this.version;
    }
    return result;
  }
}

function isDomain(str: string): boolean {
  if (str === "localhost") return true;
  return str.includes(".");
}

/**
 * Parse a resource locator string into RXL object.
 *
 * Format: [domain/path/]name[.type][@version]
 */
export function parseRXL(locator: string): RXL {
  let remaining = locator;
  let version: string | undefined;
  let type: string | undefined;
  let domain: string | undefined;
  let path: string | undefined;
  let name: string;

  // 1. Extract version (after @)
  const atIndex = remaining.indexOf("@");
  if (atIndex !== -1) {
    version = remaining.slice(atIndex + 1);
    remaining = remaining.slice(0, atIndex);
  }

  // 2. Split by / to get segments
  const segments = remaining.split("/");

  // 3. Handle domain and path
  if (segments.length > 1 && isDomain(segments[0])) {
    domain = segments[0];
    const lastSegment = segments[segments.length - 1];
    if (segments.length > 2) {
      path = segments.slice(1, -1).join("/");
    }
    remaining = lastSegment;
  } else {
    remaining = segments.join("/");
  }

  // 4. Extract type (after last .)
  const dotIndex = remaining.lastIndexOf(".");
  if (dotIndex !== -1) {
    type = remaining.slice(dotIndex + 1);
    name = remaining.slice(0, dotIndex);
  } else {
    name = remaining;
  }

  return new RXLImpl({ domain, path, name, type, version });
}
