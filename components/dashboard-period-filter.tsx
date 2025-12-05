"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PeriodFilter } from "@/lib/types/dashboard";

const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "week", label: "Esta semana" },
  { value: "month", label: "Este mês" },
];

export function DashboardPeriodFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPeriod = (searchParams.get("period") as PeriodFilter) || "today";

  const handlePeriodChange = (value: PeriodFilter) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", value);
    router.push(`/dashboard?${params.toString()}`);
  };

  return (
    <div data-testid="period-filter">
      <Select value={currentPeriod} onValueChange={handlePeriodChange}>
        <SelectTrigger className="w-[150px]" data-testid="period-filter-trigger">
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          {PERIOD_OPTIONS.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              data-testid={`period-option-${option.value}`}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
