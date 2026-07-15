// TEMPORAL — reemplazar por Entra ID antes de producción.
// Ver docs/decisions/0003-entra-id-auth.md

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

async function loginAsDeveloper() {
  "use server";

  const cookieStore = await cookies();
  cookieStore.set("cc_dev_session", "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  redirect("/dashboard");
}

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-16">
      <p className="text-sm text-red-600">
        Login temporal de desarrollo — no usar en producción.
      </p>
      <form action={loginAsDeveloper}>
        <button
          type="submit"
          className="rounded bg-black px-4 py-2 text-white"
        >
          Entrar como desarrollador (temporal)
        </button>
      </form>
    </div>
  );
}
