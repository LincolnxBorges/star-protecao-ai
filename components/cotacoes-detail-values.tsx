/**
 * Cotacoes Detail Values Component
 * @module components/cotacoes-detail-values
 *
 * Card com valores da cotacao conforme FR-017:
 * mensalidade, adesao (cheio e desconto 20%), cota de participacao
 *
 * Barra de validade conforme FR-018:
 * validade 7 dias com barra de progresso visual e dias restantes
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DollarSign, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ValuesData {
  mensalidade: string;
  adesao: string;
  adesaoDesconto: string;
  cotaParticipacao: string | null;
  createdAt: Date | string | null;
  expiresAt: Date | string | null;
}

interface CotacoesDetailValuesProps {
  values: ValuesData;
}

function formatCurrency(value: string | number): string {
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numValue);
}

function calculateValidity(
  createdAt: Date | string | null,
  expiresAt: Date | string | null
): {
  daysRemaining: number;
  totalDays: number;
  percentRemaining: number;
  isExpired: boolean;
  isExpiringSoon: boolean;
} {
  if (!createdAt || !expiresAt) {
    return {
      daysRemaining: 0,
      totalDays: 7,
      percentRemaining: 0,
      isExpired: true,
      isExpiringSoon: false,
    };
  }

  const created = new Date(createdAt);
  const expires = new Date(expiresAt);
  const now = new Date();

  const totalMs = expires.getTime() - created.getTime();
  const remainingMs = expires.getTime() - now.getTime();

  const totalDays = Math.ceil(totalMs / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));
  const percentRemaining = Math.max(0, Math.min(100, (remainingMs / totalMs) * 100));

  return {
    daysRemaining,
    totalDays,
    percentRemaining,
    isExpired: daysRemaining === 0,
    isExpiringSoon: daysRemaining > 0 && daysRemaining <= 2,
  };
}

function formatDate(date: Date | string | null): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function CotacoesDetailValues({ values }: CotacoesDetailValuesProps) {
  const validity = calculateValidity(values.createdAt, values.expiresAt);

  const adesaoOriginal = parseFloat(values.adesao);
  const adesaoComDesconto = parseFloat(values.adesaoDesconto);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <DollarSign className="h-5 w-5" />
          Valores da Cotacao
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mensalidade */}
        <div className="p-4 bg-primary/5 rounded-lg border">
          <p className="text-sm font-medium text-muted-foreground">Mensalidade</p>
          <p className="text-2xl font-bold text-primary">
            {formatCurrency(values.mensalidade)}
          </p>
          <p className="text-xs text-muted-foreground">por mes</p>
        </div>

        {/* Adesao */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Adesao (valor cheio)
            </p>
            <p className="text-sm line-through text-muted-foreground">
              {formatCurrency(adesaoOriginal)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Adesao com desconto (20%)
            </p>
            <p className="text-lg font-semibold text-green-600">
              {formatCurrency(adesaoComDesconto)}
            </p>
          </div>
        </div>

        {/* Cota de Participacao */}
        {values.cotaParticipacao && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Cota de Participacao
            </p>
            <p className="text-sm">{formatCurrency(values.cotaParticipacao)}</p>
          </div>
        )}

        {/* Validade */}
        <div className="border-t pt-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">Validade da Cotacao</p>
            {validity.isExpiringSoon && !validity.isExpired && (
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            )}
          </div>

          <Progress
            value={validity.percentRemaining}
            className={cn(
              "h-2 mb-2",
              validity.isExpired && "[&>div]:bg-destructive",
              validity.isExpiringSoon && !validity.isExpired && "[&>div]:bg-yellow-500"
            )}
          />

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Criada em {formatDate(values.createdAt)}</span>
            <span
              className={cn(
                validity.isExpired && "text-destructive font-medium",
                validity.isExpiringSoon && !validity.isExpired && "text-yellow-600 font-medium"
              )}
            >
              {validity.isExpired
                ? "Expirada"
                : `${validity.daysRemaining} dia${validity.daysRemaining !== 1 ? "s" : ""} restante${validity.daysRemaining !== 1 ? "s" : ""}`}
            </span>
          </div>

          <p className="text-xs text-muted-foreground mt-1">
            Expira em {formatDate(values.expiresAt)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
