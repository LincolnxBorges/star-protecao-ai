"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Car, Check } from "lucide-react";

interface VehicleData {
  placa: string;
  marca: string;
  modelo: string;
  ano: string;
  valorFipe: number;
  codigoFipe: string;
  combustivel: string | null;
  cor: string | null;
  categoria: string;
  tipoUso: string;
  pricing: {
    mensalidade: number;
    adesao: number;
    adesaoDesconto: number;
    cotaParticipacao: number | null;
  };
}

interface CotacaoResultProps {
  vehicle: VehicleData;
  onContinue: () => void;
  onBack: () => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function getCategoryLabel(categoria: string): string {
  const labels: Record<string, string> = {
    NORMAL: "Normal",
    ESPECIAL: "Especial",
    UTILITARIO: "Utilitario",
    MOTO: "Moto",
  };
  return labels[categoria] || categoria;
}

function getUsageLabel(tipoUso: string): string {
  const labels: Record<string, string> = {
    PARTICULAR: "Particular",
    COMERCIAL: "Comercial",
  };
  return labels[tipoUso] || tipoUso;
}

export function CotacaoResult({
  vehicle,
  onContinue,
  onBack,
}: CotacaoResultProps) {
  return (
    <div className="w-full max-w-md space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Dados do Veiculo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Placa</span>
            <span className="font-semibold">{vehicle.placa}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Marca/Modelo</span>
            <span className="font-semibold">
              {vehicle.marca} {vehicle.modelo}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Ano</span>
            <span className="font-semibold">{vehicle.ano}</span>
          </div>
          {vehicle.cor && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Cor</span>
              <span className="font-semibold">{vehicle.cor}</span>
            </div>
          )}
          {vehicle.combustivel && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Combustivel</span>
              <span className="font-semibold">{vehicle.combustivel}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Valor FIPE</span>
            <span className="font-semibold text-primary">
              {formatCurrency(vehicle.valorFipe)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Categoria</span>
            <Badge variant="secondary">{getCategoryLabel(vehicle.categoria)}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Tipo de Uso</span>
            <Badge variant="outline">{getUsageLabel(vehicle.tipoUso)}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-500" />
            Valores da Protecao
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Mensalidade</span>
            <span className="font-semibold text-xl text-primary">
              {formatCurrency(vehicle.pricing.mensalidade)}
            </span>
          </div>

          <Separator />

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Adesao</span>
            <span className="text-muted-foreground line-through">
              {formatCurrency(vehicle.pricing.adesao)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">
              Adesao com 20% de desconto
            </span>
            <span className="font-semibold text-green-600">
              {formatCurrency(vehicle.pricing.adesaoDesconto)}
            </span>
          </div>

          {vehicle.pricing.cotaParticipacao && (
            <>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Cota de Participacao</span>
                <span className="font-semibold">
                  {formatCurrency(vehicle.pricing.cotaParticipacao)}
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Voltar
        </Button>
        <Button onClick={onContinue} className="flex-1">
          Continuar
        </Button>
      </div>
    </div>
  );
}
