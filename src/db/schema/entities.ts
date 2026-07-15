import { pgTable, uuid, text, timestamp, type AnyPgColumn } from "drizzle-orm/pg-core";

/**
 * Entities: empresas/grupos jerárquicos, self-referencing.
 * - groupParentId null  -> fila top-level (grupo o empresa raíz)
 * - groupParentId set   -> fila hija, apunta a su entities.id padre
 */
export const entities = pgTable("entities", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  groupParentId: uuid("group_parent_id").references((): AnyPgColumn => entities.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
