import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { timeEntries, employees, clients, entities } from "@/db/schema";
import { resolveScopeEntityIds } from "@/lib/entity-tree";

export default async function ProductividadPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string }>;
}) {
  const scope = (await searchParams).scope ?? "all";

  const entityRows = await db
    .select({ id: entities.id, groupParentId: entities.groupParentId })
    .from(entities);
  const entityIds = resolveScopeEntityIds(scope, entityRows);

  const baseQuery = db
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

  const rows = await (entityIds
    ? baseQuery.where(inArray(employees.entityId, entityIds))
    : baseQuery
  )
    .orderBy(desc(timeEntries.date))
    .limit(50);

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-foreground">
        Hours (last 50 records)
      </h1>

      <table className="w-full border-collapse border border-border text-sm">
        <thead>
          <tr className="bg-muted">
            <th className="border border-border px-2 py-1 text-left">
              Employee
            </th>
            <th className="border border-border px-2 py-1 text-left">
              Client
            </th>
            <th className="border border-border px-2 py-1 text-left">
              Date
            </th>
            <th className="border border-border px-2 py-1 text-left">
              Hours
            </th>
            <th className="border border-border px-2 py-1 text-left">
              Billable
            </th>
            <th className="border border-border px-2 py-1 text-left">
              Project
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
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
  );
}
