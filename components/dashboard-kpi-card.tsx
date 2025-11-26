import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { KpiCard } from "@/lib/types/dashboard";

interface DashboardKpiCardProps {
  data: KpiCard;
  testId: string;
  formatValue?: (value: number) => string;
  icon?: React.ReactNode;
}

export function DashboardKpiCard({
  data,
  testId,
  formatValue,
  icon,
}: DashboardKpiCardProps) {
  const displayValue = formatValue ? formatValue(data.value) : data.value;

  return (
    <Card data-testid={`kpi-${testId}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {data.label}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div
          className="text-2xl font-bold"
          data-testid="kpi-value"
        >
          {displayValue}
        </div>
        <p
          className={cn(
            "text-xs text-muted-foreground",
            data.change.startsWith("+") && "text-green-600",
            data.change.startsWith("-") && "text-red-600",
            data.change.startsWith("↑") && "text-green-600",
            data.change.startsWith("↓") && "text-red-600"
          )}
          data-testid="kpi-change"
        >
          {data.change}
        </p>
      </CardContent>
    </Card>
  );
}
