import { Clock, CheckCircle, DollarSign, TrendingUp } from "lucide-react";
import { DashboardKpiCard } from "@/components/dashboard-kpi-card";
import type { KpiData } from "@/lib/types/dashboard";

interface DashboardKpiCardsProps {
  data: KpiData;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercentage(value: number): string {
  return `${value}%`;
}

export function DashboardKpiCards({ data }: DashboardKpiCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div data-testid="kpi-card">
        <DashboardKpiCard
          data={data.pending}
          testId="pending"
          icon={<Clock className="h-4 w-4 text-amber-500" />}
        />
      </div>
      <div data-testid="kpi-card">
        <DashboardKpiCard
          data={data.accepted}
          testId="accepted"
          icon={<CheckCircle className="h-4 w-4 text-green-500" />}
        />
      </div>
      <div data-testid="kpi-card">
        <DashboardKpiCard
          data={data.potential}
          testId="potential"
          formatValue={formatCurrency}
          icon={<DollarSign className="h-4 w-4 text-blue-500" />}
        />
      </div>
      <div data-testid="kpi-card">
        <DashboardKpiCard
          data={data.conversion}
          testId="conversion"
          formatValue={formatPercentage}
          icon={<TrendingUp className="h-4 w-4 text-purple-500" />}
        />
      </div>
    </div>
  );
}
