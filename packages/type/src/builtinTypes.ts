import type { BundledType } from "./types.js";

/**
 * Text type - bundled code for sandbox execution.
 * Code format: returns an object with resolve function.
 */
const textCode = `
({
  async resolve(rxr) {
    const pkg = await rxr.archive.extract();
    const buffer = await pkg.file("content");
    return buffer.toString("utf-8");
  }
})
`;

/**
 * Text resource type (pre-bundled)
 */
export const textType: BundledType = {
  name: "text",
  aliases: ["txt", "plaintext"],
  description: "Plain text content",
  code: textCode,
  sandbox: "none",
};

/**
 * JSON type - bundled code for sandbox execution.
 */
const jsonCode = `
({
  async resolve(rxr) {
    const pkg = await rxr.archive.extract();
    const buffer = await pkg.file("content");
    return JSON.parse(buffer.toString("utf-8"));
  }
})
`;

/**
 * JSON resource type (pre-bundled)
 */
export const jsonType: BundledType = {
  name: "json",
  aliases: ["config", "manifest"],
  description: "JSON content",
  code: jsonCode,
  sandbox: "none",
};

/**
 * Binary type - bundled code for sandbox execution.
 */
const binaryCode = `
({
  async resolve(rxr) {
    const pkg = await rxr.archive.extract();
    return pkg.file("content");
  }
})
`;

/**
 * Binary resource type (pre-bundled)
 */
export const binaryType: BundledType = {
  name: "binary",
  aliases: ["bin", "blob", "raw"],
  description: "Binary content",
  code: binaryCode,
  sandbox: "none",
};

/**
 * All built-in types (pre-bundled)
 */
export const builtinTypes: BundledType[] = [textType, jsonType, binaryType];
