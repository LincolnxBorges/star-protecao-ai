/**
 * Clients Card List Component (Mobile View)
 * @module components/clients-card-list
 *
 * Visualizacao em cards para mobile com informacoes resumidas e acoes rapidas.
 * T077: Phase 13 - Polish & Cross-Cutting Concerns.
 */

"use client";

import { MoreVertical, Eye, FileText, Plus, Phone, MessageCircle, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ClientWithMetrics, ClientStatus } from "@/lib/types/clients";
import {
  ClientsActionsMenu,
  handleCall,
  handleWhatsApp,
  handleEmail,
} from "@/components/clients-actions-menu";

// Configuracao de status com cores do design system
const CLIENT_STATUS_CONFIG: Record<
  ClientStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string }
> = {
  CONVERTED: {
    label: "Convertido",
    variant: "default",
    className: "bg-green-500/10 text-green-700 border-green-500/20 hover:bg-green-500/20",
  },
  NEGOTIATING: {
    label: "Em Negociacao",
    variant: "secondary",
    className: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20 hover:bg-yellow-500/20",
  },
  INACTIVE: {
    label: "Inativo",
    variant: "outline",
    className: "bg-muted text-muted-foreground border-muted-foreground/20",
  },
  LOST: {
    label: "Perdido",
    variant: "destructive",
    className: "bg-red-500/10 text-red-700 border-red-500/20 hover:bg-red-500/20",
  },
  NEW: {
    label: "Novo",
    variant: "secondary",
    className: "bg-blue-500/10 text-blue-700 border-blue-500/20 hover:bg-blue-500/20",
  },
};

interface ClientsCardListProps {
  clients: ClientWithMetrics[];
  onViewProfile?: (client: ClientWithMetrics) => void;
  onViewQuotations?: (client: ClientWithMetrics) => void;
  onAddInteraction?: (client: ClientWithMetrics) => void;
  onDelete?: (client: ClientWithMetrics) => void;
  isAdmin?: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  } else if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

export function ClientsCardList({
  clients,
  onViewProfile,
  onViewQuotations,
  onAddInteraction,
  onDelete,
  isAdmin = false,
}: ClientsCardListProps) {
  if (clients.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {clients.map((client) => {
        const statusConfig = CLIENT_STATUS_CONFIG[client.status];

        return (
          <Card key={client.id} className="overflow-hidden">
            <CardContent className="p-4">
              {/* Header: Nome + Status + Menu */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium truncate">{client.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {client.city}/{client.state}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={statusConfig.variant} className={statusConfig.className}>
                    {statusConfig.label}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Acoes</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewProfile?.(client)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver perfil
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onViewQuotations?.(client)}>
                        <FileText className="h-4 w-4 mr-2" />
                        Ver cotacoes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onAddInteraction?.(client)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar nota
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleCall(client.phone)}>
                        <Phone className="h-4 w-4 mr-2" />
                        Ligar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleWhatsApp(client.phone)}>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        WhatsApp
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEmail(client.email)}>
                        <Mail className="h-4 w-4 mr-2" />
                        Enviar email
                      </DropdownMenuItem>
                      {isAdmin && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDelete?.(client)}
                            className="text-destructive focus:text-destructive"
                          >
                            Excluir cliente
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Info Row: Telefone + Cotacoes + Valor */}
              <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                <div>
                  <p className="text-muted-foreground text-xs">Telefone</p>
                  <p className="font-medium truncate">{formatPhone(client.phone)}</p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground text-xs">Cotacoes</p>
                  <p className="font-medium">
                    {client.quotationCount}
                    {client.acceptedQuotations > 0 && (
                      <span className="text-green-600 ml-1">({client.acceptedQuotations})</span>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground text-xs">Valor Mensal</p>
                  <p className="font-medium">
                    {client.monthlyValue > 0 ? formatCurrency(client.monthlyValue) : "-"}
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center justify-between pt-3 border-t">
                <ClientsActionsMenu
                  phone={client.phone}
                  email={client.email}
                  mode="inline"
                  size="sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewProfile?.(client)}
                >
                  Ver perfil
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
