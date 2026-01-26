-- D1 Database schema for Registry API

CREATE TABLE IF NOT EXISTS resources (
  locator TEXT PRIMARY KEY,
  domain TEXT NOT NULL,
  path TEXT,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  version TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index for search queries
CREATE INDEX IF NOT EXISTS idx_resources_domain ON resources(domain);
CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(type);
CREATE INDEX IF NOT EXISTS idx_resources_created_at ON resources(created_at DESC);
