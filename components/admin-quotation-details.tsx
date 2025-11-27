"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CotacoesDetailHeader } from "@/components/cotacoes-detail-header";
import { CotacoesDetailClient } from "@/components/cotacoes-detail-client";
import { CotacoesDetailVehicle } from "@/components/cotacoes-detail-vehicle";
import { CotacoesDetailValues } from "@/components/cotacoes-detail-values";
import { CotacoesDetailSeller } from "@/components/cotacoes-detail-seller";
import { CotacoesDetailStatus } from "@/components/cotacoes-detail-status";
import { CotacoesDetailHistory } from "@/components/cotacoes-detail-history";
import type { QuotationStatus, QuotationActivity } from "@/lib/types/quotations";

// ===========================================
// Types
// ===========================================

interface QuotationDetails {
  id: string;
  status: string;
  rejectionReason: string | null;
  mensalidade: number;
  adesao: number;
  adesaoDesconto: number;
  cotaParticipacao: number | null;
  createdAt: string;
  expiresAt: string;
  contactedAt: string | null;
  acceptedAt: string | null;
  notes: string | null;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
    cpf: string;
    address: {
      cep: string;
      street: string;
      number: string;
      complement: string | null;
      neighborhood: string;
      city: string;
      state: string;
    };
  };
  vehicle: {
    id: string;
    placa: string;
    marca: string;
    modelo: string;
    ano: string;
    valorFipe: number;
    codigoFipe: string;
    combustivel: string | null;
    cor: string | null;
    categoria: string;
    tipoUso: string;
  };
  seller: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  } | null;
}

interface Props {
  quotation: QuotationDetails;
  activities: QuotationActivity[];
}

// ===========================================
// Component
// ===========================================

export function AdminQuotationDetails({ quotation, activities }: Props) {
  // Check if quotation is expired
  const isExpired = quotation.status === "EXPIRED" ||
    Boolean(quotation.expiresAt && new Date(quotation.expiresAt) < new Date());

  // Transform customer data for the detail component
  const clientData = {
    name: quotation.customer.name,
    cpf: quotation.customer.cpf,
    phone: quotation.customer.phone,
    email: quotation.customer.email,
    cep: quotation.customer.address.cep,
    street: quotation.customer.address.street,
    number: quotation.customer.address.number,
    complement: quotation.customer.address.complement,
    neighborhood: quotation.customer.address.neighborhood,
    city: quotation.customer.address.city,
    state: quotation.customer.address.state,
  };

  // Transform vehicle data for the detail component
  const vehicleData = {
    placa: quotation.vehicle.placa,
    marca: quotation.vehicle.marca,
    modelo: quotation.vehicle.modelo,
    ano: quotation.vehicle.ano,
    valorFipe: quotation.vehicle.valorFipe.toString(),
    codigoFipe: quotation.vehicle.codigoFipe,
    combustivel: quotation.vehicle.combustivel,
    cor: quotation.vehicle.cor,
    categoria: quotation.vehicle.categoria,
    tipoUso: quotation.vehicle.tipoUso,
  };

  // Transform values data for the detail component
  const valuesData = {
    mensalidade: quotation.mensalidade.toString(),
    adesao: quotation.adesao.toString(),
    adesaoDesconto: quotation.adesaoDesconto.toString(),
    cotaParticipacao: quotation.cotaParticipacao?.toString() || null,
    createdAt: quotation.createdAt,
    expiresAt: quotation.expiresAt,
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header with back button, title, and status badge */}
      <CotacoesDetailHeader
        quotationId={quotation.id}
        status={quotation.status as QuotationStatus}
        customerName={quotation.customer.name}
        vehiclePlate={quotation.vehicle.placa}
      />

      {/* Main content grid - responsive: single column on mobile, 2 cols on lg */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        {/* Client card (FR-015) */}
        <CotacoesDetailClient client={clientData} />

        {/* Vehicle card (FR-016) */}
        <CotacoesDetailVehicle vehicle={vehicleData} />

        {/* Values card (FR-017, FR-018) */}
        {quotation.status === "REJECTED" ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Valores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-muted-foreground">Cotacao recusada</p>
                {quotation.rejectionReason && (
                  <p className="text-sm mt-2">{quotation.rejectionReason}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <CotacoesDetailValues values={valuesData} />
        )}

        {/* Seller card (FR-019) */}
        <CotacoesDetailSeller
          seller={quotation.seller}
          assignedAt={quotation.createdAt}
        />
      </div>

      {/* Status change section (FR-020, FR-021, FR-028) */}
      <CotacoesDetailStatus
        quotationId={quotation.id}
        currentStatus={quotation.status as QuotationStatus}
        currentNotes={quotation.notes}
        isExpired={isExpired}
      />

      {/* History section (FR-022, FR-023, FR-024) */}
      <CotacoesDetailHistory
        quotationId={quotation.id}
        activities={activities}
      />
    </div>
  );
}
