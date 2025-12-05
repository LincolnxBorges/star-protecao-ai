/**
 * Clients Table Component (Desktop View)
 * @module components/clients-table
 *
 * Tabela desktop com: nome, CPF, telefone, email, cidade, cotacoes, status, acoes.
 * Inclui badges de status coloridos e menu de acoes.
 */

"use client";

import { MoreVertical, Eye, FileText, Plus, Phone, MessageCircle, Mail, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import type { ClientWithMetrics, ClientStatus, ClientFilters } from "@/lib/types/clients";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
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

// Sortable columns definition
type SortableColumn = NonNullable<ClientFilters["orderBy"]>;

interface ClientsTableProps {
  clients: ClientWithMetrics[];
  onViewProfile?: (client: ClientWithMetrics) => void;
  onViewQuotations?: (client: ClientWithMetrics) => void;
  onAddInteraction?: (client: ClientWithMetrics) => void;
  onDelete?: (client: ClientWithMetrics) => void;
  isAdmin?: boolean;
  // Sorting props
  orderBy?: SortableColumn;
  orderDir?: "asc" | "desc";
  onSort?: (column: SortableColumn) => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatPhone(phone: string): string {
  // Remove non-digits
  const digits = phone.replace(/\D/g, "");

  // Format: (XX) XXXXX-XXXX or (XX) XXXX-XXXX
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  } else if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

function formatCPF(cpf: string): string {
  // Remove non-digits
  const digits = cpf.replace(/\D/g, "");

  // Format: XXX.XXX.XXX-XX
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }
  return cpf;
}

// Sortable header component
function SortableHeader({
  column,
  label,
  align,
  currentOrderBy,
  currentOrderDir,
  onSort,
}: {
  column: SortableColumn;
  label: string;
  align: "left" | "right";
  currentOrderBy?: SortableColumn;
  currentOrderDir?: "asc" | "desc";
  onSort?: (column: SortableColumn) => void;
}) {
  const isActive = currentOrderBy === column;
  const isAsc = currentOrderDir === "asc";

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onSort?.(column)}
      className={cn(
        "h-auto py-0 px-0 font-medium hover:bg-transparent",
        align === "right" && "ml-auto flex-row-reverse",
        isActive && "text-foreground"
      )}
    >
      {label}
      {isActive ? (
        isAsc ? (
          <ArrowUp className="ml-1 h-3.5 w-3.5" />
        ) : (
          <ArrowDown className="ml-1 h-3.5 w-3.5" />
        )
      ) : (
        <ArrowUpDown className="ml-1 h-3.5 w-3.5 text-muted-foreground/50" />
      )}
    </Button>
  );
}

export function ClientsTable({
  clients,
  onViewProfile,
  onViewQuotations,
  onAddInteraction,
  onDelete,
  isAdmin = false,
  orderBy,
  orderDir,
  onSort,
}: ClientsTableProps) {
  if (clients.length === 0) {
    return null;
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[200px]">
              <SortableHeader
                column="name"
                label="Nome"
                align="left"
                currentOrderBy={orderBy}
                currentOrderDir={orderDir}
                onSort={onSort}
              />
            </TableHead>
            <TableHead>CPF</TableHead>
            <TableHead>Contato</TableHead>
            <TableHead>Cidade</TableHead>
            <TableHead className="text-right">
              <SortableHeader
                column="quotationCount"
                label="Cotacoes"
                align="right"
                currentOrderBy={orderBy}
                currentOrderDir={orderDir}
                onSort={onSort}
              />
            </TableHead>
            <TableHead className="text-right">
              <SortableHeader
                column="monthlyValue"
                label="Valor Mensal"
                align="right"
                currentOrderBy={orderBy}
                currentOrderDir={orderDir}
                onSort={onSort}
              />
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => {
            const statusConfig = CLIENT_STATUS_CONFIG[client.status];

            return (
              <TableRow key={client.id}>
                <TableCell>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{client.name}</p>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatCPF(client.cpf)}
                </TableCell>
                <TableCell>
                  <ClientsActionsMenu
                    phone={client.phone}
                    email={client.email}
                    mode="inline"
                    size="sm"
                  />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {client.city}/{client.state}
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-medium">{client.quotationCount}</span>
                  {client.acceptedQuotations > 0 && (
                    <span className="text-green-600 ml-1">
                      ({client.acceptedQuotations})
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {client.monthlyValue > 0
                    ? formatCurrency(client.monthlyValue)
                    : "-"}
                </TableCell>
                <TableCell>
                  <Badge variant={statusConfig.variant} className={statusConfig.className}>
                    {statusConfig.label}
                  </Badge>
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
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * Table Skeleton for loading state
 */
export function ClientsTableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[200px]">
              <Skeleton className="h-4 w-16" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-12" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-16" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-14" />
            </TableHead>
            <TableHead className="text-right">
              <Skeleton className="h-4 w-16 ml-auto" />
            </TableHead>
            <TableHead className="text-right">
              <Skeleton className="h-4 w-20 ml-auto" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-14" />
            </TableHead>
            <TableHead className="w-[50px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-28" />
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Skeleton className="h-7 w-7 rounded" />
                  <Skeleton className="h-7 w-7 rounded" />
                  <Skeleton className="h-7 w-7 rounded" />
                  <Skeleton className="h-7 w-7 rounded" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="h-4 w-8 ml-auto" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="h-4 w-20 ml-auto" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-24 rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-8 w-8 rounded" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
