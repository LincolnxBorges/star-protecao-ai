import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

type BorderColor = "green" | "blue" | "red" | "yellow" | "grey";
type ChangeType = "positive" | "negative" | "neutral";

interface DashboardMetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: ChangeType;
  changeLabel?: string;
  borderColor?: BorderColor;
  icon?: React.ReactNode;
  className?: string;
}

const borderColorMap: Record<BorderColor, string> = {
  green: "border-l-light-green-500",
  blue: "border-l-blue-500",
  red: "border-l-red-500",
  yellow: "border-l-yellow-500",
  grey: "border-l-grey-500",
};

const changeColorMap: Record<ChangeType, string> = {
  positive: "text-light-green-600 dark:text-light-green-400",
  negative: "text-red-600 dark:text-red-400",
  neutral: "text-grey-500 dark:text-grey-400",
};

const ChangeIcon = ({ type }: { type: ChangeType }) => {
  const className = "h-4 w-4";
  switch (type) {
    case "positive":
      return <TrendingUp className={className} aria-hidden="true" />;
    case "negative":
      return <TrendingDown className={className} aria-hidden="true" />;
    default:
      return <Minus className={className} aria-hidden="true" />;
  }
};

export function DashboardMetricCard({
  title,
  value,
  change,
  changeType = "neutral",
  changeLabel,
  borderColor = "green",
  icon,
  className,
}: DashboardMetricCardProps) {
  return (
    <article
      className={cn(
        "rounded-lg border border-l-4 bg-card p-4 shadow-sm transition-shadow hover:shadow-md",
        borderColorMap[borderColor],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-card-foreground lg:text-3xl">
            {value}
          </p>
        </div>
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            {icon}
          </div>
        )}
      </div>

      {change && (
        <div className="mt-3 flex items-center gap-1">
          <span
            className={cn(
              "flex items-center gap-1 text-sm font-medium",
              changeColorMap[changeType]
            )}
          >
            <ChangeIcon type={changeType} />
            {change}
          </span>
          {changeLabel && (
            <span className="text-sm text-muted-foreground">{changeLabel}</span>
          )}
        </div>
      )}
    </article>
  );
}
