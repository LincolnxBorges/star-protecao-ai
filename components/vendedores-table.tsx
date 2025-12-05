/**
 * Sellers Table Component (Desktop View)
 * @module components/vendedores-table
 *
 * Tabela desktop com: avatar, nome, cargo, email, status, metricas, acoes.
 */

"use client";

import { MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SellerWithMetrics, SellerStatus } from "@/lib/types/sellers";
import { SELLER_STATUS_CONFIG } from "@/lib/types/sellers";

interface VendedoresTableProps {
  sellers: SellerWithMetrics[];
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

export function VendedoresTable({
  sellers,
  onEdit,
  onViewProfile,
  onChangeStatus,
  onReassignLeads,
}: VendedoresTableProps) {
  if (sellers.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <p className="text-muted-foreground">Nenhum vendedor encontrado</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[250px]">Vendedor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Cotacoes</TableHead>
            <TableHead className="text-right">Aceitas</TableHead>
            <TableHead className="text-right">Conversao</TableHead>
            <TableHead className="text-right">Tempo Resp.</TableHead>
            <TableHead className="text-right">Ranking</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sellers.map((seller) => {
            const statusConfig = SELLER_STATUS_CONFIG[seller.status];
            const isInactive = seller.status !== "ACTIVE";

            return (
              <TableRow
                key={seller.id}
                className={isInactive ? "opacity-60" : ""}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={seller.image || undefined} alt={seller.name} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                        {getInitials(seller.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{seller.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {seller.email}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {seller.metrics.totalQuotations}
                </TableCell>
                <TableCell className="text-right font-medium text-green-600">
                  {seller.metrics.acceptedQuotations}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatPercentage(seller.metrics.conversionRate)}
                </TableCell>
                <TableCell className="text-right">
                  {formatTime(seller.metrics.avgResponseTimeHours)}
                </TableCell>
                <TableCell className="text-right">
                  <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    {seller.metrics.ranking}
                  </span>
                </TableCell>
                <TableCell>
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
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
