import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { entities } from "./entities";

/**
 * departmentName solo se llena cuando la orden viene de un company.type
 * DEPARTAMENTO en MiGu Compras (entityId apunta a MIGU Group en ese caso).
 */
export const purchaseOrders = pgTable("purchase_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderNumber: text("order_number").notNull().unique(),
  status: text("status"),
  priority: text("priority"),
  entityId: uuid("entity_id").notNull().references(() => entities.id),
  departmentName: text("department_name"),
  requestedByName: text("requested_by_name"),
  requestedByEmail: text("requested_by_email"),
  approvedByName: text("approved_by_name"),
  approvedByEmail: text("approved_by_email"),
  createdAt: timestamp("created_at"),
  approvedAt: timestamp("approved_at"),
  executedAt: timestamp("executed_at"),
  completedAt: timestamp("completed_at"),
  sourceOrderId: text("source_order_id").notNull().unique(),
});
