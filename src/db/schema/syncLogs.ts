import { pgTable, uuid, text, timestamp, integer } from "drizzle-orm/pg-core";

export const syncLogs = pgTable("sync_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  source: text("source").notNull(),
  runAt: timestamp("run_at").defaultNow().notNull(),
  status: text("status").notNull(),
  records: integer("records").default(0).notNull(),
  message: text("message"),
});
