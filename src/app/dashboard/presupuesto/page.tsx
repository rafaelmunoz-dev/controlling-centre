import Link from "next/link";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { budgets, entities } from "@/db/schema";
import { filterEntitiesByScope, resolveScopeEntityIds } from "@/lib/entity-tree";
import { formatAmount } from "@/lib/format";
import { BudgetForm } from "./budget-form";
import { DeleteBudgetForm } from "./delete-budget-form";
import { saveBudget, deleteBudget } from "./actions";

const PL_LINE_LABELS: Record<string, string> = {
  revenue: "Revenue",
  direct_cost: "Direct Costs",
  indirect_cost: "Indirect Costs",
};

export default async function PresupuestoPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string; edit?: string }>;
}) {
  const { scope: scopeParam, edit } = await searchParams;
  const scope = scopeParam ?? "all";

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
      id: budgets.id,
      entityId: budgets.entityId,
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

  let editEntityId: string | null = null;
  let editMonth: string | null = null;
  if (edit) {
    const [entityId, month] = edit.split(":");
    editEntityId = entityId ?? null;
    editMonth = month ?? null;
  }

  const initialValues = {
    entityId: editEntityId ?? scopedEntities[0]?.id ?? "",
    month: editMonth ?? "",
    revenue: "0",
    direct_cost: "0",
    indirect_cost: "0",
  };

  if (editEntityId && editMonth) {
    for (const row of existing) {
      if (
        row.entityId === editEntityId &&
        row.month.slice(0, 7) === editMonth &&
        row.plLine in PL_LINE_LABELS
      ) {
        (initialValues as Record<string, string>)[row.plLine] = row.amount;
      }
    }
  }

  const boundSaveBudget = saveBudget.bind(
    null,
    scopedEntities.map((entity) => entity.id)
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="mb-4 text-xl font-semibold text-foreground">
          {editEntityId ? "Edit budget" : "Load budget"}
        </h1>

        <BudgetForm
          key={edit ?? "new"}
          action={boundSaveBudget}
          scopedEntities={scopedEntities}
          initialValues={initialValues}
        />
      </div>

      <div>
        <h2 className="mb-2 text-lg font-semibold text-foreground">
          Already loaded
        </h2>
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-3 py-2 text-left text-xs font-normal text-muted-foreground">
                  Entity
                </th>
                <th className="px-3 py-2 text-left text-xs font-normal text-muted-foreground">
                  Month
                </th>
                <th className="px-3 py-2 text-left text-xs font-normal text-muted-foreground">
                  Line
                </th>
                <th className="px-3 py-2 text-right text-xs font-normal text-muted-foreground">
                  Amount
                </th>
                <th className="px-3 py-2 text-left text-xs font-normal text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="[&>tr:nth-child(even)]:bg-muted/30">
              {existing.map((row) => (
                <tr key={row.id}>
                  <td className="px-3 py-2">
                    {row.entityName ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    {row.month}
                  </td>
                  <td className="px-3 py-2">
                    {PL_LINE_LABELS[row.plLine] ?? row.plLine}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatAmount(row.amount)}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/presupuesto?scope=${scope}&edit=${row.entityId}:${row.month.slice(0, 7)}`}
                        className="text-sm text-primary underline"
                      >
                        Edit
                      </Link>
                      <DeleteBudgetForm id={row.id} action={deleteBudget} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
