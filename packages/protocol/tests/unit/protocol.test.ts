import { describe, it, expect } from "bun:test";
import {
  ENDPOINTS,
  METHODS,
  CONTENT_TYPES,
  buildUrl,
  ERROR_CODES,
  ERROR_STATUS,
  getStatusCode,
} from "../../src/index.js";

describe("protocol", () => {
  describe("ENDPOINTS", () => {
    it("defines resource endpoint", () => {
      expect(ENDPOINTS.resource).toBe("/resource");
    });

    it("defines content endpoint", () => {
      expect(ENDPOINTS.content).toBe("/content");
    });

    it("defines search endpoint", () => {
      expect(ENDPOINTS.search).toBe("/search");
    });
  });

  describe("METHODS", () => {
    it("defines resource methods", () => {
      expect(METHODS.resource.GET).toBeDefined();
      expect(METHODS.resource.POST).toBeDefined();
      expect(METHODS.resource.HEAD).toBeDefined();
      expect(METHODS.resource.DELETE).toBeDefined();
    });

    it("defines content methods", () => {
      expect(METHODS.content.GET).toBeDefined();
      expect(METHODS.content.POST).toBeDefined();
    });

    it("defines search methods", () => {
      expect(METHODS.search.GET).toBeDefined();
    });
  });

  describe("CONTENT_TYPES", () => {
    it("defines json content type", () => {
      expect(CONTENT_TYPES.json).toBe("application/json");
    });

    it("defines binary content type", () => {
      expect(CONTENT_TYPES.binary).toBe("application/octet-stream");
    });
  });

  describe("buildUrl", () => {
    it("builds resource URL without params", () => {
      const url = buildUrl("https://registry.example.com", "resource");
      expect(url).toBe("https://registry.example.com/resource");
    });

    it("builds resource URL with locator param", () => {
      const url = buildUrl("https://registry.example.com", "resource", {
        locator: "hello.text@1.0.0",
      });
      expect(url).toBe("https://registry.example.com/resource?locator=hello.text%401.0.0");
    });

    it("builds content URL with locator param", () => {
      const url = buildUrl("https://registry.example.com", "content", {
        locator: "mycompany.com/hello.text@1.0.0",
      });
      expect(url).toBe(
        "https://registry.example.com/content?locator=mycompany.com%2Fhello.text%401.0.0"
      );
    });

    it("builds search URL with query param", () => {
      const url = buildUrl("https://registry.example.com", "search", {
        q: "hello",
      });
      expect(url).toBe("https://registry.example.com/search?q=hello");
    });

    it("handles trailing slash in base URL", () => {
      const url = buildUrl("https://registry.example.com/", "resource");
      expect(url).toBe("https://registry.example.com/resource");
    });
  });

  describe("ERROR_CODES", () => {
    it("defines validation error codes", () => {
      expect(ERROR_CODES.LOCATOR_REQUIRED).toBe("LOCATOR_REQUIRED");
      expect(ERROR_CODES.MANIFEST_REQUIRED).toBe("MANIFEST_REQUIRED");
      expect(ERROR_CODES.INVALID_LOCATOR).toBe("INVALID_LOCATOR");
    });

    it("defines not found error codes", () => {
      expect(ERROR_CODES.RESOURCE_NOT_FOUND).toBe("RESOURCE_NOT_FOUND");
      expect(ERROR_CODES.CONTENT_NOT_FOUND).toBe("CONTENT_NOT_FOUND");
    });

    it("defines conflict error codes", () => {
      expect(ERROR_CODES.RESOURCE_EXISTS).toBe("RESOURCE_EXISTS");
      expect(ERROR_CODES.VERSION_EXISTS).toBe("VERSION_EXISTS");
    });
  });

  describe("getStatusCode", () => {
    it("returns 400 for validation errors", () => {
      expect(getStatusCode(ERROR_CODES.LOCATOR_REQUIRED)).toBe(400);
      expect(getStatusCode(ERROR_CODES.INVALID_MANIFEST)).toBe(400);
    });

    it("returns 404 for not found errors", () => {
      expect(getStatusCode(ERROR_CODES.RESOURCE_NOT_FOUND)).toBe(404);
      expect(getStatusCode(ERROR_CODES.CONTENT_NOT_FOUND)).toBe(404);
    });

    it("returns 409 for conflict errors", () => {
      expect(getStatusCode(ERROR_CODES.RESOURCE_EXISTS)).toBe(409);
      expect(getStatusCode(ERROR_CODES.VERSION_EXISTS)).toBe(409);
    });

    it("returns 500 for server errors", () => {
      expect(getStatusCode(ERROR_CODES.INTERNAL_ERROR)).toBe(500);
      expect(getStatusCode(ERROR_CODES.STORAGE_ERROR)).toBe(500);
    });
  });
});
