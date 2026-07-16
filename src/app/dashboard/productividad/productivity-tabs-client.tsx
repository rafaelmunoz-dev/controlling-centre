"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ProductivityTabs({
  currentTab,
  overview,
  byEmployee,
  byClient,
  allRecords,
}: {
  currentTab: string;
  overview: React.ReactNode;
  byEmployee: React.ReactNode;
  byClient: React.ReactNode;
  allRecords: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(value: string | null) {
    if (!value) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Tabs value={currentTab} onValueChange={handleChange}>
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="by-employee">By employee</TabsTrigger>
        <TabsTrigger value="by-client">By client</TabsTrigger>
        <TabsTrigger value="all-records">All records</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">{overview}</TabsContent>
      <TabsContent value="by-employee">{byEmployee}</TabsContent>
      <TabsContent value="by-client">{byClient}</TabsContent>
      <TabsContent value="all-records">{allRecords}</TabsContent>
    </Tabs>
  );
}
