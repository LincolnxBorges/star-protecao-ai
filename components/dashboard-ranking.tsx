import { DashboardRankingItem } from "@/components/dashboard-ranking-item";
import type { RankingData } from "@/lib/types/dashboard";

interface DashboardRankingProps {
  data: RankingData;
}

export function DashboardRanking({ data }: DashboardRankingProps) {
  if (data.items.length === 0) {
    return (
      <div data-testid="ranking">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Ranking do Mês</h2>
          <div className="rounded-lg border border-dashed p-6 text-center">
            <p className="text-muted-foreground">
              Nenhum vendedor no ranking ainda.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="ranking" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Ranking do Mês</h2>
        {data.currentUserGap > 0 && (
          <span className="text-sm text-muted-foreground">
            {data.currentUserGap} para o 1º lugar
          </span>
        )}
      </div>

      <div className="rounded-lg border bg-card">
        <div className="divide-y">
          {data.items.map((item) => (
            <DashboardRankingItem
              key={item.sellerId}
              item={item}
              maxAccepted={data.maxAccepted}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
