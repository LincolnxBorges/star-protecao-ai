/**
 * Clients Delete Confirmation Dialog
 * @module components/clients-delete-dialog
 *
 * Dialogo de confirmacao para soft delete de clientes.
 * Exibe aviso se cliente possui cotacoes ativas.
 * T080: Phase 13 - Polish & Cross-Cutting Concerns.
 */

"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import type { ClientWithMetrics } from "@/lib/types/clients";

interface ClientsDeleteDialogProps {
  client: ClientWithMetrics | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (clientId: string) => Promise<{ success: boolean; error?: string }>;
}

export function ClientsDeleteDialog({
  client,
  isOpen,
  onClose,
  onConfirm,
}: ClientsDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!client) return null;

  const hasActiveQuotations = client.acceptedQuotations > 0;

  const handleConfirm = async () => {
    setIsDeleting(true);

    try {
      const result = await onConfirm(client.id);

      if (result.success) {
        toast.success("Cliente excluido com sucesso");
        onClose();
      } else {
        toast.error(result.error || "Erro ao excluir cliente");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Erro ao excluir cliente");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Excluir cliente
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Tem certeza que deseja excluir o cliente{" "}
                <span className="font-medium text-foreground">{client.name}</span>?
              </p>

              {hasActiveQuotations && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                  <p className="font-medium text-yellow-800 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Atencao: Cliente com cotacoes ativas
                  </p>
                  <p className="text-yellow-700 mt-1">
                    Este cliente possui {client.acceptedQuotations} cotacao(oes) aceita(s).
                    A exclusao nao afetara as cotacoes existentes, mas o cliente
                    nao aparecera mais na lista.
                  </p>
                </div>
              )}

              <p className="text-muted-foreground">
                Esta acao pode ser revertida pelo administrador do sistema.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Excluindo...
              </>
            ) : (
              "Excluir cliente"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
