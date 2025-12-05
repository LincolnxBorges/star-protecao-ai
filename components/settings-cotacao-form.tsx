"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  Calculator,
  Calendar,
  DollarSign,
  Car,
  Truck,
  Bike,
  ExternalLink,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import {
  quotationSettingsSchema,
  type QuotationSettings,
} from "@/lib/settings-schemas";

interface SettingsCotacaoFormProps {
  initialData: QuotationSettings;
  onSave: (data: QuotationSettings) => Promise<void>;
  readOnly?: boolean;
}

export function SettingsCotacaoForm({
  initialData,
  onSave,
  readOnly = false,
}: SettingsCotacaoFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<QuotationSettings>({
    resolver: zodResolver(quotationSettingsSchema),
    defaultValues: initialData,
  });

  // Watch values for real-time calculations
  const taxaAdesao = watch("taxaAdesao");
  const desconto = watch("desconto");
  const alertaHabilitado = watch("alertaExpiracao.habilitado");
  const permitirReativarHabilitado = watch("permitirReativar.habilitado");

  // Real-time calculation of taxa de adesao example
  const taxaExemplo = useMemo(() => {
    const valorFipeExemplo = 50000; // R$ 50.000 exemplo
    const taxaCalculada = valorFipeExemplo * (taxaAdesao / 100);
    const descontoCalculado = taxaCalculada * (desconto / 100);
    return {
      valorFipe: valorFipeExemplo,
      taxaBruta: taxaCalculada,
      descontoValor: descontoCalculado,
      taxaFinal: taxaCalculada - descontoCalculado,
    };
  }, [taxaAdesao, desconto]);

  // Reset success message after 3 seconds
  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => setSaveSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess]);

  const onSubmit = async (data: QuotationSettings) => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await onSave(data);
      setSaveSuccess(true);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Erro ao salvar configuracoes"
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Validade Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Validade da Cotacao
          </CardTitle>
          <CardDescription>
            Defina o periodo de validade das cotacoes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="diasValidade">Dias de Validade *</Label>
              <Input
                id="diasValidade"
                type="number"
                min={1}
                max={30}
                {...register("diasValidade", { valueAsNumber: true })}
                disabled={readOnly}
              />
              {errors.diasValidade && (
                <p className="text-sm text-destructive">
                  {errors.diasValidade.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Cotacoes expiram apos este periodo (1-30 dias)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Taxa de Adesao Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Taxa de Adesao
          </CardTitle>
          <CardDescription>
            Configure a taxa e desconto aplicados ao valor FIPE
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="taxaAdesao">Taxa de Adesao (%) *</Label>
              <Input
                id="taxaAdesao"
                type="number"
                step="0.1"
                min={0}
                max={10}
                {...register("taxaAdesao", { valueAsNumber: true })}
                disabled={readOnly}
              />
              {errors.taxaAdesao && (
                <p className="text-sm text-destructive">
                  {errors.taxaAdesao.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Percentual sobre o valor FIPE (0-10%)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="desconto">Desconto (%) *</Label>
              <Input
                id="desconto"
                type="number"
                step="1"
                min={0}
                max={100}
                {...register("desconto", { valueAsNumber: true })}
                disabled={readOnly}
              />
              {errors.desconto && (
                <p className="text-sm text-destructive">
                  {errors.desconto.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Desconto aplicado sobre a taxa de adesao (0-100%)
              </p>
            </div>
          </div>

          {/* Real-time Calculation Preview */}
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <h4 className="mb-3 flex items-center gap-2 text-sm font-medium">
              <DollarSign className="h-4 w-4" />
              Simulacao (Veiculo de R$ {taxaExemplo.valorFipe.toLocaleString("pt-BR")})
            </h4>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxa bruta ({taxaAdesao}%):</span>
                <span>R$ {taxaExemplo.taxaBruta.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Desconto ({desconto}%):</span>
                <span className="text-green-600">
                  - R$ {taxaExemplo.descontoValor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 font-medium">
                <span>Taxa final:</span>
                <span className="text-primary">
                  R$ {taxaExemplo.taxaFinal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cotas por Categoria Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Cotas de Participacao por Categoria
          </CardTitle>
          <CardDescription>
            Defina os valores de cota de participacao para cada categoria de veiculo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="cotaNormal" className="flex items-center gap-2">
                <Car className="h-4 w-4" />
                Normal
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  R$
                </span>
                <Input
                  id="cotaNormal"
                  type="number"
                  className="pl-10"
                  {...register("cotasParticipacao.normal", { valueAsNumber: true })}
                  disabled={readOnly}
                />
              </div>
              {errors.cotasParticipacao?.normal && (
                <p className="text-sm text-destructive">
                  {errors.cotasParticipacao.normal.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cotaEspecial" className="flex items-center gap-2">
                <Car className="h-4 w-4" />
                Especial
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  R$
                </span>
                <Input
                  id="cotaEspecial"
                  type="number"
                  className="pl-10"
                  {...register("cotasParticipacao.especial", { valueAsNumber: true })}
                  disabled={readOnly}
                />
              </div>
              {errors.cotasParticipacao?.especial && (
                <p className="text-sm text-destructive">
                  {errors.cotasParticipacao.especial.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cotaUtilitario" className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Utilitario
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  R$
                </span>
                <Input
                  id="cotaUtilitario"
                  type="number"
                  className="pl-10"
                  {...register("cotasParticipacao.utilitario", { valueAsNumber: true })}
                  disabled={readOnly}
                />
              </div>
              {errors.cotasParticipacao?.utilitario && (
                <p className="text-sm text-destructive">
                  {errors.cotasParticipacao.utilitario.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cotaMoto" className="flex items-center gap-2">
                <Bike className="h-4 w-4" />
                Moto
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  R$
                </span>
                <Input
                  id="cotaMoto"
                  type="number"
                  className="pl-10"
                  {...register("cotasParticipacao.moto", { valueAsNumber: true })}
                  disabled={readOnly}
                />
              </div>
              {errors.cotasParticipacao?.moto && (
                <p className="text-sm text-destructive">
                  {errors.cotasParticipacao.moto.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerta de Expiracao Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Alerta de Expiracao
          </CardTitle>
          <CardDescription>
            Configure notificacoes para cotacoes proximas de expirar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="alertaHabilitado">Ativar alertas</Label>
              <p className="text-xs text-muted-foreground">
                Envia notificacao quando a cotacao estiver proximo de expirar
              </p>
            </div>
            <Switch
              id="alertaHabilitado"
              checked={alertaHabilitado}
              onCheckedChange={(checked) =>
                setValue("alertaExpiracao.habilitado", checked, { shouldDirty: true })
              }
              disabled={readOnly}
            />
          </div>

          {alertaHabilitado && (
            <div className="space-y-2">
              <Label htmlFor="diasAntecedencia">Dias de antecedencia</Label>
              <Input
                id="diasAntecedencia"
                type="number"
                min={1}
                max={30}
                className="max-w-[200px]"
                {...register("alertaExpiracao.diasAntecedencia", { valueAsNumber: true })}
                disabled={readOnly}
              />
              {errors.alertaExpiracao?.diasAntecedencia && (
                <p className="text-sm text-destructive">
                  {errors.alertaExpiracao.diasAntecedencia.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Alerta sera enviado X dias antes da cotacao expirar
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permitir Reativar Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Reativacao de Cotacoes
          </CardTitle>
          <CardDescription>
            Configure se cotacoes expiradas podem ser reativadas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="permitirReativar">Permitir reativar</Label>
              <p className="text-xs text-muted-foreground">
                Permite reativar cotacoes expiradas dentro do prazo
              </p>
            </div>
            <Switch
              id="permitirReativar"
              checked={permitirReativarHabilitado}
              onCheckedChange={(checked) =>
                setValue("permitirReativar.habilitado", checked, { shouldDirty: true })
              }
              disabled={readOnly}
            />
          </div>

          {permitirReativarHabilitado && (
            <div className="space-y-2">
              <Label htmlFor="diasMaximo">Prazo maximo (dias)</Label>
              <Input
                id="diasMaximo"
                type="number"
                min={1}
                max={90}
                className="max-w-[200px]"
                {...register("permitirReativar.diasMaximo", { valueAsNumber: true })}
                disabled={readOnly}
              />
              {errors.permitirReativar?.diasMaximo && (
                <p className="text-sm text-destructive">
                  {errors.permitirReativar.diasMaximo.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Cotacoes podem ser reativadas ate X dias apos expirar
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Links to Related Pages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Configuracoes Relacionadas
          </CardTitle>
          <CardDescription>
            Acesse outras configuracoes de cotacao
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Link href="/precos" passHref>
              <Button variant="outline" type="button" className="gap-2">
                <DollarSign className="h-4 w-4" />
                Tabela de Precos
                <ExternalLink className="h-3 w-3" />
              </Button>
            </Link>
            <Link href="/blacklist" passHref>
              <Button variant="outline" type="button" className="gap-2">
                <AlertCircle className="h-4 w-4" />
                Blacklist de Veiculos
                <ExternalLink className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Submit Section */}
      {!readOnly && (
        <div className="flex items-center justify-between">
          <div>
            {saveError && <p className="text-sm text-destructive">{saveError}</p>}
            {saveSuccess && (
              <p className="text-sm text-green-600">
                Configuracoes salvas com sucesso!
              </p>
            )}
          </div>
          <Button type="submit" disabled={isSaving || !isDirty}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar Configuracoes"
            )}
          </Button>
        </div>
      )}
    </form>
  );
}
