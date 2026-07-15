import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { timeEntries, employees, clients } from "@/db/schema";

async function logout() {
  "use server";

  const cookieStore = await cookies();
  cookieStore.delete("cc_dev_session");

  redirect("/");
}

export default async function DashboardPage() {
  const rows = await db
    .select({
      employeeName: employees.name,
      clientName: clients.name,
      date: timeEntries.date,
      hours: timeEntries.hours,
      billable: timeEntries.billable,
      project: timeEntries.project,
    })
    .from(timeEntries)
    .leftJoin(employees, eq(timeEntries.employeeId, employees.id))
    .leftJoin(clients, eq(timeEntries.clientId, clients.id))
    .orderBy(desc(timeEntries.date))
    .limit(50);

  return (
    <div className="p-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Horas (últimos 50 registros)</h1>
        <form action={logout}>
          <button type="submit" className="rounded border px-3 py-1">
            Cerrar sesión
          </button>
        </form>
      </div>

      <table border={1} cellPadding={4}>
        <thead>
          <tr>
            <th>Empleado</th>
            <th>Cliente</th>
            <th>Fecha</th>
            <th>Horas</th>
            <th>Facturable</th>
            <th>Proyecto</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td>{row.employeeName ?? "—"}</td>
              <td>{row.clientName ?? "—"}</td>
              <td>{row.date}</td>
              <td>{row.hours}</td>
              <td>{row.billable ? "Sí" : "No"}</td>
              <td>{row.project ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
