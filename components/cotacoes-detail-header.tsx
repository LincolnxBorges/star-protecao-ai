/**
 * Cotacoes Detail Header Component
 * @module components/cotacoes-detail-header
 *
 * Cabecalho da pagina de detalhes com titulo, status badge e botao voltar.
 */

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuotationStatus } from "@/lib/types/quotations";

interface CotacoesDetailHeaderProps {
  quotationId: string;
  status: QuotationStatus;
  customerName: string;
  vehiclePlate: string;
}

const STATUS_CONFIG: Record<
  QuotationStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  PENDING: { label: "Pendente", variant: "default" },
  CONTACTED: { label: "Contatada", variant: "secondary" },
  ACCEPTED: { label: "Aceita", variant: "default" },
  EXPIRED: { label: "Expirada", variant: "outline" },
  CANCELLED: { label: "Cancelada", variant: "destructive" },
  REJECTED: { label: "Rejeitada", variant: "destructive" },
};

export function CotacoesDetailHeader({
  status,
  customerName,
  vehiclePlate,
}: CotacoesDetailHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const statusConfig = STATUS_CONFIG[status] || {
    label: status,
    variant: "outline" as const,
  };

  // Navigate back preserving filters
  const handleBack = () => {
    const params = new URLSearchParams(searchParams.toString());
    const queryString = params.toString();
    router.push(queryString ? `/cotacoes?${queryString}` : "/cotacoes");
  };

  return (
    <div className="flex items-start justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Voltar para lista</span>
          </Button>
          <h1 className="text-2xl font-bold">{customerName}</h1>
          <Badge
            variant={statusConfig.variant}
            className={cn(
              "text-xs",
              status === "PENDING" && "bg-yellow-500 text-white hover:bg-yellow-600",
              status === "ACCEPTED" && "bg-green-500 text-white hover:bg-green-600"
            )}
          >
            {statusConfig.label}
          </Badge>
        </div>
        <p className="text-muted-foreground ml-11">
          Placa: <span className="font-medium">{vehiclePlate}</span>
        </p>
      </div>
    </div>
  );
}
