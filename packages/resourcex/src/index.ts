/**
 * resourcexjs - AI Resource Management Protocol
 *
 * ResourceX is like npm for AI resources (prompts, tools, agents, etc.)
 *
 * @example
 * ```typescript
 * import { createResourceX } from "resourcexjs";
 *
 * const rx = createResourceX({
 *   resourceDirs: ["./resources"],
 * });
 *
 * // Access resources by name
 * const resource = await rx.resolve("resourcex://my-prompt");
 * ```
 *
 * For low-level ARP protocol access:
 * ```typescript
 * import { createARP } from "resourcexjs/arp";
 * ```
 *
 * @packageDocumentation
 */

// TODO: Implement ResourceX protocol
// - createResourceX factory
// - resource.json manifest support
// - registry system
// - resourcex:// URL scheme

declare const __VERSION__: string | undefined;
export const VERSION: string = typeof __VERSION__ !== "undefined" ? __VERSION__ : "0.0.0-dev";
