/**
 * Cotacoes List Component
 * @module components/cotacoes-list
 *
 * Componente principal que orquestra tabela, filtros e paginacao.
 * Conforme FR-010: paginacao com opcoes de 10, 25 ou 50 itens.
 */

"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { CotacoesTable } from "@/components/cotacoes-table";
import { CotacoesStatusTabs } from "@/components/cotacoes-status-tabs";
import { CotacoesSearch } from "@/components/cotacoes-search";
import { CotacoesFilters, type FiltersState } from "@/components/cotacoes-filters";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { listQuotationsAction } from "@/app/(admin)/cotacoes/actions";
import type { QuotationWithRelations } from "@/lib/quotations";
import type { StatusCount, QuotationFilters, QuotationStatus, VehicleCategory, DatePeriod } from "@/lib/types/quotations";

interface CotacoesListProps {
  initialData?: {
    items: QuotationWithRelations[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    statusCounts: StatusCount[];
  };
}

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50];

export function CotacoesList({ initialData }: CotacoesListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // State
  const [quotations, setQuotations] = useState<QuotationWithRelations[]>(
    initialData?.items || []
  );
  const [total, setTotal] = useState(initialData?.total || 0);
  const [page, setPage] = useState(initialData?.page || 1);
  const [limit, setLimit] = useState(initialData?.limit || 10);
  const [totalPages, setTotalPages] = useState(initialData?.totalPages || 0);
  const [statusCounts, setStatusCounts] = useState<StatusCount[]>(
    initialData?.statusCounts || []
  );
  const [isLoading, setIsLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  // Derive currentStatus and searchTerm from URL (avoiding setState in useEffect)
  const currentStatus = useMemo((): QuotationStatus | "ALL" => {
    const statusParam = searchParams.get("status");
    return statusParam ? (statusParam as QuotationStatus) : "ALL";
  }, [searchParams]);

  const searchTerm = useMemo((): string => {
    return searchParams.get("search") || "";
  }, [searchParams]);

  // Derive advanced filters from URL
  const advancedFilters = useMemo((): FiltersState => {
    const category = searchParams.get("category") as VehicleCategory | null;
    const period = searchParams.get("period") as DatePeriod | null;
    const dateFromParam = searchParams.get("dateFrom");
    const dateToParam = searchParams.get("dateTo");
    const fipeMinParam = searchParams.get("fipeMin");
    const fipeMaxParam = searchParams.get("fipeMax");

    return {
      category,
      period,
      dateFrom: dateFromParam ? new Date(dateFromParam) : null,
      dateTo: dateToParam ? new Date(dateToParam) : null,
      fipeMin: fipeMinParam ? parseInt(fipeMinParam, 10) : null,
      fipeMax: fipeMaxParam !== "null" && fipeMaxParam ? parseInt(fipeMaxParam, 10) : null,
    };
  }, [searchParams]);

  // Parse filters from URL
  const getFiltersFromUrl = useCallback((): Partial<QuotationFilters> => {
    const filters: Partial<QuotationFilters> = {};

    const statusParam = searchParams.get("status");
    if (statusParam) {
      filters.status = statusParam.split(",") as QuotationFilters["status"];
    }

    const pageParam = searchParams.get("page");
    if (pageParam) {
      filters.page = parseInt(pageParam, 10);
    }

    const limitParam = searchParams.get("limit");
    if (limitParam) {
      filters.limit = parseInt(limitParam, 10);
    }

    const searchParam = searchParams.get("search");
    if (searchParam) {
      filters.search = searchParam;
    }

    // Advanced filters
    const categoryParam = searchParams.get("category");
    if (categoryParam) {
      filters.category = [categoryParam as VehicleCategory];
    }

    const dateFromParam = searchParams.get("dateFrom");
    if (dateFromParam) {
      filters.dateFrom = new Date(dateFromParam);
    }

    const dateToParam = searchParams.get("dateTo");
    if (dateToParam) {
      filters.dateTo = new Date(dateToParam);
    }

    const fipeMinParam = searchParams.get("fipeMin");
    if (fipeMinParam) {
      filters.fipeMin = parseInt(fipeMinParam, 10);
    }

    const fipeMaxParam = searchParams.get("fipeMax");
    if (fipeMaxParam && fipeMaxParam !== "null") {
      filters.fipeMax = parseInt(fipeMaxParam, 10);
    }

    return filters;
  }, [searchParams]);

  // Update URL with filters
  const updateUrl = useCallback(
    (newFilters: Partial<QuotationFilters>, advFilters?: FiltersState) => {
      const params = new URLSearchParams(searchParams.toString());

      if (newFilters.page && newFilters.page > 1) {
        params.set("page", newFilters.page.toString());
      } else {
        params.delete("page");
      }

      if (newFilters.limit && newFilters.limit !== 10) {
        params.set("limit", newFilters.limit.toString());
      } else {
        params.delete("limit");
      }

      if (newFilters.status && newFilters.status.length > 0) {
        params.set("status", newFilters.status.join(","));
      } else {
        params.delete("status");
      }

      if (newFilters.search) {
        params.set("search", newFilters.search);
      } else {
        params.delete("search");
      }

      // Advanced filters
      if (advFilters !== undefined) {
        if (advFilters.category) {
          params.set("category", advFilters.category);
        } else {
          params.delete("category");
        }

        if (advFilters.period) {
          params.set("period", advFilters.period);
        } else {
          params.delete("period");
        }

        if (advFilters.dateFrom) {
          params.set("dateFrom", advFilters.dateFrom.toISOString());
        } else {
          params.delete("dateFrom");
        }

        if (advFilters.dateTo) {
          params.set("dateTo", advFilters.dateTo.toISOString());
        } else {
          params.delete("dateTo");
        }

        if (advFilters.fipeMin !== null) {
          params.set("fipeMin", advFilters.fipeMin.toString());
        } else {
          params.delete("fipeMin");
        }

        if (advFilters.fipeMax !== null) {
          params.set("fipeMax", advFilters.fipeMax.toString());
        } else {
          params.delete("fipeMax");
        }
      }

      const queryString = params.toString();
      router.push(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams]
  );

  // Fetch data
  const fetchData = useCallback(
    async (filters: Partial<QuotationFilters>) => {
      setIsLoading(true);
      setError(null);

      const result = await listQuotationsAction(filters);

      if (result.success && result.data) {
        setQuotations(result.data.items);
        setTotal(result.data.total);
        setPage(result.data.page);
        setLimit(result.data.limit);
        setTotalPages(result.data.totalPages);
        setStatusCounts(result.data.statusCounts);
      } else {
        setError(result.error || "Erro ao carregar cotacoes");
      }

      setIsLoading(false);
    },
    []
  );

  // Initial load from URL params
  const hasLoadedRef = useRef(false);
  useEffect(() => {
    if (!initialData && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      const filters = getFiltersFromUrl();
      // Using startTransition to wrap the async operation
      startTransition(() => {
        void fetchData(filters);
      });
    }
  }, [fetchData, getFiltersFromUrl, initialData, startTransition]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    const filters = { ...getFiltersFromUrl(), page: newPage, limit };
    startTransition(() => {
      updateUrl(filters);
      fetchData(filters);
    });
  };

  // Handle limit change
  const handleLimitChange = (newLimit: string) => {
    const limitValue = parseInt(newLimit, 10);
    const filters = { ...getFiltersFromUrl(), page: 1, limit: limitValue };
    startTransition(() => {
      updateUrl(filters);
      fetchData(filters);
    });
  };

  // Handle status filter change
  const handleStatusChange = (status: QuotationStatus | "ALL") => {
    const filters: Partial<QuotationFilters> = {
      ...getFiltersFromUrl(),
      page: 1,
      status: status === "ALL" ? undefined : [status],
    };
    startTransition(() => {
      updateUrl(filters);
      fetchData(filters);
    });
  };

  // Handle search change
  const handleSearchChange = (search: string) => {
    const filters: Partial<QuotationFilters> = {
      ...getFiltersFromUrl(),
      page: 1,
      search: search || undefined,
    };
    startTransition(() => {
      updateUrl(filters);
      fetchData(filters);
    });
  };

  // Handle advanced filters change
  const handleAdvancedFiltersChange = (newAdvancedFilters: FiltersState) => {
    const baseFilters = getFiltersFromUrl();
    const filters: Partial<QuotationFilters> = {
      ...baseFilters,
      page: 1,
      category: newAdvancedFilters.category
        ? [newAdvancedFilters.category]
        : undefined,
      dateFrom: newAdvancedFilters.dateFrom || undefined,
      dateTo: newAdvancedFilters.dateTo || undefined,
      fipeMin: newAdvancedFilters.fipeMin ?? undefined,
      fipeMax: newAdvancedFilters.fipeMax ?? undefined,
    };
    startTransition(() => {
      updateUrl(filters, newAdvancedFilters);
      fetchData(filters);
    });
  };

  // Handle clear all advanced filters
  const handleClearAdvancedFilters = () => {
    const emptyFilters: FiltersState = {
      category: null,
      period: null,
      dateFrom: null,
      dateTo: null,
      fipeMin: null,
      fipeMax: null,
    };
    const baseFilters = getFiltersFromUrl();
    const filters: Partial<QuotationFilters> = {
      ...baseFilters,
      page: 1,
      category: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      fipeMin: undefined,
      fipeMax: undefined,
    };
    startTransition(() => {
      updateUrl(filters, emptyFilters);
      fetchData(filters);
    });
  };

  // Loading skeleton
  if (isLoading && quotations.length === 0) {
    return (
      <div className="space-y-4">
        {/* Status tabs skeleton */}
        <div className="flex gap-2 overflow-x-auto">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 shrink-0" />
          ))}
        </div>

        {/* Search skeleton */}
        <Skeleton className="h-10 w-full" />

        {/* Filters skeleton */}
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-40" />
        </div>

        {/* Count and items per page skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-[150px]" />
          <Skeleton className="h-9 w-[100px]" />
        </div>

        {/* Mobile: Card skeletons */}
        <div className="lg:hidden space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-9 flex-1" />
                <Skeleton className="h-9 flex-1" />
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: Table skeleton */}
        <div className="hidden lg:block border rounded-md">
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">{error}</p>
        <Button
          variant="outline"
          onClick={() => fetchData(getFiltersFromUrl())}
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Tabs Filter */}
      <CotacoesStatusTabs
        statusCounts={statusCounts}
        currentStatus={currentStatus}
        onStatusChange={handleStatusChange}
        isLoading={isPending}
      />

      {/* Search */}
      <CotacoesSearch
        value={searchTerm}
        onSearch={handleSearchChange}
        isLoading={isPending}
      />

      {/* Advanced Filters */}
      <CotacoesFilters
        filters={advancedFilters}
        onFiltersChange={handleAdvancedFiltersChange}
        onClearFilters={handleClearAdvancedFilters}
        isLoading={isPending}
      />

      {/* Header with total count and items per page */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {total} cotacao{total !== 1 ? "es" : ""} encontrada{total !== 1 ? "s" : ""}
        </p>

        {/* Items per page selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Exibir:</span>
          <Select value={limit.toString()} onValueChange={handleLimitChange}>
            <SelectTrigger className="w-[80px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                <SelectItem key={option} value={option.toString()}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="relative">
        {isPending && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        <CotacoesTable quotations={quotations} isLoading={isLoading} />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Pagina {page} de {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1 || isPending}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages || isPending}
            >
              Proxima
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
