/**
 * @resourcexjs/core - Type Detection
 */

// Types
export type { TypeDetector, TypeDetectionResult } from "./types.js";

// Chain
export { TypeDetectorChain } from "./TypeDetectorChain.js";

// Built-in detectors
export { ResourceJsonDetector } from "./ResourceJsonDetector.js";
export { SkillDetector } from "./SkillDetector.js";

// Generation
export { generateDefinition } from "./generateDefinition.js";
