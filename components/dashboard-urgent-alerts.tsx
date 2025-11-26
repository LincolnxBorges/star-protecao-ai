import { AlertTriangle, Clock, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { UrgentAlert } from "@/lib/types/dashboard";
import { URGENCY_COLORS } from "@/lib/types/dashboard";

interface DashboardUrgentAlertsProps {
  alerts: UrgentAlert[];
}

function AlertIcon({ type }: { type: UrgentAlert["type"] }) {
  if (type === "expiring") {
    return <Clock className="h-5 w-5" />;
  }
  return <AlertTriangle className="h-5 w-5" />;
}

function getFilterUrl(type: UrgentAlert["type"]): string {
  if (type === "expiring") {
    return "/cotacoes?filter=expiring-today";
  }
  return "/cotacoes?filter=no-contact-24h";
}

export function DashboardUrgentAlerts({ alerts }: DashboardUrgentAlertsProps) {
  if (alerts.length === 0) {
    return (
      <div data-testid="urgent-alerts">
        <div
          data-testid="no-alerts"
          className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-700"
        >
          <p className="text-sm font-medium">
            Tudo em dia! Nenhuma ação urgente pendente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="urgent-alerts" className="space-y-3">
      {alerts.map((alert) => (
        <div
          key={alert.type}
          data-testid={`alert-${alert.type === "expiring" ? "expiring" : "no-contact"}`}
          className={`flex items-center justify-between rounded-lg border p-4 ${URGENCY_COLORS[alert.type]}`}
        >
          <div className="flex items-center gap-3">
            <AlertIcon type={alert.type} />
            <span className="font-medium">{alert.message}</span>
          </div>
          <Button
            asChild
            variant="ghost"
            size="sm"
            data-testid="alert-view-button"
            className="hover:bg-white/50"
          >
            <Link href={getFilterUrl(alert.type)}>
              <Eye className="mr-2 h-4 w-4" />
              Ver
            </Link>
          </Button>
        </div>
      ))}
    </div>
  );
}
