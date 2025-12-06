"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DashboardQuotationRow } from "@/components/dashboard-quotation-row";
import { DashboardContactConfirm } from "@/components/dashboard-contact-confirm";
import { confirmContactAction } from "@/app/(admin)/dashboard/actions";
import type { QuotationListItem } from "@/lib/types/dashboard";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface DashboardQuotationsListProps {
  quotations: QuotationListItem[];
}

export function DashboardQuotationsList({
  quotations,
}: DashboardQuotationsListProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    quotationId: string;
    customerName: string;
  }>({
    open: false,
    quotationId: "",
    customerName: "",
  });

  const handleContactClick = (quotationId: string) => {
    const quotation = quotations.find((q) => q.id === quotationId);
    if (quotation && quotation.status === "PENDING") {
      setConfirmDialog({
        open: true,
        quotationId,
        customerName: quotation.customer.name,
      });
    }
  };

  const handleConfirmContact = async () => {
    const result = await confirmContactAction(confirmDialog.quotationId);

    if (result.success) {
      toast.success("Contato registrado com sucesso!");
      startTransition(() => {
        router.refresh();
      });
    } else {
      toast.error(result.error || "Erro ao registrar contato");
    }
  };

  if (quotations.length === 0) {
    return (
      <div data-testid="quotations-list">
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className="text-muted-foreground">
            Nenhuma cotação encontrada. As novas cotações aparecerão aqui.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="quotations-list" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Cotações Recentes</h2>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/cotacoes">
            Ver todas
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="space-y-3">
        {quotations.map((quotation) => (
          <DashboardQuotationRow
            key={quotation.id}
            quotation={quotation}
            onContactClick={handleContactClick}
          />
        ))}
      </div>

      <DashboardContactConfirm
        open={confirmDialog.open}
        onOpenChange={(open) =>
          setConfirmDialog((prev) => ({ ...prev, open }))
        }
        onConfirm={handleConfirmContact}
        customerName={confirmDialog.customerName}
      />
    </div>
  );
}
