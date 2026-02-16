import { ResourceXError } from "~/errors.js";
import { ResourceJsonDetector } from "./ResourceJsonDetector.js";
import { SkillDetector } from "./SkillDetector.js";
import type { TypeDetectionResult, TypeDetector } from "./types.js";

/**
 * TypeDetectorChain - Chain of type detectors.
 *
 * Follows the same pattern as TypeHandlerChain:
 * - Static create() factory with built-in detectors
 * - Extensible via register()
 * - First match wins
 *
 * Detection order:
 * 1. ResourceJsonDetector (explicit resource.json always wins)
 * 2. SkillDetector (SKILL.md pattern)
 * 3. Custom detectors (registered in order)
 */
export class TypeDetectorChain {
  private readonly detectors: TypeDetector[] = [];

  private constructor() {}

  /**
   * Create a new TypeDetectorChain with built-in detectors.
   */
  static create(): TypeDetectorChain {
    const chain = new TypeDetectorChain();
    chain.detectors.push(new ResourceJsonDetector());
    chain.detectors.push(new SkillDetector());
    return chain;
  }

  /**
   * Register a custom detector.
   * Custom detectors are appended after built-in detectors.
   */
  register(detector: TypeDetector): void {
    this.detectors.push(detector);
  }

  /**
   * Detect type from files.
   *
   * @param files - Raw files from the source
   * @param source - Original source identifier
   * @returns Detection result
   * @throws ResourceXError if no detector matches
   */
  detect(files: Record<string, Buffer>, source: string): TypeDetectionResult {
    for (const detector of this.detectors) {
      const result = detector.detect(files, source);
      if (result !== null) {
        return result;
      }
    }
    throw new ResourceXError(
      `Cannot detect resource type from source: ${source}. ` +
        `No detector matched. ` +
        `Files: [${Object.keys(files).join(", ")}]`
    );
  }
}
