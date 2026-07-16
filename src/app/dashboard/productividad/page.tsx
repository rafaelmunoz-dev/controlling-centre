import Link from "next/link";
import { and, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { timeEntries, employees, clients, entities } from "@/db/schema";
import { resolveScopeEntityIds } from "@/lib/entity-tree";
import { parsePeriod } from "@/lib/period";
import { formatHours, formatPercent } from "@/lib/format";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProductivityTabs } from "./productivity-tabs-client";
import { EmployeeSelectClient } from "./employee-select-client";

function billablePercentOf(
  splitRows: { billable: boolean; hours: string }[]
) {
  const billableHours = Number(
    splitRows.find((r) => r.billable === true)?.hours ?? 0
  );
  const nonBillableHours = Number(
    splitRows.find((r) => r.billable === false)?.hours ?? 0
  );
  const totalHours = billableHours + nonBillableHours;
  const billablePercent = totalHours > 0 ? (billableHours / totalHours) * 100 : 0;
  return { totalHours, billableHours, nonBillableHours, billablePercent };
}

export default async function ProductividadPage({
  searchParams,
}: {
  searchParams: Promise<{
    scope?: string;
    period?: string;
    tab?: string;
    employee?: string;
    client?: string;
    clientSort?: string;
    clientDir?: string;
  }>;
}) {
  const {
    scope: scopeParam,
    period: periodParam,
    tab: tabParam,
    employee: employeeParam,
    client: clientParam,
    clientSort: clientSortParam,
    clientDir: clientDirParam,
  } = await searchParams;
  const scope = scopeParam ?? "all";
  const tab = tabParam ?? "overview";
  const period = parsePeriod({ period: periodParam });
  const { startDate: start, endDate: end } = period;

  const entityRows = await db
    .select({ id: entities.id, name: entities.name, groupParentId: entities.groupParentId })
    .from(entities);
  const scopedIds = resolveScopeEntityIds(scope, entityRows);

  const monthFilter = scopedIds
    ? and(
        gte(timeEntries.date, start),
        lt(timeEntries.date, end),
        inArray(employees.entityId, scopedIds)
      )
    : and(gte(timeEntries.date, start), lt(timeEntries.date, end));

  // --- Overview tab ---
  const billableSplitRows = await db
    .select({
      billable: timeEntries.billable,
      hours: sql<string>`coalesce(sum(${timeEntries.hours}), 0)`,
    })
    .from(timeEntries)
    .leftJoin(employees, eq(timeEntries.employeeId, employees.id))
    .where(monthFilter)
    .groupBy(timeEntries.billable);

  const { totalHours, billablePercent } = billablePercentOf(billableSplitRows);

  const [{ count: activeEmployeeCount }] = await db
    .select({ count: sql<number>`count(distinct ${timeEntries.employeeId})::int` })
    .from(timeEntries)
    .leftJoin(employees, eq(timeEntries.employeeId, employees.id))
    .where(monthFilter);

  const topClients = await db
    .select({
      clientId: clients.id,
      clientName: clients.name,
      totalHours: sql<string>`coalesce(sum(${timeEntries.hours}), 0)`,
      billableHours: sql<string>`coalesce(sum(case when ${timeEntries.billable} then ${timeEntries.hours} else 0 end), 0)`,
    })
    .from(timeEntries)
    .leftJoin(employees, eq(timeEntries.employeeId, employees.id))
    .leftJoin(clients, eq(timeEntries.clientId, clients.id))
    .where(monthFilter)
    .groupBy(clients.id, clients.name)
    .orderBy(desc(sql`sum(${timeEntries.hours})`))
    .limit(5);

  const topEmployees = await db
    .select({
      employeeId: employees.id,
      employeeName: employees.name,
      totalHours: sql<string>`coalesce(sum(${timeEntries.hours}), 0)`,
      billableHours: sql<string>`coalesce(sum(case when ${timeEntries.billable} then ${timeEntries.hours} else 0 end), 0)`,
    })
    .from(timeEntries)
    .leftJoin(employees, eq(timeEntries.employeeId, employees.id))
    .where(monthFilter)
    .groupBy(employees.id, employees.name)
    .orderBy(desc(sql`sum(${timeEntries.hours})`))
    .limit(5);

  const overview = (
    <div className="flex flex-col gap-6 pt-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total hours</CardTitle>
            <CardDescription>{period.label}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-foreground">
              {formatHours(totalHours)} h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Billable</CardTitle>
            <CardDescription>Share of hours in {period.label}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-foreground">
              {formatPercent(billablePercent)}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatPercent(100 - billablePercent)} non-billable
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active employees</CardTitle>
            <CardDescription>With at least one record in {period.label}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-foreground">
              {activeEmployeeCount}
            </p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-semibold text-foreground">
          Top clients by hours ({period.label})
        </h2>
        <table className="w-full border-collapse border border-border text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="border border-border px-2 py-1 text-left">Client</th>
              <th className="border border-border px-2 py-1 text-right">Hours</th>
              <th className="border border-border px-2 py-1 text-right">% Billable</th>
            </tr>
          </thead>
          <tbody>
            {topClients.map((row) => {
              const total = Number(row.totalHours);
              const pct = total > 0 ? (Number(row.billableHours) / total) * 100 : 0;
              return (
                <tr key={row.clientId ?? "no-client"}>
                  <td className="border border-border px-2 py-1">
                    {row.clientName ?? "No client"}
                  </td>
                  <td className="border border-border px-2 py-1 text-right">
                    {formatHours(row.totalHours)}
                  </td>
                  <td className="border border-border px-2 py-1 text-right">
                    {formatPercent(pct)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-semibold text-foreground">
          Top employees by hours ({period.label})
        </h2>
        <table className="w-full border-collapse border border-border text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="border border-border px-2 py-1 text-left">Employee</th>
              <th className="border border-border px-2 py-1 text-right">Total hours</th>
              <th className="border border-border px-2 py-1 text-right">Billable hours</th>
            </tr>
          </thead>
          <tbody>
            {topEmployees.map((row) => (
              <tr key={row.employeeId ?? "unknown"}>
                <td className="border border-border px-2 py-1">
                  {row.employeeName ?? "—"}
                </td>
                <td className="border border-border px-2 py-1 text-right">
                  {formatHours(row.totalHours)}
                </td>
                <td className="border border-border px-2 py-1 text-right">
                  {formatHours(row.billableHours)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // --- By employee tab ---
  const employeesInScopeQuery = db
    .select({ id: employees.id, name: employees.name, entityId: employees.entityId })
    .from(employees);

  const employeesInScope = await (scopedIds
    ? employeesInScopeQuery.where(inArray(employees.entityId, scopedIds))
    : employeesInScopeQuery
  ).orderBy(employees.name);

  const selectedEmployee = employeeParam
    ? employeesInScope.find((e) => e.id === employeeParam) ?? null
    : null;

  let byEmployeeContent: React.ReactNode = (
    <p className="text-muted-foreground">
      Select an employee to see their breakdown.
    </p>
  );

  if (selectedEmployee) {
    const employeeMonthFilter = and(
      eq(timeEntries.employeeId, selectedEmployee.id),
      gte(timeEntries.date, start),
      lt(timeEntries.date, end)
    );

    const employeeSplitRows = await db
      .select({
        billable: timeEntries.billable,
        hours: sql<string>`coalesce(sum(${timeEntries.hours}), 0)`,
      })
      .from(timeEntries)
      .where(employeeMonthFilter)
      .groupBy(timeEntries.billable);

    const employeeTotals = billablePercentOf(employeeSplitRows);
    const entityName =
      entityRows.find((e) => e.id === selectedEmployee.entityId)?.name ?? "—";

    const employeeClientBreakdown = await db
      .select({
        clientId: clients.id,
        clientName: clients.name,
        totalHours: sql<string>`coalesce(sum(${timeEntries.hours}), 0)`,
        billableHours: sql<string>`coalesce(sum(case when ${timeEntries.billable} then ${timeEntries.hours} else 0 end), 0)`,
      })
      .from(timeEntries)
      .leftJoin(clients, eq(timeEntries.clientId, clients.id))
      .where(employeeMonthFilter)
      .groupBy(clients.id, clients.name)
      .orderBy(desc(sql`sum(${timeEntries.hours})`));

    const employeeDetailRows = await db
      .select({
        employeeName: employees.name,
        clientName: clients.name,
        date: timeEntries.date,
        hours: timeEntries.hours,
        billable: timeEntries.billable,
        project: timeEntries.project,
      })
      .from(timeEntries)
      .leftJoin(employees, eq(timeEntries.employeeId, employees.id))
      .leftJoin(clients, eq(timeEntries.clientId, clients.id))
      .where(employeeMonthFilter)
      .orderBy(desc(timeEntries.date));

    byEmployeeContent = (
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Total hours</CardTitle>
              <CardDescription>{period.label}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-foreground">
                {formatHours(employeeTotals.totalHours)} h
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Billable</CardTitle>
              <CardDescription>Billable vs non-billable</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-foreground">
                {formatHours(employeeTotals.billableHours)} h
              </p>
              <p className="text-sm text-muted-foreground">
                {formatHours(employeeTotals.nonBillableHours)} h non-billable
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Entity</CardTitle>
              <CardDescription>Assigned entity</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-foreground">
                {entityName}
              </p>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Breakdown by client
          </h2>
          <table className="w-full border-collapse border border-border text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border px-2 py-1 text-left">Client</th>
                <th className="border border-border px-2 py-1 text-right">Hours</th>
                <th className="border border-border px-2 py-1 text-right">Billable</th>
              </tr>
            </thead>
            <tbody>
              {employeeClientBreakdown.map((row) => (
                <tr key={row.clientId ?? "no-client"}>
                  <td className="border border-border px-2 py-1">
                    {row.clientName ?? "No client"}
                  </td>
                  <td className="border border-border px-2 py-1 text-right">
                    {formatHours(row.totalHours)}
                  </td>
                  <td className="border border-border px-2 py-1 text-right">
                    {formatHours(row.billableHours)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Detailed records
          </h2>
          <table className="w-full border-collapse border border-border text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border px-2 py-1 text-left">Employee</th>
                <th className="border border-border px-2 py-1 text-left">Client</th>
                <th className="border border-border px-2 py-1 text-left">Date</th>
                <th className="border border-border px-2 py-1 text-left">Hours</th>
                <th className="border border-border px-2 py-1 text-left">Billable</th>
                <th className="border border-border px-2 py-1 text-left">Project</th>
              </tr>
            </thead>
            <tbody>
              {employeeDetailRows.map((row, i) => (
                <tr key={i}>
                  <td className="border border-border px-2 py-1">
                    {row.employeeName ?? "—"}
                  </td>
                  <td className="border border-border px-2 py-1">
                    {row.clientName ?? "—"}
                  </td>
                  <td className="border border-border px-2 py-1">{row.date}</td>
                  <td className="border border-border px-2 py-1">{row.hours}</td>
                  <td className="border border-border px-2 py-1">
                    {row.billable ? "Yes" : "No"}
                  </td>
                  <td className="border border-border px-2 py-1">
                    {row.project ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const byEmployee = (
    <div className="flex flex-col gap-6 pt-4">
      <EmployeeSelectClient
        employees={employeesInScope}
        currentEmployeeId={selectedEmployee?.id ?? null}
      />
      {byEmployeeContent}
    </div>
  );

  // --- By client tab ---
  type ClientSortColumn = "client" | "hours" | "billable";
  const validClientSortColumns: ClientSortColumn[] = ["client", "hours", "billable"];
  const activeClientSort: ClientSortColumn = validClientSortColumns.includes(
    clientSortParam as ClientSortColumn
  )
    ? (clientSortParam as ClientSortColumn)
    : "hours";
  const activeClientDir: "asc" | "desc" =
    clientDirParam === "asc" ? "asc" : "desc";

  function clientSortHref(column: ClientSortColumn) {
    const nextDir =
      activeClientSort === column && activeClientDir === "desc"
        ? "asc"
        : activeClientSort === column && activeClientDir === "asc"
          ? "desc"
          : column === "client"
            ? "asc"
            : "desc";
    const params = new URLSearchParams();
    params.set("scope", scope);
    params.set("period", period.value);
    params.set("tab", "by-client");
    params.set("clientSort", column);
    params.set("clientDir", nextDir);
    return `/dashboard/productividad?${params.toString()}`;
  }

  function clientSortIndicator(column: ClientSortColumn) {
    if (activeClientSort !== column) return null;
    return activeClientDir === "asc" ? " ▲" : " ▼";
  }

  const allClientsRaw = await db
    .select({
      clientId: clients.id,
      clientName: clients.name,
      totalHours: sql<string>`coalesce(sum(${timeEntries.hours}), 0)`,
      billableHours: sql<string>`coalesce(sum(case when ${timeEntries.billable} then ${timeEntries.hours} else 0 end), 0)`,
    })
    .from(timeEntries)
    .leftJoin(employees, eq(timeEntries.employeeId, employees.id))
    .leftJoin(clients, eq(timeEntries.clientId, clients.id))
    .where(monthFilter)
    .groupBy(clients.id, clients.name);

  const sortedClients = [...allClientsRaw].sort((a, b) => {
    let cmp = 0;
    if (activeClientSort === "client") {
      cmp = (a.clientName ?? "").localeCompare(b.clientName ?? "");
    } else if (activeClientSort === "hours") {
      cmp = Number(a.totalHours) - Number(b.totalHours);
    } else {
      const aTotal = Number(a.totalHours);
      const bTotal = Number(b.totalHours);
      const aPct = aTotal > 0 ? Number(a.billableHours) / aTotal : 0;
      const bPct = bTotal > 0 ? Number(b.billableHours) / bTotal : 0;
      cmp = aPct - bPct;
    }
    return activeClientDir === "asc" ? cmp : -cmp;
  });

  const selectedClientRow = clientParam
    ? (await db
        .select({ id: clients.id, name: clients.name })
        .from(clients)
        .where(eq(clients.id, clientParam)))[0] ?? null
    : null;

  let byClient: React.ReactNode;

  if (selectedClientRow) {
    const clientMonthFilter = and(
      eq(timeEntries.clientId, selectedClientRow.id),
      gte(timeEntries.date, start),
      lt(timeEntries.date, end)
    );

    const clientSplitRows = await db
      .select({
        billable: timeEntries.billable,
        hours: sql<string>`coalesce(sum(${timeEntries.hours}), 0)`,
      })
      .from(timeEntries)
      .where(clientMonthFilter)
      .groupBy(timeEntries.billable);

    const clientTotals = billablePercentOf(clientSplitRows);

    const clientEmployeeBreakdown = await db
      .select({
        employeeId: employees.id,
        employeeName: employees.name,
        totalHours: sql<string>`coalesce(sum(${timeEntries.hours}), 0)`,
        billableHours: sql<string>`coalesce(sum(case when ${timeEntries.billable} then ${timeEntries.hours} else 0 end), 0)`,
      })
      .from(timeEntries)
      .leftJoin(employees, eq(timeEntries.employeeId, employees.id))
      .where(clientMonthFilter)
      .groupBy(employees.id, employees.name)
      .orderBy(desc(sql`sum(${timeEntries.hours})`));

    byClient = (
      <div className="flex flex-col gap-6 pt-4">
        <Link
          href={`/dashboard/productividad?scope=${scope}&period=${period.value}&tab=by-client`}
          className="w-fit text-sm text-primary underline"
        >
          ← Back to all clients
        </Link>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>{selectedClientRow.name}</CardTitle>
              <CardDescription>{period.label}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-foreground">
                {formatHours(clientTotals.totalHours)} h
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Billable</CardTitle>
              <CardDescription>Share of hours in {period.label}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-foreground">
                {formatPercent(clientTotals.billablePercent)}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatPercent(100 - clientTotals.billablePercent)} non-billable
              </p>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Employees on this client
          </h2>
          <table className="w-full border-collapse border border-border text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border px-2 py-1 text-left">Employee</th>
                <th className="border border-border px-2 py-1 text-right">Total hours</th>
                <th className="border border-border px-2 py-1 text-right">Billable hours</th>
              </tr>
            </thead>
            <tbody>
              {clientEmployeeBreakdown.map((row) => (
                <tr key={row.employeeId ?? "unknown"}>
                  <td className="border border-border px-2 py-1">
                    {row.employeeName ?? "—"}
                  </td>
                  <td className="border border-border px-2 py-1 text-right">
                    {formatHours(row.totalHours)}
                  </td>
                  <td className="border border-border px-2 py-1 text-right">
                    {formatHours(row.billableHours)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  } else {
    byClient = (
      <div className="pt-4">
        <table className="w-full border-collapse border border-border text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="border border-border px-2 py-1 text-left">
                <Link href={clientSortHref("client")}>
                  Client{clientSortIndicator("client")}
                </Link>
              </th>
              <th className="border border-border px-2 py-1 text-right">
                <Link href={clientSortHref("hours")}>
                  Total hours{clientSortIndicator("hours")}
                </Link>
              </th>
              <th className="border border-border px-2 py-1 text-right">
                <Link href={clientSortHref("billable")}>
                  % Billable{clientSortIndicator("billable")}
                </Link>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedClients.map((row) => {
              const total = Number(row.totalHours);
              const pct = total > 0 ? (Number(row.billableHours) / total) * 100 : 0;
              const href = row.clientId
                ? `/dashboard/productividad?scope=${scope}&period=${period.value}&tab=by-client&client=${row.clientId}`
                : null;
              return (
                <tr key={row.clientId ?? "no-client"} className="hover:bg-muted">
                  <td className="border border-border p-0">
                    {href ? (
                      <Link href={href} className="block px-2 py-1">
                        {row.clientName ?? "No client"}
                      </Link>
                    ) : (
                      <span className="block px-2 py-1">No client</span>
                    )}
                  </td>
                  <td className="border border-border p-0 text-right">
                    {href ? (
                      <Link href={href} className="block px-2 py-1">
                        {formatHours(row.totalHours)}
                      </Link>
                    ) : (
                      <span className="block px-2 py-1">
                        {formatHours(row.totalHours)}
                      </span>
                    )}
                  </td>
                  <td className="border border-border p-0 text-right">
                    {href ? (
                      <Link href={href} className="block px-2 py-1">
                        {formatPercent(pct)}
                      </Link>
                    ) : (
                      <span className="block px-2 py-1">{formatPercent(pct)}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // --- All records tab ---
  const allRecordsBaseQuery = db
    .select({
      employeeName: employees.name,
      clientName: clients.name,
      date: timeEntries.date,
      hours: timeEntries.hours,
      billable: timeEntries.billable,
      project: timeEntries.project,
    })
    .from(timeEntries)
    .leftJoin(employees, eq(timeEntries.employeeId, employees.id))
    .leftJoin(clients, eq(timeEntries.clientId, clients.id));

  const allRecordsRows = await (scopedIds
    ? allRecordsBaseQuery.where(inArray(employees.entityId, scopedIds))
    : allRecordsBaseQuery
  )
    .orderBy(desc(timeEntries.date))
    .limit(50);

  const allRecords = (
    <div className="pt-4">
      <h1 className="mb-4 text-xl font-semibold text-foreground">
        Hours (last 50 records)
      </h1>

      <table className="w-full border-collapse border border-border text-sm">
        <thead>
          <tr className="bg-muted">
            <th className="border border-border px-2 py-1 text-left">Employee</th>
            <th className="border border-border px-2 py-1 text-left">Client</th>
            <th className="border border-border px-2 py-1 text-left">Date</th>
            <th className="border border-border px-2 py-1 text-left">Hours</th>
            <th className="border border-border px-2 py-1 text-left">Billable</th>
          </tr>
        </thead>
        <tbody>
          {allRecordsRows.map((row, i) => (
            <tr key={i}>
              <td className="border border-border px-2 py-1">
                {row.employeeName ?? "—"}
              </td>
              <td className="border border-border px-2 py-1">
                {row.clientName ?? "—"}
              </td>
              <td className="border border-border px-2 py-1">{row.date}</td>
              <td className="border border-border px-2 py-1">{row.hours}</td>
              <td className="border border-border px-2 py-1">
                {row.billable ? "Yes" : "No"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <ProductivityTabs
      currentTab={tab}
      overview={overview}
      byEmployee={byEmployee}
      byClient={byClient}
      allRecords={allRecords}
    />
  );
}
