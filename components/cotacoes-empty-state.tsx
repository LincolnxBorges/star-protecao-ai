/**
 * Cotacoes Empty State Component
 * @module components/cotacoes-empty-state
 *
 * Componente de estado vazio com CTA conforme FR-011.
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion, Plus } from "lucide-react";

interface CotacoesEmptyStateProps {
  title?: string;
  description?: string;
  showCreateButton?: boolean;
}

export function CotacoesEmptyState({
  title = "Nenhuma cotacao encontrada",
  description = "Nao existem cotacoes que correspondam aos filtros selecionados.",
  showCreateButton = true,
}: CotacoesEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center border rounded-lg bg-muted/30">
      <FileQuestion className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
      {showCreateButton && (
        <Button asChild>
          <Link href="/cotacoes/nova">
            <Plus className="h-4 w-4 mr-2" />
            Nova Cotacao
          </Link>
        </Button>
      )}
    </div>
  );
}
