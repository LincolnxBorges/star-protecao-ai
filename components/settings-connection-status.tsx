"use client";

import { CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ConnectionStatus = "connected" | "disconnected" | "error" | "testing" | "unknown";

interface SettingsConnectionStatusProps {
  status: ConnectionStatus;
  message?: string;
  instanceInfo?: {
    name?: string;
    number?: string;
    status?: string;
  };
  className?: string;
}

const statusConfig: Record<
  ConnectionStatus,
  { icon: React.ReactNode; label: string; className: string }
> = {
  connected: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    label: "Conectado",
    className: "text-green-600 bg-green-50 border-green-200",
  },
  disconnected: {
    icon: <XCircle className="h-4 w-4" />,
    label: "Desconectado",
    className: "text-orange-600 bg-orange-50 border-orange-200",
  },
  error: {
    icon: <AlertCircle className="h-4 w-4" />,
    label: "Erro",
    className: "text-destructive bg-destructive/10 border-destructive/20",
  },
  testing: {
    icon: <Loader2 className="h-4 w-4 animate-spin" />,
    label: "Testando...",
    className: "text-blue-600 bg-blue-50 border-blue-200",
  },
  unknown: {
    icon: <AlertCircle className="h-4 w-4" />,
    label: "Desconhecido",
    className: "text-muted-foreground bg-muted border-border",
  },
};

export function SettingsConnectionStatus({
  status,
  message,
  instanceInfo,
  className,
}: SettingsConnectionStatusProps) {
  const config = statusConfig[status] || statusConfig.unknown;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border p-3",
        config.className,
        className
      )}
    >
      <div className="mt-0.5">{config.icon}</div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{config.label}</span>
          {instanceInfo?.number && (
            <span className="text-xs opacity-75">({instanceInfo.number})</span>
          )}
        </div>
        {message && <p className="text-sm opacity-90">{message}</p>}
        {instanceInfo?.name && status === "connected" && (
          <p className="text-xs opacity-75">
            Instancia: {instanceInfo.name}
            {instanceInfo.status && ` • ${instanceInfo.status}`}
          </p>
        )}
      </div>
    </div>
  );
}
