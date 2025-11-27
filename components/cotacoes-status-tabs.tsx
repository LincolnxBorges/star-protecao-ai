/**
 * Cotacoes Status Tabs Component
 * @module components/cotacoes-status-tabs
 *
 * Tabs de filtro por status com contadores conforme FR-002, FR-003.
 * Status disponíveis: Todas, Pendentes, Contatadas, Aceitas, Expiradas
 */

"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { StatusCount, QuotationStatus } from "@/lib/types/quotations";

interface CotacoesStatusTabsProps {
  statusCounts: StatusCount[];
  currentStatus: QuotationStatus | "ALL";
  onStatusChange: (status: QuotationStatus | "ALL") => void;
  isLoading?: boolean;
}

interface TabConfig {
  value: QuotationStatus | "ALL";
  label: string;
  variant?: "default" | "secondary" | "destructive" | "outline";
}

const TABS_CONFIG: TabConfig[] = [
  { value: "ALL", label: "Todas" },
  { value: "PENDING", label: "Pendentes", variant: "default" },
  { value: "CONTACTED", label: "Contatadas", variant: "secondary" },
  { value: "ACCEPTED", label: "Aceitas", variant: "default" },
  { value: "EXPIRED", label: "Expiradas", variant: "outline" },
  { value: "CANCELLED", label: "Canceladas", variant: "destructive" },
];

export function CotacoesStatusTabs({
  statusCounts,
  currentStatus,
  onStatusChange,
  isLoading,
}: CotacoesStatusTabsProps) {
  // Calculate total count
  const totalCount = statusCounts.reduce((sum, item) => sum + item.count, 0);

  // Get count for a specific status
  const getCount = (status: QuotationStatus | "ALL"): number => {
    if (status === "ALL") {
      return totalCount;
    }
    const found = statusCounts.find((item) => item.status === status);
    return found?.count || 0;
  };

  return (
    <Tabs
      value={currentStatus}
      onValueChange={(value) => onStatusChange(value as QuotationStatus | "ALL")}
      className="w-full"
      aria-label="Filtrar cotacoes por status"
    >
      <TabsList className="w-full justify-start h-auto flex-wrap gap-1 bg-transparent p-0">
        {TABS_CONFIG.map((tab) => {
          const count = getCount(tab.value);
          const isActive = currentStatus === tab.value;

          return (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              disabled={isLoading}
              className={cn(
                "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
                "border border-border rounded-md px-3 py-1.5",
                "flex items-center gap-2",
                isLoading && "opacity-50 cursor-not-allowed"
              )}
            >
              <span>{tab.label}</span>
              <Badge
                variant={isActive ? "secondary" : "outline"}
                className={cn(
                  "ml-1 min-w-[20px] h-5 px-1.5 text-xs",
                  isActive && "bg-primary-foreground/20 text-primary-foreground"
                )}
              >
                {count}
              </Badge>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
