import type { TypeDetector, TypeDetectionResult } from "./types.js";

/**
 * ResourceJsonDetector - Detects resources with an explicit resource.json.
 *
 * Highest-priority detector. When resource.json exists,
 * it takes precedence over all other detectors.
 */
export class ResourceJsonDetector implements TypeDetector {
  readonly name = "resource-json";

  detect(files: Record<string, Buffer>, _source: string): TypeDetectionResult | null {
    const buffer = files["resource.json"];
    if (!buffer) {
      return null;
    }

    let json: Record<string, unknown>;
    try {
      json = JSON.parse(buffer.toString("utf-8"));
    } catch {
      return null;
    }

    if (typeof json.name !== "string" || typeof json.type !== "string") {
      return null;
    }

    return {
      type: json.type as string,
      name: json.name as string,
      tag: (json.tag as string) ?? (json.version as string) ?? undefined,
      description: json.description as string | undefined,
      registry: json.registry as string | undefined,
      path: json.path as string | undefined,
      author: json.author as string | undefined,
      license: json.license as string | undefined,
      keywords: json.keywords as string[] | undefined,
      repository: json.repository as string | undefined,
      excludeFromContent: ["resource.json"],
    };
  }
}
