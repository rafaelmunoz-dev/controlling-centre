import Link from "next/link";
import { and, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { timeEntries, employees, budgets, entities } from "@/db/schema";
import { resolveScopeEntityIds } from "@/lib/entity-tree";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function currentMonthRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const pad = (n: number) => String(n).padStart(2, "0");

  const start = `${year}-${pad(month + 1)}-01`;
  const nextMonth = month === 11 ? { y: year + 1, m: 1 } : { y: year, m: month + 2 };
  const end = `${nextMonth.y}-${pad(nextMonth.m)}-01`;

  return { start, end };
}

export default async function DashboardHomePage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string }>;
}) {
  const scope = (await searchParams).scope ?? "all";
  const { start, end } = currentMonthRange();

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

  const [[{ total: totalHours }], [{ total: totalBudget }]] = await Promise.all([
    hoursQuery,
    budgetQuery,
  ]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Productivity</CardTitle>
          <CardDescription>Hours logged this month</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold text-foreground">
            {Number(totalHours).toFixed(2)} h
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Budget</CardTitle>
          <CardDescription>Total loaded this month</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <p className="text-3xl font-semibold text-foreground">
            {Number(totalBudget).toFixed(2)} €
          </p>
          <Link
            href="/dashboard/presupuesto"
            className="text-sm text-primary underline"
          >
            Load budget
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>P&L</CardTitle>
          <CardDescription>Waiting on external system connection</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No data yet.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cash Flow</CardTitle>
          <CardDescription>Waiting on external system connection</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No data yet.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Budget vs Actual</CardTitle>
          <CardDescription>Waiting on external system connection</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No data yet.</p>
        </CardContent>
      </Card>

      <Card>
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
    </div>
  );
}
