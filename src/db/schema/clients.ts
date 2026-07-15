import { pgTable, uuid, text, timestamp, integer } from "drizzle-orm/pg-core";

/**
 * Incluye TODOS los customers de Clockodo tal cual: algunos son clientes
 * externos reales, otros son empresas propias usadas para tiempo interno.
 * La facturación real la decide el campo `billable` de time_entries, no
 * este listado.
 */
export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  clockodoCustomerId: integer("clockodo_customer_id").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
