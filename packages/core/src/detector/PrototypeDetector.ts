import { basename } from "node:path";
import type { TypeDetectionResult, TypeDetector } from "./types.js";

/**
 * PrototypeDetector - Detects prototype resources from prototype.json.
 *
 * Pattern:
 * - Required: prototype.json file
 * - Optional: *.feature files (referenced via @filename)
 */
export class PrototypeDetector implements TypeDetector {
  readonly name = "prototype";

  detect(files: Record<string, Buffer>, source: string): TypeDetectionResult | null {
    if (!files["prototype.json"]) {
      return null;
    }

    const name = basename(source);

    return {
      type: "prototype",
      name,
      description: `Prototype instruction set: ${name}`,
    };
  }
}
