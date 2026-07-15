import { pgTable, uuid, text, timestamp, integer } from "drizzle-orm/pg-core";
import { entities } from "./entities";

export const employees = pgTable("employees", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityId: uuid("entity_id").notNull().references(() => entities.id),
  name: text("name").notNull(),
  clockodoId: integer("clockodo_id").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
