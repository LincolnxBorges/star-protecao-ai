/**
 * Client Quotations Modal Component
 * @module components/clients-quotations-modal
 *
 * Modal com todas as cotacoes do cliente: resumo, cards por status,
 * alerta de expiracao e opcoes de nova cotacao.
 * T046-T052: User Story 5 - Ver Historico de Cotacoes.
 */

"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Car,
  Calendar,
  Clock,
  AlertTriangle,
  Plus,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  Timer,
} from "lucide-react";
import { format, differenceInDays, isPast } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ClientQuotationsSummary, ClientQuotationDetail } from "@/lib/types/clients";

// Quotation status config
const QUOTATION_STATUS_CONFIG: Record<
  string,
  { label: string; className: string; icon: typeof CheckCircle }
> = {
  ACCEPTED: {
    label: "Aceita",
    className: "bg-green-500/10 text-green-700 border-green-500/20",
    icon: CheckCircle,
  },
  PENDING: {
    label: "Pendente",
    className: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
    icon: Clock,
  },
  CONTACTED: {
    label: "Contatado",
    className: "bg-blue-500/10 text-blue-700 border-blue-500/20",
    icon: Clock,
  },
  EXPIRED: {
    label: "Expirada",
    className: "bg-red-500/10 text-red-700 border-red-500/20",
    icon: XCircle,
  },
  CANCELLED: {
    label: "Cancelada",
    className: "bg-muted text-muted-foreground border-muted-foreground/20",
    icon: XCircle,
  },
  REJECTED: {
    label: "Rejeitada",
    className: "bg-red-500/10 text-red-700 border-red-500/20",
    icon: XCircle,
  },
};

interface ClientsQuotationsModalProps {
  clientId: string | null;
  clientName: string;
  isOpen: boolean;
  onClose: () => void;
  onLoadQuotations: (clientId: string) => Promise<ClientQuotationsSummary | null>;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function getExpiringStatus(expiresAt: Date | null): { isExpiringSoon: boolean; daysLeft: number } {
  if (!expiresAt) return { isExpiringSoon: false, daysLeft: 0 };

  const daysLeft = differenceInDays(expiresAt, new Date());
  return {
    isExpiringSoon: daysLeft >= 0 && daysLeft <= 7,
    daysLeft,
  };
}

export function ClientsQuotationsModal({
  clientId,
  clientName,
  isOpen,
  onClose,
  onLoadQuotations,
}: ClientsQuotationsModalProps) {
  const router = useRouter();
  const [data, setData] = useState<ClientQuotationsSummary | null>(null);
  const [isPending, startTransition] = useTransition();

  // Load quotations when clientId changes
  useEffect(() => {
    if (clientId && isOpen) {
      startTransition(async () => {
        const result = await onLoadQuotations(clientId);
        setData(result);
      });
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setData(null);
    }
  }, [clientId, isOpen, onLoadQuotations]);

  const handleClose = () => {
    setData(null);
    onClose();
  };

  // Navigate to new quotation page with pre-filled customer
  const handleNewQuotation = () => {
    if (clientId) {
      router.push(`/cotacao?customerId=${clientId}`);
      handleClose();
    }
  };

  // Navigate to re-quote a vehicle
  const handleReQuote = (vehiclePlaca: string) => {
    if (clientId) {
      router.push(`/cotacao?customerId=${clientId}&placa=${vehiclePlaca}`);
      handleClose();
    }
  };

  // Group quotations by status
  const groupedQuotations = data?.quotations.reduce(
    (acc, q) => {
      const group = q.status === "ACCEPTED" ? "accepted" :
                   ["PENDING", "CONTACTED"].includes(q.status) ? "pending" : "other";
      acc[group].push(q);
      return acc;
    },
    { accepted: [] as ClientQuotationDetail[], pending: [] as ClientQuotationDetail[], other: [] as ClientQuotationDetail[] }
  );

  // Count expiring soon quotations
  const expiringSoonCount = data?.quotations.filter(
    (q) => ["PENDING", "CONTACTED"].includes(q.status) && getExpiringStatus(q.expiresAt).isExpiringSoon
  ).length || 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Cotacoes de {clientName}
          </DialogTitle>
        </DialogHeader>

        {isPending ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : data ? (
          <ScrollArea className="max-h-[calc(90vh-80px)]">
            <div className="px-6 pb-6 space-y-6">
              {/* Summary Header */}
              <section>
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold">{data.total}</p>
                      <p className="text-xs text-muted-foreground">Total de Cotacoes</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-green-600">{data.accepted}</p>
                      <p className="text-xs text-muted-foreground">Aceitas</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-primary">
                        {formatCurrency(data.activeMonthlyValue)}
                      </p>
                      <p className="text-xs text-muted-foreground">Valor Mensal Ativo</p>
                    </CardContent>
                  </Card>
                </div>
              </section>

              {/* Expiring Soon Alert */}
              {expiringSoonCount > 0 && (
                <div className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-yellow-700">
                      {expiringSoonCount} cotacao{expiringSoonCount > 1 ? "es" : ""} expirando em breve
                    </p>
                    <p className="text-sm text-yellow-600">
                      Entre em contato com o cliente para finalizar a negociacao.
                    </p>
                  </div>
                </div>
              )}

              <Separator />

              {/* Quotations List */}
              {data.quotations.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Nenhuma cotacao registrada.</p>
                  <Button className="mt-4" onClick={handleNewQuotation}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Nova Cotacao
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Accepted Quotations */}
                  {groupedQuotations && groupedQuotations.accepted.length > 0 && (
                    <section>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Cotacoes Aceitas ({groupedQuotations.accepted.length})
                      </h3>
                      <div className="space-y-2">
                        {groupedQuotations.accepted.map((q) => (
                          <QuotationCard key={q.id} quotation={q} onReQuote={handleReQuote} />
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Pending Quotations */}
                  {groupedQuotations && groupedQuotations.pending.length > 0 && (
                    <section>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        Em Negociacao ({groupedQuotations.pending.length})
                      </h3>
                      <div className="space-y-2">
                        {groupedQuotations.pending.map((q) => (
                          <QuotationCard key={q.id} quotation={q} onReQuote={handleReQuote} />
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Other Quotations (Expired, Cancelled, Rejected) */}
                  {groupedQuotations && groupedQuotations.other.length > 0 && (
                    <section>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                        Historico ({groupedQuotations.other.length})
                      </h3>
                      <div className="space-y-2">
                        {groupedQuotations.other.map((q) => (
                          <QuotationCard key={q.id} quotation={q} onReQuote={handleReQuote} />
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              )}

              <Separator />

              {/* New Quotation Button */}
              <div className="flex justify-center">
                <Button onClick={handleNewQuotation} size="lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Cotacao para este Cliente
                </Button>
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Erro ao carregar cotacoes.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Quotation Card Component
interface QuotationCardProps {
  quotation: ClientQuotationDetail;
  onReQuote: (vehiclePlaca: string) => void;
}

function QuotationCard({ quotation, onReQuote }: QuotationCardProps) {
  const statusConfig = QUOTATION_STATUS_CONFIG[quotation.status] || {
    label: quotation.status,
    className: "bg-muted text-muted-foreground",
    icon: Clock,
  };
  const StatusIcon = statusConfig.icon;

  const { isExpiringSoon, daysLeft } = getExpiringStatus(quotation.expiresAt);
  const isExpired = quotation.expiresAt && isPast(quotation.expiresAt);
  const canReQuote = ["EXPIRED", "CANCELLED", "REJECTED"].includes(quotation.status);

  return (
    <div className="bg-muted/30 rounded-lg p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-background rounded-lg">
            <Car className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="font-medium">
              {quotation.vehicle.marca} {quotation.vehicle.modelo}
            </p>
            <p className="text-sm text-muted-foreground">
              {quotation.vehicle.placa} • {quotation.vehicle.ano}
            </p>
            <p className="text-sm">
              <span className="font-semibold">{formatCurrency(quotation.mensalidade)}</span>
              <span className="text-muted-foreground">/mes</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <Badge className={statusConfig.className}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusConfig.label}
          </Badge>

          {/* Expiring Soon Warning */}
          {isExpiringSoon && !isExpired && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                    <Timer className="h-3 w-3 mr-1" />
                    {daysLeft === 0 ? "Expira hoje" : `${daysLeft} dia${daysLeft > 1 ? "s" : ""}`}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Esta cotacao expira em {format(quotation.expiresAt!, "dd/MM/yyyy")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Re-quote Button for Expired/Cancelled/Rejected */}
          {canReQuote && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReQuote(quotation.vehicle.placa)}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Recotar
            </Button>
          )}
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-3 pt-3 border-t flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          Criada em {format(quotation.createdAt, "dd/MM/yyyy")}
        </span>
        {quotation.acceptedAt && (
          <span className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-green-600" />
            Aceita em {format(quotation.acceptedAt, "dd/MM/yyyy")}
          </span>
        )}
        {quotation.expiresAt && !quotation.acceptedAt && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {isPast(quotation.expiresAt) ? "Expirou em" : "Expira em"}{" "}
            {format(quotation.expiresAt, "dd/MM/yyyy")}
          </span>
        )}
        {quotation.seller && (
          <span className="ml-auto">
            Vendedor: {quotation.seller.name}
          </span>
        )}
      </div>

      {/* FIPE Value and Fees */}
      <div className="mt-2 pt-2 border-t flex items-center gap-4 text-xs text-muted-foreground">
        <span>Valor FIPE: {formatCurrency(quotation.vehicle.valorFipe)}</span>
        <span>
          Adesao: {formatCurrency(quotation.adesaoDesconto)}
          {quotation.adesaoDesconto < quotation.adesao && (
            <span className="line-through ml-1">{formatCurrency(quotation.adesao)}</span>
          )}
        </span>
      </div>
    </div>
  );
}
