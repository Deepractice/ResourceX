import type {
  ResourceType,
  ResourceSerializer,
  ResourceResolver,
  ResolvedResource,
} from "./types.js";
import type { RXR, RXM } from "@resourcexjs/core";
import { createRXC, parseRXL } from "@resourcexjs/core";

/**
 * Text serializer - stores RXC archive as-is
 */
const textSerializer: ResourceSerializer = {
  async serialize(rxr: RXR): Promise<Buffer> {
    return rxr.content.buffer();
  },

  async deserialize(data: Buffer, manifest: RXM): Promise<RXR> {
    return {
      locator: parseRXL(manifest.toLocator()),
      manifest,
      content: await createRXC({ archive: data }),
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
      schema: undefined,
      execute: async () => {
        const buffer = await rxr.content.file("content");
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
 * JSON serializer - stores RXC archive as-is
 */
const jsonSerializer: ResourceSerializer = {
  async serialize(rxr: RXR): Promise<Buffer> {
    return rxr.content.buffer();
  },

  async deserialize(data: Buffer, manifest: RXM): Promise<RXR> {
    return {
      locator: parseRXL(manifest.toLocator()),
      manifest,
      content: await createRXC({ archive: data }),
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
      schema: undefined,
      execute: async () => {
        const buffer = await rxr.content.file("content");
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
 * Binary serializer - stores RXC archive as-is
 */
const binarySerializer: ResourceSerializer = {
  async serialize(rxr: RXR): Promise<Buffer> {
    return rxr.content.buffer();
  },

  async deserialize(data: Buffer, manifest: RXM): Promise<RXR> {
    return {
      locator: parseRXL(manifest.toLocator()),
      manifest,
      content: await createRXC({ archive: data }),
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
      schema: undefined,
      execute: async () => {
        return rxr.content.file("content");
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
