import { pgTable, uuid, text, numeric } from "drizzle-orm/pg-core";
import { purchaseOrders } from "./purchaseOrders";

/** currency: nunca convertir/sumar entre monedas distintas. */
export const orderSuppliers = pgTable("order_suppliers", {
  id: uuid("id").primaryKey().defaultRandom(),
  purchaseOrderId: uuid("purchase_order_id")
    .notNull()
    .references(() => purchaseOrders.id),
  supplierName: text("supplier_name"),
  amount: numeric("amount", { precision: 12, scale: 2 }),
  currency: text("currency"),
});
