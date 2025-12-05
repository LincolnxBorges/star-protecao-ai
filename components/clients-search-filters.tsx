/**
 * Clients Search and Filters Component
 * @module components/clients-search-filters
 *
 * Busca com debounce e filtros por status, cidade e periodo.
 * T029-T036: User Story 3 - Buscar e Filtrar Clientes.
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, X, Filter, CalendarDays, Download, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
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
import { format, subDays, startOfYear, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ClientStatus } from "@/lib/types/clients";

// Status options
const STATUS_OPTIONS: Array<{ value: ClientStatus | "all"; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "CONVERTED", label: "Convertidos" },
  { value: "NEGOTIATING", label: "Em Negociacao" },
  { value: "INACTIVE", label: "Inativos" },
  { value: "LOST", label: "Perdidos" },
  { value: "NEW", label: "Novos" },
];

// Period options
const PERIOD_OPTIONS = [
  { value: "all", label: "Todo periodo" },
  { value: "today", label: "Hoje" },
  { value: "7days", label: "Ultimos 7 dias" },
  { value: "30days", label: "Ultimos 30 dias" },
  { value: "90days", label: "Ultimos 90 dias" },
  { value: "year", label: "Este ano" },
  { value: "custom", label: "Personalizado" },
];

interface SellerOption {
  id: string;
  name: string;
}

interface ClientsSearchFiltersProps {
  // Search
  search: string;
  onSearchChange: (search: string) => void;
  // Status
  status: ClientStatus | "all";
  onStatusChange: (status: ClientStatus | "all") => void;
  // City
  city: string;
  onCityChange: (city: string) => void;
  cities: string[];
  // Period
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  onPeriodChange: (dateFrom: Date | undefined, dateTo: Date | undefined) => void;
  // General
  onClearAll: () => void;
  disabled?: boolean;
  // Admin-only seller filter
  isAdmin?: boolean;
  sellers?: SellerOption[];
  sellerId?: string;
  onSellerChange?: (sellerId: string) => void;
  // CSV Export
  onExportCSV?: () => Promise<void>;
  isExporting?: boolean;
}

export function ClientsSearchFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  city,
  onCityChange,
  cities,
  dateFrom,
  dateTo,
  onPeriodChange,
  onClearAll,
  disabled,
  isAdmin = false,
  sellers = [],
  sellerId = "",
  onSellerChange,
  onExportCSV,
  isExporting = false,
}: ClientsSearchFiltersProps) {
  const [localSearch, setLocalSearch] = useState(search);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [customDateRange, setCustomDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: dateFrom, to: dateTo });

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== search) {
        onSearchChange(localSearch);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearch, search, onSearchChange]);

  // Sync local state when external search changes
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  // Handle period selection
  const handlePeriodChange = useCallback(
    (period: string) => {
      setSelectedPeriod(period);

      if (period === "custom") {
        setIsCalendarOpen(true);
        return;
      }

      const now = new Date();
      let from: Date | undefined;
      let to: Date | undefined;

      switch (period) {
        case "today":
          from = startOfDay(now);
          to = endOfDay(now);
          break;
        case "7days":
          from = startOfDay(subDays(now, 7));
          to = endOfDay(now);
          break;
        case "30days":
          from = startOfDay(subDays(now, 30));
          to = endOfDay(now);
          break;
        case "90days":
          from = startOfDay(subDays(now, 90));
          to = endOfDay(now);
          break;
        case "year":
          from = startOfYear(now);
          to = endOfDay(now);
          break;
        case "all":
        default:
          from = undefined;
          to = undefined;
          break;
      }

      onPeriodChange(from, to);
    },
    [onPeriodChange]
  );

  // Handle custom date range selection
  const handleCustomDateSelect = () => {
    if (customDateRange.from) {
      onPeriodChange(
        startOfDay(customDateRange.from),
        customDateRange.to ? endOfDay(customDateRange.to) : endOfDay(customDateRange.from)
      );
      setIsCalendarOpen(false);
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setLocalSearch("");
    onSearchChange("");
  };

  // Check if any filters are active
  const hasActiveFilters =
    search ||
    status !== "all" ||
    city ||
    dateFrom ||
    dateTo ||
    sellerId;

  // Get active filter count
  const activeFilterCount = [
    search,
    status !== "all",
    city,
    dateFrom || dateTo,
    sellerId,
  ].filter(Boolean).length;

  // Get seller name by id
  const getSellerName = (id: string) => {
    const seller = sellers.find((s) => s.id === id);
    return seller?.name || id;
  };

  // Format period label
  const getPeriodLabel = () => {
    if (dateFrom && dateTo) {
      if (selectedPeriod !== "custom") {
        const option = PERIOD_OPTIONS.find((p) => p.value === selectedPeriod);
        if (option && option.value !== "all") return option.label;
      }
      return `${format(dateFrom, "dd/MM/yy")} - ${format(dateTo, "dd/MM/yy")}`;
    }
    return "Todo periodo";
  };

  return (
    <div className="space-y-3">
      {/* Search and Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CPF, telefone, email ou cidade..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-9 pr-9"
            disabled={disabled}
          />
          {localSearch && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={handleClearSearch}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Limpar busca</span>
            </Button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap gap-2">
          {/* Status Filter */}
          <Select
            value={status}
            onValueChange={(value) => onStatusChange(value as ClientStatus | "all")}
            disabled={disabled}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* City Filter */}
          <Select
            value={city || "all"}
            onValueChange={(value) => onCityChange(value === "all" ? "" : value)}
            disabled={disabled}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Cidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas cidades</SelectItem>
              {cities.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Seller Filter (Admin only) */}
          {isAdmin && sellers.length > 0 && (
            <Select
              value={sellerId || "all"}
              onValueChange={(value) => onSellerChange?.(value === "all" ? "" : value)}
              disabled={disabled}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Vendedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos vendedores</SelectItem>
                {sellers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Period Filter */}
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[160px] justify-start text-left font-normal"
                disabled={disabled}
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                <span className="truncate">{getPeriodLabel()}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-2 border-b">
                <Select
                  value={selectedPeriod}
                  onValueChange={handlePeriodChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o periodo" />
                  </SelectTrigger>
                  <SelectContent>
                    {PERIOD_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedPeriod === "custom" && (
                <div className="p-2">
                  <Calendar
                    mode="range"
                    selected={{
                      from: customDateRange.from,
                      to: customDateRange.to,
                    }}
                    onSelect={(range) =>
                      setCustomDateRange({
                        from: range?.from,
                        to: range?.to,
                      })
                    }
                    locale={ptBR}
                    numberOfMonths={1}
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsCalendarOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleCustomDateSelect}
                      disabled={!customDateRange.from}
                    >
                      Aplicar
                    </Button>
                  </div>
                </div>
              )}
            </PopoverContent>
          </Popover>

          {/* Export CSV Button */}
          {onExportCSV && (
            <Button
              variant="outline"
              onClick={onExportCSV}
              disabled={disabled || isExporting}
              className="gap-2"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Exportar CSV</span>
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">
            <Filter className="h-3.5 w-3.5 inline mr-1" />
            Filtros ativos:
          </span>

          {search && (
            <Badge variant="secondary" className="gap-1">
              Busca: &quot;{search}&quot;
              <button
                onClick={handleClearSearch}
                className="ml-1 hover:text-foreground"
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {status !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Status: {STATUS_OPTIONS.find((s) => s.value === status)?.label}
              <button
                onClick={() => onStatusChange("all")}
                className="ml-1 hover:text-foreground"
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {city && (
            <Badge variant="secondary" className="gap-1">
              Cidade: {city}
              <button
                onClick={() => onCityChange("")}
                className="ml-1 hover:text-foreground"
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {(dateFrom || dateTo) && (
            <Badge variant="secondary" className="gap-1">
              Periodo: {getPeriodLabel()}
              <button
                onClick={() => {
                  setSelectedPeriod("all");
                  onPeriodChange(undefined, undefined);
                }}
                className="ml-1 hover:text-foreground"
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {sellerId && (
            <Badge variant="secondary" className="gap-1">
              Vendedor: {getSellerName(sellerId)}
              <button
                onClick={() => onSellerChange?.("")}
                className="ml-1 hover:text-foreground"
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {activeFilterCount > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="h-6 px-2 text-xs"
              disabled={disabled}
            >
              Limpar tudo
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
