// TEMPORAL — reemplazar por Entra ID antes de producción.
// Ver docs/decisions/0003-entra-id-auth.md

import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const session = request.cookies.get("cc_dev_session");

  if (!session) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
