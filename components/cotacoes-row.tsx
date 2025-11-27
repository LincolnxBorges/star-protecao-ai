/**
 * Cotacoes Row Component
 * @module components/cotacoes-row
 *
 * Linha da tabela com dados do veiculo, cliente, valor, status.
 * Conforme FR-001, FR-012 (destaque visual para expirando/novas).
 */

"use client";

import Link from "next/link";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Eye, MessageCircle, Clock, AlertTriangle } from "lucide-react";
import type { QuotationWithRelations } from "@/lib/quotations";
import { cn, formatWhatsAppLink } from "@/lib/utils";

interface CotacoesRowProps {
  quotation: QuotationWithRelations;
}

// ===========================================
// Status Configuration
// ===========================================

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  PENDING: { label: "Pendente", variant: "default" },
  CONTACTED: { label: "Contatado", variant: "secondary" },
  ACCEPTED: { label: "Aceita", variant: "default" },
  CANCELLED: { label: "Cancelada", variant: "destructive" },
  EXPIRED: { label: "Expirada", variant: "outline" },
  REJECTED: { label: "Recusada", variant: "destructive" },
};

const CATEGORY_LABELS: Record<string, string> = {
  NORMAL: "Normal",
  ESPECIAL: "Especial",
  UTILITARIO: "Utilitario",
  MOTO: "Moto",
};

// ===========================================
// Helper Functions
// ===========================================

function formatCurrency(value: string | number): string {
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numValue);
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

function formatTimeAgo(date: Date | string | null): string {
  if (!date) return "-";
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}min`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return "1 dia";
  return `${diffDays} dias`;
}

function isExpiringToday(expiresAt: Date | string | null): boolean {
  if (!expiresAt) return false;
  const expiry = new Date(expiresAt);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const expiryDate = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());
  return expiryDate.getTime() === today.getTime();
}

function isNew(createdAt: Date | string | null): boolean {
  if (!createdAt) return false;
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  return diffHours <= 2;
}

// ===========================================
// Component
// ===========================================

export function CotacoesRow({ quotation }: CotacoesRowProps) {
  const statusConfig = STATUS_CONFIG[quotation.status] || {
    label: quotation.status,
    variant: "outline" as const,
  };

  const expiringToday = isExpiringToday(quotation.expiresAt);
  const isNewQuotation = isNew(quotation.createdAt);

  return (
    <TableRow
      className={cn(
        expiringToday && quotation.status === "PENDING" && "border-l-4 border-l-destructive",
        "hover:bg-muted/50"
      )}
    >
      {/* Status */}
      <TableCell>
        <div className="flex items-center gap-2">
          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          {isNewQuotation && quotation.status === "PENDING" && (
            <Badge variant="secondary" className="text-xs">
              Novo
            </Badge>
          )}
        </div>
      </TableCell>

      {/* Veiculo */}
      <TableCell>
        <div className="space-y-1">
          <p className="font-medium">
            {quotation.vehicle.marca} {quotation.vehicle.modelo}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground font-mono">
              {quotation.vehicle.placa}
            </span>
            <Badge variant="outline" className="text-xs">
              {CATEGORY_LABELS[quotation.vehicle.categoria] || quotation.vehicle.categoria}
            </Badge>
          </div>
        </div>
      </TableCell>

      {/* Cliente */}
      <TableCell>
        <div className="space-y-1">
          <p className="font-medium">{quotation.customer.name}</p>
          <p className="text-sm text-muted-foreground">
            {formatPhone(quotation.customer.phone)}
          </p>
          <p className="text-xs text-muted-foreground">
            {quotation.customer.city}/{quotation.customer.state}
          </p>
        </div>
      </TableCell>

      {/* Mensalidade */}
      <TableCell className="text-right">
        <span className="font-medium">{formatCurrency(quotation.mensalidade)}</span>
      </TableCell>

      {/* Tempo desde criacao */}
      <TableCell>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{formatTimeAgo(quotation.createdAt)}</span>
          {expiringToday && quotation.status === "PENDING" && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Expira hoje!</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </TableCell>

      {/* Vendedor */}
      <TableCell>
        {quotation.seller ? (
          <span className="text-sm">{quotation.seller.name}</span>
        ) : (
          <span className="text-sm text-muted-foreground">Nao atribuido</span>
        )}
      </TableCell>

      {/* Acoes */}
      <TableCell>
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" asChild>
                  <a
                    href={formatWhatsAppLink(quotation.customer.phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="h-4 w-4 text-green-600" />
                    <span className="sr-only">WhatsApp</span>
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Abrir WhatsApp</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/cotacoes/${quotation.id}`}>
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">Ver detalhes</span>
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ver detalhes</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </TableCell>
    </TableRow>
  );
}
