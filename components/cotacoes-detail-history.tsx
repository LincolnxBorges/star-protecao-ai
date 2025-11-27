/**
 * Cotacoes Detail History Component
 * @module components/cotacoes-detail-history
 *
 * Timeline de atividades/historico da cotacao.
 * Exibe notas, mudancas de status, contatos em ordem cronologica DESC.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Phone,
  Mail,
  MessageCircle,
  FileText,
  RefreshCw,
  Plus,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CotacoesNoteDialog } from "@/components/cotacoes-note-dialog";
import type { QuotationActivity, ActivityType } from "@/lib/types/quotations";

interface CotacoesDetailHistoryProps {
  quotationId: string;
  activities: QuotationActivity[];
}

// Icon and color configuration per activity type
const ACTIVITY_CONFIG: Record<
  ActivityType,
  { icon: React.ElementType; label: string; color: string }
> = {
  CREATION: {
    icon: Plus,
    label: "Criacao",
    color: "text-green-600 bg-green-100",
  },
  STATUS_CHANGE: {
    icon: RefreshCw,
    label: "Status",
    color: "text-blue-600 bg-blue-100",
  },
  WHATSAPP_SENT: {
    icon: MessageCircle,
    label: "WhatsApp",
    color: "text-green-600 bg-green-100",
  },
  NOTE: {
    icon: FileText,
    label: "Nota",
    color: "text-gray-600 bg-gray-100",
  },
  CALL: {
    icon: Phone,
    label: "Ligacao",
    color: "text-purple-600 bg-purple-100",
  },
  EMAIL: {
    icon: Mail,
    label: "Email",
    color: "text-orange-600 bg-orange-100",
  },
  ASSIGNMENT: {
    icon: UserPlus,
    label: "Atribuicao",
    color: "text-indigo-600 bg-indigo-100",
  },
};

function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Agora";
  if (diffMins < 60) return `${diffMins} min atras`;
  if (diffHours < 24) return `${diffHours}h atras`;
  if (diffDays === 1) return "Ontem";
  if (diffDays < 7) return `${diffDays} dias atras`;
  return formatDateTime(date);
}

export function CotacoesDetailHistory({
  quotationId,
  activities,
}: CotacoesDetailHistoryProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5" />
          Historico
        </CardTitle>
        <CotacoesNoteDialog quotationId={quotationId} />
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhuma atividade registrada</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

            {/* Activity items */}
            <div className="space-y-6">
              {activities.map((activity, index) => {
                const config = ACTIVITY_CONFIG[activity.type] || {
                  icon: FileText,
                  label: activity.type,
                  color: "text-gray-600 bg-gray-100",
                };
                const Icon = config.icon;

                return (
                  <div key={activity.id} className="relative pl-10">
                    {/* Icon circle */}
                    <div
                      className={cn(
                        "absolute left-0 p-2 rounded-full",
                        config.color
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    {/* Content */}
                    <div
                      className={cn(
                        "p-3 rounded-lg border bg-card",
                        index === 0 && "ring-1 ring-primary/20"
                      )}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {config.label}
                          </Badge>
                          {activity.authorName && (
                            <span className="text-sm text-muted-foreground">
                              por {activity.authorName}
                            </span>
                          )}
                        </div>
                        <span
                          className="text-xs text-muted-foreground whitespace-nowrap"
                          title={formatDateTime(activity.createdAt)}
                        >
                          {formatRelativeTime(activity.createdAt)}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-sm whitespace-pre-wrap">
                        {activity.description}
                      </p>

                      {/* Metadata (for status changes) */}
                      {activity.metadata && activity.type === "STATUS_CHANGE" && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          {(() => {
                            try {
                              const meta = typeof activity.metadata === "string"
                                ? JSON.parse(activity.metadata)
                                : activity.metadata;
                              return (
                                <span>
                                  {meta.previousStatus} → {meta.newStatus}
                                </span>
                              );
                            } catch {
                              return null;
                            }
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
