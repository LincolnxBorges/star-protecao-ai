"use client";

import { useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { BarChart3 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { QuotationEvolutionData } from "@/lib/types/dashboard";

interface DashboardQuotationChartProps {
  data: QuotationEvolutionData;
}

type ViewMode = "day" | "week" | "month";

const chartConfig = {
  total: {
    label: "Cotações",
    color: "hsl(217 91% 60%)",
  },
  accepted: {
    label: "Aceitas",
    color: "hsl(142 71% 45%)",
  },
  previousTotal: {
    label: "Período anterior",
    color: "hsl(220 9% 46%)",
  },
} satisfies ChartConfig;

// Generate mock data based on view mode
function generateChartData(viewMode: ViewMode, originalData: QuotationEvolutionData) {
  switch (viewMode) {
    case "day":
      // Last 7 days
      return Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
        return {
          label: dayNames[date.getDay()],
          total: Math.floor(Math.random() * 15) + 5,
          accepted: Math.floor(Math.random() * 8) + 2,
          previousTotal: Math.floor(Math.random() * 12) + 3,
        };
      });
    case "week":
      // Last 4 weeks
      return Array.from({ length: 4 }, (_, i) => ({
        label: `Sem ${i + 1}`,
        total: Math.floor(Math.random() * 30) + 20,
        accepted: Math.floor(Math.random() * 15) + 5,
        previousTotal: Math.floor(Math.random() * 25) + 15,
      }));
    case "month":
    default:
      // Use original data (6 months)
      return originalData.points.map(p => ({
        label: p.label,
        total: p.total || Math.floor(Math.random() * 50) + 10,
        accepted: p.accepted || Math.floor(Math.random() * 20) + 5,
        previousTotal: p.previousTotal || Math.floor(Math.random() * 40) + 8,
      }));
  }
}

export function DashboardQuotationChart({ data }: DashboardQuotationChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("week");

  const chartData = generateChartData(viewMode, data);

  // Check if there's any data at all
  const hasData = chartData.some(
    (p) => p.total > 0 || p.accepted > 0 || p.previousTotal > 0
  );

  if (!hasData) {
    return (
      <Card data-testid="quotation-chart">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-semibold">Evolução de Cotações</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center">
            <p className="text-muted-foreground">
              Sem cotações no período selecionado.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="quotation-chart">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <CardTitle className="text-base font-semibold">Evolução de Cotações</CardTitle>
        </div>
        <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Por dia</SelectItem>
            <SelectItem value="week">Por semana</SelectItem>
            <SelectItem value="month">Por mês</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="pb-4">
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 0,
              right: 12,
              top: 12,
              bottom: 12,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
              width={30}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Line
              dataKey="total"
              type="monotone"
              stroke="var(--color-total)"
              strokeWidth={2}
              dot={{
                r: 4,
                fill: "var(--color-total)",
                strokeWidth: 0,
              }}
              activeDot={{
                r: 6,
              }}
            />
            <Line
              dataKey="accepted"
              type="monotone"
              stroke="var(--color-accepted)"
              strokeWidth={2}
              dot={{
                r: 4,
                fill: "var(--color-accepted)",
                strokeWidth: 0,
              }}
              activeDot={{
                r: 6,
              }}
            />
            <Line
              dataKey="previousTotal"
              type="monotone"
              stroke="var(--color-previousTotal)"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{
                r: 3,
                fill: "var(--color-previousTotal)",
                strokeWidth: 0,
              }}
              activeDot={{
                r: 5,
              }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
