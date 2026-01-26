# Registry API

ResourceX Registry HTTP API service, deployed on Cloudflare Workers.

## Deployment

- **Production URL**: `https://resourcex-registry-api.jshansince93.workers.dev`
- **Custom Domain**: `https://registry.deepractice.dev` (pending configuration)
- **Infrastructure**:
  - D1 Database: `resourcex-registry`
  - R2 Bucket: `resourcex-registry-archives`

## Tech Stack

- **Runtime**: Cloudflare Workers
- **Framework**: Hono
- **ORM**: Drizzle ORM (database-agnostic)
- **Database**: D1 (SQLite)
- **Storage**: R2 (S3-compatible)

## API Reference

Base path: `/v1`

### Get Resource Manifest

```
GET /v1/resource?locator={locator}
```

Returns the manifest for a resource.

**Response** `200 OK`:

```json
{
  "domain": "deepractice.dev",
  "path": "sean",
  "name": "assistant",
  "type": "prompt",
  "version": "1.0.0"
}
```

**Errors**:

- `400` - locator is required
- `404` - not found

### Check Resource Existence

```
HEAD /v1/resource?locator={locator}
```

Check if a resource exists without fetching the manifest.

**Response**:

- `200` - exists
- `400` - locator is required
- `404` - not found

### Get Resource Archive

```
GET /v1/content?locator={locator}
```

Download the resource archive (tar.gz).

**Response** `200 OK`:

- Content-Type: `application/gzip`
- Body: tar.gz archive binary

**Errors**:

- `400` - locator is required
- `404` - not found

### Search Resources

```
GET /v1/search?q={query}&limit={limit}&offset={offset}
```

Search for resources by locator pattern.

**Parameters**:

- `q` (optional) - Search query, matches against locator substring
- `limit` (optional, default: 100) - Maximum results to return
- `offset` (optional, default: 0) - Skip first N results

**Response** `200 OK`:

```json
["deepractice.dev/sean/assistant.prompt@1.0.0", "localhost/hello.text@1.0.0"]
```

### Publish Resource

```
POST /v1/publish
Content-Type: multipart/form-data
```

Publish a new resource or update an existing one.

**Form Fields**:

- `manifest` (required) - JSON string of the manifest
- `archive` (required) - tar.gz file

**Manifest Format**:

```json
{
  "domain": "deepractice.dev",
  "path": "sean",
  "name": "assistant",
  "type": "prompt",
  "version": "1.0.0"
}
```

**Response** `201 Created`:

```json
{
  "locator": "deepractice.dev/sean/assistant.prompt@1.0.0"
}
```

**Errors**:

- `400` - manifest is required / archive is required / invalid manifest JSON

### Delete Resource

```
DELETE /v1/resource?locator={locator}
```

Delete a resource and its archive.

**Response**:

- `204` - deleted successfully
- `400` - locator is required
- `404` - not found

## Locator Format

```
[domain/][path/]name.type@version
```

Examples:

- `hello.text@1.0.0` → localhost resource
- `deepractice.dev/assistant.prompt@1.0.0` → domain resource
- `deepractice.dev/sean/assistant.prompt@1.0.0` → domain + path resource

## Development

```bash
# Install dependencies
bun install

# Apply local migrations
bun run db:migrate:local

# Start local dev server
bun run dev

# Type check
bun run typecheck

# Deploy to production
bun run deploy
```

## Database Migrations

Uses Drizzle ORM for database-agnostic schema management.

```bash
# Generate new migration after schema changes
bun run db:generate

# Apply migrations to local D1
bun run db:migrate:local

# Apply migrations to production D1
bun run db:migrate:remote
```

### Schema

Schema defined in `src/db/schema.ts`:

```typescript
export const resources = sqliteTable("resources", {
  locator: text("locator").primaryKey(),
  domain: text("domain").notNull(),
  path: text("path"),
  name: text("name").notNull(),
  type: text("type").notNull(),
  version: text("version").notNull(),
  createdAt: text("created_at").notNull(),
});
```

Migrations stored in `drizzle/` directory.

## Storage Architecture

**D1 (Manifest Index)**:

- Stores resource metadata for fast lookup and search
- Indexed by locator, domain, type, and created_at
- Managed via Drizzle ORM migrations

**R2 (Archive Storage)**:

- Key format: `{locator}/archive.tar.gz`
- Stores the actual resource content as tar.gz archives

## Testing

BDD tests located in `bdd/features/server/registry-api.feature`.

```bash
# Run registry API tests (auto-starts local server)
cd bdd && bun run test-server.ts
```
