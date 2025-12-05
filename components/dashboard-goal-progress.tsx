import { Target } from "lucide-react";
import type { GoalData } from "@/lib/types/dashboard";

interface DashboardGoalProgressProps {
  data: GoalData;
}

function CircularProgress({ percentage }: { percentage: number }) {
  const radius = 45;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative h-32 w-32">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted"
        />
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-primary transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold">{percentage}%</span>
      </div>
    </div>
  );
}

export function DashboardGoalProgress({ data }: DashboardGoalProgressProps) {
  if (!data.hasGoal) {
    return (
      <div data-testid="goal-progress" className="space-y-4">
        <h2 className="text-lg font-semibold">Meta Mensal</h2>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-muted-foreground">
                Meta não definida
              </p>
              <p className="text-sm text-muted-foreground">
                Entre em contato com seu gestor para definir sua meta mensal.
              </p>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Conversão atual: </span>
              <span className="font-medium">{data.conversionRate}%</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="goal-progress" className="space-y-4">
      <h2 className="text-lg font-semibold">Meta Mensal</h2>
      <div className="rounded-lg border bg-card p-6">
        <div className="flex flex-col items-center justify-center space-y-4">
          <CircularProgress percentage={data.percentage} />

          <div className="text-center">
            <p className="text-2xl font-bold">
              {data.currentAccepted} / {data.targetAccepted}
            </p>
            <p className="text-sm text-muted-foreground">cotações aceitas</p>
          </div>

          {data.remaining > 0 ? (
            <p className="text-sm text-muted-foreground">
              Faltam <span className="font-medium">{data.remaining}</span> para
              atingir a meta
            </p>
          ) : (
            <p className="text-sm font-medium text-green-600">
              Meta atingida! Parabéns!
            </p>
          )}

          <div className="text-sm">
            <span className="text-muted-foreground">Conversão: </span>
            <span className="font-medium">{data.conversionRate}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
