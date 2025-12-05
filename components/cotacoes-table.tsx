/**
 * Cotacoes Table Component
 * @module components/cotacoes-table
 *
 * Tabela de cotacoes com colunas conforme FR-001:
 * veiculo (marca/modelo/placa/categoria), cliente (nome/telefone/cidade),
 * valor da mensalidade, status e tempo desde criacao.
 *
 * Conforme FR-032: exibe cards empilhados em mobile, tabela em desktop.
 */

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CotacoesRow } from "@/components/cotacoes-row";
import { CotacoesMobileCard } from "@/components/cotacoes-mobile-card";
import { CotacoesEmptyState } from "@/components/cotacoes-empty-state";
import type { QuotationWithRelations } from "@/lib/quotations";

interface CotacoesTableProps {
  quotations: QuotationWithRelations[];
  isLoading?: boolean;
}

export function CotacoesTable({ quotations, isLoading }: CotacoesTableProps) {
  if (quotations.length === 0 && !isLoading) {
    return <CotacoesEmptyState />;
  }

  return (
    <>
      {/* Mobile: Stacked Cards (visible on screens smaller than lg) */}
      <div className="lg:hidden space-y-3">
        {quotations.map((quotation) => (
          <CotacoesMobileCard key={quotation.id} quotation={quotation} />
        ))}
      </div>

      {/* Desktop: Table (visible on lg screens and up) */}
      <div className="hidden lg:block rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead>Veiculo</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="text-right">Mensalidade</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead>Vendedor</TableHead>
              <TableHead className="w-[100px]">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotations.map((quotation) => (
              <CotacoesRow key={quotation.id} quotation={quotation} />
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
