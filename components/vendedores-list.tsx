/**
 * Sellers List Component
 * @module components/vendedores-list
 *
 * Componente principal que orquestra KPIs, busca, filtros, lista/tabela e paginacao.
 * T042: Integrado com componentes de busca e tabs de status.
 */

"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Loader2, Plus, Users } from "lucide-react";
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
import { VendedoresKpiCards } from "@/components/vendedores-kpi-cards";
import { VendedoresCard } from "@/components/vendedores-card";
import { VendedoresTable } from "@/components/vendedores-table";
import { VendedoresModalForm } from "@/components/vendedores-modal-form";
import { VendedoresModalDeactivate } from "@/components/vendedores-modal-deactivate";
import { VendedoresModalProfile } from "@/components/vendedores-modal-profile";
import { VendedoresSearch } from "@/components/vendedores-search";
import { VendedoresStatusTabs } from "@/components/vendedores-status-tabs";
import { VendedoresRoundRobinCard } from "@/components/vendedores-round-robin-card";
import { VendedoresRoundRobinModal } from "@/components/vendedores-round-robin-modal";
import { VendedoresModalReassign } from "@/components/vendedores-modal-reassign";
import { listSellersAction } from "@/app/(admin)/vendedores/actions";
import type {
  SellerWithMetrics,
  TeamMetrics,
  StatusCounts,
  SellerFilters,
  SellerStatus,
  SellerSortField,
} from "@/lib/types/sellers";

interface VendedoresListProps {
  initialData?: {
    items: SellerWithMetrics[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    statusCounts: StatusCounts;
    teamMetrics: TeamMetrics;
  };
}

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50];

const DEFAULT_TEAM_METRICS: TeamMetrics = {
  totalSellers: 0,
  activeSellers: 0,
  teamConversionRate: 0,
  teamAvgResponseTimeHours: null,
  totalQuotationsMonth: 0,
  totalAcceptedMonth: 0,
  totalPotentialMonth: 0,
  topSeller: null,
};

type StatusFilter = SellerStatus | "all";

export function VendedoresList({ initialData }: VendedoresListProps) {
  const [isPending, startTransition] = useTransition();

  // State - Lista
  const [sellers, setSellers] = useState<SellerWithMetrics[]>(
    initialData?.items || []
  );
  const [total, setTotal] = useState(initialData?.total || 0);
  const [page, setPage] = useState(initialData?.page || 1);
  const [limit, setLimit] = useState(initialData?.limit || 10);
  const [totalPages, setTotalPages] = useState(initialData?.totalPages || 0);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>(
    initialData?.statusCounts || { all: 0, active: 0, inactive: 0, vacation: 0 }
  );
  const [teamMetrics, setTeamMetrics] = useState<TeamMetrics>(
    initialData?.teamMetrics || DEFAULT_TEAM_METRICS
  );
  const [error, setError] = useState<string | null>(null);

  // State - Filtros e Busca
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SellerSortField>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Modal state - Form (criar/editar)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<SellerWithMetrics | null>(null);

  // Modal state - Status (ativar/desativar/ferias)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusTargetSeller, setStatusTargetSeller] = useState<SellerWithMetrics | null>(null);
  const [targetStatus, setTargetStatus] = useState<SellerStatus>("ACTIVE");

  // Modal state - Profile (T050)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileSellerId, setProfileSellerId] = useState<string | null>(null);

  // Modal state - Round-Robin Config (T056)
  const [isRoundRobinModalOpen, setIsRoundRobinModalOpen] = useState(false);
  const [roundRobinKey, setRoundRobinKey] = useState(0);

  // Modal state - Reassign Leads (T069)
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [reassignTargetSeller, setReassignTargetSeller] = useState<SellerWithMetrics | null>(null);

  // Fetch data
  const fetchData = useCallback(async (filters: Partial<SellerFilters>) => {
    setError(null);

    const result = await listSellersAction(filters);

    if (result.success && result.data) {
      setSellers(result.data.items);
      setTotal(result.data.total);
      setPage(result.data.page);
      setLimit(result.data.limit);
      setTotalPages(result.data.totalPages);
      setStatusCounts(result.data.statusCounts);
      setTeamMetrics(result.data.teamMetrics);
    } else {
      setError(result.error || "Erro ao carregar vendedores");
    }
  }, []);

  // Helper para construir filtros atuais
  const buildFilters = useCallback(
    (overrides: Partial<SellerFilters> = {}): SellerFilters => ({
      page,
      limit,
      search: search || undefined,
      status: statusFilter === "all" ? undefined : [statusFilter],
      sortBy,
      sortOrder,
      ...overrides,
    }),
    [page, limit, search, statusFilter, sortBy, sortOrder]
  );

  // Initial load
  const hasLoadedRef = useRef(false);
  useEffect(() => {
    if (!initialData && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      startTransition(() => {
        void fetchData({ page: 1, limit: 10 });
      });
    }
  }, [fetchData, initialData]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    startTransition(() => {
      void fetchData(buildFilters({ page: newPage }));
    });
  };

  // Handle limit change
  const handleLimitChange = (newLimit: string) => {
    const limitValue = parseInt(newLimit, 10);
    startTransition(() => {
      void fetchData(buildFilters({ page: 1, limit: limitValue }));
    });
  };

  // Handle search change
  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    startTransition(() => {
      void fetchData(buildFilters({ page: 1, search: newSearch || undefined }));
    });
  };

  // Handle status filter change
  const handleStatusFilterChange = (newStatus: StatusFilter) => {
    setStatusFilter(newStatus);
    startTransition(() => {
      void fetchData(
        buildFilters({
          page: 1,
          status: newStatus === "all" ? undefined : [newStatus],
        })
      );
    });
  };

  // Handle sort by change
  const handleSortByChange = (newSortBy: SellerSortField) => {
    setSortBy(newSortBy);
    startTransition(() => {
      void fetchData(buildFilters({ page: 1, sortBy: newSortBy }));
    });
  };

  // Handle sort order change
  const handleSortOrderChange = (newSortOrder: "asc" | "desc") => {
    setSortOrder(newSortOrder);
    startTransition(() => {
      void fetchData(buildFilters({ page: 1, sortOrder: newSortOrder }));
    });
  };

  // Open modal for creating
  const handleOpenCreate = () => {
    setSelectedSeller(null);
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleEdit = (seller: SellerWithMetrics) => {
    setSelectedSeller(seller);
    setIsModalOpen(true);
  };

  // Open modal for viewing profile (T050)
  const handleViewProfile = (seller: SellerWithMetrics) => {
    setProfileSellerId(seller.id);
    setIsProfileModalOpen(true);
  };

  // Handle profile modal close
  const handleProfileModalClose = (open: boolean) => {
    if (!open) {
      setProfileSellerId(null);
    }
    setIsProfileModalOpen(open);
  };

  // Open modal for changing status
  const handleChangeStatus = (seller: SellerWithMetrics, newStatus: SellerStatus) => {
    setStatusTargetSeller(seller);
    setTargetStatus(newStatus);
    setIsStatusModalOpen(true);
  };

  // Handle status modal close
  const handleStatusModalClose = (open: boolean) => {
    if (!open) {
      setStatusTargetSeller(null);
    }
    setIsStatusModalOpen(open);
  };

  // Handle status change success
  const handleStatusSuccess = () => {
    startTransition(() => {
      void fetchData(buildFilters());
    });
  };

  // Open reassign leads modal (T069)
  const handleReassignLeads = (seller: SellerWithMetrics) => {
    setReassignTargetSeller(seller);
    setIsReassignModalOpen(true);
  };

  // Handle reassign modal close (T069)
  const handleReassignModalClose = (open: boolean) => {
    if (!open) {
      setReassignTargetSeller(null);
    }
    setIsReassignModalOpen(open);
  };

  // Handle reassign success (T069)
  const handleReassignSuccess = () => {
    startTransition(() => {
      void fetchData(buildFilters());
    });
  };

  // Open round-robin config modal (T056)
  const handleOpenRoundRobinConfig = () => {
    setIsRoundRobinModalOpen(true);
  };

  // Handle round-robin config success (T056)
  const handleRoundRobinSuccess = () => {
    // Increment key to force refresh of round-robin card
    setRoundRobinKey((prev) => prev + 1);
  };

  // Handle successful creation or update
  const handleModalSuccess = () => {
    startTransition(() => {
      void fetchData(buildFilters());
    });
  };

  // Handle modal close
  const handleModalClose = (open: boolean) => {
    if (!open) {
      setSelectedSeller(null);
    }
    setIsModalOpen(open);
  };

  // Error state
  if (error && sellers.length === 0) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader
          title="Vendedores"
          description="Gerencie sua equipe de vendas"
          actions={
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              Novo Vendedor
            </Button>
          }
        />
        <VendedoresKpiCards metrics={DEFAULT_TEAM_METRICS} />
        <div className="text-center py-12">
          <p className="text-destructive mb-4">{error}</p>
          <Button
            variant="outline"
            onClick={() => fetchData({ page: 1, limit: 10 })}
          >
            Tentar novamente
          </Button>
        </div>
        <VendedoresModalForm
          open={isModalOpen}
          onOpenChange={handleModalClose}
          onSuccess={handleModalSuccess}
          seller={selectedSeller}
        />
        <VendedoresModalDeactivate
          open={isStatusModalOpen}
          onOpenChange={handleStatusModalClose}
          onSuccess={handleStatusSuccess}
          seller={statusTargetSeller}
          targetStatus={targetStatus}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <DashboardPageHeader
        title="Vendedores"
        description="Gerencie sua equipe de vendas"
        actions={
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            Novo Vendedor
          </Button>
        }
      />

      {/* KPI Cards */}
      <VendedoresKpiCards metrics={teamMetrics} />

      {/* Round-Robin Card (T056) */}
      <VendedoresRoundRobinCard
        key={roundRobinKey}
        onOpenConfig={handleOpenRoundRobinConfig}
      />

      {/* Results Card */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Status Tabs */}
          <VendedoresStatusTabs
            value={statusFilter}
            onChange={handleStatusFilterChange}
            counts={statusCounts}
            disabled={isPending}
          />

          {/* Search and Sort */}
          <VendedoresSearch
            search={search}
            onSearchChange={handleSearchChange}
            sortBy={sortBy}
            onSortByChange={handleSortByChange}
            sortOrder={sortOrder}
            onSortOrderChange={handleSortOrderChange}
            disabled={isPending}
          />

          {/* Header with total count and items per page */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {total} vendedor{total !== 1 ? "es" : ""} encontrado{total !== 1 ? "s" : ""}
            </p>

            {/* Items per page selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Exibir:</span>
              <Select value={limit.toString()} onValueChange={handleLimitChange} disabled={isPending}>
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
            {sellers.length === 0 && !isPending ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-1">Nenhum vendedor encontrado</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                  {search || statusFilter !== "all"
                    ? "Nenhum vendedor corresponde aos filtros aplicados. Tente ajustar a busca ou filtros."
                    : "Ainda nao ha vendedores cadastrados. Clique no botao acima para cadastrar o primeiro vendedor."}
                </p>
                {(search || statusFilter !== "all") && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearch("");
                      setStatusFilter("all");
                      startTransition(() => {
                        void fetchData({ page: 1, limit, search: undefined, status: undefined });
                      });
                    }}
                  >
                    Limpar filtros
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Mobile: Cards */}
                <div className="lg:hidden space-y-3">
                  {sellers.map((seller) => (
                    <VendedoresCard
                      key={seller.id}
                      seller={seller}
                      onEdit={handleEdit}
                      onViewProfile={handleViewProfile}
                      onChangeStatus={handleChangeStatus}
                      onReassignLeads={handleReassignLeads}
                    />
                  ))}
                </div>

                {/* Desktop: Table */}
                <div className="hidden lg:block">
                  <VendedoresTable
                    sellers={sellers}
                    onEdit={handleEdit}
                    onViewProfile={handleViewProfile}
                    onChangeStatus={handleChangeStatus}
                    onReassignLeads={handleReassignLeads}
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

      {/* Create/Edit Seller Modal */}
      <VendedoresModalForm
        open={isModalOpen}
        onOpenChange={handleModalClose}
        onSuccess={handleModalSuccess}
        seller={selectedSeller}
      />

      {/* Change Status Modal */}
      <VendedoresModalDeactivate
        open={isStatusModalOpen}
        onOpenChange={handleStatusModalClose}
        onSuccess={handleStatusSuccess}
        seller={statusTargetSeller}
        targetStatus={targetStatus}
      />

      {/* Profile Modal (T050) */}
      <VendedoresModalProfile
        open={isProfileModalOpen}
        onOpenChange={handleProfileModalClose}
        sellerId={profileSellerId}
      />

      {/* Round-Robin Config Modal (T056) */}
      <VendedoresRoundRobinModal
        open={isRoundRobinModalOpen}
        onOpenChange={setIsRoundRobinModalOpen}
        onSuccess={handleRoundRobinSuccess}
      />

      {/* Reassign Leads Modal (T069) */}
      <VendedoresModalReassign
        open={isReassignModalOpen}
        onOpenChange={handleReassignModalClose}
        onSuccess={handleReassignSuccess}
        seller={reassignTargetSeller}
      />
    </div>
  );
}
