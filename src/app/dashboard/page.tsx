import Link from "next/link";
import { and, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { timeEntries, employees, budgets, entities } from "@/db/schema";
import { resolveScopeEntityIds } from "@/lib/entity-tree";
import { formatAmount, formatHours } from "@/lib/format";
import { parsePeriod } from "@/lib/period";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

  const [[{ total: totalHours }], [{ total: totalBudget }], [{ count: employeeCount }]] =
    await Promise.all([hoursQuery, budgetQuery, employeeCountQuery]);

  const hasNoClockodoData = employeeCount === 0 || Number(totalHours) === 0;

  const cardClassName =
    "flex h-48 flex-col justify-between cursor-pointer transition-all hover:shadow-md hover:border-primary/50";

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Link
        href={`/dashboard/productividad?scope=${scope}&period=${period.value}`}
        className="block h-full"
      >
        <Card className={cardClassName}>
          <CardHeader>
            <CardTitle>Productivity</CardTitle>
            <CardDescription>
              {hasNoClockodoData
                ? "No time-tracking data"
                : `Hours logged in ${period.label}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasNoClockodoData ? (
              <p className="text-sm text-muted-foreground">
                No time-tracking data — this entity doesn&apos;t use Clockodo yet.
              </p>
            ) : (
              <p className="text-3xl font-semibold text-foreground">
                {formatHours(totalHours)} h
              </p>
            )}
          </CardContent>
        </Card>
      </Link>

      <Link href={`/dashboard/presupuesto?scope=${scope}`} className="block h-full">
        <Card className={cardClassName}>
          <CardHeader>
            <CardTitle>Budget</CardTitle>
            <CardDescription>Total loaded for {period.label}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-foreground">
              {formatAmount(totalBudget)} €
            </p>
          </CardContent>
        </Card>
      </Link>

      <Link
        href={`/dashboard/pl?scope=${scope}&period=${period.value}`}
        className="block h-full"
      >
        <Card className={cardClassName}>
          <CardHeader>
            <CardTitle>P&L</CardTitle>
            <CardDescription>Waiting on external system connection</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No data yet.</p>
          </CardContent>
        </Card>
      </Link>

      <Link
        href={`/dashboard/cash-flow?scope=${scope}&period=${period.value}`}
        className="block h-full"
      >
        <Card className={cardClassName}>
          <CardHeader>
            <CardTitle>Cash Flow</CardTitle>
            <CardDescription>Waiting on external system connection</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No data yet.</p>
          </CardContent>
        </Card>
      </Link>

      <Link
        href={`/dashboard/budget-vs-actual?scope=${scope}&period=${period.value}`}
        className="block h-full"
      >
        <Card className={cardClassName}>
          <CardHeader>
            <CardTitle>Budget vs Actual</CardTitle>
            <CardDescription>Waiting on external system connection</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No data yet.</p>
          </CardContent>
        </Card>
      </Link>

      <Link
        href={`/dashboard/pipeline?scope=${scope}&period=${period.value}`}
        className="block h-full"
      >
        <Card className={cardClassName}>
          <CardHeader>
            <CardTitle>Pipeline (basic)</CardTitle>
            <CardDescription>Coming soon</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Coming soon — activates once the CRM is ready.
            </p>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
