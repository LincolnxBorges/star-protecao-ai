"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, XCircle } from "lucide-react";

interface RejectionError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

interface CotacaoRejectedProps {
  error: RejectionError;
  saveAsLead: boolean;
  onCollectData: () => void;
  onBack: () => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function CotacaoRejected({
  error,
  saveAsLead,
  onCollectData,
  onBack,
}: CotacaoRejectedProps) {
  const isBlacklisted = error.code === "BLACKLISTED";
  const isOverLimit = error.code === "OVER_LIMIT";

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <XCircle className="h-5 w-5" />
          Cotacao Nao Disponivel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-destructive/10 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
            <div className="space-y-2">
              <p className="font-medium text-destructive">{error.message}</p>

              {isBlacklisted && error.details && (
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>
                    <span className="font-medium">Marca:</span>{" "}
                    {String(error.details.marca)}
                  </p>
                  {error.details.modelo ? (
                    <p>
                      <span className="font-medium">Modelo:</span>{" "}
                      {String(error.details.modelo)}
                    </p>
                  ) : null}
                  {error.details.motivo ? (
                    <p>
                      <span className="font-medium">Motivo:</span>{" "}
                      {String(error.details.motivo)}
                    </p>
                  ) : null}
                </div>
              )}

              {isOverLimit && error.details && (
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>
                    <span className="font-medium">Categoria:</span>{" "}
                    {String(error.details.categoria)}
                  </p>
                  <p>
                    <span className="font-medium">Valor FIPE:</span>{" "}
                    {formatCurrency(Number(error.details.valorFipe))}
                  </p>
                  <p>
                    <span className="font-medium">Limite:</span>{" "}
                    {formatCurrency(Number(error.details.limite))}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {saveAsLead && (
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Mesmo assim, voce pode deixar seus dados para que um de nossos
              consultores entre em contato e avalie possibilidades.
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Nova Consulta
          </Button>
          {saveAsLead && (
            <Button onClick={onCollectData} className="flex-1">
              Deixar meus dados
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
