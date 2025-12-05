/**
 * KPI Cards for Sellers Page
 * @module components/vendedores-kpi-cards
 *
 * Displays team-wide metrics: total sellers, active, conversion rate,
 * avg response time, monthly quotations, accepted, potential revenue, top seller.
 */

"use client";

import {
  Users,
  UserCheck,
  TrendingUp,
  Clock,
  FileText,
  CheckCircle,
  DollarSign,
  Trophy,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { TeamMetrics } from "@/lib/types/sellers";

interface VendedoresKpiCardsProps {
  metrics: TeamMetrics;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatTime(hours: number | null): string {
  if (hours === null) return "-";
  if (hours < 1) return `${Math.round(hours * 60)}min`;
  return `${hours.toFixed(1)}h`;
}

export function VendedoresKpiCards({ metrics }: VendedoresKpiCardsProps) {
  const kpiItems = [
    {
      label: "Total de Vendedores",
      value: metrics.totalSellers.toString(),
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Vendedores Ativos",
      value: metrics.activeSellers.toString(),
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      label: "Taxa de Conversao",
      value: formatPercentage(metrics.teamConversionRate),
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      label: "Tempo Medio Resposta",
      value: formatTime(metrics.teamAvgResponseTimeHours),
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      label: "Cotacoes do Mes",
      value: metrics.totalQuotationsMonth.toString(),
      icon: FileText,
      color: "text-slate-600",
      bgColor: "bg-slate-50",
    },
    {
      label: "Aceitas no Mes",
      value: metrics.totalAcceptedMonth.toString(),
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      label: "Potencial R$",
      value: formatCurrency(metrics.totalPotentialMonth),
      icon: DollarSign,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
    },
    {
      label: "Top Vendedor",
      value: metrics.topSeller?.name || "-",
      subValue: metrics.topSeller
        ? `${metrics.topSeller.acceptedCount} aceitas`
        : undefined,
      icon: Trophy,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8">
      {kpiItems.map((item) => (
        <Card key={item.label} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className={`rounded-lg p-2 ${item.bgColor}`}>
                <item.icon className={`h-4 w-4 ${item.color}`} aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground truncate">{item.label}</p>
                <p className="text-lg font-semibold truncate" title={item.value}>
                  {item.value}
                </p>
                {item.subValue && (
                  <p className="text-xs text-muted-foreground truncate">
                    {item.subValue}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
