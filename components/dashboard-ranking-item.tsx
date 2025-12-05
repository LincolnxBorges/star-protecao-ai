import { Trophy, Medal, Award } from "lucide-react";
import type { RankingItem } from "@/lib/types/dashboard";
import { cn } from "@/lib/utils";

interface DashboardRankingItemProps {
  item: RankingItem;
  maxAccepted: number;
}

function PositionIcon({ position }: { position: number }) {
  switch (position) {
    case 1:
      return <Trophy className="h-5 w-5 text-yellow-500" />;
    case 2:
      return <Medal className="h-5 w-5 text-gray-400" />;
    case 3:
      return <Award className="h-5 w-5 text-amber-600" />;
    default:
      return (
        <span className="flex h-5 w-5 items-center justify-center text-sm font-medium text-muted-foreground">
          {position}
        </span>
      );
  }
}

export function DashboardRankingItem({
  item,
  maxAccepted,
}: DashboardRankingItemProps) {
  const barWidth = maxAccepted > 0 ? (item.acceptedCount / maxAccepted) * 100 : 0;

  return (
    <div
      data-testid={`ranking-item-${item.position}`}
      className={cn(
        "flex items-center gap-3 rounded-lg p-3",
        item.isCurrentUser && "bg-primary/10 ring-1 ring-primary/20"
      )}
    >
      <div className="flex h-8 w-8 items-center justify-center">
        <PositionIcon position={item.position} />
      </div>

      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "text-sm font-medium",
              item.isCurrentUser && "text-primary"
            )}
          >
            {item.name}
            {item.isCurrentUser && " (você)"}
          </span>
          <span className="text-sm text-muted-foreground">
            {item.acceptedCount} aceitas
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              item.isCurrentUser ? "bg-primary" : "bg-green-500"
            )}
            style={{ width: `${barWidth}%` }}
          />
        </div>
      </div>
    </div>
  );
}
