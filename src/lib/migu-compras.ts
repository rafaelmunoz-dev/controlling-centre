const API_URL = process.env.MIGU_COMPRAS_API_URL;
const API_KEY = process.env.MIGU_COMPRAS_API_KEY;

function headers() {
  if (!API_URL || !API_KEY) {
    throw new Error(
      "Faltan MIGU_COMPRAS_API_URL y/o MIGU_COMPRAS_API_KEY en el entorno"
    );
  }
  return {
    "x-api-key": API_KEY,
  };
}

export type MiguCompany = {
  name: string;
  code: string;
  type: "EMPRESA" | "DEPARTAMENTO";
};

export type MiguPerson = {
  name: string;
  email: string;
  role?: string;
};

export type MiguOrderItem = {
  description: string;
  quantity: number;
  unit: string;
};

export type MiguOrderSupplier = {
  name: string;
  amount: number;
  currency: string;
};

export type MiguOrder = {
  orderNumber: string;
  status: string;
  priority: string;
  createdAt: string;
  approvedAt: string | null;
  executedAt: string | null;
  completedAt: string | null;
  company: MiguCompany;
  requestedBy: MiguPerson;
  approvedBy: MiguPerson | null;
  items: MiguOrderItem[];
  suppliers: MiguOrderSupplier[];
  totalByCurrency: Record<string, number>;
};

export async function fetchOrders(): Promise<MiguOrder[]> {
  if (!API_URL) {
    throw new Error("Falta MIGU_COMPRAS_API_URL en el entorno");
  }

  const response = await fetch(`${API_URL}/api/external/orders`, {
    headers: headers(),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`MiGu Compras API error ${response.status}: ${body}`);
  }

  const data = await response.json();
  return data.orders;
}
