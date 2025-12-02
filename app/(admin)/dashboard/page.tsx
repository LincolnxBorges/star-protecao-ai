import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import { getSellerByUserId, getKpis, getGreeting, getUrgentAlerts, getRecentQuotations, getStatusDistribution, getRanking, getGoalProgress, getQuotationEvolution } from "@/lib/dashboard";
import { DashboardKpiCards } from "@/components/dashboard-kpi-cards";
import { DashboardUrgentAlerts } from "@/components/dashboard-urgent-alerts";
import { DashboardQuotationsList } from "@/components/dashboard-quotations-list";
import { DashboardStatusChart } from "@/components/dashboard-status-chart";
import { DashboardRanking } from "@/components/dashboard-ranking";
import { DashboardGoalProgress } from "@/components/dashboard-goal-progress";
import { DashboardGreeting } from "@/components/dashboard-greeting";
import { DashboardPeriodFilter } from "@/components/dashboard-period-filter";
import { DashboardPollingWrapper } from "@/components/dashboard-polling-wrapper";
import { DashboardQuotationChart } from "@/components/dashboard-quotation-chart";
import type { PeriodFilter } from "@/lib/types/dashboard";

interface DashboardPageProps {
  searchParams: Promise<{ period?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const seller = await getSellerByUserId(session.user.id);

  if (!seller) {
    redirect("/login");
  }

  const params = await searchParams;
  const period = (params.period as PeriodFilter) || "today";
  const greeting = getGreeting();

  const [kpis, urgentAlerts, recentQuotations, statusDistribution, ranking, goalProgress, quotationEvolution] = await Promise.all([
    getKpis(seller.id, period),
    getUrgentAlerts(seller.id),
    getRecentQuotations(seller.id),
    getStatusDistribution(seller.id, period),
    getRanking(seller.id),
    getGoalProgress(seller.id),
    getQuotationEvolution(seller.id, period),
  ]);

  return (
    <DashboardPollingWrapper intervalMs={300000}>
      <div className="flex-1 space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <DashboardGreeting greeting={greeting} userName={session.user.name || "Vendedor"} />
          <DashboardPeriodFilter />
        </div>

        {/* Urgent Alerts */}
        <DashboardUrgentAlerts alerts={urgentAlerts} />

        {/* KPI Cards */}
        <DashboardKpiCards data={kpis} />

        {/* Quotation Evolution Chart */}
        <DashboardQuotationChart data={quotationEvolution} />

        {/* Recent Quotations */}
        <DashboardQuotationsList quotations={recentQuotations} />

        {/* Analytics Grid - Responsive */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Status Distribution Chart */}
          <DashboardStatusChart data={statusDistribution} />

          {/* Seller Ranking */}
          <DashboardRanking data={ranking} />

          {/* Goal Progress */}
          <DashboardGoalProgress data={goalProgress} />
        </div>
      </div>
    </DashboardPollingWrapper>
  );
}
