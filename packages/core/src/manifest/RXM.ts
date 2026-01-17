import { ManifestError } from "../errors.js";

/**
 * Raw manifest data (input to RXM.create)
 */
export interface ManifestData {
  domain?: string;
  path?: string;
  name?: string;
  type?: string;
  version?: string;
  resolver?: string;
}

/**
 * RXM - ResourceX Manifest
 *
 * Represents a resource manifest.
 *
 * @example
 * ```typescript
 * const rxm = RXM.create({
 *   domain: "deepractice.ai",
 *   name: "assistant",
 *   type: "prompt",
 *   version: "1.0.0",
 * });
 * rxm.toLocator();  // "deepractice.ai/assistant.prompt@1.0.0"
 * ```
 */
export class RXM {
  /** Resource domain (required for validation) */
  readonly domain: string;

  /** Resource path within domain */
  readonly path?: string;

  /** Resource name */
  readonly name: string;

  /** Resource type (e.g., "prompt", "tool", "agent") */
  readonly type: string;

  /** Resource version (semver) */
  readonly version: string;

  /** Resolver for this type (optional, defaults based on type) */
  readonly resolver?: string;

  private constructor(data: {
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

  /**
   * Create a manifest from data object.
   *
   * @param data - The manifest data
   * @returns RXM instance
   * @throws ManifestError if required fields are missing
   */
  static create(data: ManifestData): RXM {
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

    return new RXM({
      domain: data.domain,
      path: data.path,
      name: data.name,
      type: data.type,
      version: data.version,
      resolver: data.resolver,
    });
  }

  /** Convert to locator string */
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

  /** Convert to JSON object */
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
