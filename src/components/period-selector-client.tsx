"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function PeriodSelectorClient({
  options,
}: {
  options: { value: string; label: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPeriod = searchParams.get("period") ?? options[0]?.value ?? "";

  function handleChange(value: string | null) {
    if (!value) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Select value={currentPeriod} onValueChange={handleChange}>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Select period">
          {(value: string | null) =>
            options.find((option) => option.value === value)?.label ??
            "Select period"
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
