import { basename } from "node:path";
import type { TypeDetector, TypeDetectionResult } from "./types.js";

/**
 * SkillDetector - Detects Agent Skill resources from SKILL.md.
 *
 * Pattern:
 * - Required: SKILL.md file
 * - Optional: references/ directory
 *
 * SKILL.md is content (kept in archive), not metadata.
 */
export class SkillDetector implements TypeDetector {
  readonly name = "skill";

  detect(files: Record<string, Buffer>, source: string): TypeDetectionResult | null {
    if (!files["SKILL.md"]) {
      return null;
    }

    const name = basename(source);
    const content = files["SKILL.md"].toString("utf-8");
    const description = this.extractDescription(content);

    return {
      type: "skill",
      name,
      description,
    };
  }

  /**
   * Extract description from the first markdown heading.
   */
  private extractDescription(content: string): string | undefined {
    const lines = content.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("# ")) {
        return trimmed.substring(2).trim();
      }
    }
    return undefined;
  }
}
