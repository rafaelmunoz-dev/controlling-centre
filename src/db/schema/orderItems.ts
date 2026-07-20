import { pgTable, uuid, text, numeric } from "drizzle-orm/pg-core";
import { purchaseOrders } from "./purchaseOrders";

export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  purchaseOrderId: uuid("purchase_order_id")
    .notNull()
    .references(() => purchaseOrders.id),
  description: text("description"),
  quantity: numeric("quantity", { precision: 12, scale: 2 }),
  unit: text("unit"),
});
