/**
 * RXI - ResourceX Identifier
 *
 * Structured identifier for a resource (pure data object).
 * Docker-style format with optional tag.
 *
 * Format: [registry/][path/]name[:tag]
 *
 * Examples:
 * - hello                    → name=hello, tag=latest (default)
 * - hello:1.0.0             → name=hello, tag=1.0.0
 * - prompts/hello:stable    → path=prompts, name=hello, tag=stable
 * - localhost:3098/hello:1.0.0 → registry=localhost:3098, name=hello, tag=1.0.0
 * - registry.example.com/org/hello:latest → registry=registry.example.com, path=org, name=hello, tag=latest
 */
export interface RXI {
  /** Registry host:port (e.g., "localhost:3098", "registry.example.com") */
  readonly registry?: string;

  /** Path within registry (e.g., "org", "prompts") */
  readonly path?: string;

  /** Resource name */
  readonly name: string;

  /** Tag (mutable pointer). Defaults to "latest" if not specified. */
  readonly tag: string;

  /** Content digest (immutable hash, e.g., "sha256:abc123"). */
  readonly digest?: string;
}
