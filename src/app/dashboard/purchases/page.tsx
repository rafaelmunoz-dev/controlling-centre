import { and, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { purchaseOrders, orderSuppliers, entities } from "@/db/schema";
import { parsePeriod } from "@/lib/period";
import { resolveMiguPurchaseScope } from "@/lib/entity-tree";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function formatByCurrency(amount: number | string, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(Number(amount));
  } catch {
    return `${Number(amount).toFixed(2)} ${currency}`;
  }
}

type OrderRow = {
  id: string;
  orderNumber: string;
  status: string | null;
  departmentName: string | null;
  approvedByName: string | null;
  entityName: string | null;
};

function OrdersTable({
  orders,
  totalsByOrderId,
  showEntityColumn,
}: {
  orders: OrderRow[];
  totalsByOrderId: Map<string, { currency: string; total: string }[]>;
  showEntityColumn: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-muted">
            <th className="border-b border-border px-2 py-1 text-left">Order #</th>
            {showEntityColumn && (
              <th className="border-b border-border px-2 py-1 text-left">Company / Dept</th>
            )}
            <th className="border-b border-border px-2 py-1 text-left">Status</th>
            <th className="border-b border-border px-2 py-1 text-left">Approved by</th>
            <th className="border-b border-border px-2 py-1 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? (
            <tr>
              <td
                className="px-2 py-1 text-muted-foreground"
                colSpan={showEntityColumn ? 5 : 4}
              >
                No orders in this period.
              </td>
            </tr>
          ) : (
            orders.map((order) => {
              const totals = totalsByOrderId.get(order.id) ?? [];
              return (
                <tr key={order.id}>
                  <td className="px-2 py-1">{order.orderNumber}</td>
                  {showEntityColumn && (
                    <td className="px-2 py-1">
                      {order.entityName ?? "—"}
                      {order.departmentName ? ` — ${order.departmentName}` : ""}
                    </td>
                  )}
                  <td className="px-2 py-1">{order.status ?? "—"}</td>
                  <td className="px-2 py-1">{order.approvedByName ?? "—"}</td>
                  <td className="px-2 py-1 text-right">
                    {totals.length === 0
                      ? "—"
                      : totals
                          .map((t) => formatByCurrency(t.total, t.currency))
                          .join(", ")}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default async function PurchasesPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string; period?: string }>;
}) {
  const { scope: scopeParam, period: periodParam } = await searchParams;
  const scope = scopeParam ?? "all";
  const period = parsePeriod({ period: periodParam });
  const { startDate: start, endDate: end } = period;

  const entityRows = await db
    .select({ id: entities.id, name: entities.name, groupParentId: entities.groupParentId })
    .from(entities);

  const { effectiveIds, hasMiguData } = resolveMiguPurchaseScope(scope, entityRows);
  const miguGroup = entityRows.find((r) => r.name === "MIGU Group");
  const isGroupScope = !!miguGroup && scope === miguGroup.id;

  if (!hasMiguData) {
    return (
      <div className="flex flex-col gap-1">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Purchases</h1>
          <p className="text-sm text-muted-foreground">
            Purchase orders synced from MIGU Compras.
          </p>
        </div>
        <Card className="mt-4">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              This entity doesn&apos;t have a purchase order system yet — overall
              spending will be visible via P&amp;L once DATEV is connected.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const periodFilter = and(
    gte(purchaseOrders.createdAt, new Date(start)),
    lt(purchaseOrders.createdAt, new Date(end)),
    inArray(purchaseOrders.entityId, effectiveIds)
  );

  const orders = await db
    .select({
      id: purchaseOrders.id,
      orderNumber: purchaseOrders.orderNumber,
      status: purchaseOrders.status,
      departmentName: purchaseOrders.departmentName,
      approvedByName: purchaseOrders.approvedByName,
      createdAt: purchaseOrders.createdAt,
      entityName: entities.name,
    })
    .from(purchaseOrders)
    .leftJoin(entities, eq(purchaseOrders.entityId, entities.id))
    .where(periodFilter)
    .orderBy(purchaseOrders.createdAt);

  const currencyTotalsByOrder = await db
    .select({
      purchaseOrderId: orderSuppliers.purchaseOrderId,
      currency: orderSuppliers.currency,
      total: sql<string>`coalesce(sum(${orderSuppliers.amount}), 0)`,
    })
    .from(orderSuppliers)
    .innerJoin(purchaseOrders, eq(orderSuppliers.purchaseOrderId, purchaseOrders.id))
    .where(periodFilter)
    .groupBy(orderSuppliers.purchaseOrderId, orderSuppliers.currency);

  const totalsByOrderId = new Map<string, { currency: string; total: string }[]>();
  for (const row of currencyTotalsByOrder) {
    const list = totalsByOrderId.get(row.purchaseOrderId) ?? [];
    list.push({ currency: row.currency ?? "?", total: row.total });
    totalsByOrderId.set(row.purchaseOrderId, list);
  }

  const summaryByCurrency = await db
    .select({
      currency: orderSuppliers.currency,
      total: sql<string>`coalesce(sum(${orderSuppliers.amount}), 0)`,
    })
    .from(orderSuppliers)
    .innerJoin(purchaseOrders, eq(orderSuppliers.purchaseOrderId, purchaseOrders.id))
    .where(periodFilter)
    .groupBy(orderSuppliers.currency);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Purchases</h1>
        <p className="text-sm text-muted-foreground">
          Purchase orders synced from MIGU Compras — {period.label}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryByCurrency.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Total spend</CardTitle>
              <CardDescription>{period.label}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No orders in this period.</p>
            </CardContent>
          </Card>
        ) : (
          summaryByCurrency.map((row) => (
            <Card key={row.currency ?? "unknown"}>
              <CardHeader>
                <CardTitle>Total spend ({row.currency ?? "?"})</CardTitle>
                <CardDescription>{period.label}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold text-foreground">
                  {formatByCurrency(row.total, row.currency ?? "USD")}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {isGroupScope ? (
        <>
          {(() => {
            const companyOrders = orders.filter((o) => o.departmentName === null);
            const departmentOrders = orders.filter((o) => o.departmentName !== null);
            const ordersByDepartment = new Map<string, OrderRow[]>();
            for (const order of departmentOrders) {
              const key = order.departmentName!;
              const list = ordersByDepartment.get(key) ?? [];
              list.push(order);
              ordersByDepartment.set(key, list);
            }

            return (
              <>
                <div>
                  <h2 className="mb-2 text-lg font-semibold text-foreground">
                    Companies ({period.label})
                  </h2>
                  <OrdersTable
                    orders={companyOrders}
                    totalsByOrderId={totalsByOrderId}
                    showEntityColumn
                  />
                </div>

                <div>
                  <h2 className="mb-2 text-lg font-semibold text-foreground">
                    Departments ({period.label})
                  </h2>
                  {ordersByDepartment.size === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No department orders in this period.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {Array.from(ordersByDepartment.entries()).map(
                        ([departmentName, deptOrders]) => (
                          <div key={departmentName}>
                            <h3 className="mb-1.5 text-sm font-medium text-foreground">
                              {departmentName}
                            </h3>
                            <OrdersTable
                              orders={deptOrders}
                              totalsByOrderId={totalsByOrderId}
                              showEntityColumn={false}
                            />
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </>
      ) : (
        <div>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Orders ({period.label})
          </h2>
          <OrdersTable orders={orders} totalsByOrderId={totalsByOrderId} showEntityColumn />
        </div>
      )}
    </div>
  );
}
