import { cn } from "@/lib/utils";

interface DashboardPageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumb?: React.ReactNode;
  className?: string;
}

export function DashboardPageHeader({
  title,
  description,
  actions,
  breadcrumb,
  className,
}: DashboardPageHeaderProps) {
  return (
    <header className={cn("mb-6 space-y-2", className)}>
      {breadcrumb && <div className="mb-2">{breadcrumb}</div>}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-muted-foreground lg:text-base">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>
    </header>
  );
}
