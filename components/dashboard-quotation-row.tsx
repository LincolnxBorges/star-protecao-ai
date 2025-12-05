"use client";

import { Phone, MessageCircle, Eye, Car, Truck, Bike } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import type { QuotationListItem, VehicleCategory } from "@/lib/types/dashboard";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/types/dashboard";

interface DashboardQuotationRowProps {
  quotation: QuotationListItem;
  onContactClick: (quotationId: string) => void;
}

function VehicleIcon({ category }: { category: VehicleCategory }) {
  switch (category) {
    case "MOTO":
      return <Bike className="h-4 w-4" />;
    case "UTILITARIO":
      return <Truck className="h-4 w-4" />;
    default:
      return <Car className="h-4 w-4" />;
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return `${diffMins}min atrás`;
  }
  if (diffHours < 24) {
    return `${diffHours}h atrás`;
  }
  return `${diffDays}d atrás`;
}

function getWhatsAppUrl(phone: string, customerName: string): string {
  const cleaned = phone.replace(/\D/g, "");
  const message = encodeURIComponent(
    `Olá ${customerName.split(" ")[0]}! Sou da Star Proteção e recebi sua cotação de proteção veicular. Posso te ajudar?`
  );
  return `https://wa.me/55${cleaned}?text=${message}`;
}

function getPhoneUrl(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  return `tel:+55${cleaned}`;
}

export function DashboardQuotationRow({
  quotation,
  onContactClick,
}: DashboardQuotationRowProps) {
  const statusColor = STATUS_COLORS[quotation.status];
  const statusLabel = STATUS_LABELS[quotation.status];
  const isPending = quotation.status === "PENDING";

  const handleContactClick = () => {
    if (isPending) {
      onContactClick(quotation.id);
    }
  };

  return (
    <div
      data-testid="quotation-row"
      className="flex items-center justify-between rounded-lg border bg-card p-4"
    >
      <div className="flex items-center gap-4">
        {/* Vehicle Icon */}
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
          <VehicleIcon category={quotation.vehicle.categoria} />
        </div>

        {/* Vehicle and Customer Info */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {quotation.vehicle.marca} {quotation.vehicle.modelo}
            </span>
            <span className="text-sm text-muted-foreground">
              {quotation.vehicle.ano}
            </span>
            <Badge
              variant="secondary"
              className={statusColor}
            >
              {statusLabel}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{quotation.customer.name}</span>
            <span>•</span>
            <span>{formatPhone(quotation.customer.phone)}</span>
            <span>•</span>
            <span>{formatTimeAgo(quotation.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Price and Actions */}
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="font-semibold">
            {formatCurrency(quotation.mensalidade)}/mês
          </p>
          <p className="text-sm text-muted-foreground">
            FIPE: {formatCurrency(quotation.vehicle.valorFipe)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            asChild
            onClick={handleContactClick}
            data-testid="contact-phone-button"
          >
            <a href={getPhoneUrl(quotation.customer.phone)}>
              <Phone className="h-4 w-4" />
            </a>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="text-green-600 hover:text-green-700"
            asChild
            onClick={handleContactClick}
            data-testid="contact-whatsapp-button"
          >
            <a
              href={getWhatsAppUrl(quotation.customer.phone, quotation.customer.name)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="h-4 w-4" />
            </a>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            asChild
            data-testid="view-details-button"
          >
            <Link href={`/cotacoes/${quotation.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
