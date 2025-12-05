/**
 * Cotacoes Filters Component
 * @module components/cotacoes-filters
 *
 * Filtros avancados para cotacoes: categoria, periodo, valor FIPE.
 * Conforme FR-008: Filtros avancados por categoria, periodo, valor FIPE.
 */

"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { X, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { VehicleCategory, DatePeriod } from "@/lib/types/quotations";

// ===========================================
// Types
// ===========================================

export interface FiltersState {
  category: VehicleCategory | null;
  period: DatePeriod | null;
  dateFrom: Date | null;
  dateTo: Date | null;
  fipeMin: number | null;
  fipeMax: number | null;
}

interface CotacoesFiltersProps {
  filters: FiltersState;
  onFiltersChange: (filters: FiltersState) => void;
  onClearFilters: () => void;
  isLoading?: boolean;
}

// ===========================================
// Constants
// ===========================================

const CATEGORY_OPTIONS: { value: VehicleCategory; label: string }[] = [
  { value: "NORMAL", label: "Normal" },
  { value: "ESPECIAL", label: "Especial" },
  { value: "UTILITARIO", label: "Utilitario" },
  { value: "MOTO", label: "Moto" },
];

const PERIOD_OPTIONS: { value: DatePeriod; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "7days", label: "Ultimos 7 dias" },
  { value: "30days", label: "Ultimos 30 dias" },
  { value: "custom", label: "Personalizado" },
];

const FIPE_RANGES = [
  { label: "Ate R$ 30.000", min: 0, max: 30000 },
  { label: "R$ 30.000 - R$ 60.000", min: 30000, max: 60000 },
  { label: "R$ 60.000 - R$ 100.000", min: 60000, max: 100000 },
  { label: "R$ 100.000 - R$ 150.000", min: 100000, max: 150000 },
  { label: "Acima de R$ 150.000", min: 150000, max: null },
];

// ===========================================
// Helper Functions
// ===========================================

function getPeriodDates(period: DatePeriod): { from: Date; to: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);

  switch (period) {
    case "today":
      return { from: today, to: endOfToday };
    case "7days": {
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return { from: sevenDaysAgo, to: endOfToday };
    }
    case "30days": {
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return { from: thirtyDaysAgo, to: endOfToday };
    }
    case "custom":
    default:
      return { from: today, to: endOfToday };
  }
}

function getFipeRangeLabel(min: number | null, max: number | null): string | null {
  if (min === null && max === null) return null;
  const range = FIPE_RANGES.find((r) => r.min === min && r.max === max);
  return range?.label || null;
}

// ===========================================
// Component
// ===========================================

export function CotacoesFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  isLoading,
}: CotacoesFiltersProps) {
  // Derive showCustomDatePicker from filters.period
  const showCustomDatePicker = useMemo(
    () => filters.period === "custom",
    [filters.period]
  );

  // Count active filters
  const activeFilterCount = [
    filters.category,
    filters.period,
    filters.fipeMin !== null || filters.fipeMax !== null,
  ].filter(Boolean).length;

  // Handle category change
  const handleCategoryChange = (value: string) => {
    const newCategory = value === "all" ? null : (value as VehicleCategory);
    onFiltersChange({ ...filters, category: newCategory });
  };

  // Handle period change
  const handlePeriodChange = (value: string) => {
    if (value === "all") {
      onFiltersChange({
        ...filters,
        period: null,
        dateFrom: null,
        dateTo: null,
      });
      return;
    }

    const period = value as DatePeriod;
    if (period === "custom") {
      onFiltersChange({
        ...filters,
        period,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      });
    } else {
      const { from, to } = getPeriodDates(period);
      onFiltersChange({
        ...filters,
        period,
        dateFrom: from,
        dateTo: to,
      });
    }
  };

  // Handle custom date range change
  const handleCustomDateChange = (from: Date | null, to: Date | null) => {
    onFiltersChange({
      ...filters,
      period: "custom",
      dateFrom: from,
      dateTo: to,
    });
  };

  // Handle FIPE range change
  const handleFipeChange = (value: string) => {
    if (value === "all") {
      onFiltersChange({ ...filters, fipeMin: null, fipeMax: null });
      return;
    }

    const range = FIPE_RANGES.find((r) => `${r.min}-${r.max}` === value);
    if (range) {
      onFiltersChange({
        ...filters,
        fipeMin: range.min,
        fipeMax: range.max,
      });
    }
  };

  // Remove individual filter
  const removeFilter = (filterKey: keyof FiltersState) => {
    const newFilters = { ...filters };
    if (filterKey === "category") {
      newFilters.category = null;
    } else if (filterKey === "period" || filterKey === "dateFrom" || filterKey === "dateTo") {
      newFilters.period = null;
      newFilters.dateFrom = null;
      newFilters.dateTo = null;
    } else if (filterKey === "fipeMin" || filterKey === "fipeMax") {
      newFilters.fipeMin = null;
      newFilters.fipeMax = null;
    }
    onFiltersChange(newFilters);
  };

  // Get active filter chips
  const getActiveFilterChips = () => {
    const chips: { key: keyof FiltersState; label: string }[] = [];

    if (filters.category) {
      const categoryLabel = CATEGORY_OPTIONS.find(
        (c) => c.value === filters.category
      )?.label;
      chips.push({ key: "category", label: `Categoria: ${categoryLabel}` });
    }

    if (filters.period && filters.period !== "custom") {
      const periodLabel = PERIOD_OPTIONS.find(
        (p) => p.value === filters.period
      )?.label;
      chips.push({ key: "period", label: `Periodo: ${periodLabel}` });
    } else if (filters.dateFrom || filters.dateTo) {
      const fromStr = filters.dateFrom
        ? format(filters.dateFrom, "dd/MM/yy", { locale: ptBR })
        : "...";
      const toStr = filters.dateTo
        ? format(filters.dateTo, "dd/MM/yy", { locale: ptBR })
        : "...";
      chips.push({ key: "period", label: `Periodo: ${fromStr} - ${toStr}` });
    }

    if (filters.fipeMin !== null || filters.fipeMax !== null) {
      const fipeLabel = getFipeRangeLabel(filters.fipeMin, filters.fipeMax);
      chips.push({ key: "fipeMin", label: `FIPE: ${fipeLabel || "Personalizado"}` });
    }

    return chips;
  };

  const activeChips = getActiveFilterChips();

  return (
    <div className="space-y-3">
      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Category Filter */}
        <Select
          value={filters.category || "all"}
          onValueChange={handleCategoryChange}
          disabled={isLoading}
        >
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {CATEGORY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Period Filter */}
        <Select
          value={filters.period || "all"}
          onValueChange={handlePeriodChange}
          disabled={isLoading}
        >
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Periodo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos periodos</SelectItem>
            {PERIOD_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Custom Date Range Picker */}
        {showCustomDatePicker && (
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "w-[130px] justify-start text-left font-normal h-9",
                    !filters.dateFrom && "text-muted-foreground"
                  )}
                  disabled={isLoading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateFrom ? (
                    format(filters.dateFrom, "dd/MM/yyyy", { locale: ptBR })
                  ) : (
                    <span>De</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.dateFrom || undefined}
                  onSelect={(date) =>
                    handleCustomDateChange(date || null, filters.dateTo)
                  }
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
            <span className="text-muted-foreground">-</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "w-[130px] justify-start text-left font-normal h-9",
                    !filters.dateTo && "text-muted-foreground"
                  )}
                  disabled={isLoading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateTo ? (
                    format(filters.dateTo, "dd/MM/yyyy", { locale: ptBR })
                  ) : (
                    <span>Ate</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.dateTo || undefined}
                  onSelect={(date) =>
                    handleCustomDateChange(filters.dateFrom, date || null)
                  }
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
        )}

        {/* FIPE Range Filter */}
        <Select
          value={
            filters.fipeMin !== null || filters.fipeMax !== null
              ? `${filters.fipeMin}-${filters.fipeMax}`
              : "all"
          }
          onValueChange={handleFipeChange}
          disabled={isLoading}
        >
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="Valor FIPE" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos valores</SelectItem>
            {FIPE_RANGES.map((range) => (
              <SelectItem
                key={`${range.min}-${range.max}`}
                value={`${range.min}-${range.max}`}
              >
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear All Button */}
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            disabled={isLoading}
            className="h-9 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Active Filter Chips */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeChips.map((chip) => (
            <Badge
              key={chip.key}
              variant="secondary"
              className="pl-2 pr-1 py-1 gap-1"
            >
              <span className="text-xs">{chip.label}</span>
              <button
                type="button"
                onClick={() => removeFilter(chip.key)}
                className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
                disabled={isLoading}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remover filtro</span>
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
