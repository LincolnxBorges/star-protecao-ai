"use client";

import { useCallback, useEffect, useState } from "react";
import { Target, Edit2, Trash2, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { SellerWithGoal } from "@/lib/goals";

interface VendedoresGoalsCardProps {
  isAdmin: boolean;
}

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export function VendedoresGoalsCard({ isAdmin }: VendedoresGoalsCardProps) {
  const [sellers, setSellers] = useState<SellerWithGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);
  const [editingSellerId, setEditingSellerId] = useState<string | null>(null);
  const [goalValue, setGoalValue] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const fetchGoals = useCallback(async () => {
    try {
      const response = await fetch(`/api/goals?month=${currentMonth}&year=${currentYear}`);
      if (response.ok) {
        const data = await response.json();
        setSellers(data.sellers || []);
      }
    } catch (error) {
      console.error("Error fetching goals:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentMonth, currentYear]);

  useEffect(() => {
    if (isAdmin) {
      fetchGoals();
    }
  }, [isAdmin, fetchGoals]);

  async function handleSaveGoal(sellerId: string) {
    const target = parseInt(goalValue, 10);
    if (isNaN(target) || target < 1) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerId,
          month: currentMonth,
          year: currentYear,
          targetAccepted: target,
        }),
      });

      if (response.ok) {
        await fetchGoals();
      }
    } finally {
      setIsSaving(false);
      setEditingSellerId(null);
      setGoalValue("");
    }
  }

  async function handleRemoveGoal(sellerId: string) {
    if (!confirm("Tem certeza que deseja remover esta meta?")) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/goals", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellerId, month: currentMonth, year: currentYear }),
      });

      if (response.ok) {
        await fetchGoals();
      }
    } finally {
      setIsSaving(false);
    }
  }

  function startEditing(seller: SellerWithGoal) {
    setEditingSellerId(seller.id);
    setGoalValue(seller.goal?.targetAccepted?.toString() || "");
  }

  function cancelEditing() {
    setEditingSellerId(null);
    setGoalValue("");
  }

  if (!isAdmin) {
    return null;
  }

  const sellersWithGoals = sellers.filter(s => s.goal);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">
                  Metas Mensais - {MONTH_NAMES[currentMonth - 1]} {currentYear}
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {sellersWithGoals.length} de {sellers.length} definidas
                </span>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <span className="text-sm text-muted-foreground">Carregando...</span>
              </div>
            ) : sellers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Nenhum vendedor ativo encontrado.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {sellers.map((seller) => (
                  <div
                    key={seller.id}
                    className="flex items-center justify-between py-3 gap-4"
                  >
                    {/* Seller Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{seller.name}</p>
                      {seller.goal ? (
                        <div className="mt-1.5 space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">
                              {seller.goal.currentAccepted} / {seller.goal.targetAccepted} aceitas
                            </span>
                            <span className="font-medium text-primary">
                              {seller.goal.percentage}%
                            </span>
                          </div>
                          <Progress value={seller.goal.percentage} className="h-1.5" />
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-1">
                          Meta não definida
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {editingSellerId === seller.id ? (
                        <>
                          <Input
                            type="number"
                            min="1"
                            value={goalValue}
                            onChange={(e) => setGoalValue(e.target.value)}
                            placeholder="Meta"
                            className="w-20 h-8"
                            disabled={isSaving}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveGoal(seller.id);
                              if (e.key === "Escape") cancelEditing();
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleSaveGoal(seller.id)}
                            disabled={isSaving || !goalValue}
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={cancelEditing}
                            disabled={isSaving}
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => startEditing(seller)}
                            title={seller.goal ? "Editar meta" : "Definir meta"}
                          >
                            {seller.goal ? (
                              <Edit2 className="h-4 w-4" />
                            ) : (
                              <Target className="h-4 w-4" />
                            )}
                          </Button>
                          {seller.goal && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleRemoveGoal(seller.id)}
                              title="Remover meta"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
