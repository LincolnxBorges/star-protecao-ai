import { Check, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PlatformType = "shopify" | "woocommerce" | "wordpress" | "magento" | "wix" | "custom";
type ConnectionStatus = "connected" | "disconnected" | "pending";

interface PlatformCardProps {
  platform: PlatformType;
  name?: string;
  description?: string;
  icon?: React.ReactNode;
  status?: ConnectionStatus;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onConfigure?: () => void;
  className?: string;
}

const platformDefaults: Record<PlatformType, { name: string; description: string }> = {
  shopify: {
    name: "Shopify",
    description: "Integre sua loja Shopify para sincronização automática de produtos e pedidos.",
  },
  woocommerce: {
    name: "WooCommerce",
    description: "Conecte sua loja WooCommerce para gerenciar vendas e estoque.",
  },
  wordpress: {
    name: "WordPress",
    description: "Integração com sites WordPress para publicação de conteúdo.",
  },
  magento: {
    name: "Magento",
    description: "Conecte sua loja Magento para gestão completa de e-commerce.",
  },
  wix: {
    name: "Wix",
    description: "Integração com sites Wix para sincronização de dados.",
  },
  custom: {
    name: "Personalizado",
    description: "Configure uma integração personalizada via API.",
  },
};

const statusConfig: Record<ConnectionStatus, { label: string; color: string; icon: React.ReactNode }> = {
  connected: {
    label: "Conectado",
    color: "bg-light-green-500 dark:bg-light-green-400",
    icon: <Check className="h-3 w-3 text-white dark:text-dark-green-900" aria-hidden="true" />,
  },
  disconnected: {
    label: "Desconectado",
    color: "bg-grey-400 dark:bg-grey-500",
    icon: <X className="h-3 w-3 text-white" aria-hidden="true" />,
  },
  pending: {
    label: "Pendente",
    color: "bg-yellow-500 dark:bg-yellow-400",
    icon: <span className="h-2 w-2 rounded-full bg-white animate-pulse" aria-hidden="true" />,
  },
};

export function PlatformCard({
  platform,
  name,
  description,
  icon,
  status = "disconnected",
  onConnect,
  onDisconnect,
  onConfigure,
  className,
}: PlatformCardProps) {
  const defaults = platformDefaults[platform];
  const displayName = name || defaults.name;
  const displayDescription = description || defaults.description;
  const statusInfo = statusConfig[status];

  return (
    <article
      className={cn(
        "rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md",
        className
      )}
    >
      <div className="flex items-start gap-4">
        {/* Platform Icon */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
          {icon || (
            <span className="text-lg font-bold text-muted-foreground">
              {displayName.charAt(0)}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-card-foreground truncate">
              {displayName}
            </h3>
            {/* Connection Status Indicator */}
            <div
              className={cn(
                "flex items-center justify-center h-5 w-5 rounded-full shrink-0",
                statusInfo.color
              )}
              title={statusInfo.label}
              aria-label={`Status: ${statusInfo.label}`}
            >
              {statusInfo.icon}
            </div>
          </div>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {displayDescription}
          </p>

          {/* Status Text */}
          <p className="mt-2 text-xs font-medium text-muted-foreground">
            Status: <span className={cn(
              status === "connected" && "text-light-green-600 dark:text-light-green-400",
              status === "disconnected" && "text-grey-500",
              status === "pending" && "text-yellow-600 dark:text-yellow-400"
            )}>{statusInfo.label}</span>
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center gap-2">
        {status === "disconnected" && onConnect && (
          <Button size="sm" onClick={onConnect}>
            Conectar
          </Button>
        )}
        {status === "connected" && (
          <>
            {onConfigure && (
              <Button size="sm" variant="outline" onClick={onConfigure}>
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                Configurar
              </Button>
            )}
            {onDisconnect && (
              <Button size="sm" variant="ghost" onClick={onDisconnect}>
                Desconectar
              </Button>
            )}
          </>
        )}
        {status === "pending" && (
          <Button size="sm" variant="outline" disabled>
            Aguardando...
          </Button>
        )}
      </div>
    </article>
  );
}
