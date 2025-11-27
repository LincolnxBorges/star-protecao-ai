/**
 * Seller Status Tabs Component
 * @module components/vendedores-status-tabs
 *
 * Tabs para filtrar por status: Todos, Ativos, Inativos, Ferias.
 */

"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { SellerStatus, StatusCounts } from "@/lib/types/sellers";

type StatusFilter = SellerStatus | "all";

interface VendedoresStatusTabsProps {
  value: StatusFilter;
  onChange: (value: StatusFilter) => void;
  counts: StatusCounts;
  disabled?: boolean;
}

const STATUS_TABS: Array<{
  value: StatusFilter;
  label: string;
  countKey: keyof StatusCounts;
}> = [
  { value: "all", label: "Todos", countKey: "all" },
  { value: "ACTIVE", label: "Ativos", countKey: "active" },
  { value: "INACTIVE", label: "Inativos", countKey: "inactive" },
  { value: "VACATION", label: "Ferias", countKey: "vacation" },
];

export function VendedoresStatusTabs({
  value,
  onChange,
  counts,
  disabled,
}: VendedoresStatusTabsProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(v) => onChange(v as StatusFilter)}
      className="w-full"
    >
      <TabsList className="w-full justify-start h-auto p-1 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            disabled={disabled}
            className="data-[state=active]:bg-background gap-2"
          >
            {tab.label}
            <Badge
              variant={value === tab.value ? "default" : "secondary"}
              className="h-5 min-w-[20px] px-1.5 text-xs"
            >
              {counts[tab.countKey]}
            </Badge>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
