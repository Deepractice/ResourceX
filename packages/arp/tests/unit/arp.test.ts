import { describe, expect, it } from "bun:test";
import {
  ARP,
  binarySemantic,
  createARP,
  fileTransport,
  httpsTransport,
  ParseError,
  SemanticError,
  TransportError,
  textSemantic,
} from "../../src/index.js";

describe("createARP", () => {
  it("creates an ARP instance", () => {
    const arp = createARP();
    expect(arp).toBeInstanceOf(ARP);
  });

  it("creates an ARP instance with custom handlers", () => {
    const arp = createARP({
      transports: [fileTransport],
      semantics: [textSemantic],
    });
    expect(arp).toBeInstanceOf(ARP);
  });
});

describe("ARP.parse", () => {
  describe("valid URLs", () => {
    it("parses standard ARP URL", () => {
      const arp = createARP({
        transports: [httpsTransport],
        semantics: [textSemantic],
      });

      const arl = arp.parse("arp:text:https://example.com/file.txt");

      expect(arl.semantic).toBe("text");
      expect(arl.transport).toBe("https");
      expect(arl.location).toBe("example.com/file.txt");
    });

    it("parses URL with file transport", () => {
      const arp = createARP({
        transports: [fileTransport],
        semantics: [textSemantic],
      });

      const arl = arp.parse("arp:text:file://./config/settings.json");

      expect(arl.semantic).toBe("text");
      expect(arl.transport).toBe("file");
      expect(arl.location).toBe("./config/settings.json");
    });

    it("parses URL with binary semantic", () => {
      const arp = createARP({
        transports: [fileTransport],
        semantics: [binarySemantic],
      });

      const arl = arp.parse("arp:binary:file://./data/image.png");

      expect(arl.semantic).toBe("binary");
      expect(arl.transport).toBe("file");
      expect(arl.location).toBe("./data/image.png");
    });
  });

  describe("invalid URLs", () => {
    it("throws ParseError for missing arp: prefix", () => {
      const arp = createARP({
        transports: [fileTransport],
        semantics: [textSemantic],
      });

      expect(() => arp.parse("text:file://./test.txt")).toThrow(ParseError);
      expect(() => arp.parse("text:file://./test.txt")).toThrow('must start with "arp:"');
    });

    it("throws ParseError for missing :// separator", () => {
      const arp = createARP({
        transports: [fileTransport],
        semantics: [textSemantic],
      });

      expect(() => arp.parse("arp:text:file:./test.txt")).toThrow(ParseError);
      expect(() => arp.parse("arp:text:file:./test.txt")).toThrow('missing "://"');
    });

    it("throws ParseError for missing transport", () => {
      const arp = createARP({
        transports: [fileTransport],
        semantics: [textSemantic],
      });

      expect(() => arp.parse("arp:text:://./test.txt")).toThrow(ParseError);
      expect(() => arp.parse("arp:text:://./test.txt")).toThrow("transport type cannot be empty");
    });

    it("throws ParseError for missing semantic", () => {
      const arp = createARP({
        transports: [fileTransport],
        semantics: [textSemantic],
      });

      expect(() => arp.parse("arp::file://./test.txt")).toThrow(ParseError);
      expect(() => arp.parse("arp::file://./test.txt")).toThrow("semantic type cannot be empty");
    });

    it("throws ParseError for missing location", () => {
      const arp = createARP({
        transports: [fileTransport],
        semantics: [textSemantic],
      });

      expect(() => arp.parse("arp:text:file://")).toThrow(ParseError);
      expect(() => arp.parse("arp:text:file://")).toThrow("location cannot be empty");
    });

    it("throws TransportError for unsupported transport", () => {
      const arp = createARP({
        transports: [fileTransport],
        semantics: [textSemantic],
      });

      expect(() => arp.parse("arp:text:s3://bucket/key")).toThrow(TransportError);
      expect(() => arp.parse("arp:text:s3://bucket/key")).toThrow("Unsupported transport type: s3");
    });

    it("throws SemanticError for unsupported semantic", () => {
      const arp = createARP({
        transports: [fileTransport],
        semantics: [textSemantic],
      });

      expect(() => arp.parse("arp:json:file://./test.json")).toThrow(SemanticError);
      expect(() => arp.parse("arp:json:file://./test.json")).toThrow(
        "Unsupported semantic type: json"
      );
    });

    it("includes original URL in ParseError", () => {
      const arp = createARP({
        transports: [fileTransport],
        semantics: [textSemantic],
      });

      const url = "invalid-url";
      try {
        arp.parse(url);
      } catch (error) {
        expect(error).toBeInstanceOf(ParseError);
        expect((error as ParseError).url).toBe(url);
      }
    });
  });
});

describe("ARL.toString", () => {
  it("returns the ARP URL string", () => {
    const arp = createARP({
      transports: [fileTransport],
      semantics: [textSemantic],
    });

    const arl = arp.parse("arp:text:file://./path/to/file.txt");

    expect(arl.toString()).toBe("arp:text:file://./path/to/file.txt");
  });
});

describe("ARP.registerTransport", () => {
  it("registers a custom transport handler", () => {
    const arp = createARP();

    // Custom transport handler
    const customTransport = {
      name: "custom",
      capabilities: { read: true, write: false, delete: false, list: false },
      read: async () => Buffer.from("custom"),
    };

    // Before registering, should throw
    expect(() => arp.parse("arp:text:custom://./test.txt")).toThrow(TransportError);

    // Register transport
    arp.registerTransport(customTransport);

    // After registering, should work
    const arl = arp.parse("arp:text:custom://./test.txt");
    expect(arl.transport).toBe("custom");
  });
});

describe("ARP.registerSemantic", () => {
  it("registers a custom semantic handler", () => {
    const arp = createARP();

    // Custom semantic handler
    const customSemantic = {
      name: "custom",
      resolve: async () => ({ content: "custom", meta: {} }),
      deposit: async () => {},
    };

    // Before registering, should throw
    expect(() => arp.parse("arp:custom:file://./test.txt")).toThrow(SemanticError);

    // Register semantic
    arp.registerSemantic(customSemantic);

    // After registering, should work
    const arl = arp.parse("arp:custom:file://./test.txt");
    expect(arl.semantic).toBe("custom");
  });
});
