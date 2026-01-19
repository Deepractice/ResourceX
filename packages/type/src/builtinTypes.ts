import type { ResourceType, ResourceSerializer, ResourceResolver } from "./types.js";
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
 * Text resolver - returns content as string
 */
const textResolver: ResourceResolver<string> = {
  async resolve(rxr: RXR): Promise<string> {
    const buffer = await rxr.content.file("content");
    return buffer.toString("utf-8");
  },
};

/**
 * Text resource type
 */
export const textType: ResourceType<string> = {
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
 * JSON resolver - returns content as parsed object
 */
const jsonResolver: ResourceResolver<unknown> = {
  async resolve(rxr: RXR): Promise<unknown> {
    const buffer = await rxr.content.file("content");
    return JSON.parse(buffer.toString("utf-8"));
  },
};

/**
 * JSON resource type
 */
export const jsonType: ResourceType<unknown> = {
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
 * Binary resolver - returns content as Buffer
 */
const binaryResolver: ResourceResolver<Buffer> = {
  async resolve(rxr: RXR): Promise<Buffer> {
    return rxr.content.file("content");
  },
};

/**
 * Binary resource type
 */
export const binaryType: ResourceType<Buffer> = {
  name: "binary",
  aliases: ["bin", "blob", "raw"],
  description: "Binary content",
  serializer: binarySerializer,
  resolver: binaryResolver,
};

/**
 * All built-in types
 */
export const builtinTypes: ResourceType[] = [textType, jsonType, binaryType];
