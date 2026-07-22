"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function EmployeeSelectClient({
  employees,
  currentEmployeeId,
}: {
  employees: { id: string; name: string }[];
  currentEmployeeId: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(value: string | null) {
    if (!value) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("employee", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Select value={currentEmployeeId ?? ""} onValueChange={handleChange}>
      <SelectTrigger className="w-full sm:w-64">
        <SelectValue placeholder="Select employee">
          {(value: string | null) =>
            employees.find((employee) => employee.id === value)?.name ??
            "Select employee"
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {employees.map((employee) => (
          <SelectItem key={employee.id} value={employee.id}>
            {employee.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
