import { pgTable, uuid, text, date, numeric, timestamp, unique } from "drizzle-orm/pg-core";
import { entities } from "./entities";

export const budgets = pgTable(
  "budgets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entityId: uuid("entity_id").notNull().references(() => entities.id),
    month: date("month").notNull(),
    plLine: text("pl_line").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [unique().on(table.entityId, table.month, table.plLine)]
);
