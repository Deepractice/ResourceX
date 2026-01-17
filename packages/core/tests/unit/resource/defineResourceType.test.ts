import { describe, it, expect, beforeEach } from "bun:test";
import {
  defineResourceType,
  getResourceType,
  clearResourceTypes,
  ResourceTypeError,
} from "../../../src/index.js";
import type {
  ResourceType,
  ResourceSerializer,
  ResourceResolver,
  RXR,
  RXM,
} from "../../../src/index.js";

// Mock serializer
const mockSerializer: ResourceSerializer = {
  serialize: async (rxr: RXR) => Buffer.from(JSON.stringify(rxr.manifest.toJSON())),
  deserialize: async (_data: Buffer, _manifest: RXM) => ({}) as RXR,
};

// Mock resolver
const mockResolver: ResourceResolver<string> = {
  resolve: async (rxr: RXR) => `resolved: ${rxr.manifest.name}`,
};

describe("defineResourceType", () => {
  beforeEach(() => {
    clearResourceTypes();
  });

  describe("define", () => {
    it("registers a new resource type", () => {
      const type = defineResourceType({
        name: "prompt",
        description: "Prompt template",
        serializer: mockSerializer,
        resolver: mockResolver,
      });

      expect(type.name).toBe("prompt");
      expect(type.description).toBe("Prompt template");
    });

    it("returns the registered type", () => {
      const type = defineResourceType({
        name: "tool",
        description: "Executable tool",
        serializer: mockSerializer,
        resolver: mockResolver,
      });

      expect(type.serializer).toBe(mockSerializer);
      expect(type.resolver).toBe(mockResolver);
    });

    it("throws error for duplicate registration", () => {
      defineResourceType({
        name: "prompt",
        description: "First prompt",
        serializer: mockSerializer,
        resolver: mockResolver,
      });

      expect(() =>
        defineResourceType({
          name: "prompt",
          description: "Second prompt",
          serializer: mockSerializer,
          resolver: mockResolver,
        })
      ).toThrow(ResourceTypeError);

      expect(() =>
        defineResourceType({
          name: "prompt",
          description: "Second prompt",
          serializer: mockSerializer,
          resolver: mockResolver,
        })
      ).toThrow("already registered");
    });
  });

  describe("getResourceType", () => {
    it("returns registered type", () => {
      defineResourceType({
        name: "prompt",
        description: "Prompt template",
        serializer: mockSerializer,
        resolver: mockResolver,
      });

      const type = getResourceType("prompt");

      expect(type).toBeDefined();
      expect(type?.name).toBe("prompt");
      expect(type?.description).toBe("Prompt template");
    });

    it("returns undefined for unregistered type", () => {
      const type = getResourceType("unknown");

      expect(type).toBeUndefined();
    });
  });

  describe("clearResourceTypes", () => {
    it("clears all registered types", () => {
      defineResourceType({
        name: "prompt",
        description: "Prompt",
        serializer: mockSerializer,
        resolver: mockResolver,
      });

      defineResourceType({
        name: "tool",
        description: "Tool",
        serializer: mockSerializer,
        resolver: mockResolver,
      });

      clearResourceTypes();

      expect(getResourceType("prompt")).toBeUndefined();
      expect(getResourceType("tool")).toBeUndefined();
    });
  });
});
