/**
 * Cotacoes Mobile Card Component
 * @module components/cotacoes-mobile-card
 *
 * Card responsivo para visualizacao mobile da lista de cotacoes.
 * Conforme FR-032: cards empilhados em mobile.
 */

"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, MessageCircle, Clock, AlertTriangle, Car, User } from "lucide-react";
import type { QuotationWithRelations } from "@/lib/quotations";
import { cn, formatWhatsAppLink } from "@/lib/utils";

interface CotacoesMobileCardProps {
  quotation: QuotationWithRelations;
}

// ===========================================
// Status Configuration
// ===========================================

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" }
> = {
  PENDING: { label: "Pendente", variant: "warning" },
  CONTACTED: { label: "Contatado", variant: "info" },
  ACCEPTED: { label: "Aceita", variant: "success" },
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

export function CotacoesMobileCard({ quotation }: CotacoesMobileCardProps) {
  const statusConfig = STATUS_CONFIG[quotation.status] || {
    label: quotation.status,
    variant: "outline" as const,
  };

  const expiringToday = isExpiringToday(quotation.expiresAt);
  const isNewQuotation = isNew(quotation.createdAt);

  return (
    <Card
      className={cn(
        expiringToday && quotation.status === "PENDING" && "border-l-4 border-l-destructive"
      )}
    >
      <CardContent className="p-4">
        {/* Header: Status + Time */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
            {isNewQuotation && quotation.status === "PENDING" && (
              <Badge variant="secondary" className="text-xs">
                Novo
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" aria-hidden="true" />
            <span>{formatTimeAgo(quotation.createdAt)}</span>
            {expiringToday && quotation.status === "PENDING" && (
              <>
                <AlertTriangle className="h-4 w-4 text-destructive ml-1" aria-hidden="true" />
                <span className="sr-only">Expira hoje</span>
              </>
            )}
          </div>
        </div>

        {/* Vehicle Info */}
        <div className="flex items-start gap-2 mb-3">
          <Car className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">
              {quotation.vehicle.marca} {quotation.vehicle.modelo}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground font-mono">
                {quotation.vehicle.placa}
              </span>
              <Badge variant="outline" className="text-xs">
                {CATEGORY_LABELS[quotation.vehicle.categoria] || quotation.vehicle.categoria}
              </Badge>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="flex items-start gap-2 mb-3">
          <User className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{quotation.customer.name}</p>
            <p className="text-sm text-muted-foreground">
              {formatPhone(quotation.customer.phone)}
            </p>
            <p className="text-xs text-muted-foreground">
              {quotation.customer.city}/{quotation.customer.state}
            </p>
          </div>
        </div>

        {/* Value + Seller */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b">
          <div>
            <p className="text-xs text-muted-foreground">Mensalidade</p>
            <p className="font-bold text-lg">{formatCurrency(quotation.mensalidade)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Vendedor</p>
            <p className="text-sm">
              {quotation.seller?.name || (
                <span className="text-muted-foreground">Nao atribuido</span>
              )}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            className="flex-1 bg-light-green-600 hover:bg-light-green-700 dark:bg-light-green-500 dark:hover:bg-light-green-600 dark:text-white"
            asChild
          >
            <a
              href={formatWhatsAppLink(quotation.customer.phone)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="h-4 w-4 mr-2" aria-hidden="true" />
              WhatsApp
            </a>
          </Button>
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link href={`/cotacoes/${quotation.id}`}>
              <Eye className="h-4 w-4 mr-2" aria-hidden="true" />
              Ver Detalhes
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
