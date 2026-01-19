import type { ResourceType, ResourceSerializer, ResourceResolver } from "./types.js";
import type { RXR, RXM } from "@resourcexjs/core";
import { createRXC, parseRXL } from "@resourcexjs/core";

/**
 * Text serializer - stores content as UTF-8 text
 */
const textSerializer: ResourceSerializer = {
  async serialize(rxr: RXR): Promise<Buffer> {
    const text = await rxr.content.text();
    return Buffer.from(text, "utf-8");
  },

  async deserialize(data: Buffer, manifest: RXM): Promise<RXR> {
    const text = data.toString("utf-8");
    return {
      locator: parseRXL(manifest.toLocator()),
      manifest,
      content: createRXC(text),
    };
  },
};

/**
 * Text resolver - returns content as string
 */
const textResolver: ResourceResolver<string> = {
  async resolve(rxr: RXR): Promise<string> {
    return rxr.content.text();
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
 * JSON serializer - stores content as JSON string
 */
const jsonSerializer: ResourceSerializer = {
  async serialize(rxr: RXR): Promise<Buffer> {
    const json = await rxr.content.json();
    return Buffer.from(JSON.stringify(json, null, 2), "utf-8");
  },

  async deserialize(data: Buffer, manifest: RXM): Promise<RXR> {
    const text = data.toString("utf-8");
    return {
      locator: parseRXL(manifest.toLocator()),
      manifest,
      content: createRXC(text),
    };
  },
};

/**
 * JSON resolver - returns content as parsed object
 */
const jsonResolver: ResourceResolver<unknown> = {
  async resolve(rxr: RXR): Promise<unknown> {
    return rxr.content.json();
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
 * Binary serializer - stores content as raw bytes
 */
const binarySerializer: ResourceSerializer = {
  async serialize(rxr: RXR): Promise<Buffer> {
    return rxr.content.buffer();
  },

  async deserialize(data: Buffer, manifest: RXM): Promise<RXR> {
    return {
      locator: parseRXL(manifest.toLocator()),
      manifest,
      content: createRXC(data),
    };
  },
};

/**
 * Binary resolver - returns content as Buffer
 */
const binaryResolver: ResourceResolver<Buffer> = {
  async resolve(rxr: RXR): Promise<Buffer> {
    return rxr.content.buffer();
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
