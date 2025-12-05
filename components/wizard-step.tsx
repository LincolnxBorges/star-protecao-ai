import { Check, X, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createContext, useContext } from "react";

type StepStatus = "idle" | "active" | "completed" | "error" | "loading";
type Orientation = "vertical" | "horizontal";

const WizardContext = createContext<{ orientation: Orientation }>({ orientation: "vertical" });

interface WizardStepProps {
  step: number;
  title: string;
  description?: string;
  status?: StepStatus;
  isLast?: boolean;
  children?: React.ReactNode;
  className?: string;
}

interface WizardStepsProps {
  children: React.ReactNode;
  className?: string;
  orientation?: Orientation;
}

const statusConfig: Record<StepStatus, {
  bgColor: string;
  borderColor: string;
  textColor: string;
  iconColor: string;
  lineColor: string;
}> = {
  idle: {
    bgColor: "bg-muted",
    borderColor: "border-grey-300 dark:border-grey-600",
    textColor: "text-muted-foreground",
    iconColor: "text-grey-400 dark:text-grey-500",
    lineColor: "bg-grey-200 dark:bg-grey-700",
  },
  active: {
    bgColor: "bg-light-green-500 dark:bg-light-green-400",
    borderColor: "border-light-green-500 dark:border-light-green-400",
    textColor: "text-foreground",
    iconColor: "text-white dark:text-dark-green-900",
    lineColor: "bg-grey-200 dark:bg-grey-700",
  },
  completed: {
    bgColor: "bg-light-green-500 dark:bg-light-green-400",
    borderColor: "border-light-green-500 dark:border-light-green-400",
    textColor: "text-muted-foreground",
    iconColor: "text-white dark:text-dark-green-900",
    lineColor: "bg-light-green-500 dark:bg-light-green-400",
  },
  error: {
    bgColor: "bg-red-500 dark:bg-red-400",
    borderColor: "border-red-500 dark:border-red-400",
    textColor: "text-red-600 dark:text-red-400",
    iconColor: "text-white dark:text-red-900",
    lineColor: "bg-red-200 dark:bg-red-800",
  },
  loading: {
    bgColor: "bg-light-green-100 dark:bg-light-green-900",
    borderColor: "border-light-green-500 dark:border-light-green-400",
    textColor: "text-foreground",
    iconColor: "text-light-green-500 dark:text-light-green-400",
    lineColor: "bg-grey-200 dark:bg-grey-700",
  },
};

function StepIcon({ step, status }: { step: number; status: StepStatus }) {
  const config = statusConfig[status];

  if (status === "completed") {
    return <Check className={cn("h-4 w-4", config.iconColor)} aria-hidden="true" />;
  }

  if (status === "error") {
    return <X className={cn("h-4 w-4", config.iconColor)} aria-hidden="true" />;
  }

  if (status === "loading") {
    return <Loader2 className={cn("h-4 w-4 animate-spin", config.iconColor)} aria-hidden="true" />;
  }

  if (status === "active") {
    return <span className={cn("text-sm font-semibold", config.iconColor)}>{step}</span>;
  }

  return <Circle className={cn("h-4 w-4", config.iconColor)} aria-hidden="true" />;
}

export function WizardStep({
  step,
  title,
  description,
  status = "idle",
  isLast = false,
  children,
  className,
}: WizardStepProps) {
  const config = statusConfig[status];
  const { orientation } = useContext(WizardContext);
  const isHorizontal = orientation === "horizontal";

  if (isHorizontal) {
    return (
      <div className={cn("relative flex flex-1 flex-col items-center", className)}>
        <div className="flex items-center w-full">
          {/* Connector Line (before) */}
          {step > 1 && (
            <div
              className={cn(
                "h-0.5 flex-1",
                status === "completed" || status === "active"
                  ? "bg-light-green-500 dark:bg-light-green-400"
                  : "bg-grey-200 dark:bg-grey-700"
              )}
              aria-hidden="true"
            />
          )}

          {/* Step Indicator */}
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
              config.bgColor,
              config.borderColor
            )}
            aria-current={status === "active" ? "step" : undefined}
          >
            <StepIcon step={step} status={status} />
          </div>

          {/* Connector Line (after) */}
          {!isLast && (
            <div
              className={cn(
                "h-0.5 flex-1",
                status === "completed"
                  ? "bg-light-green-500 dark:bg-light-green-400"
                  : "bg-grey-200 dark:bg-grey-700"
              )}
              aria-hidden="true"
            />
          )}
        </div>

        {/* Content */}
        <div className="mt-2 text-center">
          <h3
            className={cn(
              "text-sm font-semibold leading-tight",
              status === "active" ? "text-foreground" : config.textColor
            )}
          >
            {title}
          </h3>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground hidden sm:block">{description}</p>
          )}
        </div>

        {/* Step Content (shown when active) - only for vertical */}
        {children && status === "active" && (
          <div className="mt-4 w-full">{children}</div>
        )}
      </div>
    );
  }

  // Vertical layout (default)
  return (
    <div className={cn("relative flex gap-4", className)}>
      {/* Step Indicator */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            config.bgColor,
            config.borderColor
          )}
          aria-current={status === "active" ? "step" : undefined}
        >
          <StepIcon step={step} status={status} />
        </div>

        {/* Connector Line */}
        {!isLast && (
          <div
            className={cn(
              "mt-2 h-full w-0.5 flex-1 min-h-6",
              config.lineColor
            )}
            aria-hidden="true"
          />
        )}
      </div>

      {/* Content */}
      <div className={cn("flex-1 pb-8", isLast && "pb-0")}>
        <div className="flex flex-col">
          <h3
            className={cn(
              "text-sm font-semibold leading-tight",
              status === "active" ? "text-foreground" : config.textColor
            )}
          >
            {title}
          </h3>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>

        {/* Step Content (shown when active) */}
        {children && status === "active" && (
          <div className="mt-4">{children}</div>
        )}
      </div>
    </div>
  );
}

export function WizardSteps({ children, className, orientation = "vertical" }: WizardStepsProps) {
  return (
    <WizardContext.Provider value={{ orientation }}>
      <div
        className={cn(
          "flex",
          orientation === "horizontal" ? "flex-row" : "flex-col",
          className
        )}
        role="list"
        aria-label="Etapas do processo"
      >
        {children}
      </div>
    </WizardContext.Provider>
  );
}
