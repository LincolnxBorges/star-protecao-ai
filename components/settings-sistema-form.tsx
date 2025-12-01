"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Globe,
  Server,
  Eye,
  EyeOff,
  Wifi,
  CheckCircle2,
  XCircle,
  Clock,
  Database,
  FileText,
} from "lucide-react";
import {
  systemSettingsSchema,
  type SystemSettings,
} from "@/lib/settings-schemas";
import { SettingsBackupManager } from "@/components/settings-backup-manager";
import { SettingsAuditViewer } from "@/components/settings-audit-viewer";

interface SettingsSistemaFormProps {
  initialData: SystemSettings;
  onSave: (data: SystemSettings) => Promise<void>;
  readOnly?: boolean;
}

type ApiConnectionStatus = "idle" | "testing" | "connected" | "error";

interface ApiTestResult {
  status: ApiConnectionStatus;
  message?: string;
}

const timezoneOptions = [
  { value: "America/Sao_Paulo", label: "Brasilia (GMT-3)" },
  { value: "America/Manaus", label: "Manaus (GMT-4)" },
  { value: "America/Cuiaba", label: "Cuiaba (GMT-4)" },
  { value: "America/Recife", label: "Recife (GMT-3)" },
  { value: "America/Fortaleza", label: "Fortaleza (GMT-3)" },
  { value: "America/Belem", label: "Belem (GMT-3)" },
  { value: "America/Rio_Branco", label: "Rio Branco (GMT-5)" },
];

const dateFormatOptions = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY (Brasil)" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY (EUA)" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD (ISO)" },
];

const currencyOptions = [
  { value: "BRL", label: "Real (R$)" },
  { value: "USD", label: "Dolar (US$)" },
  { value: "EUR", label: "Euro (E)" },
];

const languageOptions = [
  { value: "pt-BR", label: "Portugues (Brasil)" },
  { value: "en-US", label: "English (US)" },
  { value: "es-ES", label: "Espanol" },
];

const logLevelOptions = [
  { value: "debug", label: "Debug (Detalhado)" },
  { value: "info", label: "Info (Normal)" },
  { value: "warning", label: "Warning (Avisos)" },
  { value: "error", label: "Error (Apenas erros)" },
];

export function SettingsSistemaForm({
  initialData,
  onSave,
  readOnly = false,
}: SettingsSistemaFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showWdapiKey, setShowWdapiKey] = useState(false);
  const [apiTestResults, setApiTestResults] = useState<Record<string, ApiTestResult>>({
    wdapi2: { status: "idle" },
    fipe: { status: "idle" },
    viacep: { status: "idle" },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<SystemSettings>({
    resolver: zodResolver(systemSettingsSchema),
    defaultValues: initialData,
  });

  const wdapiKey = watch("apis.wdapi2.apiKey");
  const fipeUrl = watch("apis.fipe.url");
  const viacepUrl = watch("apis.viacep.url");

  // Reset success message after 3 seconds
  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => setSaveSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess]);

  const testApiConnection = async (apiType: "wdapi2" | "fipe" | "viacep") => {
    setApiTestResults((prev) => ({
      ...prev,
      [apiType]: { status: "testing" },
    }));

    try {
      let settings: Record<string, unknown> = {};

      switch (apiType) {
        case "wdapi2":
          settings = { apiKey: wdapiKey };
          break;
        case "fipe":
          settings = { url: fipeUrl };
          break;
        case "viacep":
          settings = { url: viacepUrl };
          break;
      }

      const response = await fetch("/api/settings/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: apiType,
          settings,
        }),
      });

      const data = await response.json();

      if (data.connected) {
        setApiTestResults((prev) => ({
          ...prev,
          [apiType]: {
            status: "connected",
            message: "Conexao estabelecida com sucesso",
          },
        }));
      } else {
        setApiTestResults((prev) => ({
          ...prev,
          [apiType]: {
            status: "error",
            message: data.error || "Falha na conexao",
          },
        }));
      }
    } catch (error) {
      setApiTestResults((prev) => ({
        ...prev,
        [apiType]: {
          status: "error",
          message: error instanceof Error ? error.message : "Erro ao testar conexao",
        },
      }));
    }
  };

  const onSubmit = async (data: SystemSettings) => {
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

  const renderApiStatus = (apiType: "wdapi2" | "fipe" | "viacep") => {
    const result = apiTestResults[apiType];
    switch (result.status) {
      case "testing":
        return (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Testando...</span>
          </div>
        );
      case "connected":
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm">{result.message}</span>
          </div>
        );
      case "error":
        return (
          <div className="flex items-center gap-2 text-destructive">
            <XCircle className="h-4 w-4" />
            <span className="text-sm">{result.message}</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Regional Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Preferencias Regionais
          </CardTitle>
          <CardDescription>
            Configure formato de data, moeda e idioma do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="regional.fusoHorario">Fuso Horario</Label>
              <Select
                value={watch("regional.fusoHorario")}
                onValueChange={(value) =>
                  setValue("regional.fusoHorario", value, { shouldDirty: true })
                }
                disabled={readOnly}
              >
                <SelectTrigger id="regional.fusoHorario">
                  <SelectValue placeholder="Selecione o fuso horario" />
                </SelectTrigger>
                <SelectContent>
                  {timezoneOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="regional.formatoData">Formato de Data</Label>
              <Select
                value={watch("regional.formatoData")}
                onValueChange={(value: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD") =>
                  setValue("regional.formatoData", value, { shouldDirty: true })
                }
                disabled={readOnly}
              >
                <SelectTrigger id="regional.formatoData">
                  <SelectValue placeholder="Selecione o formato" />
                </SelectTrigger>
                <SelectContent>
                  {dateFormatOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="regional.formatoMoeda">Formato de Moeda</Label>
              <Select
                value={watch("regional.formatoMoeda")}
                onValueChange={(value: "BRL" | "USD" | "EUR") =>
                  setValue("regional.formatoMoeda", value, { shouldDirty: true })
                }
                disabled={readOnly}
              >
                <SelectTrigger id="regional.formatoMoeda">
                  <SelectValue placeholder="Selecione a moeda" />
                </SelectTrigger>
                <SelectContent>
                  {currencyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="regional.idioma">Idioma</Label>
              <Select
                value={watch("regional.idioma")}
                onValueChange={(value: "pt-BR" | "en-US" | "es-ES") =>
                  setValue("regional.idioma", value, { shouldDirty: true })
                }
                disabled={readOnly}
              >
                <SelectTrigger id="regional.idioma">
                  <SelectValue placeholder="Selecione o idioma" />
                </SelectTrigger>
                <SelectContent>
                  {languageOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* APIs Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Integracao de APIs
          </CardTitle>
          <CardDescription>
            Configure as APIs externas utilizadas pelo sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* WDAPI2 */}
          <div className="space-y-4">
            <h4 className="font-medium">WDAPI2 (Consulta Veicular)</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="apis.wdapi2.url">URL da API</Label>
                <Input
                  id="apis.wdapi2.url"
                  {...register("apis.wdapi2.url")}
                  placeholder="https://api.wdapi2.com.br"
                  disabled={readOnly}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apis.wdapi2.apiKey">API Key</Label>
                <div className="relative">
                  <Input
                    id="apis.wdapi2.apiKey"
                    type={showWdapiKey ? "text" : "password"}
                    {...register("apis.wdapi2.apiKey")}
                    placeholder="Sua API Key"
                    className="pr-10"
                    disabled={readOnly}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowWdapiKey(!showWdapiKey)}
                    disabled={readOnly}
                  >
                    {showWdapiKey ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  A API Key sera criptografada antes de salvar
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              {renderApiStatus("wdapi2")}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => testApiConnection("wdapi2")}
                disabled={!wdapiKey || apiTestResults.wdapi2.status === "testing" || readOnly}
              >
                {apiTestResults.wdapi2.status === "testing" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testando...
                  </>
                ) : (
                  <>
                    <Wifi className="mr-2 h-4 w-4" />
                    Testar
                  </>
                )}
              </Button>
            </div>
          </div>

          <Separator />

          {/* FIPE */}
          <div className="space-y-4">
            <h4 className="font-medium">FIPE (Tabela de Precos)</h4>
            <div className="space-y-2">
              <Label htmlFor="apis.fipe.url">URL da API</Label>
              <Input
                id="apis.fipe.url"
                {...register("apis.fipe.url")}
                placeholder="https://parallelum.com.br/fipe/api/v2"
                disabled={readOnly}
              />
            </div>
            <div className="flex items-center justify-between">
              {renderApiStatus("fipe")}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => testApiConnection("fipe")}
                disabled={apiTestResults.fipe.status === "testing" || readOnly}
              >
                {apiTestResults.fipe.status === "testing" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testando...
                  </>
                ) : (
                  <>
                    <Wifi className="mr-2 h-4 w-4" />
                    Testar
                  </>
                )}
              </Button>
            </div>
          </div>

          <Separator />

          {/* ViaCEP */}
          <div className="space-y-4">
            <h4 className="font-medium">ViaCEP (Consulta de Endereco)</h4>
            <div className="space-y-2">
              <Label htmlFor="apis.viacep.url">URL da API</Label>
              <Input
                id="apis.viacep.url"
                {...register("apis.viacep.url")}
                placeholder="https://viacep.com.br/ws"
                disabled={readOnly}
              />
            </div>
            <div className="flex items-center justify-between">
              {renderApiStatus("viacep")}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => testApiConnection("viacep")}
                disabled={apiTestResults.viacep.status === "testing" || readOnly}
              >
                {apiTestResults.viacep.status === "testing" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testando...
                  </>
                ) : (
                  <>
                    <Wifi className="mr-2 h-4 w-4" />
                    Testar
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backup Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Configuracao de Backup
          </CardTitle>
          <CardDescription>
            Configure backup automatico e politica de retencao
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="backup.automaticoHabilitado">
                Backup Automatico
              </Label>
              <p className="text-sm text-muted-foreground">
                Realiza backup diario automatico
              </p>
            </div>
            <Switch
              id="backup.automaticoHabilitado"
              checked={watch("backup.automaticoHabilitado")}
              onCheckedChange={(checked) =>
                setValue("backup.automaticoHabilitado", checked, {
                  shouldDirty: true,
                })
              }
              disabled={readOnly}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="backup.horario" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Horario do Backup
              </Label>
              <Input
                id="backup.horario"
                type="time"
                {...register("backup.horario")}
                disabled={readOnly}
              />
              <p className="text-xs text-muted-foreground">
                Horario em que o backup sera executado
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="backup.retencaoDias">Retencao (dias)</Label>
              <Input
                id="backup.retencaoDias"
                type="number"
                {...register("backup.retencaoDias", { valueAsNumber: true })}
                min={1}
                max={365}
                disabled={readOnly}
              />
              {errors.backup?.retencaoDias && (
                <p className="text-sm text-destructive">
                  {errors.backup.retencaoDias.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Numero de dias para manter os backups
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Configuracao de Logs
          </CardTitle>
          <CardDescription>
            Configure o nivel de detalhamento e retencao dos logs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="logs.nivel">Nivel de Log</Label>
              <Select
                value={watch("logs.nivel")}
                onValueChange={(value: "debug" | "info" | "warning" | "error") =>
                  setValue("logs.nivel", value, { shouldDirty: true })
                }
                disabled={readOnly}
              >
                <SelectTrigger id="logs.nivel">
                  <SelectValue placeholder="Selecione o nivel" />
                </SelectTrigger>
                <SelectContent>
                  {logLevelOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Nivel minimo de logs a serem registrados
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logs.retencaoDias">Retencao (dias)</Label>
              <Input
                id="logs.retencaoDias"
                type="number"
                {...register("logs.retencaoDias", { valueAsNumber: true })}
                min={1}
                max={365}
                disabled={readOnly}
              />
              {errors.logs?.retencaoDias && (
                <p className="text-sm text-destructive">
                  {errors.logs.retencaoDias.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Numero de dias para manter os logs
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Section for Settings Form */}
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

    {/* Backup Manager (outside form) */}
    <SettingsBackupManager />

    {/* Audit Log Viewer */}
    <SettingsAuditViewer />
    </div>
  );
}
