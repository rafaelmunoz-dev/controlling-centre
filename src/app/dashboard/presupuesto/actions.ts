"use server";

import { revalidatePath } from "next/cache";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { budgets } from "@/db/schema";

const PL_LINES = ["revenue", "direct_cost", "indirect_cost"] as const;

export async function saveBudget(formData: FormData) {
  const entityId = String(formData.get("entityId") ?? "");
  const monthInput = String(formData.get("month") ?? ""); // "YYYY-MM"

  if (!entityId || !monthInput) {
    throw new Error("Faltan entidad o mes");
  }

  const month = `${monthInput}-01`;

  const rows = PL_LINES.map((plLine) => ({
    entityId,
    month,
    plLine,
    amount: String(formData.get(plLine) ?? "0"),
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
}
