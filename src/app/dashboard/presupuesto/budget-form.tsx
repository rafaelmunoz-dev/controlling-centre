"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BudgetFormState } from "./actions";

type BoundSaveBudget = (
  prevState: BudgetFormState,
  formData: FormData
) => Promise<BudgetFormState>;

export function BudgetForm({
  action,
  scopedEntities,
  initialValues,
}: {
  action: BoundSaveBudget;
  scopedEntities: { id: string; name: string }[];
  initialValues: BudgetFormState["values"];
}) {
  const [state, formAction, pending] = useActionState(action, {
    errors: {},
    values: initialValues,
  });

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-md">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="entityId">Entity</Label>
        <select
          id="entityId"
          name="entityId"
          defaultValue={state.values.entityId}
          required
          className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
        >
          {scopedEntities.map((entity) => (
            <option key={entity.id} value={entity.id}>
              {entity.name}
            </option>
          ))}
        </select>
        {state.errors.entityId && (
          <p className="text-sm text-destructive">{state.errors.entityId}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="month">Month</Label>
        <Input
          id="month"
          name="month"
          type="month"
          defaultValue={state.values.month}
          required
        />
        {state.errors.month && (
          <p className="text-sm text-destructive">{state.errors.month}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="revenue">Revenue</Label>
        <Input
          id="revenue"
          name="revenue"
          type="number"
          step="0.01"
          defaultValue={state.values.revenue}
          required
        />
        {state.errors.revenue && (
          <p className="text-sm text-destructive">{state.errors.revenue}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="direct_cost">Direct cost</Label>
        <Input
          id="direct_cost"
          name="direct_cost"
          type="number"
          step="0.01"
          defaultValue={state.values.direct_cost}
          required
        />
        {state.errors.direct_cost && (
          <p className="text-sm text-destructive">
            {state.errors.direct_cost}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="indirect_cost">Indirect cost</Label>
        <Input
          id="indirect_cost"
          name="indirect_cost"
          type="number"
          step="0.01"
          defaultValue={state.values.indirect_cost}
          required
        />
        {state.errors.indirect_cost && (
          <p className="text-sm text-destructive">
            {state.errors.indirect_cost}
          </p>
        )}
      </div>

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Saving…" : "Save budget"}
      </Button>
    </form>
  );
}
