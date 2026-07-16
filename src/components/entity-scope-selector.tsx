import { db } from "@/db";
import { entities } from "@/db/schema";
import { buildEntityScopeOptions } from "@/lib/entity-tree";
import { EntityScopeSelectorClient } from "./entity-scope-selector-client";

export async function EntityScopeSelector() {
  const rows = await db
    .select({
      id: entities.id,
      name: entities.name,
      groupParentId: entities.groupParentId,
    })
    .from(entities);

  const options = buildEntityScopeOptions(rows);

  return <EntityScopeSelectorClient options={options} />;
}
