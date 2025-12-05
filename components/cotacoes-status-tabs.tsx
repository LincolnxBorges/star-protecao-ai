/**
 * Cotacoes Status Tabs Component
 * @module components/cotacoes-status-tabs
 *
 * Tabs de filtro por status com contadores conforme FR-002, FR-003.
 * Status disponíveis: Todas, Pendentes, Contatadas, Aceitas, Expiradas
 */

"use client";

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
  activeClass: string;
  inactiveClass: string;
}

const TABS_CONFIG: TabConfig[] = [
  {
    value: "ALL",
    label: "Todas",
    activeClass: "bg-grey-900 text-white dark:bg-grey-100 dark:text-grey-900",
    inactiveClass: "bg-grey-100 text-grey-700 hover:bg-grey-200 dark:bg-grey-800 dark:text-grey-300 dark:hover:bg-grey-700",
  },
  {
    value: "PENDING",
    label: "Pendentes",
    activeClass: "bg-yellow-500 text-white dark:bg-yellow-400 dark:text-yellow-950",
    inactiveClass: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:hover:bg-yellow-900/50",
  },
  {
    value: "CONTACTED",
    label: "Contatadas",
    activeClass: "bg-blue-500 text-white dark:bg-blue-400 dark:text-blue-950",
    inactiveClass: "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50",
  },
  {
    value: "ACCEPTED",
    label: "Aceitas",
    activeClass: "bg-light-green-500 text-white dark:bg-light-green-400 dark:text-dark-green-900",
    inactiveClass: "bg-light-green-100 text-light-green-800 hover:bg-light-green-200 dark:bg-light-green-900/30 dark:text-light-green-400 dark:hover:bg-light-green-900/50",
  },
  {
    value: "EXPIRED",
    label: "Expiradas",
    activeClass: "bg-grey-500 text-white dark:bg-grey-400 dark:text-grey-950",
    inactiveClass: "bg-grey-100 text-grey-600 hover:bg-grey-200 dark:bg-grey-800 dark:text-grey-400 dark:hover:bg-grey-700",
  },
  {
    value: "CANCELLED",
    label: "Canceladas",
    activeClass: "bg-red-500 text-white dark:bg-red-400 dark:text-red-950",
    inactiveClass: "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50",
  },
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
    <div
      role="tablist"
      aria-label="Filtrar cotacoes por status"
      className="flex flex-wrap gap-2"
    >
      {TABS_CONFIG.map((tab) => {
        const count = getCount(tab.value);
        const isActive = currentStatus === tab.value;

        return (
          <button
            key={tab.value}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.value}`}
            onClick={() => onStatusChange(tab.value)}
            disabled={isLoading}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isActive ? tab.activeClass : tab.inactiveClass,
              isLoading && "opacity-50 cursor-not-allowed"
            )}
          >
            <span>{tab.label}</span>
            <span
              className={cn(
                "inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-semibold",
                isActive
                  ? "bg-white/20 text-inherit"
                  : "bg-black/10 dark:bg-white/10"
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
