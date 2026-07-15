import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  // Import dinámico: db/index.ts lee DATABASE_URL al cargar el módulo,
  // tiene que pasar después de que dotenv haya inyectado el env.
  const { eq } = await import("drizzle-orm");
  const { db } = await import("../src/db");
  const { entities } = await import("../src/db/schema");

  async function getOrCreate(name: string, groupParentId: string | null) {
    const existing = await db
      .select()
      .from(entities)
      .where(eq(entities.name, name))
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    const [created] = await db
      .insert(entities)
      .values({ name, groupParentId })
      .onConflictDoNothing()
      .returning();

    return created;
  }

  const lpoInternational = await getOrCreate("LPO International", null);
  const kanzlei = await getOrCreate("Kanzlei", null);
  const miguGroup = await getOrCreate("MIGU Group", null);
  const imperium = await getOrCreate("Imperium", miguGroup.id);

  const rows = [lpoInternational, kanzlei, miguGroup, imperium];

  console.log("Entidades sembradas:");
  for (const row of rows) {
    console.log(`- ${row.name} (id: ${row.id}, groupParentId: ${row.groupParentId ?? "null"})`);
  }

  const imperiumOk = imperium.groupParentId === miguGroup.id;
  console.log(
    imperiumOk
      ? `\nOK: Imperium.groupParentId (${imperium.groupParentId}) apunta a MIGU Group (${miguGroup.id}).`
      : `\nERROR: Imperium.groupParentId (${imperium.groupParentId}) NO coincide con MIGU Group (${miguGroup.id}).`
  );

  process.exit(0);
}

main().catch((err) => {
  console.error("Fallo al sembrar entidades:", err);
  process.exit(1);
});
