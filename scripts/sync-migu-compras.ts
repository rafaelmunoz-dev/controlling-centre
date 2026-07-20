import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  // Import dinámico: db/index.ts lee DATABASE_URL al cargar el módulo,
  // tiene que pasar después de que dotenv haya inyectado el env.
  const { eq, sql } = await import("drizzle-orm");
  const { db } = await import("../src/db");
  const { entities, purchaseOrders, orderItems, orderSuppliers, syncLogs } =
    await import("../src/db/schema");
  const { fetchOrders } = await import("../src/lib/migu-compras");

  let totalRecords = 0;

  try {
    const orders = await fetchOrders();

    const entityRows = await db
      .select({ id: entities.id, name: entities.name, code: entities.code })
      .from(entities);

    const entityByCode = new Map(
      entityRows.filter((e) => e.code).map((e) => [e.code, e.id])
    );
    const miguGroup = entityRows.find((e) => e.name === "MIGU Group");

    if (!miguGroup) {
      throw new Error("No existe la entidad 'MIGU Group'. Corré scripts/seed-entities.ts primero.");
    }

    let upserted = 0;
    let skipped = 0;
    let itemsInserted = 0;
    let suppliersInserted = 0;

    for (const order of orders) {
      const entityId =
        order.company.type === "EMPRESA"
          ? entityByCode.get(order.company.code)
          : miguGroup.id;

      if (!entityId) {
        console.warn(
          `Omitida ${order.orderNumber}: no hay entity con code "${order.company.code}" (EMPRESA).`
        );
        skipped += 1;
        continue;
      }

      const departmentName =
        order.company.type === "DEPARTAMENTO" ? order.company.name : null;

      const [po] = await db
        .insert(purchaseOrders)
        .values({
          orderNumber: order.orderNumber,
          status: order.status,
          priority: order.priority,
          entityId,
          departmentName,
          requestedByName: order.requestedBy?.name ?? null,
          requestedByEmail: order.requestedBy?.email ?? null,
          approvedByName: order.approvedBy?.name ?? null,
          approvedByEmail: order.approvedBy?.email ?? null,
          createdAt: order.createdAt ? new Date(order.createdAt) : null,
          approvedAt: order.approvedAt ? new Date(order.approvedAt) : null,
          executedAt: order.executedAt ? new Date(order.executedAt) : null,
          completedAt: order.completedAt ? new Date(order.completedAt) : null,
          sourceOrderId: order.orderNumber,
        })
        .onConflictDoUpdate({
          target: purchaseOrders.sourceOrderId,
          set: {
            orderNumber: sql`excluded.order_number`,
            status: sql`excluded.status`,
            priority: sql`excluded.priority`,
            entityId: sql`excluded.entity_id`,
            departmentName: sql`excluded.department_name`,
            requestedByName: sql`excluded.requested_by_name`,
            requestedByEmail: sql`excluded.requested_by_email`,
            approvedByName: sql`excluded.approved_by_name`,
            approvedByEmail: sql`excluded.approved_by_email`,
            createdAt: sql`excluded.created_at`,
            approvedAt: sql`excluded.approved_at`,
            executedAt: sql`excluded.executed_at`,
            completedAt: sql`excluded.completed_at`,
          },
        })
        .returning();

      upserted += 1;

      // Items y suppliers no traen id estable desde el origen: se
      // reemplazan enteros en cada sync para mantener idempotencia.
      await db.delete(orderItems).where(eq(orderItems.purchaseOrderId, po.id));
      await db
        .delete(orderSuppliers)
        .where(eq(orderSuppliers.purchaseOrderId, po.id));

      if (order.items.length > 0) {
        await db.insert(orderItems).values(
          order.items.map((item) => ({
            purchaseOrderId: po.id,
            description: item.description,
            quantity: String(item.quantity),
            unit: item.unit,
          }))
        );
        itemsInserted += order.items.length;
      }

      if (order.suppliers.length > 0) {
        await db.insert(orderSuppliers).values(
          order.suppliers.map((supplier) => ({
            purchaseOrderId: po.id,
            supplierName: supplier.name,
            amount: String(supplier.amount),
            currency: supplier.currency,
          }))
        );
        suppliersInserted += order.suppliers.length;
      }
    }

    totalRecords = upserted;

    await db.insert(syncLogs).values({
      source: "migu-compras",
      status: "ok",
      records: totalRecords,
      message:
        skipped > 0 ? `${skipped} orden(es) omitida(s) por entity sin mapear` : null,
    });

    console.log("Sync MiGu Compras OK.");
    console.log(
      `- purchase_orders: ${upserted} upserted (de ${orders.length} en el origen)` +
        (skipped > 0 ? `, ${skipped} omitidas` : "")
    );
    console.log(`- order_items: ${itemsInserted} insertados`);
    console.log(`- order_suppliers: ${suppliersInserted} insertados`);

    process.exit(0);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    await db.insert(syncLogs).values({
      source: "migu-compras",
      status: "error",
      records: totalRecords,
      message,
    });

    console.error("Sync MiGu Compras FALLÓ:", message);
    process.exit(1);
  }
}

main();
