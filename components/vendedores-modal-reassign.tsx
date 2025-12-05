/**
 * Lead Reassignment Modal Component
 * @module components/vendedores-modal-reassign
 *
 * Modal para reatribuir leads de um vendedor para outros.
 * T067: vendedores-modal-reassign.tsx
 */

"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import {
  Loader2,
  AlertCircle,
  Users,
  ArrowRight,
  CheckCircle2,
  Car,
  Phone,
} from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  getSellerPendingLeadsAction,
  getActiveSellersAction,
  reassignLeadsAction,
} from "@/app/(admin)/vendedores/actions";
import type { SellerWithMetrics } from "@/lib/types/sellers";
import type { PendingLead } from "@/lib/sellers";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface VendedoresModalReassignProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  seller: SellerWithMetrics | null;
}

export function VendedoresModalReassign({
  open,
  onOpenChange,
  onSuccess,
  seller,
}: VendedoresModalReassignProps) {
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Leads data
  const [leads, setLeads] = useState<PendingLead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());

  // Active sellers for destination
  const [activeSellers, setActiveSellers] = useState<Array<{ id: string; name: string }>>([]);

  // Form state
  const [distribution, setDistribution] = useState<"equal" | "specific">("equal");
  const [toSellerId, setToSellerId] = useState<string>("");

  // Load data when modal opens
  const loadData = useCallback(async (sellerId: string) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setSelectedLeads(new Set());
    setDistribution("equal");
    setToSellerId("");

    try {
      const [leadsResult, sellersResult] = await Promise.all([
        getSellerPendingLeadsAction(sellerId),
        getActiveSellersAction(sellerId),
      ]);
      if (leadsResult.success && leadsResult.data) {
        setLeads(leadsResult.data);
      }
      if (sellersResult.success && sellersResult.data) {
        setActiveSellers(sellersResult.data);
      }
    } catch {
      setError("Erro ao carregar dados");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && seller) {
      void loadData(seller.id);
    }
  }, [open, seller, loadData]);

  const handleSelectAll = () => {
    if (selectedLeads.size === leads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(leads.map((lead) => lead.id)));
    }
  };

  const handleToggleLead = (leadId: string) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId);
    } else {
      newSelected.add(leadId);
    }
    setSelectedLeads(newSelected);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleSubmit = () => {
    if (!seller) return;

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await reassignLeadsAction(seller.id, {
        quotationIds: Array.from(selectedLeads),
        distribution,
        toSellerId: distribution === "specific" ? toSellerId : undefined,
      });

      if (result.success && result.data) {
        const { reassignedCount, toSellers } = result.data;
        const sellerNames = toSellers.map((s) => `${s.name} (${s.count})`).join(", ");
        const successMsg = `${reassignedCount} lead${reassignedCount !== 1 ? "s" : ""} reatribuido${reassignedCount !== 1 ? "s" : ""} para: ${sellerNames}`;
        setSuccess(successMsg);
        toast.success(successMsg);

        // Remove reassigned leads from list
        setLeads((prev) => prev.filter((lead) => !selectedLeads.has(lead.id)));
        setSelectedLeads(new Set());

        onSuccess?.();
      } else {
        const errorMsg = result.error || "Erro ao reatribuir leads";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    });
  };

  if (!seller) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Reatribuir Leads
          </DialogTitle>
          <DialogDescription>
            Selecione os leads de {seller.name} para reatribuir a outros vendedores.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex-1 overflow-hidden space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {leads.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Nenhum lead pendente para reatribuir.
                </p>
              </div>
            ) : (
              <>
                {/* Lead Selection */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      Leads Pendentes ({leads.length})
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSelectAll}
                      className="text-xs h-7"
                    >
                      {selectedLeads.size === leads.length
                        ? "Desmarcar todos"
                        : "Selecionar todos"}
                    </Button>
                  </div>

                  <ScrollArea className="h-[200px] border rounded-lg">
                    <div className="p-2 space-y-2">
                      {leads.map((lead) => (
                        <div
                          key={lead.id}
                          className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors ${
                            selectedLeads.has(lead.id)
                              ? "border-primary bg-primary/5"
                              : "hover:bg-muted/50"
                          }`}
                          onClick={() => handleToggleLead(lead.id)}
                        >
                          <Checkbox
                            checked={selectedLeads.has(lead.id)}
                            onCheckedChange={() => handleToggleLead(lead.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Car className="h-3 w-3 text-muted-foreground" />
                              <p className="text-sm font-medium truncate">
                                {lead.vehicleMarca} {lead.vehicleModelo} {lead.vehicleAno}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{lead.customerName}</span>
                              {lead.customerPhone && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {lead.customerPhone}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="secondary" className="text-xs">
                              {formatCurrency(lead.mensalidade)}/mes
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(lead.createdAt), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  {selectedLeads.size > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {selectedLeads.size} lead{selectedLeads.size !== 1 ? "s" : ""} selecionado{selectedLeads.size !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>

                {/* Distribution Options */}
                {selectedLeads.size > 0 && (
                  <div className="space-y-4 pt-2 border-t">
                    <Label className="text-sm font-medium">Destino</Label>

                    <RadioGroup
                      value={distribution}
                      onValueChange={(v) => setDistribution(v as "equal" | "specific")}
                      className="space-y-3"
                    >
                      <div className="flex items-start gap-3">
                        <RadioGroupItem value="equal" id="equal" className="mt-1" />
                        <div>
                          <Label htmlFor="equal" className="font-medium cursor-pointer">
                            Distribuir igualmente
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Os leads serao distribuidos entre todos os vendedores ativos
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <RadioGroupItem value="specific" id="specific" className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor="specific" className="font-medium cursor-pointer">
                            Atribuir a vendedor especifico
                          </Label>
                          <p className="text-xs text-muted-foreground mb-2">
                            Todos os leads serao atribuidos a um unico vendedor
                          </p>

                          {distribution === "specific" && (
                            <Select value={toSellerId} onValueChange={setToSellerId}>
                              <SelectTrigger className="w-full">
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
                          )}
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <DialogFooter className="pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {leads.length === 0 || success ? "Fechar" : "Cancelar"}
          </Button>
          {leads.length > 0 && !success && (
            <Button
              onClick={handleSubmit}
              disabled={
                isPending ||
                selectedLeads.size === 0 ||
                (distribution === "specific" && !toSellerId)
              }
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4 mr-2" />
              )}
              Reatribuir {selectedLeads.size > 0 && `(${selectedLeads.size})`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
