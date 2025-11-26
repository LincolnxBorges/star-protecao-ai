"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowLeft, Phone, Mail, MapPin } from "lucide-react";

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
}

// ===========================================
// Helpers
// ===========================================

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Aguardando Contato",
  CONTACTED: "Em Negociacao",
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

// Valid transitions for showing action buttons
const NEXT_ACTIONS: Record<string, { status: string; label: string }[]> = {
  PENDING: [
    { status: "CONTACTED", label: "Marcar como Contatado" },
    { status: "CANCELLED", label: "Cancelar" },
  ],
  CONTACTED: [
    { status: "ACCEPTED", label: "Marcar como Aceita" },
    { status: "CANCELLED", label: "Cancelar" },
  ],
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "-";
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

function formatCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, "");
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function formatCep(cep: string): string {
  const digits = cep.replace(/\D/g, "");
  return digits.replace(/(\d{5})(\d{3})/, "$1-$2");
}

// ===========================================
// Component
// ===========================================

export function AdminQuotationDetails({ quotation }: Props) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [notes, setNotes] = useState(quotation.notes || "");
  const [error, setError] = useState<string | null>(null);

  const actions = NEXT_ACTIONS[quotation.status] || [];

  async function handleStatusUpdate(newStatus: string) {
    setIsUpdating(true);
    setError(null);

    try {
      const response = await fetch(`/api/quotations/${quotation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          notes: notes || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh the page to show updated data
        router.refresh();
      } else {
        setError(data.error?.message || "Erro ao atualizar status");
      }
    } catch {
      setError("Erro ao atualizar status");
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              Cotacao #{quotation.id.slice(0, 8).toUpperCase()}
            </h1>
            <p className="text-muted-foreground">
              Criada em {formatDate(quotation.createdAt)}
            </p>
          </div>
        </div>
        <Badge
          variant={STATUS_VARIANTS[quotation.status] || "outline"}
          className="text-base px-4 py-1"
        >
          {STATUS_LABELS[quotation.status] || quotation.status}
        </Badge>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-destructive/10 text-destructive rounded-md p-4">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-semibold text-lg">{quotation.customer.name}</p>
              <p className="text-sm text-muted-foreground font-mono">
                CPF: {formatCpf(quotation.customer.cpf)}
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a
                href={`tel:${quotation.customer.phone}`}
                className="hover:underline"
              >
                {formatPhone(quotation.customer.phone)}
              </a>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a
                href={`mailto:${quotation.customer.email}`}
                className="hover:underline"
              >
                {quotation.customer.email}
              </a>
            </div>

            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p>
                  {quotation.customer.address.street},{" "}
                  {quotation.customer.address.number}
                  {quotation.customer.address.complement &&
                    ` - ${quotation.customer.address.complement}`}
                </p>
                <p>
                  {quotation.customer.address.neighborhood} -{" "}
                  {quotation.customer.address.city}/
                  {quotation.customer.address.state}
                </p>
                <p className="font-mono">
                  CEP: {formatCep(quotation.customer.address.cep)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Veiculo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-semibold text-lg">
                {quotation.vehicle.marca} {quotation.vehicle.modelo}
              </p>
              <p className="font-mono text-muted-foreground">
                {quotation.vehicle.placa}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Ano</p>
                <p className="font-medium">{quotation.vehicle.ano}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Valor FIPE</p>
                <p className="font-medium">
                  {formatCurrency(quotation.vehicle.valorFipe)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Categoria</p>
                <p className="font-medium">{quotation.vehicle.categoria}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Tipo de Uso</p>
                <p className="font-medium">{quotation.vehicle.tipoUso}</p>
              </div>
              {quotation.vehicle.combustivel && (
                <div>
                  <p className="text-muted-foreground">Combustivel</p>
                  <p className="font-medium">{quotation.vehicle.combustivel}</p>
                </div>
              )}
              {quotation.vehicle.cor && (
                <div>
                  <p className="text-muted-foreground">Cor</p>
                  <p className="font-medium">{quotation.vehicle.cor}</p>
                </div>
              )}
            </div>

            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground font-mono">
                FIPE: {quotation.vehicle.codigoFipe}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Valores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {quotation.status === "REJECTED" ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground">Cotacao recusada</p>
                {quotation.rejectionReason && (
                  <p className="text-sm mt-2">{quotation.rejectionReason}</p>
                )}
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Mensalidade</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(quotation.mensalidade)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Taxa de Adesao</span>
                  <div className="text-right">
                    <span className="line-through text-muted-foreground mr-2">
                      {formatCurrency(quotation.adesao)}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(quotation.adesaoDesconto)}
                    </span>
                  </div>
                </div>
                {quotation.cotaParticipacao && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">
                      Cota de Participacao
                    </span>
                    <span className="font-medium">
                      {formatCurrency(quotation.cotaParticipacao)}
                    </span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Timeline / Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Historico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Criada em</span>
              <span>{formatDate(quotation.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Validade</span>
              <span>{formatDate(quotation.expiresAt)}</span>
            </div>
            {quotation.contactedAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contatado em</span>
                <span>{formatDate(quotation.contactedAt)}</span>
              </div>
            )}
            {quotation.acceptedAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Aceita em</span>
                <span>{formatDate(quotation.acceptedAt)}</span>
              </div>
            )}

            {quotation.seller && (
              <div className="pt-3 border-t">
                <p className="text-muted-foreground mb-1">Vendedor</p>
                <p className="font-medium">{quotation.seller.name}</p>
                <p className="text-muted-foreground">
                  {quotation.seller.email}
                </p>
                {quotation.seller.phone && (
                  <p className="text-muted-foreground">
                    {formatPhone(quotation.seller.phone)}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      {actions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Acoes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Observacoes (opcional)
              </label>
              <Textarea
                placeholder="Adicione observacoes sobre esta cotacao..."
                value={notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              {actions.map((action) => (
                <Button
                  key={action.status}
                  variant={
                    action.status === "CANCELLED" ? "destructive" : "default"
                  }
                  onClick={() => handleStatusUpdate(action.status)}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {action.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes display for completed/cancelled quotations */}
      {quotation.notes && !actions.length && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Observacoes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{quotation.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
