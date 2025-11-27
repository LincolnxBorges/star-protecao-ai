/**
 * Clients List Component
 * @module components/clients-list
 *
 * Componente principal que orquestra KPIs, busca, filtros, lista/tabela e paginacao.
 * T021-T036: Implementa User Stories 1-3.
 */

"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DashboardPageHeader } from "@/components/dashboard-page-header";
import { ClientsKpiCards } from "@/components/clients-kpi-cards";
import { ClientsSearchFilters } from "@/components/clients-search-filters";
import { ClientsTable } from "@/components/clients-table";
import { ClientsCardList } from "@/components/clients-card-list";
import { ClientsEmptyState } from "@/components/clients-empty-state";
import { ClientsProfileModal } from "@/components/clients-profile-modal";
import { ClientsQuotationsModal } from "@/components/clients-quotations-modal";
import { ClientsInteractionModal } from "@/components/clients-interaction-modal";
import { ClientsDeleteDialog } from "@/components/clients-delete-dialog";
import { getClientProfileAction, getClientQuotationsAction, createInteractionAction, exportCSVAction, deleteClientAction } from "@/app/(admin)/clientes/actions";
import { toast } from "sonner";
import type { ClientWithMetrics, ClientFilters, ClientKPIs, ClientStatus, ClientProfile, ClientQuotationsSummary, CreateInteractionInput } from "@/lib/types/clients";

interface SellerOption {
  id: string;
  name: string;
}

interface ClientsListProps {
  initialData: {
    items: ClientWithMetrics[];
    total: number;
  };
  initialFilters: ClientFilters;
  initialKPIs: ClientKPIs;
  cities: string[];
  isAdmin: boolean;
  sellers?: SellerOption[];
}

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50];

export function ClientsList({
  initialData,
  initialFilters,
  initialKPIs,
  cities,
  isAdmin,
  sellers = [],
}: ClientsListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // State
  const [clients, setClients] = useState<ClientWithMetrics[]>(initialData.items);
  const [total, setTotal] = useState(initialData.total);
  const [page, setPage] = useState(initialFilters.page || 1);
  const [limit, setLimit] = useState(initialFilters.limit || 10);

  // Profile modal state
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // Quotations modal state
  const [quotationsModalOpen, setQuotationsModalOpen] = useState(false);
  const [selectedClientForQuotations, setSelectedClientForQuotations] = useState<{ id: string; name: string } | null>(null);

  // Interaction modal state
  const [interactionModalOpen, setInteractionModalOpen] = useState(false);
  const [selectedClientForInteraction, setSelectedClientForInteraction] = useState<{ id: string; name: string } | null>(null);

  // CSV Export state
  const [isExporting, setIsExporting] = useState(false);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<ClientWithMetrics | null>(null);

  // Calculate total pages
  const totalPages = Math.ceil(total / limit);

  // Get current filter values from initialFilters
  const currentSearch = initialFilters.search || "";
  const currentStatus: ClientStatus | "all" =
    initialFilters.status && initialFilters.status.length === 1
      ? initialFilters.status[0]
      : "all";
  const currentCity = initialFilters.city || "";
  const currentDateFrom = initialFilters.dateFrom;
  const currentDateTo = initialFilters.dateTo;
  const currentSellerId = initialFilters.sellerId || "";
  const currentOrderBy = initialFilters.orderBy || "name";
  const currentOrderDir = initialFilters.orderDir || "asc";

  // Update URL with new params
  const updateURL = useCallback(
    (newParams: Record<string, string | number | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(newParams).forEach(([key, value]) => {
        if (value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateURL({ page: newPage > 1 ? newPage : undefined });
  };

  // Handle limit change
  const handleLimitChange = (newLimit: string) => {
    const limitValue = parseInt(newLimit, 10);
    setLimit(limitValue);
    setPage(1);
    updateURL({ limit: limitValue !== 10 ? limitValue : undefined, page: undefined });
  };

  // Handle search change
  const handleSearchChange = (search: string) => {
    updateURL({ search: search || undefined, page: undefined });
  };

  // Handle status change
  const handleStatusChange = (status: ClientStatus | "all") => {
    updateURL({
      status: status !== "all" ? status : undefined,
      page: undefined,
    });
  };

  // Handle city change
  const handleCityChange = (city: string) => {
    updateURL({ city: city || undefined, page: undefined });
  };

  // Handle period change
  const handlePeriodChange = (dateFrom: Date | undefined, dateTo: Date | undefined) => {
    updateURL({
      dateFrom: dateFrom ? dateFrom.toISOString() : undefined,
      dateTo: dateTo ? dateTo.toISOString() : undefined,
      page: undefined,
    });
  };

  // Handle seller change (admin only)
  const handleSellerChange = (sellerId: string) => {
    updateURL({ sellerId: sellerId || undefined, page: undefined });
  };

  // Handle sort change (T074, T075)
  const handleSort = (column: ClientFilters["orderBy"]) => {
    // If clicking same column, toggle direction; otherwise, default to asc
    const newDir = currentOrderBy === column && currentOrderDir === "asc" ? "desc" : "asc";
    updateURL({
      orderBy: column !== "name" ? column : undefined, // name is default, no need in URL
      orderDir: newDir !== "asc" ? newDir : undefined, // asc is default, no need in URL
      page: undefined, // Reset page on sort change
    });
  };

  // Handle clear all filters
  const handleClearAllFilters = () => {
    updateURL({
      search: undefined,
      status: undefined,
      city: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      sellerId: undefined,
      orderBy: undefined,
      orderDir: undefined,
      page: undefined,
    });
  };

  // Update data when props change (server-side refetch)
  useEffect(() => {
    setClients(initialData.items);
    setTotal(initialData.total);
    setPage(initialFilters.page || 1);
    setLimit(initialFilters.limit || 10);
  }, [initialData, initialFilters]);

  // Check if any filters are active
  const hasFilters = !!(
    currentSearch ||
    currentStatus !== "all" ||
    currentCity ||
    currentDateFrom ||
    currentDateTo
  );

  // Profile modal handlers
  const handleViewProfile = (client: ClientWithMetrics) => {
    setSelectedClientId(client.id);
    setProfileModalOpen(true);
  };

  const handleCloseProfileModal = () => {
    setProfileModalOpen(false);
    setSelectedClientId(null);
  };

  const handleLoadProfile = useCallback(async (clientId: string): Promise<ClientProfile | null> => {
    const result = await getClientProfileAction(clientId);
    if (result.success && result.data) {
      return result.data;
    }
    return null;
  }, []);

  // Quotations modal handlers
  const handleViewQuotations = (client: ClientWithMetrics) => {
    setSelectedClientForQuotations({ id: client.id, name: client.name });
    setQuotationsModalOpen(true);
  };

  const handleCloseQuotationsModal = () => {
    setQuotationsModalOpen(false);
    setSelectedClientForQuotations(null);
  };

  const handleLoadQuotations = useCallback(async (clientId: string): Promise<ClientQuotationsSummary | null> => {
    const result = await getClientQuotationsAction(clientId);
    if (result.success && result.data) {
      return result.data;
    }
    return null;
  }, []);

  // Interaction modal handlers
  const handleAddInteraction = (client: ClientWithMetrics) => {
    setSelectedClientForInteraction({ id: client.id, name: client.name });
    setInteractionModalOpen(true);
  };

  const handleCloseInteractionModal = () => {
    setInteractionModalOpen(false);
    setSelectedClientForInteraction(null);
  };

  const handleSubmitInteraction = useCallback(async (data: CreateInteractionInput): Promise<{ success: boolean; error?: string }> => {
    const result = await createInteractionAction(data);
    return { success: result.success, error: result.error };
  }, []);

  // Delete handlers
  const handleDelete = (client: ClientWithMetrics) => {
    setClientToDelete(client);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setClientToDelete(null);
  };

  const handleConfirmDelete = useCallback(async (clientId: string): Promise<{ success: boolean; error?: string }> => {
    const result = await deleteClientAction(clientId);
    if (result.success) {
      // Refresh the page to update the list
      router.refresh();
    }
    return result;
  }, [router]);

  // CSV Export handler
  const handleExportCSV = useCallback(async () => {
    setIsExporting(true);

    try {
      // Build filters for export (without pagination)
      const exportFilters = {
        search: currentSearch || undefined,
        status: currentStatus !== "all" ? [currentStatus] : undefined,
        city: currentCity || undefined,
        dateFrom: currentDateFrom,
        dateTo: currentDateTo,
        sellerId: currentSellerId || undefined,
      };

      const result = await exportCSVAction(exportFilters);

      if (!result.success || !result.data) {
        toast.error(result.error || "Erro ao exportar clientes");
        return;
      }

      // Create blob and trigger download
      const blob = new Blob([result.data], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      // Generate filename with current date
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];
      link.href = url;
      link.download = `clientes-${dateStr}.csv`;

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Cleanup
      URL.revokeObjectURL(url);

      toast.success("Arquivo exportado com sucesso!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Erro ao exportar clientes");
    } finally {
      setIsExporting(false);
    }
  }, [currentSearch, currentStatus, currentCity, currentDateFrom, currentDateTo, currentSellerId]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <DashboardPageHeader
        title="Clientes"
        description="Gerencie sua base de clientes"
      />

      {/* KPI Cards */}
      <ClientsKpiCards kpis={initialKPIs} />

      {/* Results Card */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Search and Filters */}
          <ClientsSearchFilters
            search={currentSearch}
            onSearchChange={handleSearchChange}
            status={currentStatus}
            onStatusChange={handleStatusChange}
            city={currentCity}
            onCityChange={handleCityChange}
            cities={cities}
            dateFrom={currentDateFrom}
            dateTo={currentDateTo}
            onPeriodChange={handlePeriodChange}
            onClearAll={handleClearAllFilters}
            disabled={isPending}
            // Admin-only seller filter
            isAdmin={isAdmin}
            sellers={sellers}
            sellerId={currentSellerId}
            onSellerChange={handleSellerChange}
            // CSV Export
            onExportCSV={handleExportCSV}
            isExporting={isExporting}
          />

          {/* Header with total count and items per page */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {total} cliente{total !== 1 ? "s" : ""} encontrado{total !== 1 ? "s" : ""}
            </p>

            {/* Items per page selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Exibir:</span>
              <Select
                value={limit.toString()}
                onValueChange={handleLimitChange}
                disabled={isPending}
              >
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

          {/* List/Table with loading overlay */}
          <div className="relative">
            {isPending && (
              <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 rounded-lg">
                <div className="flex items-center gap-2 bg-background px-4 py-2 rounded-full shadow-lg border">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
                  <span className="text-sm text-muted-foreground">Carregando...</span>
                </div>
              </div>
            )}

            {/* Empty state */}
            {clients.length === 0 && !isPending ? (
              <ClientsEmptyState
                hasFilters={hasFilters}
                onClearFilters={handleClearAllFilters}
              />
            ) : (
              <>
                {/* Desktop: Table */}
                <div className="hidden lg:block">
                  <ClientsTable
                    clients={clients}
                    onViewProfile={handleViewProfile}
                    onViewQuotations={handleViewQuotations}
                    onAddInteraction={handleAddInteraction}
                    onDelete={handleDelete}
                    isAdmin={isAdmin}
                    orderBy={currentOrderBy}
                    orderDir={currentOrderDir}
                    onSort={handleSort}
                  />
                </div>

                {/* Mobile: Cards */}
                <div className="lg:hidden">
                  <ClientsCardList
                    clients={clients}
                    onViewProfile={handleViewProfile}
                    onViewQuotations={handleViewQuotations}
                    onAddInteraction={handleAddInteraction}
                    onDelete={handleDelete}
                    isAdmin={isAdmin}
                  />
                </div>
              </>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 mt-4 border-t">
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
                  <ChevronLeft className="h-4 w-4 mr-1" aria-hidden="true" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages || isPending}
                >
                  Proxima
                  <ChevronRight className="h-4 w-4 ml-1" aria-hidden="true" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile Modal */}
      <ClientsProfileModal
        clientId={selectedClientId}
        isOpen={profileModalOpen}
        onClose={handleCloseProfileModal}
        onLoadProfile={handleLoadProfile}
      />

      {/* Quotations Modal */}
      <ClientsQuotationsModal
        clientId={selectedClientForQuotations?.id || null}
        clientName={selectedClientForQuotations?.name || ""}
        isOpen={quotationsModalOpen}
        onClose={handleCloseQuotationsModal}
        onLoadQuotations={handleLoadQuotations}
      />

      {/* Interaction Modal */}
      <ClientsInteractionModal
        clientId={selectedClientForInteraction?.id || null}
        clientName={selectedClientForInteraction?.name || ""}
        isOpen={interactionModalOpen}
        onClose={handleCloseInteractionModal}
        onSubmit={handleSubmitInteraction}
      />

      {/* Delete Confirmation Dialog */}
      <ClientsDeleteDialog
        client={clientToDelete}
        isOpen={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
