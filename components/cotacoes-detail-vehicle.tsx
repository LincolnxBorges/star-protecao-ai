/**
 * Cotacoes Detail Vehicle Component
 * @module components/cotacoes-detail-vehicle
 *
 * Card com dados completos do veiculo conforme FR-016:
 * marca, modelo, placa, ano, cor, combustivel, codigo FIPE, valor FIPE, categoria, tipo de uso
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car } from "lucide-react";

interface VehicleData {
  placa: string;
  marca: string;
  modelo: string;
  ano: string;
  valorFipe: string;
  codigoFipe: string;
  combustivel: string | null;
  cor: string | null;
  categoria: string;
  tipoUso: string;
}

interface CotacoesDetailVehicleProps {
  vehicle: VehicleData;
}

function formatCurrency(value: string | number): string {
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numValue);
}

function formatPlaca(placa: string): string {
  const clean = placa.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  if (clean.length === 7) {
    // Mercosul ou antiga
    return `${clean.slice(0, 3)}-${clean.slice(3)}`;
  }
  return placa.toUpperCase();
}

const CATEGORY_LABELS: Record<string, string> = {
  CARRO: "Carro",
  MOTO: "Moto",
  CAMINHAO: "Caminhao",
  UTILITARIO: "Utilitario",
};

const USAGE_LABELS: Record<string, string> = {
  PARTICULAR: "Particular",
  COMERCIAL: "Comercial",
  APP: "Aplicativo",
};

export function CotacoesDetailVehicle({ vehicle }: CotacoesDetailVehicleProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Car className="h-5 w-5" />
          Dados do Veiculo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Marca/Modelo e Placa */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Marca/Modelo</p>
            <p className="text-sm font-semibold">
              {vehicle.marca} {vehicle.modelo}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Placa</p>
            <p className="text-sm font-mono font-semibold">
              {formatPlaca(vehicle.placa)}
            </p>
          </div>
        </div>

        {/* Ano e Cor */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Ano</p>
            <p className="text-sm">{vehicle.ano}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Cor</p>
            <p className="text-sm">{vehicle.cor || "-"}</p>
          </div>
        </div>

        {/* Combustivel e Categoria */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Combustivel</p>
            <p className="text-sm">{vehicle.combustivel || "-"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Categoria</p>
            <Badge variant="outline">
              {CATEGORY_LABELS[vehicle.categoria] || vehicle.categoria}
            </Badge>
          </div>
        </div>

        {/* Tipo de Uso */}
        <div>
          <p className="text-sm font-medium text-muted-foreground">Tipo de Uso</p>
          <Badge variant="secondary">
            {USAGE_LABELS[vehicle.tipoUso] || vehicle.tipoUso}
          </Badge>
        </div>

        {/* FIPE */}
        <div className="border-t pt-4 mt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Codigo FIPE</p>
              <p className="text-sm font-mono">{vehicle.codigoFipe}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Valor FIPE</p>
              <p className="text-sm font-semibold text-primary">
                {formatCurrency(vehicle.valorFipe)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
