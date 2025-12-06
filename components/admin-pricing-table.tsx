"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";

// ===========================================
// Types
// ===========================================

interface PricingRule {
  id: string;
  categoria: string;
  faixaMin: number;
  faixaMax: number;
  mensalidade: number;
  cotaParticipacao: number | null;
  isActive: boolean;
  createdAt: string | null;
}

type VehicleCategory = "NORMAL" | "ESPECIAL" | "UTILITARIO" | "MOTO";

// ===========================================
// Helpers
// ===========================================

const CATEGORIA_LABELS: Record<string, string> = {
  NORMAL: "Normal",
  ESPECIAL: "Especial",
  UTILITARIO: "Utilitario",
  MOTO: "Moto",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

// ===========================================
// Component
// ===========================================

export function AdminPricingTable() {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCategoria, setFilterCategoria] = useState<string>("all");

  // Form state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const [formData, setFormData] = useState({
    categoria: "NORMAL" as VehicleCategory,
    faixaMin: "",
    faixaMax: "",
    mensalidade: "",
    cotaParticipacao: "",
  });

  // Fetch rules
  useEffect(() => {
    fetchRules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCategoria]);

  async function fetchRules() {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filterCategoria !== "all") {
        params.set("categoria", filterCategoria);
      }

      const response = await fetch(`/api/pricing?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setRules(data.data);
      } else {
        setError(data.error?.message || "Erro ao carregar regras de preco");
      }
    } catch {
      setError("Erro ao carregar regras de preco");
    } finally {
      setIsLoading(false);
    }
  }

  function openCreateDialog() {
    setEditingRule(null);
    setFormData({
      categoria: "NORMAL",
      faixaMin: "",
      faixaMax: "",
      mensalidade: "",
      cotaParticipacao: "",
    });
    setIsDialogOpen(true);
  }

  function openEditDialog(rule: PricingRule) {
    setEditingRule(rule);
    setFormData({
      categoria: rule.categoria as VehicleCategory,
      faixaMin: rule.faixaMin.toString(),
      faixaMax: rule.faixaMax.toString(),
      mensalidade: rule.mensalidade.toString(),
      cotaParticipacao: rule.cotaParticipacao?.toString() || "",
    });
    setIsDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        categoria: formData.categoria,
        faixaMin: parseFloat(formData.faixaMin),
        faixaMax: parseFloat(formData.faixaMax),
        mensalidade: parseFloat(formData.mensalidade),
        cotaParticipacao: formData.cotaParticipacao
          ? parseFloat(formData.cotaParticipacao)
          : null,
      };

      if (editingRule) {
        // Update
        const response = await fetch(`/api/pricing/${editingRule.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            faixaMin: payload.faixaMin,
            faixaMax: payload.faixaMax,
            mensalidade: payload.mensalidade,
            cotaParticipacao: payload.cotaParticipacao,
          }),
        });

        const data = await response.json();

        if (!data.success) {
          setError(data.error?.message || "Erro ao atualizar regra");
          return;
        }
      } else {
        // Create
        const response = await fetch("/api/pricing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!data.success) {
          setError(data.error?.message || "Erro ao criar regra");
          return;
        }
      }

      setIsDialogOpen(false);
      fetchRules();
    } catch {
      setError("Erro ao salvar regra");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja desativar esta regra de preco?")) {
      return;
    }

    try {
      const response = await fetch(`/api/pricing/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        fetchRules();
      } else {
        setError(data.error?.message || "Erro ao desativar regra");
      }
    } catch {
      setError("Erro ao desativar regra");
    }
  }

  // Group rules by category
  const groupedRules = rules.reduce(
    (acc, rule) => {
      if (!acc[rule.categoria]) {
        acc[rule.categoria] = [];
      }
      acc[rule.categoria].push(rule);
      return acc;
    },
    {} as Record<string, PricingRule[]>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={filterCategoria} onValueChange={setFilterCategoria}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Categorias</SelectItem>
              <SelectItem value="NORMAL">Normal</SelectItem>
              <SelectItem value="ESPECIAL">Especial</SelectItem>
              <SelectItem value="UTILITARIO">Utilitario</SelectItem>
              <SelectItem value="MOTO">Moto</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Regra
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingRule ? "Editar Regra de Preco" : "Nova Regra de Preco"}
                </DialogTitle>
                <DialogDescription>
                  {editingRule
                    ? "Altere os valores da regra de preco"
                    : "Adicione uma nova faixa de preco"}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="categoria">Categoria</Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(value) =>
                      setFormData({ ...formData, categoria: value as VehicleCategory })
                    }
                    disabled={!!editingRule}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NORMAL">Normal</SelectItem>
                      <SelectItem value="ESPECIAL">Especial</SelectItem>
                      <SelectItem value="UTILITARIO">Utilitario</SelectItem>
                      <SelectItem value="MOTO">Moto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="faixaMin">Valor FIPE Minimo (R$)</Label>
                    <Input
                      id="faixaMin"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.faixaMin}
                      onChange={(e) =>
                        setFormData({ ...formData, faixaMin: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="faixaMax">Valor FIPE Maximo (R$)</Label>
                    <Input
                      id="faixaMax"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.faixaMax}
                      onChange={(e) =>
                        setFormData({ ...formData, faixaMax: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="mensalidade">Mensalidade (R$)</Label>
                    <Input
                      id="mensalidade"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.mensalidade}
                      onChange={(e) =>
                        setFormData({ ...formData, mensalidade: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="cotaParticipacao">
                      Cota Participacao (R$)
                    </Label>
                    <Input
                      id="cotaParticipacao"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.cotaParticipacao}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          cotaParticipacao: e.target.value,
                        })
                      }
                      placeholder="Opcional"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  {editingRule ? "Salvar" : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-destructive/10 text-destructive rounded-md p-4">
          {error}
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : rules.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Nenhuma regra de preco encontrada
        </div>
      ) : (
        /* Tables by category */
        Object.entries(groupedRules)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([categoria, categoryRules]) => (
            <div key={categoria} className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Badge variant="outline">
                  {CATEGORIA_LABELS[categoria] || categoria}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  ({categoryRules.length} faixas)
                </span>
              </h3>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Faixa FIPE</TableHead>
                      <TableHead className="text-right">Mensalidade</TableHead>
                      <TableHead className="text-right">
                        Cota Participacao
                      </TableHead>
                      <TableHead className="text-right">Acoes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryRules
                      .sort((a, b) => a.faixaMin - b.faixaMin)
                      .map((rule) => (
                        <TableRow key={rule.id}>
                          <TableCell className="font-mono text-sm">
                            {formatCurrency(rule.faixaMin)} -{" "}
                            {formatCurrency(rule.faixaMax)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(rule.mensalidade)}
                          </TableCell>
                          <TableCell className="text-right">
                            {rule.cotaParticipacao
                              ? formatCurrency(rule.cotaParticipacao)
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(rule)}
                              >
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Editar</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(rule.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Excluir</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))
      )}
    </div>
  );
}
