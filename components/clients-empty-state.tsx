/**
 * Clients Empty State Component
 * @module components/clients-empty-state
 *
 * Estado vazio para lista de clientes quando nao ha resultados.
 */

"use client";

import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ClientsEmptyStateProps {
  hasFilters?: boolean;
  onClearFilters?: () => void;
}

export function ClientsEmptyState({
  hasFilters = false,
  onClearFilters,
}: ClientsEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Users className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-medium mb-1">Nenhum cliente encontrado</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm">
        {hasFilters
          ? "Nenhum cliente corresponde aos filtros aplicados. Tente ajustar a busca ou filtros."
          : "Ainda nao ha clientes cadastrados. Novos clientes serao exibidos aqui quando fizerem cotacoes."}
      </p>
      {hasFilters && onClearFilters && (
        <Button variant="outline" onClick={onClearFilters}>
          Limpar filtros
        </Button>
      )}
    </div>
  );
}
