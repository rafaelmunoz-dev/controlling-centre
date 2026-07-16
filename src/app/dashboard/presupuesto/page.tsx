import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { budgets, entities } from "@/db/schema";
import { filterEntitiesByScope, resolveScopeEntityIds } from "@/lib/entity-tree";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveBudget } from "./actions";

const PL_LINE_LABELS: Record<string, string> = {
  revenue: "Revenue",
  direct_cost: "Direct cost",
  indirect_cost: "Indirect cost",
};

export default async function PresupuestoPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string }>;
}) {
  const scope = (await searchParams).scope ?? "all";

  const entityRows = await db
    .select({
      id: entities.id,
      name: entities.name,
      groupParentId: entities.groupParentId,
    })
    .from(entities);

  const scopedEntities = filterEntitiesByScope(scope, entityRows);
  const scopedIds = resolveScopeEntityIds(scope, entityRows);

  const existingQuery = db
    .select({
      entityName: entities.name,
      month: budgets.month,
      plLine: budgets.plLine,
      amount: budgets.amount,
    })
    .from(budgets)
    .leftJoin(entities, eq(budgets.entityId, entities.id));

  const existing = await (scopedIds
    ? existingQuery.where(inArray(budgets.entityId, scopedIds))
    : existingQuery
  ).orderBy(desc(budgets.month));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="mb-4 text-xl font-semibold text-foreground">
          Load budget
        </h1>

        <form action={saveBudget} className="flex flex-col gap-4 max-w-md">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="entityId">Entity</Label>
            <select
              id="entityId"
              name="entityId"
              required
              className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            >
              {scopedEntities.map((entity) => (
                <option key={entity.id} value={entity.id}>
                  {entity.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="month">Month</Label>
            <Input id="month" name="month" type="month" required />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="revenue">Revenue</Label>
            <Input
              id="revenue"
              name="revenue"
              type="number"
              step="0.01"
              defaultValue="0"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="direct_cost">Direct cost</Label>
            <Input
              id="direct_cost"
              name="direct_cost"
              type="number"
              step="0.01"
              defaultValue="0"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="indirect_cost">Indirect cost</Label>
            <Input
              id="indirect_cost"
              name="indirect_cost"
              type="number"
              step="0.01"
              defaultValue="0"
              required
            />
          </div>

          <Button type="submit" className="w-fit">
            Save budget
          </Button>
        </form>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-semibold text-foreground">
          Already loaded
        </h2>
        <table className="w-full border-collapse border border-border text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="border border-border px-2 py-1 text-left">
                Entity
              </th>
              <th className="border border-border px-2 py-1 text-left">
                Month
              </th>
              <th className="border border-border px-2 py-1 text-left">
                Line
              </th>
              <th className="border border-border px-2 py-1 text-left">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {existing.map((row, i) => (
              <tr key={i}>
                <td className="border border-border px-2 py-1">
                  {row.entityName ?? "—"}
                </td>
                <td className="border border-border px-2 py-1">
                  {row.month}
                </td>
                <td className="border border-border px-2 py-1">
                  {PL_LINE_LABELS[row.plLine] ?? row.plLine}
                </td>
                <td className="border border-border px-2 py-1">
                  {row.amount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
