/**
 * Seller Card Component (Mobile View)
 * @module components/vendedores-card
 *
 * Card individual: avatar, nome, cargo, email, telefone, status badge, metricas.
 */

"use client";

import { MoreVertical, Mail, Phone, TrendingUp, Clock, FileText, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SellerWithMetrics, SellerStatus } from "@/lib/types/sellers";
import { SELLER_STATUS_CONFIG } from "@/lib/types/sellers";

interface VendedoresCardProps {
  seller: SellerWithMetrics;
  onEdit?: (seller: SellerWithMetrics) => void;
  onViewProfile?: (seller: SellerWithMetrics) => void;
  onChangeStatus?: (seller: SellerWithMetrics, targetStatus: SellerStatus) => void;
  onReassignLeads?: (seller: SellerWithMetrics) => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatTime(hours: number | null): string {
  if (hours === null) return "-";
  if (hours < 1) return `${Math.round(hours * 60)}min`;
  return `${hours.toFixed(1)}h`;
}

export function VendedoresCard({
  seller,
  onEdit,
  onViewProfile,
  onChangeStatus,
  onReassignLeads,
}: VendedoresCardProps) {
  const statusConfig = SELLER_STATUS_CONFIG[seller.status];
  const isInactive = seller.status !== "ACTIVE";

  return (
    <Card className={isInactive ? "opacity-75" : ""}>
      <CardContent className="p-4">
        {/* Header: Avatar, Name, Status, Actions */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={seller.image || undefined} alt={seller.name} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                {getInitials(seller.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-medium truncate">{seller.name}</p>
              {seller.cargo && (
                <p className="text-sm text-muted-foreground truncate">{seller.cargo}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Acoes</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onViewProfile?.(seller)}>
                  Ver perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit?.(seller)}>
                  Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {seller.status === "ACTIVE" ? (
                  <>
                    <DropdownMenuItem onClick={() => onChangeStatus?.(seller, "VACATION")}>
                      Colocar em ferias
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onChangeStatus?.(seller, "INACTIVE")}
                      className="text-destructive focus:text-destructive"
                    >
                      Desativar
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem onClick={() => onChangeStatus?.(seller, "ACTIVE")}>
                    Ativar
                  </DropdownMenuItem>
                )}
                {seller.metrics.pendingQuotations > 0 && (
                  <DropdownMenuItem onClick={() => onReassignLeads?.(seller)}>
                    Reatribuir leads ({seller.metrics.pendingQuotations})
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-1 mb-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{seller.email}</span>
          </div>
          {seller.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{seller.phone}</span>
            </div>
          )}
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <div>
              <p className="text-xs text-muted-foreground">Cotacoes</p>
              <p className="font-medium">{seller.metrics.totalQuotations}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" aria-hidden="true" />
            <div>
              <p className="text-xs text-muted-foreground">Aceitas</p>
              <p className="font-medium">{seller.metrics.acceptedQuotations}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-purple-600" aria-hidden="true" />
            <div>
              <p className="text-xs text-muted-foreground">Conversao</p>
              <p className="font-medium">{formatPercentage(seller.metrics.conversionRate)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-600" aria-hidden="true" />
            <div>
              <p className="text-xs text-muted-foreground">Tempo Resp.</p>
              <p className="font-medium">{formatTime(seller.metrics.avgResponseTimeHours)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
