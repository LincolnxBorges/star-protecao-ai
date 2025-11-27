/**
 * Cotacoes Detail Status Component
 * @module components/cotacoes-detail-status
 *
 * Componente para alteracao de status da cotacao conforme FR-020, FR-021, FR-028.
 * - FR-020: Status disponiveis: Pendente, Contatado, Aceita, Cancelada
 * - FR-021: Observacao obrigatoria para Aceita/Cancelada
 * - FR-028: Bloqueio para cotacoes expiradas
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { updateQuotationStatusAction } from "@/app/(admin)/cotacoes/actions";
import type { QuotationStatus } from "@/lib/types/quotations";

interface CotacoesDetailStatusProps {
  quotationId: string;
  currentStatus: QuotationStatus;
  currentNotes: string | null;
  isExpired: boolean;
}

// Valid transitions per status
const VALID_TRANSITIONS: Record<string, QuotationStatus[]> = {
  PENDING: ["CONTACTED", "CANCELLED"],
  CONTACTED: ["ACCEPTED", "CANCELLED"],
};

const STATUS_CONFIG: Record<
  string,
  { label: string; description: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  PENDING: {
    label: "Pendente",
    description: "Aguardando primeiro contato",
    variant: "default",
  },
  CONTACTED: {
    label: "Contatado",
    description: "Cliente ja foi contactado",
    variant: "secondary",
  },
  ACCEPTED: {
    label: "Aceita",
    description: "Cliente aceitou a proposta",
    variant: "default",
  },
  CANCELLED: {
    label: "Cancelada",
    description: "Cotacao cancelada",
    variant: "destructive",
  },
};

// Status that require mandatory notes
const REQUIRES_NOTES: QuotationStatus[] = ["ACCEPTED", "CANCELLED"];

export function CotacoesDetailStatus({
  quotationId,
  currentStatus,
  currentNotes,
  isExpired,
}: CotacoesDetailStatusProps) {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<QuotationStatus | null>(null);
  const [notes, setNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const availableTransitions = VALID_TRANSITIONS[currentStatus] || [];
  const notesRequired = selectedStatus && REQUIRES_NOTES.includes(selectedStatus);
  const canSave = selectedStatus && (!notesRequired || notes.trim().length > 0);

  // No transitions available (already at terminal state)
  if (availableTransitions.length === 0 || isExpired) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            Status da Cotacao
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Badge variant={STATUS_CONFIG[currentStatus]?.variant || "outline"}>
              {STATUS_CONFIG[currentStatus]?.label || currentStatus}
            </Badge>
            {isExpired && (
              <span className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                Cotacao expirada - nao pode ser alterada
              </span>
            )}
            {!isExpired && (currentStatus === "ACCEPTED" || currentStatus === "CANCELLED" || currentStatus === "REJECTED") && (
              <span className="text-sm text-muted-foreground">
                Status final - nao pode ser alterado
              </span>
            )}
          </div>
          {currentNotes && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium text-muted-foreground mb-2">Observacoes</p>
              <p className="text-sm whitespace-pre-wrap">{currentNotes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  async function handleSave() {
    if (!selectedStatus || !canSave) return;

    setIsUpdating(true);
    setError(null);
    setSuccess(false);

    const result = await updateQuotationStatusAction({
      id: quotationId,
      status: selectedStatus,
      notes: notes.trim() || undefined,
    });

    if (result.success) {
      setSuccess(true);
      setSelectedStatus(null);
      setNotes("");
      toast.success("Status atualizado com sucesso!");
      // Refresh page to show updated status
      setTimeout(() => {
        router.refresh();
      }, 500);
    } else {
      const errorMsg = result.error || "Erro ao atualizar status";
      setError(errorMsg);
      toast.error(errorMsg);
    }

    setIsUpdating(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          Alterar Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">Status Atual</p>
          <Badge variant={STATUS_CONFIG[currentStatus]?.variant || "outline"} className="text-sm">
            {STATUS_CONFIG[currentStatus]?.label || currentStatus}
          </Badge>
        </div>

        {/* Status Selection */}
        <div>
          <p className="text-sm font-medium mb-3">Novo Status</p>
          <RadioGroup
            value={selectedStatus || ""}
            onValueChange={(value) => setSelectedStatus(value as QuotationStatus)}
            className="space-y-3"
          >
            {availableTransitions.map((status) => {
              const config = STATUS_CONFIG[status];
              return (
                <div
                  key={status}
                  className={cn(
                    "flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    selectedStatus === status
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  )}
                  onClick={() => setSelectedStatus(status)}
                >
                  <RadioGroupItem value={status} id={status} className="mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor={status} className="font-medium cursor-pointer">
                      {config?.label || status}
                      {REQUIRES_NOTES.includes(status) && (
                        <span className="text-destructive ml-1">*</span>
                      )}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {config?.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </RadioGroup>
        </div>

        {/* Notes Input */}
        {selectedStatus && (
          <div>
            <Label
              htmlFor="status-notes"
              className={cn(notesRequired && "text-destructive")}
            >
              Observacoes {notesRequired ? "(obrigatorio)" : "(opcional)"}
            </Label>
            <Textarea
              id="status-notes"
              placeholder={
                notesRequired
                  ? "Descreva o motivo da alteracao..."
                  : "Adicione observacoes opcionais..."
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={cn(
                "mt-2",
                notesRequired && !notes.trim() && "border-destructive"
              )}
            />
            {notesRequired && !notes.trim() && (
              <p className="text-sm text-destructive mt-1">
                Observacao e obrigatoria para este status
              </p>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-100 text-green-800 text-sm">
            <CheckCircle className="h-4 w-4" />
            Status atualizado com sucesso!
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleSave}
            disabled={!canSave || isUpdating}
            className={cn(
              selectedStatus === "CANCELLED" && "bg-destructive hover:bg-destructive/90"
            )}
          >
            {isUpdating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {selectedStatus === "ACCEPTED" && "Confirmar Aceite"}
            {selectedStatus === "CONTACTED" && "Marcar como Contatado"}
            {selectedStatus === "CANCELLED" && "Cancelar Cotacao"}
            {!selectedStatus && "Selecione um status"}
          </Button>
          {selectedStatus && (
            <Button
              variant="outline"
              onClick={() => {
                setSelectedStatus(null);
                setNotes("");
                setError(null);
              }}
              disabled={isUpdating}
            >
              Cancelar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
