import type { StatusDistributionItem } from "@/lib/types/dashboard";

interface DashboardStatusChartProps {
  data: StatusDistributionItem[];
}

export function DashboardStatusChart({ data }: DashboardStatusChartProps) {
  if (data.length === 0) {
    return (
      <div data-testid="status-chart">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Distribuição por Status</h2>
          <div className="rounded-lg border border-dashed p-6 text-center">
            <p className="text-muted-foreground">
              Nenhuma cotação no período selecionado.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count));

  return (
    <div data-testid="status-chart" className="space-y-4">
      <h2 className="text-lg font-semibold">Distribuição por Status</h2>
      <div className="rounded-lg border bg-card p-4">
        <div className="space-y-3">
          {data.map((item) => (
            <div
              key={item.status}
              data-testid={`status-bar-${item.status.toLowerCase()}`}
              className="space-y-1"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{item.label}</span>
                <span className="text-muted-foreground">
                  {item.count} ({item.percentage}%)
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${item.color.split(" ")[0]}`}
                  style={{
                    width: maxCount > 0 ? `${(item.count / maxCount) * 100}%` : "0%",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
