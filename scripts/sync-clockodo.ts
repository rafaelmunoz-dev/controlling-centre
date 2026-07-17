import { config } from "dotenv";

config({ path: ".env.local" });

const LPO_INTERNATIONAL_ID = "51c9ba4b-d7b1-42e1-a7ff-4ca49dc412d7";

async function main() {
  // Import dinámico: db/index.ts lee DATABASE_URL al cargar el módulo,
  // tiene que pasar después de que dotenv haya inyectado el env.
  const { sql } = await import("drizzle-orm");
  const { db } = await import("../src/db");
  const { employees, clients, timeEntries, syncLogs } = await import(
    "../src/db/schema"
  );
  const { fetchUsers, fetchCustomers, fetchTimeEntries } = await import(
    "../src/lib/clockodo"
  );

  async function countRows(table: any) {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(table);
    return count;
  }

  function chunk<T>(arr: T[], size: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  }

  let totalRecords = 0;

  try {
    // --- employees ---
    const users = await fetchUsers();
    const employeesBefore = await countRows(employees);

    for (const batch of chunk(users, 500)) {
      await db
        .insert(employees)
        .values(
          batch.map((u) => ({
            entityId: LPO_INTERNATIONAL_ID,
            name: u.name,
            clockodoId: u.id,
          }))
        )
        .onConflictDoUpdate({
          target: employees.clockodoId,
          set: { name: sql`excluded.name` },
        });
    }

    const employeesAfter = await countRows(employees);
    const employeesInserted = employeesAfter - employeesBefore;
    const employeesUpdated = users.length - employeesInserted;

    // --- clients ---
    const customers = await fetchCustomers();
    const clientsBefore = await countRows(clients);

    for (const batch of chunk(customers, 500)) {
      await db
        .insert(clients)
        .values(
          batch.map((c) => ({
            name: c.name,
            clockodoCustomerId: c.id,
          }))
        )
        .onConflictDoUpdate({
          target: clients.clockodoCustomerId,
          set: { name: sql`excluded.name` },
        });
    }

    const clientsAfter = await countRows(clients);
    const clientsInserted = clientsAfter - clientsBefore;
    const clientsUpdated = customers.length - clientsInserted;

    // --- time entries (último mes) ---
    const dateTo = new Date();
    const dateFrom = new Date(dateTo);
    dateFrom.setMonth(dateFrom.getMonth() - 1);

    const entries = await fetchTimeEntries(dateFrom, dateTo);

    // Mapas clockodoId -> uuid, construidos después del upsert de arriba.
    const employeeRows = await db
      .select({ id: employees.id, clockodoId: employees.clockodoId })
      .from(employees);
    const employeeByClockodoId = new Map(
      employeeRows.map((e) => [e.clockodoId, e.id])
    );

    const clientRows = await db
      .select({ id: clients.id, clockodoCustomerId: clients.clockodoCustomerId })
      .from(clients);
    const clientByClockodoId = new Map(
      clientRows.map((c) => [c.clockodoCustomerId, c.id])
    );

    const entryRows: (typeof timeEntries.$inferInsert)[] = [];
    let skipped = 0;

    for (const entry of entries) {
      const employeeId = employeeByClockodoId.get(entry.users_id);
      if (!employeeId) {
        skipped += 1;
        continue;
      }

      const clientId = entry.customers_id
        ? clientByClockodoId.get(entry.customers_id) ?? null
        : null;

      const durationSeconds =
        entry.duration ??
        (entry.time_until
          ? (new Date(entry.time_until).getTime() -
              new Date(entry.time_since).getTime()) /
            1000
          : 0);

      entryRows.push({
        employeeId,
        clientId,
        date: entry.time_since.slice(0, 10),
        hours: (durationSeconds / 3600).toFixed(2),
        hourlyRate:
          entry.hourly_rate !== null ? entry.hourly_rate.toFixed(2) : null,
        billable: entry.billable === 1,
        project: entry.projects_id ? String(entry.projects_id) : null,
        // No hay evidencia de entries con type != 1 (absencia) en esta
        // cuenta, y el endpoint /absences está deprecado/no disponible
        // (410 en v2 y v3). Se deja null hasta poder mapearlo con datos reales.
        absenceType: null,
        note: entry.text ?? null,
        clockodoEntryId: entry.id,
      });
    }

    const timeEntriesBefore = await countRows(timeEntries);

    for (const batch of chunk(entryRows, 500)) {
      await db
        .insert(timeEntries)
        .values(batch)
        .onConflictDoUpdate({
          target: timeEntries.clockodoEntryId,
          set: {
            employeeId: sql`excluded.employee_id`,
            clientId: sql`excluded.client_id`,
            date: sql`excluded.date`,
            hours: sql`excluded.hours`,
            hourlyRate: sql`excluded.hourly_rate`,
            billable: sql`excluded.billable`,
            project: sql`excluded.project`,
            absenceType: sql`excluded.absence_type`,
            note: sql`excluded.note`,
          },
        });
    }

    const timeEntriesAfter = await countRows(timeEntries);
    const timeEntriesInserted = timeEntriesAfter - timeEntriesBefore;
    const timeEntriesUpdated = entryRows.length - timeEntriesInserted;

    totalRecords = users.length + customers.length + entryRows.length;

    await db.insert(syncLogs).values({
      source: "clockodo",
      status: "ok",
      records: totalRecords,
      message: null,
    });

    console.log("Sync Clockodo OK.");
    console.log(
      `- employees: ${employeesInserted} insertados, ${employeesUpdated} actualizados (total Clockodo: ${users.length})`
    );
    console.log(
      `- clients: ${clientsInserted} insertados, ${clientsUpdated} actualizados (total Clockodo: ${customers.length})`
    );
    console.log(
      `- time_entries: ${timeEntriesInserted} insertados, ${timeEntriesUpdated} actualizados` +
        (skipped > 0 ? `, ${skipped} omitidos (sin employee mapeado)` : "") +
        ` (rango ${dateFrom.toISOString().slice(0, 10)} a ${dateTo
          .toISOString()
          .slice(0, 10)}, total Clockodo: ${entries.length})`
    );

    process.exit(0);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    await db.insert(syncLogs).values({
      source: "clockodo",
      status: "error",
      records: totalRecords,
      message,
    });

    console.error("Sync Clockodo FALLÓ:", message);
    process.exit(1);
  }
}

main();
