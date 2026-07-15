import { config } from "dotenv";

config({ path: ".env.local" });

const API_USER = process.env.CLOCKODO_API_USER;
const API_KEY = process.env.CLOCKODO_API_KEY;

if (!API_USER || !API_KEY) {
  console.error(
    "Faltan CLOCKODO_API_USER y/o CLOCKODO_API_KEY en .env.local"
  );
  process.exit(1);
}

// Clockodo exige identificar la app llamante. Placeholder de contacto:
// ajustar el email si cambia el responsable del proyecto.
const EXTERNAL_APPLICATION = "ControllingCentre;rafael.munoz-palacios@lpo-international.com";

async function main() {
  const response = await fetch("https://my.clockodo.com/api/v3/users", {
    headers: {
      "X-ClockodoApiUser": API_USER!,
      "X-ClockodoApiKey": API_KEY!,
      "X-Clockodo-External-Application": EXTERNAL_APPLICATION,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`Clockodo API error: ${response.status} ${response.statusText}`);
    console.error(body);
    process.exit(1);
  }

  const data = await response.json();
  const users = data.data ?? [];

  console.log(`Conexión OK. ${users.length} usuario(s) encontrado(s):`);
  for (const user of users) {
    console.log(`- ${user.name} (id: ${user.id})`);
  }
}

main().catch((err) => {
  console.error("Fallo al llamar a Clockodo:", err);
  process.exit(1);
});
