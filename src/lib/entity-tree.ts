export type EntityRow = {
  id: string;
  name: string;
  groupParentId: string | null;
};

export type EntityOption = {
  value: string;
  label: string;
  depth: number;
};

/**
 * Orden de la lista: consolidado "Andreas Akhtar" primero, luego las
 * entidades sueltas (sin padre ni hijas), luego los grupos con sus hijas
 * indentadas debajo de cada padre.
 */
export function buildEntityScopeOptions(rows: EntityRow[]): EntityOption[] {
  const childrenByParent = new Map<string, EntityRow[]>();
  for (const row of rows) {
    if (row.groupParentId) {
      const siblings = childrenByParent.get(row.groupParentId) ?? [];
      siblings.push(row);
      childrenByParent.set(row.groupParentId, siblings);
    }
  }

  const topLevel = rows.filter((r) => r.groupParentId === null);
  const standalone = topLevel.filter((r) => !childrenByParent.has(r.id));
  const groupParents = topLevel.filter((r) => childrenByParent.has(r.id));

  const options: EntityOption[] = [
    { value: "all", label: "Andreas Akhtar (consolidated)", depth: 0 },
  ];

  for (const entity of standalone) {
    options.push({ value: entity.id, label: entity.name, depth: 0 });
  }

  for (const parent of groupParents) {
    options.push({ value: parent.id, label: parent.name, depth: 0 });
    for (const child of childrenByParent.get(parent.id) ?? []) {
      options.push({ value: child.id, label: child.name, depth: 1 });
    }
  }

  return options;
}

/**
 * Resuelve un scope (?scope=all | ?scope=<entityId>) a la lista de
 * entityIds que hay que incluir en los filtros. Si el scope es un grupo
 * padre, incluye también a sus hijas.
 */
export function resolveScopeEntityIds(
  scope: string,
  rows: Pick<EntityRow, "id" | "groupParentId">[]
): string[] | null {
  if (scope === "all") return null;

  const ids = [scope];
  for (const row of rows) {
    if (row.groupParentId === scope) ids.push(row.id);
  }
  return ids;
}

/** Entidades reales (sin el pseudo-item "all") dentro de un scope dado. */
export function filterEntitiesByScope(
  scope: string,
  rows: EntityRow[]
): EntityRow[] {
  if (scope === "all") return rows;
  const ids = new Set(resolveScopeEntityIds(scope, rows) ?? []);
  return rows.filter((row) => ids.has(row.id));
}
