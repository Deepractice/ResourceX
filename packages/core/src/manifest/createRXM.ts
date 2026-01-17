import type { RXM, ManifestData } from "./types.js";
import { ManifestError } from "~/errors.js";

class RXMImpl implements RXM {
  readonly domain: string;
  readonly path?: string;
  readonly name: string;
  readonly type: string;
  readonly version: string;
  readonly resolver?: string;

  constructor(data: {
    domain: string;
    path?: string;
    name: string;
    type: string;
    version: string;
    resolver?: string;
  }) {
    this.domain = data.domain;
    this.path = data.path;
    this.name = data.name;
    this.type = data.type;
    this.version = data.version;
    this.resolver = data.resolver;
  }

  toLocator(): string {
    let result = this.domain + "/";
    if (this.path) {
      result += this.path + "/";
    }
    result += this.name;
    result += "." + this.type;
    result += "@" + this.version;
    return result;
  }

  toJSON(): ManifestData {
    const json: ManifestData = {
      domain: this.domain,
      name: this.name,
      type: this.type,
      version: this.version,
    };
    if (this.path !== undefined) {
      json.path = this.path;
    }
    if (this.resolver !== undefined) {
      json.resolver = this.resolver;
    }
    return json;
  }
}

/**
 * Create a manifest from data object.
 */
export function createRXM(data: ManifestData): RXM {
  if (!data.domain) {
    throw new ManifestError("domain is required");
  }
  if (!data.name) {
    throw new ManifestError("name is required");
  }
  if (!data.type) {
    throw new ManifestError("type is required");
  }
  if (!data.version) {
    throw new ManifestError("version is required");
  }

  return new RXMImpl({
    domain: data.domain,
    path: data.path,
    name: data.name,
    type: data.type,
    version: data.version,
    resolver: data.resolver,
  });
}
