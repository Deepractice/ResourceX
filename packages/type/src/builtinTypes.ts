import type {
  ResourceType,
  ResourceSerializer,
  ResourceResolver,
  ResolvedResource,
} from "./types.js";
import type { RXR, RXM } from "@resourcexjs/core";
import { createRXA, parseRXL } from "@resourcexjs/core";

/**
 * Text serializer - stores RXA archive as-is
 */
const textSerializer: ResourceSerializer = {
  async serialize(rxr: RXR): Promise<Buffer> {
    return rxr.archive.buffer();
  },

  async deserialize(data: Buffer, manifest: RXM): Promise<RXR> {
    return {
      locator: parseRXL(manifest.toLocator()),
      manifest,
      archive: await createRXA({ buffer: data }),
    };
  },
};

/**
 * Text resolver - returns structured result with execute function (lazy)
 */
const textResolver: ResourceResolver<void, string> = {
  schema: undefined,
  async resolve(rxr: RXR): Promise<ResolvedResource<void, string>> {
    return {
      resource: rxr,
      schema: undefined,
      execute: async () => {
        const pkg = await rxr.archive.extract();
        const buffer = await pkg.file("content");
        return buffer.toString("utf-8");
      },
    };
  },
};

/**
 * Text resource type
 */
export const textType: ResourceType<void, string> = {
  name: "text",
  aliases: ["txt", "plaintext"],
  description: "Plain text content",
  serializer: textSerializer,
  resolver: textResolver,
};

/**
 * JSON serializer - stores RXA archive as-is
 */
const jsonSerializer: ResourceSerializer = {
  async serialize(rxr: RXR): Promise<Buffer> {
    return rxr.archive.buffer();
  },

  async deserialize(data: Buffer, manifest: RXM): Promise<RXR> {
    return {
      locator: parseRXL(manifest.toLocator()),
      manifest,
      archive: await createRXA({ buffer: data }),
    };
  },
};

/**
 * JSON resolver - returns structured result with execute function (lazy)
 */
const jsonResolver: ResourceResolver<void, unknown> = {
  schema: undefined,
  async resolve(rxr: RXR): Promise<ResolvedResource<void, unknown>> {
    return {
      resource: rxr,
      schema: undefined,
      execute: async () => {
        const pkg = await rxr.archive.extract();
        const buffer = await pkg.file("content");
        return JSON.parse(buffer.toString("utf-8"));
      },
    };
  },
};

/**
 * JSON resource type
 */
export const jsonType: ResourceType<void, unknown> = {
  name: "json",
  aliases: ["config", "manifest"],
  description: "JSON content",
  serializer: jsonSerializer,
  resolver: jsonResolver,
};

/**
 * Binary serializer - stores RXA archive as-is
 */
const binarySerializer: ResourceSerializer = {
  async serialize(rxr: RXR): Promise<Buffer> {
    return rxr.archive.buffer();
  },

  async deserialize(data: Buffer, manifest: RXM): Promise<RXR> {
    return {
      locator: parseRXL(manifest.toLocator()),
      manifest,
      archive: await createRXA({ buffer: data }),
    };
  },
};

/**
 * Binary resolver - returns structured result with execute function (lazy)
 */
const binaryResolver: ResourceResolver<void, Buffer> = {
  schema: undefined,
  async resolve(rxr: RXR): Promise<ResolvedResource<void, Buffer>> {
    return {
      resource: rxr,
      schema: undefined,
      execute: async () => {
        const pkg = await rxr.archive.extract();
        return pkg.file("content");
      },
    };
  },
};

/**
 * Binary resource type
 */
export const binaryType: ResourceType<void, Buffer> = {
  name: "binary",
  aliases: ["bin", "blob", "raw"],
  description: "Binary content",
  serializer: binarySerializer,
  resolver: binaryResolver,
};

/**
 * All built-in types
 */
export const builtinTypes: ResourceType<void, unknown>[] = [textType, jsonType, binaryType];
