import { sqliteTable, text, index } from "drizzle-orm/sqlite-core";

export const resources = sqliteTable(
  "resources",
  {
    locator: text("locator").primaryKey(),
    domain: text("domain").notNull(),
    path: text("path"),
    name: text("name").notNull(),
    type: text("type").notNull(),
    version: text("version").notNull(),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    index("idx_resources_domain").on(table.domain),
    index("idx_resources_type").on(table.type),
    index("idx_resources_created_at").on(table.createdAt),
  ]
);

export type Resource = typeof resources.$inferSelect;
export type NewResource = typeof resources.$inferInsert;
