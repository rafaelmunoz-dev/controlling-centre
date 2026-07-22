import { and, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { timeEntries, employees, budgets, entities, purchaseOrders, orderSuppliers } from "@/db/schema";
import { resolveScopeEntityIds, resolveMiguPurchaseScope, isMiguGroupScope } from "@/lib/entity-tree";
import { formatAmount, formatHours, formatCurrency } from "@/lib/format";
import { parsePeriod } from "@/lib/period";
import { KpiCard } from "@/components/dashboard/kpi-card";

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

export default async function DashboardHomePage({
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
  const scopedIds = resolveScopeEntityIds(scope, entityRows);
  const { effectiveIds: miguEntityIds, hasMiguData } = resolveMiguPurchaseScope(
    scope,
    entityRows
  );
  const isMiguScope = isMiguGroupScope(scope, entityRows);

  const cookieStore = await cookies();
  const userName = cookieStore.get("cc_dev_name")?.value;
  const greeting = userName ? `Welcome, ${decodeURIComponent(userName)}` : "Welcome back";

  const hoursQuery = db
    .select({ total: sql<string>`coalesce(sum(${timeEntries.hours}), 0)` })
    .from(timeEntries)
    .leftJoin(employees, eq(timeEntries.employeeId, employees.id))
    .where(
      scopedIds
        ? and(
            gte(timeEntries.date, start),
            lt(timeEntries.date, end),
            inArray(employees.entityId, scopedIds)
          )
        : and(gte(timeEntries.date, start), lt(timeEntries.date, end))
    );

  const budgetQuery = db
    .select({ total: sql<string>`coalesce(sum(${budgets.amount}), 0)` })
    .from(budgets)
    .where(
      scopedIds
        ? and(eq(budgets.month, start), inArray(budgets.entityId, scopedIds))
        : eq(budgets.month, start)
    );

  const employeeCountQuery = db
    .select({ count: sql<number>`count(*)::int` })
    .from(employees)
    .where(scopedIds ? inArray(employees.entityId, scopedIds) : sql`true`);

  const revenueQuery = db
    .select({
      total: sql<string>`coalesce(sum(${timeEntries.hours} * coalesce(${timeEntries.hourlyRate}, 0)), 0)`,
    })
    .from(timeEntries)
    .leftJoin(employees, eq(timeEntries.employeeId, employees.id))
    .where(
      scopedIds
        ? and(
            gte(timeEntries.date, start),
            lt(timeEntries.date, end),
            eq(timeEntries.billable, true),
            inArray(employees.entityId, scopedIds)
          )
        : and(
            gte(timeEntries.date, start),
            lt(timeEntries.date, end),
            eq(timeEntries.billable, true)
          )
    );

  const purchasesByCurrencyQuery = hasMiguData
    ? db
        .select({
          currency: orderSuppliers.currency,
          total: sql<string>`coalesce(sum(${orderSuppliers.amount}), 0)`,
        })
        .from(orderSuppliers)
        .innerJoin(purchaseOrders, eq(orderSuppliers.purchaseOrderId, purchaseOrders.id))
        .where(
          and(
            gte(purchaseOrders.createdAt, new Date(start)),
            lt(purchaseOrders.createdAt, new Date(end)),
            inArray(purchaseOrders.entityId, miguEntityIds)
          )
        )
        .groupBy(orderSuppliers.currency)
    : Promise.resolve([] as { currency: string | null; total: string }[]);

  const [
    [{ total: totalHours }],
    [{ total: totalBudget }],
    [{ count: employeeCount }],
    [{ total: totalRevenue }],
    purchasesByCurrency,
  ] = await Promise.all([
    hoursQuery,
    budgetQuery,
    employeeCountQuery,
    revenueQuery,
    purchasesByCurrencyQuery,
  ]);

  const hasNoClockodoData = employeeCount === 0 || Number(totalHours) === 0;

  const [firstPurchaseTotal, ...restPurchaseTotals] = purchasesByCurrency;

  return (
    <div className="flex flex-col gap-4">
      {/* Login temporal — se reemplaza por el nombre real de Entra ID cuando este disponible. */}
      <h1 className="text-xl font-semibold text-foreground">{greeting}</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <KpiCard
        title="Productivity"
        subtitle={
          hasNoClockodoData ? "No time-tracking data" : `Hours logged in ${period.label}`
        }
        href={`/dashboard/productividad?scope=${scope}&period=${period.value}`}
        emptyMessage={
          hasNoClockodoData
            ? "No time-tracking data — this entity doesn't use Clockodo yet."
            : undefined
        }
        primaryValue={formatHours(totalHours)}
        primaryUnit="h"
        secondaryValue={formatCurrency(totalRevenue)}
        secondaryLabel="tracked revenue (potential)"
      />

      <KpiCard
        title="Budget"
        subtitle={`Total loaded for ${period.label}`}
        href={`/dashboard/presupuesto?scope=${scope}`}
        primaryValue={`${formatAmount(totalBudget)} €`}
      />

      <KpiCard
        title="Purchases"
        subtitle="Spend tracked via MIGU Compras"
        href={`/dashboard/purchases?scope=${scope}&period=${period.value}`}
        emptyMessage={
          !hasMiguData
            ? "This entity doesn't have a purchase order system yet — overall spending will be visible via P&L once DATEV is connected."
            : !firstPurchaseTotal
              ? `No orders in ${period.label}.`
              : undefined
        }
        primaryValue={
          firstPurchaseTotal
            ? formatByCurrency(firstPurchaseTotal.total, firstPurchaseTotal.currency ?? "USD")
            : undefined
        }
        secondaryValue={
          restPurchaseTotals.length > 0
            ? restPurchaseTotals
                .map((row) => formatByCurrency(row.total, row.currency ?? "USD"))
                .join(", ")
            : undefined
        }
        secondaryLabel={restPurchaseTotals.length > 0 ? `${period.label}` : undefined}
      />

      {/*
        P&L / Cash Flow / Budget vs Actual dependen de DATEV (solo aplica a
        empresas alemanas del grupo) y Pipeline depende de un CRM que hoy no
        existe. No tiene sentido mostrarlas para MIGU Group ni sus hijas.
      */}
      {!isMiguScope && (
        <>
          <KpiCard
            title="P&L"
            subtitle="Waiting on external system connection"
            href={`/dashboard/pl?scope=${scope}&period=${period.value}`}
            emptyMessage="No data yet."
          />

          <KpiCard
            title="Cash Flow"
            subtitle="Waiting on external system connection"
            href={`/dashboard/cash-flow?scope=${scope}&period=${period.value}`}
            emptyMessage="No data yet."
          />

          <KpiCard
            title="Budget vs Actual"
            subtitle="Waiting on external system connection"
            href={`/dashboard/budget-vs-actual?scope=${scope}&period=${period.value}`}
            emptyMessage="No data yet."
          />

          <KpiCard
            title="Pipeline (basic)"
            subtitle="Coming soon"
            href={`/dashboard/pipeline?scope=${scope}&period=${period.value}`}
            emptyMessage="Coming soon — activates once the CRM is ready."
          />
        </>
      )}
      </div>
    </div>
  );
}
