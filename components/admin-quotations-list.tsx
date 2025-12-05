"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ChevronLeft, ChevronRight, Eye } from "lucide-react";

// ===========================================
// Types
// ===========================================

interface QuotationListItem {
  id: string;
  status: string;
  mensalidade: number;
  createdAt: string;
  expiresAt: string;
  customer: {
    id: string;
    name: string;
    phone: string;
  };
  vehicle: {
    id: string;
    placa: string;
    marca: string;
    modelo: string;
    valorFipe: number;
  };
  seller: {
    id: string;
    name: string;
  } | null;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ===========================================
// Helpers
// ===========================================

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Aguardando",
  CONTACTED: "Contatado",
  ACCEPTED: "Aceita",
  CANCELLED: "Cancelada",
  EXPIRED: "Expirada",
  REJECTED: "Recusada",
};

const STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDING: "default",
  CONTACTED: "secondary",
  ACCEPTED: "default",
  CANCELLED: "destructive",
  EXPIRED: "outline",
  REJECTED: "destructive",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(dateString));
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

// ===========================================
// Component
// ===========================================

export function AdminQuotationsList() {
  const [quotations, setQuotations] = useState<QuotationListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchQuotations(page = 1, status?: string) {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "20");

      if (status && status !== "all") {
        params.set("status", status);
      }

      const response = await fetch(`/api/quotations?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setQuotations(data.data.items);
        setPagination(data.data.pagination);
      } else {
        setError(data.error?.message || "Erro ao carregar cotacoes");
      }
    } catch {
      setError("Erro ao carregar cotacoes");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchQuotations(pagination.page, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleStatusFilterChange(value: string) {
    setStatusFilter(value);
    fetchQuotations(1, value);
  }

  function handlePageChange(newPage: number) {
    fetchQuotations(newPage, statusFilter);
  }

  if (isLoading && quotations.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">{error}</p>
        <Button
          variant="outline"
          onClick={() => fetchQuotations(pagination.page, statusFilter)}
          className="mt-4"
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="PENDING">Aguardando</SelectItem>
              <SelectItem value="CONTACTED">Contatado</SelectItem>
              <SelectItem value="ACCEPTED">Aceita</SelectItem>
              <SelectItem value="CANCELLED">Cancelada</SelectItem>
              <SelectItem value="EXPIRED">Expirada</SelectItem>
              <SelectItem value="REJECTED">Recusada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="ml-auto text-sm text-muted-foreground">
          {pagination.total} cotacao(es)
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Veiculo</TableHead>
              <TableHead className="text-right">Mensalidade</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Vendedor</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <p className="text-muted-foreground">
                    Nenhuma cotacao encontrada
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              quotations.map((q) => (
                <TableRow key={q.id}>
                  <TableCell>
                    <Badge variant={STATUS_VARIANTS[q.status] || "outline"}>
                      {STATUS_LABELS[q.status] || q.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{q.customer.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatPhone(q.customer.phone)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {q.vehicle.marca} {q.vehicle.modelo}
                      </p>
                      <p className="text-sm text-muted-foreground font-mono">
                        {q.vehicle.placa}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(q.mensalidade)}
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{formatDate(q.createdAt)}</p>
                  </TableCell>
                  <TableCell>
                    {q.seller ? (
                      <p className="text-sm">{q.seller.name}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">-</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/cotacoes/${q.id}`}>
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">Ver detalhes</span>
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Pagina {pagination.page} de {pagination.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || isLoading}
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
