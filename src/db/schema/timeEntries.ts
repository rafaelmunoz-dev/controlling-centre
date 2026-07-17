import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  date,
  numeric,
  boolean,
} from "drizzle-orm/pg-core";
import { employees } from "./employees";
import { clients } from "./clients";

/**
 * clientId null -> ausencia (ver absenceType).
 * Si absenceType tiene valor, es una ausencia: hours/billable se
 * interpretan distinto (no son tiempo facturable de cliente).
 */
export const timeEntries = pgTable("time_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id").notNull().references(() => employees.id),
  clientId: uuid("client_id").references(() => clients.id),
  date: date("date").notNull(),
  hours: numeric("hours", { precision: 5, scale: 2 }).notNull(),
  hourlyRate: numeric("hourly_rate", { precision: 10, scale: 2 }),
  billable: boolean("billable").notNull(),
  project: text("project"),
  absenceType: text("absence_type"),
  note: text("note"),
  clockodoEntryId: integer("clockodo_entry_id").notNull().unique(),
});
