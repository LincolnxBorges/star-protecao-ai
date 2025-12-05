/**
 * Seller Deactivation Modal Component
 * @module components/vendedores-modal-deactivate
 *
 * Modal para desativar/ativar vendedor com opcoes para leads pendentes.
 */

"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Loader2, UserMinus, UserPlus, Palmtree } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  changeSellerStatusAction,
  getActiveSellersAction,
  countPendingLeadsAction,
} from "@/app/(admin)/vendedores/actions";
import type { SellerWithMetrics, SellerStatus } from "@/lib/types/sellers";

interface VendedoresModalDeactivateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  seller: SellerWithMetrics | null;
  targetStatus: SellerStatus;
}

export function VendedoresModalDeactivate({
  open,
  onOpenChange,
  onSuccess,
  seller,
  targetStatus,
}: VendedoresModalDeactivateProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [pendingLeadsAction, setPendingLeadsAction] = useState<"keep" | "redistribute" | "assign">("keep");
  const [assignToSellerId, setAssignToSellerId] = useState<string>("");
  const [activeSellers, setActiveSellers] = useState<Array<{ id: string; name: string }>>([]);
  const [pendingLeadsCount, setPendingLeadsCount] = useState(0);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const isDeactivating = targetStatus !== "ACTIVE";
  const isVacation = targetStatus === "VACATION";

  // Carregar dados quando o modal abre
  useEffect(() => {
    if (open && seller && isDeactivating) {
      setIsLoadingData(true);
      Promise.all([
        getActiveSellersAction(seller.id),
        countPendingLeadsAction(seller.id),
      ])
        .then(([sellersResult, countResult]) => {
          if (sellersResult.success && sellersResult.data) {
            setActiveSellers(sellersResult.data);
          }
          if (countResult.success && countResult.data !== undefined) {
            setPendingLeadsCount(countResult.data);
          }
        })
        .finally(() => {
          setIsLoadingData(false);
        });
    }
  }, [open, seller, isDeactivating]);

  // Reset state quando modal fecha
  useEffect(() => {
    if (!open) {
      setReason("");
      setPendingLeadsAction("keep");
      setAssignToSellerId("");
      setServerError(null);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!seller) return;

    setIsSubmitting(true);
    setServerError(null);

    try {
      const result = await changeSellerStatusAction(seller.id, {
        newStatus: targetStatus,
        reason: isDeactivating ? reason : undefined,
        pendingLeadsAction: isDeactivating && pendingLeadsCount > 0 ? pendingLeadsAction : undefined,
        assignToSellerId: pendingLeadsAction === "assign" ? assignToSellerId : undefined,
      });

      if (result.success) {
        const successMsg = targetStatus === "ACTIVE"
          ? `${seller.name} ativado com sucesso!`
          : targetStatus === "VACATION"
            ? `${seller.name} colocado em ferias!`
            : `${seller.name} desativado com sucesso!`;
        toast.success(successMsg);
        onOpenChange(false);
        onSuccess?.();
      } else {
        const errorMsg = result.error || "Erro ao alterar status";
        setServerError(errorMsg);
        toast.error(errorMsg);
      }
    } catch {
      const errorMsg = "Erro inesperado. Tente novamente.";
      setServerError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
    }
  };

  if (!seller) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isDeactivating ? (
              isVacation ? (
                <Palmtree className="h-5 w-5 text-warning" />
              ) : (
                <UserMinus className="h-5 w-5 text-destructive" />
              )
            ) : (
              <UserPlus className="h-5 w-5 text-green-600" />
            )}
            {isDeactivating
              ? isVacation
                ? "Colocar em Ferias"
                : "Desativar Vendedor"
              : "Ativar Vendedor"}
          </DialogTitle>
          <DialogDescription>
            {isDeactivating
              ? `Tem certeza que deseja ${isVacation ? "colocar em ferias" : "desativar"} ${seller.name}?`
              : `Tem certeza que deseja ativar ${seller.name}?`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {serverError && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
              {serverError}
            </div>
          )}

          {isDeactivating && (
            <>
              {/* Motivo */}
              <div className="space-y-2">
                <Label htmlFor="reason">
                  Motivo {isVacation ? "(opcional)" : ""}
                </Label>
                <Textarea
                  id="reason"
                  placeholder={
                    isVacation
                      ? "Ex: Ferias de 15/01 a 30/01"
                      : "Ex: Desligamento, afastamento, etc."
                  }
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={isSubmitting}
                  rows={2}
                />
              </div>

              {/* Opcoes para leads pendentes */}
              {isLoadingData ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando informacoes...
                </div>
              ) : pendingLeadsCount > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 p-3 bg-warning/10 rounded-md">
                    <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">
                        Este vendedor possui {pendingLeadsCount} lead
                        {pendingLeadsCount > 1 ? "s" : ""} pendente
                        {pendingLeadsCount > 1 ? "s" : ""}
                      </p>
                      <p className="text-muted-foreground">
                        Escolha o que fazer com {pendingLeadsCount > 1 ? "eles" : "ele"}:
                      </p>
                    </div>
                  </div>

                  <RadioGroup
                    value={pendingLeadsAction}
                    onValueChange={(value) =>
                      setPendingLeadsAction(value as "keep" | "redistribute" | "assign")
                    }
                    disabled={isSubmitting}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="keep" id="keep" />
                      <Label htmlFor="keep" className="cursor-pointer">
                        Manter com este vendedor
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="redistribute" id="redistribute" />
                      <Label htmlFor="redistribute" className="cursor-pointer">
                        Redistribuir entre vendedores ativos
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="assign" id="assign" />
                      <Label htmlFor="assign" className="cursor-pointer">
                        Atribuir para vendedor especifico
                      </Label>
                    </div>
                  </RadioGroup>

                  {pendingLeadsAction === "assign" && (
                    <div className="pl-6 space-y-2">
                      <Label htmlFor="assignTo">Selecione o vendedor</Label>
                      <Select
                        value={assignToSellerId}
                        onValueChange={setAssignToSellerId}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um vendedor" />
                        </SelectTrigger>
                        <SelectContent>
                          {activeSellers.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Este vendedor nao possui leads pendentes.
                </p>
              )}
            </>
          )}

          {!isDeactivating && (
            <p className="text-sm text-muted-foreground">
              O vendedor sera adicionado ao final da fila do round-robin e
              voltara a receber leads automaticamente.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              (pendingLeadsAction === "assign" && !assignToSellerId)
            }
            variant={isDeactivating && !isVacation ? "destructive" : "default"}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isDeactivating
              ? isVacation
                ? "Colocar em Ferias"
                : "Desativar"
              : "Ativar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
