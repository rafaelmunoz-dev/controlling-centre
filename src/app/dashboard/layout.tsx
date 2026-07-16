import { Suspense } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "@/components/app-sidebar";
import { EntityScopeSelector } from "@/components/entity-scope-selector";
import { PeriodSelector } from "@/components/period-selector";
import { logout } from "./actions";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 items-center gap-4 border-b border-border px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6" />
          <Suspense fallback={<div className="w-64" />}>
            <EntityScopeSelector />
          </Suspense>
          <Suspense fallback={<div className="w-48" />}>
            <PeriodSelector />
          </Suspense>
          <div className="flex-1" />
          <form action={logout}>
            <Button type="submit" variant="outline">
              Sign out
            </Button>
          </form>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
