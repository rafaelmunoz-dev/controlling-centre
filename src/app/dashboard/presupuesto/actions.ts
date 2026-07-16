"use server";

import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { budgets } from "@/db/schema";

const PL_LINES = ["revenue", "direct_cost", "indirect_cost"] as const;

export type BudgetFormState = {
  errors: Record<string, string>;
  values: {
    entityId: string;
    month: string;
    revenue: string;
    direct_cost: string;
    indirect_cost: string;
  };
};

function parseAmount(raw: FormDataEntryValue | null): number | null {
  if (raw === null) return null;
  const trimmed = String(raw).trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
}

export async function saveBudget(
  allowedEntityIds: string[],
  prevState: BudgetFormState,
  formData: FormData
): Promise<BudgetFormState> {
  const entityId = String(formData.get("entityId") ?? "");
  const monthInput = String(formData.get("month") ?? ""); // "YYYY-MM"
  const rawAmounts = {
    revenue: String(formData.get("revenue") ?? ""),
    direct_cost: String(formData.get("direct_cost") ?? ""),
    indirect_cost: String(formData.get("indirect_cost") ?? ""),
  };

  const values = { entityId, month: monthInput, ...rawAmounts };
  const errors: Record<string, string> = {};

  if (!entityId) {
    errors.entityId = "Entity is required.";
  } else if (!allowedEntityIds.includes(entityId)) {
    errors.entityId = "Entity is not in the current scope.";
  }

  if (!/^\d{4}-\d{2}$/.test(monthInput)) {
    errors.month = "Month is required.";
  }

  const parsedAmounts: Record<string, number> = {};
  for (const plLine of PL_LINES) {
    const parsed = parseAmount(formData.get(plLine));
    if (parsed === null) {
      errors[plLine] = "Must be a valid number.";
    } else {
      parsedAmounts[plLine] = parsed;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { errors, values };
  }

  const month = `${monthInput}-01`;

  const rows = PL_LINES.map((plLine) => ({
    entityId,
    month,
    plLine,
    amount: parsedAmounts[plLine].toFixed(2),
  }));

  await db
    .insert(budgets)
    .values(rows)
    .onConflictDoUpdate({
      target: [budgets.entityId, budgets.month, budgets.plLine],
      set: {
        amount: sql`excluded.amount`,
        updatedAt: sql`now()`,
      },
    });

  revalidatePath("/dashboard/presupuesto");
  revalidatePath("/dashboard");

  return {
    errors: {},
    values: {
      entityId,
      month: monthInput,
      revenue: parsedAmounts.revenue.toFixed(2),
      direct_cost: parsedAmounts.direct_cost.toFixed(2),
      indirect_cost: parsedAmounts.indirect_cost.toFixed(2),
    },
  };
}

export async function deleteBudget(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await db.delete(budgets).where(eq(budgets.id, id));

  revalidatePath("/dashboard/presupuesto");
  revalidatePath("/dashboard");
}
