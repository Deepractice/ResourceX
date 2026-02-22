/**
 * RXL - ResourceX Locator
 *
 * Unified locator type for any resource reference.
 * An RXL can be:
 * - An RXI identifier string (e.g., "hello:1.0.0", "deepractice/skill-creator:0.1.0")
 * - A local directory path (e.g., "/home/user/skills/my-skill")
 * - A URL (e.g., "https://github.com/org/repo/tree/main/skills/my-skill")
 *
 * RXL is the input type for `ingest()` — the unified entry point that
 * accepts any form of resource reference and resolves it.
 */
export type RXL = string;
