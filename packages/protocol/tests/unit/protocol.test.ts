import { describe, it, expect } from "bun:test";
import {
  ENDPOINTS,
  METHODS,
  CONTENT_TYPES,
  buildResourceUrl,
  buildContentUrl,
  buildPublishUrl,
  buildSearchUrl,
  ERROR_CODES,
  getStatusCode,
  PUBLISH_FIELDS,
} from "../../src/index.js";

describe("protocol", () => {
  describe("ENDPOINTS", () => {
    it("defines publish endpoint", () => {
      expect(ENDPOINTS.publish).toBe("/publish");
    });

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
    it("defines publish methods", () => {
      expect(METHODS.publish.POST).toBeDefined();
    });

    it("defines resource methods", () => {
      expect(METHODS.resource.GET).toBeDefined();
      expect(METHODS.resource.HEAD).toBeDefined();
      expect(METHODS.resource.DELETE).toBeDefined();
    });

    it("defines content methods", () => {
      expect(METHODS.content.GET).toBeDefined();
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

    it("defines formData content type", () => {
      expect(CONTENT_TYPES.formData).toBe("multipart/form-data");
    });
  });

  describe("PUBLISH_FIELDS", () => {
    it("defines locator field", () => {
      expect(PUBLISH_FIELDS.locator).toBe("locator");
    });

    it("defines manifest field", () => {
      expect(PUBLISH_FIELDS.manifest).toBe("manifest");
    });

    it("defines content field", () => {
      expect(PUBLISH_FIELDS.content).toBe("content");
    });
  });

  describe("buildPublishUrl", () => {
    it("builds publish URL", () => {
      const url = buildPublishUrl("https://registry.example.com");
      expect(url).toBe("https://registry.example.com/publish");
    });

    it("handles trailing slash", () => {
      const url = buildPublishUrl("https://registry.example.com/");
      expect(url).toBe("https://registry.example.com/publish");
    });
  });

  describe("buildResourceUrl", () => {
    it("builds resource URL with locator", () => {
      const url = buildResourceUrl("https://registry.example.com", "hello.text@1.0.0");
      expect(url).toBe("https://registry.example.com/resource/hello.text%401.0.0");
    });

    it("encodes locator with domain", () => {
      const url = buildResourceUrl(
        "https://registry.example.com",
        "mycompany.com/hello.text@1.0.0"
      );
      expect(url).toBe("https://registry.example.com/resource/mycompany.com%2Fhello.text%401.0.0");
    });
  });

  describe("buildContentUrl", () => {
    it("builds content URL with locator", () => {
      const url = buildContentUrl("https://registry.example.com", "hello.text@1.0.0");
      expect(url).toBe("https://registry.example.com/content/hello.text%401.0.0");
    });
  });

  describe("buildSearchUrl", () => {
    it("builds search URL without params", () => {
      const url = buildSearchUrl("https://registry.example.com");
      expect(url).toBe("https://registry.example.com/search");
    });

    it("builds search URL with query", () => {
      const url = buildSearchUrl("https://registry.example.com", { q: "hello" });
      expect(url).toBe("https://registry.example.com/search?q=hello");
    });

    it("builds search URL with all params", () => {
      const url = buildSearchUrl("https://registry.example.com", {
        q: "hello",
        limit: 50,
        offset: 10,
      });
      expect(url).toBe("https://registry.example.com/search?q=hello&limit=50&offset=10");
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
