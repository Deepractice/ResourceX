/**
 * @resourcexjs/core - Type Detection
 */

// Generation
export { generateDefinition } from "./generateDefinition.js";
// Built-in detectors
export { PrototypeDetector } from "./PrototypeDetector.js";
export { ResourceJsonDetector } from "./ResourceJsonDetector.js";
export { SkillDetector } from "./SkillDetector.js";
// Chain
export { TypeDetectorChain } from "./TypeDetectorChain.js";
// Types
export type { TypeDetectionResult, TypeDetector } from "./types.js";
