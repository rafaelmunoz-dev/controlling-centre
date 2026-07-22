// TEMPORAL — reemplazar por Entra ID antes de producción.
// Ver docs/decisions/0003-entra-id-auth.md
// El campo "Your name" y su cookie tambien son parte de este login temporal;
// se reemplazan por el nombre real de Entra ID cuando este disponible.

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

async function loginAsDeveloper(formData: FormData) {
  "use server";

  const name = (formData.get("name") as string | null)?.trim();

  const cookieStore = await cookies();
  cookieStore.set("cc_dev_session", "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  if (name) {
    cookieStore.set("cc_dev_name", encodeURIComponent(name), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }

  redirect("/dashboard");
}

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-16">
      <p className="text-sm text-red-600">
        Temporary developer login — do not use in production.
      </p>
      <form action={loginAsDeveloper} className="flex flex-col items-center gap-3">
        <input
          type="text"
          name="name"
          placeholder="Your name"
          className="h-9 w-64 rounded border border-input bg-background px-3 text-sm text-foreground"
        />
        <button
          type="submit"
          className="rounded bg-black px-4 py-2 text-white"
        >
          Sign in as developer (temporary)
        </button>
      </form>
    </div>
  );
}
