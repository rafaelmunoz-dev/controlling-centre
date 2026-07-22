import { Suspense } from "react";
import { cookies } from "next/headers";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { EntityScopeSelector } from "@/components/entity-scope-selector";
import { PeriodSelector } from "@/components/period-selector";
import { UserMenu } from "@/components/dashboard/user-menu";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const rawName = cookieStore.get("cc_dev_name")?.value;
  const userName = rawName ? decodeURIComponent(rawName) : null;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 md:h-16 md:py-0">
          <SidebarTrigger />
          <Suspense fallback={<div className="h-8 w-32 rounded-md bg-muted" />}>
            <EntityScopeSelector />
          </Suspense>
          <Suspense fallback={<div className="h-8 w-28 rounded-md bg-muted" />}>
            <PeriodSelector />
          </Suspense>
          <div className="ml-auto">
            <UserMenu name={userName} />
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
