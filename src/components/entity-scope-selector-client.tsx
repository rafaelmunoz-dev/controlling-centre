"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EntityOption } from "@/lib/entity-tree";

export function EntityScopeSelectorClient({
  options,
}: {
  options: EntityOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentScope = searchParams.get("scope") ?? "all";

  function handleChange(value: string | null) {
    if (!value) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("scope", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Select value={currentScope} onValueChange={handleChange}>
      <SelectTrigger className="w-64">
        <SelectValue placeholder="Select entity">
          {(value: string | null) =>
            options.find((option) => option.value === value)?.label ??
            "Select entity"
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <span style={{ paddingLeft: option.depth * 16 }}>
              {option.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
