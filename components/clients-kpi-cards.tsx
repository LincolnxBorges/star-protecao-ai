/**
 * KPI Cards for Clients Page
 * @module components/clients-kpi-cards
 *
 * Exibe metricas de clientes: Total, Convertidos (%), Em Negociacao, Inativos.
 * T026-T028: User Story 2 - Ver Cards de KPIs.
 */

"use client";

import { Users, UserCheck, MessageCircle, UserX } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ClientKPIs } from "@/lib/types/clients";

interface ClientsKpiCardsProps {
  kpis: ClientKPIs;
}

function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function ClientsKpiCards({ kpis }: ClientsKpiCardsProps) {
  const kpiItems = [
    {
      label: "Total de Clientes",
      value: kpis.total.toString(),
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Convertidos",
      value: kpis.converted.toString(),
      subValue: formatPercentage(kpis.convertedPercentage),
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      label: "Em Negociacao",
      value: kpis.negotiating.toString(),
      icon: MessageCircle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      label: "Inativos",
      value: kpis.inactive.toString(),
      icon: UserX,
      color: "text-muted-foreground",
      bgColor: "bg-muted",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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

/**
 * KPI Cards Skeleton for loading state
 */
export function ClientsKpiCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-12" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
