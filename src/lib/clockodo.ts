const API_USER = process.env.CLOCKODO_API_USER;
const API_KEY = process.env.CLOCKODO_API_KEY;

// Placeholder de contacto — ajustar si cambia el responsable del proyecto.
const EXTERNAL_APPLICATION =
  "ControllingCentre;rafael.munoz-palacios@lpo-international.com";

function headers() {
  if (!API_USER || !API_KEY) {
    throw new Error(
      "Faltan CLOCKODO_API_USER y/o CLOCKODO_API_KEY en el entorno"
    );
  }
  return {
    "X-ClockodoApiUser": API_USER,
    "X-ClockodoApiKey": API_KEY,
    "X-Clockodo-External-Application": EXTERNAL_APPLICATION,
  };
}

async function getJson(url: string) {
  const response = await fetch(url, { headers: headers() });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Clockodo API error ${response.status}: ${body}`);
  }
  return response.json();
}

export type ClockodoUser = {
  id: number;
  name: string;
};

export type ClockodoCustomer = {
  id: number;
  name: string;
};

export type ClockodoEntry = {
  id: number;
  customers_id: number | null;
  projects_id: number | null;
  users_id: number;
  billable: 0 | 1;
  text: string | null;
  time_since: string;
  time_until: string | null;
  duration: number | null;
  type: number;
};

// /users y /customers ya migraron a v3.
async function fetchAllPagesV3<T>(resource: "users" | "customers"): Promise<T[]> {
  const items: T[] = [];
  let page = 1;

  while (true) {
    const data = await getJson(
      `https://my.clockodo.com/api/v3/${resource}?page=${page}`
    );
    items.push(...data.data);

    if (page >= data.paging.count_pages) break;
    page += 1;
  }

  return items;
}

export function fetchUsers(): Promise<ClockodoUser[]> {
  return fetchAllPagesV3<ClockodoUser>("users");
}

export function fetchCustomers(): Promise<ClockodoCustomer[]> {
  return fetchAllPagesV3<ClockodoCustomer>("customers");
}

// /entries todavía no migró a v3 (v3 devuelve 404 para este recurso).
export async function fetchTimeEntries(
  dateFrom: Date,
  dateTo: Date
): Promise<ClockodoEntry[]> {
  const entries: ClockodoEntry[] = [];
  let page = 1;

  // Clockodo exige segundos, sin milisegundos (2026-06-15T00:00:00Z).
  const toClockodoIso = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, "Z");

  const params = new URLSearchParams({
    time_since: toClockodoIso(dateFrom),
    time_until: toClockodoIso(dateTo),
  });

  while (true) {
    const data = await getJson(
      `https://my.clockodo.com/api/v2/entries?${params.toString()}&page=${page}`
    );
    entries.push(...data.entries);

    if (page >= data.paging.count_pages) break;
    page += 1;
  }

  return entries;
}
