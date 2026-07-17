import { and, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { timeEntries, employees, budgets, entities } from "@/db/schema";
import { resolveScopeEntityIds } from "@/lib/entity-tree";
import { formatAmount, formatHours, formatCurrency } from "@/lib/format";
import { parsePeriod } from "@/lib/period";
import { KpiCard } from "@/components/dashboard/kpi-card";

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
    .select({ id: entities.id, groupParentId: entities.groupParentId })
    .from(entities);
  const scopedIds = resolveScopeEntityIds(scope, entityRows);

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

  const [
    [{ total: totalHours }],
    [{ total: totalBudget }],
    [{ count: employeeCount }],
    [{ total: totalRevenue }],
  ] = await Promise.all([hoursQuery, budgetQuery, employeeCountQuery, revenueQuery]);

  const hasNoClockodoData = employeeCount === 0 || Number(totalHours) === 0;

  return (
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
    </div>
  );
}
