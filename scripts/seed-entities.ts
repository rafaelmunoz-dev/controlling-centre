import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  // Import dinámico: db/index.ts lee DATABASE_URL al cargar el módulo,
  // tiene que pasar después de que dotenv haya inyectado el env.
  const { eq } = await import("drizzle-orm");
  const { db } = await import("../src/db");
  const { entities } = await import("../src/db/schema");

  async function getOrCreate(
    name: string,
    groupParentId: string | null,
    code: string | null = null
  ) {
    const existing = await db
      .select()
      .from(entities)
      .where(eq(entities.name, name))
      .limit(1);

    if (existing.length > 0) {
      const row = existing[0];
      if (code !== null && row.code !== code) {
        const [updated] = await db
          .update(entities)
          .set({ code })
          .where(eq(entities.id, row.id))
          .returning();
        return updated;
      }
      return row;
    }

    const [created] = await db
      .insert(entities)
      .values({ name, groupParentId, code })
      .onConflictDoNothing()
      .returning();

    return created;
  }

  const lpoInternational = await getOrCreate("LPO International", null);
  const kanzlei = await getOrCreate("Rechtsanwaltskanzlei Andreas Akhtar", null);
  const miguGroup = await getOrCreate("MIGU Group", null);
  const imperium = await getOrCreate("Imperium", miguGroup.id, "IMP");
  const miguCA = await getOrCreate("MIGU C&A", miguGroup.id, "C&A");
  const miguMarketing = await getOrCreate("MIGU Marketing", miguGroup.id, "MKT");
  const haciendaLaTrinitaria = await getOrCreate(
    "Hacienda La Trinitaria",
    miguGroup.id,
    "CPE"
  );
  const miguCosmeticos = await getOrCreate("MIGU Cosméticos", miguGroup.id, "COSM");

  const rows = [
    lpoInternational,
    kanzlei,
    miguGroup,
    imperium,
    miguCA,
    miguMarketing,
    haciendaLaTrinitaria,
    miguCosmeticos,
  ];

  console.log("Entidades sembradas:");
  for (const row of rows) {
    console.log(
      `- ${row.name} (id: ${row.id}, code: ${row.code ?? "null"}, groupParentId: ${row.groupParentId ?? "null"})`
    );
  }

  const imperiumOk = imperium.groupParentId === miguGroup.id && imperium.code === "IMP";
  console.log(
    imperiumOk
      ? `\nOK: Imperium.groupParentId (${imperium.groupParentId}) apunta a MIGU Group (${miguGroup.id}) y code=IMP.`
      : `\nERROR: Imperium.groupParentId (${imperium.groupParentId}) o code (${imperium.code}) no coinciden con lo esperado.`
  );

  process.exit(0);
}

main().catch((err) => {
  console.error("Fallo al sembrar entidades:", err);
  process.exit(1);
});
