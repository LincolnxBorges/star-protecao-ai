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
  Mail,
  MessageSquare,
  Bell,
  Server,
  Eye,
  EyeOff,
  Wifi,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import {
  notificationSettingsSchema,
  type NotificationSettings,
} from "@/lib/settings-schemas";
import { smtpPresets, type SmtpPresetName } from "@/lib/integrations/smtp-presets";

interface SettingsNotificacoesFormProps {
  initialData: NotificationSettings;
  onSave: (data: NotificationSettings) => Promise<void>;
  readOnly?: boolean;
}

type SmtpConnectionStatus = "idle" | "testing" | "connected" | "error";

interface SmtpTestResult {
  status: SmtpConnectionStatus;
  message?: string;
}

const smtpPresetOptions: { value: SmtpPresetName | "custom"; label: string }[] = [
  { value: "custom", label: "Personalizado" },
  { value: "gmail", label: "Gmail" },
  { value: "outlook", label: "Outlook" },
  { value: "office365", label: "Office 365" },
  { value: "yahoo", label: "Yahoo" },
  { value: "sendgrid", label: "SendGrid" },
  { value: "mailgun", label: "Mailgun" },
  { value: "ses", label: "Amazon SES" },
];

const emailEventLabels = {
  novaCotacaoCriada: "Nova cotacao criada",
  cotacaoAceita: "Cotacao aceita",
  cotacaoExpirando: "Cotacao expirando",
  cotacaoExpirada: "Cotacao expirada",
  resumoDiario: "Resumo diario",
  resumoSemanal: "Resumo semanal",
};

const whatsappEventLabels = {
  novoLead: "Novo lead",
  cotacaoAceita: "Cotacao aceita",
  cotacaoExpirando: "Cotacao expirando",
  resumoDiario: "Resumo diario",
};

export function SettingsNotificacoesForm({
  initialData,
  onSave,
  readOnly = false,
}: SettingsNotificacoesFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [smtpPreset, setSmtpPreset] = useState<SmtpPresetName | "custom">("custom");
  const [smtpTestResult, setSmtpTestResult] = useState<SmtpTestResult>({
    status: "idle",
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<NotificationSettings>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: initialData,
  });

  const smtpServer = watch("smtp.server");
  const smtpPort = watch("smtp.port");
  const smtpUser = watch("smtp.user");
  const smtpPassword = watch("smtp.password");
  const smtpUseTls = watch("smtp.useTls");

  // Reset success message after 3 seconds
  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => setSaveSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess]);

  const handlePresetChange = (preset: SmtpPresetName | "custom") => {
    setSmtpPreset(preset);
    if (preset !== "custom" && preset in smtpPresets) {
      const presetConfig = smtpPresets[preset];
      setValue("smtp.server", presetConfig.server, { shouldDirty: true });
      setValue("smtp.port", presetConfig.port, { shouldDirty: true });
      setValue("smtp.useTls", presetConfig.useTls, { shouldDirty: true });
    }
  };

  const testSmtpConnection = async () => {
    setSmtpTestResult({ status: "testing" });

    try {
      const response = await fetch("/api/settings/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "smtp",
          settings: {
            server: smtpServer,
            port: smtpPort,
            user: smtpUser,
            password: smtpPassword,
            useTls: smtpUseTls,
          },
        }),
      });

      const data = await response.json();

      if (data.connected) {
        setSmtpTestResult({
          status: "connected",
          message: "Conexao SMTP estabelecida com sucesso",
        });
      } else {
        setSmtpTestResult({
          status: "error",
          message: data.error || "Falha na conexao SMTP",
        });
      }
    } catch (error) {
      setSmtpTestResult({
        status: "error",
        message: error instanceof Error ? error.message : "Erro ao testar conexao",
      });
    }
  };

  const onSubmit = async (data: NotificationSettings) => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // Password will be encrypted server-side
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

  const renderSmtpStatus = () => {
    switch (smtpTestResult.status) {
      case "testing":
        return (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Testando conexao...</span>
          </div>
        );
      case "connected":
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span>{smtpTestResult.message}</span>
          </div>
        );
      case "error":
        return (
          <div className="flex items-center gap-2 text-destructive">
            <XCircle className="h-4 w-4" />
            <span>{smtpTestResult.message}</span>
          </div>
        );
      default:
        return null;
    }
  };

  const canTestSmtp = smtpServer && smtpPort && smtpUser && smtpPassword;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* SMTP Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Servidor SMTP
          </CardTitle>
          <CardDescription>
            Configure o servidor de email para envio de notificacoes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="smtpPreset">Provedor</Label>
            <Select value={smtpPreset} onValueChange={handlePresetChange} disabled={readOnly}>
              <SelectTrigger id="smtpPreset">
                <SelectValue placeholder="Selecione um provedor" />
              </SelectTrigger>
              <SelectContent>
                {smtpPresetOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="smtp.server">Servidor SMTP</Label>
              <Input
                id="smtp.server"
                {...register("smtp.server")}
                placeholder="smtp.exemplo.com"
                disabled={readOnly}
              />
              {errors.smtp?.server && (
                <p className="text-sm text-destructive">
                  {errors.smtp.server.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtp.port">Porta</Label>
              <Input
                id="smtp.port"
                type="number"
                {...register("smtp.port", { valueAsNumber: true })}
                placeholder="587"
                disabled={readOnly}
              />
              {errors.smtp?.port && (
                <p className="text-sm text-destructive">
                  {errors.smtp.port.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="smtp.user">Usuario</Label>
              <Input
                id="smtp.user"
                {...register("smtp.user")}
                placeholder="usuario@exemplo.com"
                disabled={readOnly}
              />
              {errors.smtp?.user && (
                <p className="text-sm text-destructive">
                  {errors.smtp.user.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtp.password">Senha</Label>
              <div className="relative">
                <Input
                  id="smtp.password"
                  type={showPassword ? "text" : "password"}
                  {...register("smtp.password")}
                  placeholder="Senha do email"
                  className="pr-10"
                  disabled={readOnly}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={readOnly}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {errors.smtp?.password && (
                <p className="text-sm text-destructive">
                  {errors.smtp.password.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                A senha sera criptografada antes de salvar
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                id="smtp.useTls"
                checked={smtpUseTls}
                onCheckedChange={(checked) =>
                  setValue("smtp.useTls", checked, { shouldDirty: true })
                }
                disabled={readOnly}
              />
              <Label htmlFor="smtp.useTls" className="cursor-pointer">
                Usar TLS/SSL
              </Label>
            </div>
          </div>

          <Separator />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>{renderSmtpStatus()}</div>
            <Button
              type="button"
              variant="outline"
              onClick={testSmtpConnection}
              disabled={!canTestSmtp || smtpTestResult.status === "testing" || readOnly}
            >
              {smtpTestResult.status === "testing" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testando...
                </>
              ) : (
                <>
                  <Wifi className="mr-2 h-4 w-4" />
                  Testar Conexao
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Email Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Notificacoes por Email
          </CardTitle>
          <CardDescription>
            Selecione quais eventos devem gerar notificacoes por email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {Object.entries(emailEventLabels).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between">
                <Label
                  htmlFor={`emailEvents.${key}`}
                  className="cursor-pointer"
                >
                  {label}
                </Label>
                <Switch
                  id={`emailEvents.${key}`}
                  checked={watch(`emailEvents.${key as keyof NotificationSettings["emailEvents"]}`)}
                  onCheckedChange={(checked) =>
                    setValue(
                      `emailEvents.${key as keyof NotificationSettings["emailEvents"]}`,
                      checked,
                      { shouldDirty: true }
                    )
                  }
                  disabled={readOnly}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* WhatsApp Vendedor Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Notificacoes WhatsApp (Vendedor)
          </CardTitle>
          <CardDescription>
            Notificacoes enviadas aos vendedores via WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-3">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Configure a integracao WhatsApp na aba WhatsApp para habilitar estas notificacoes
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {Object.entries(whatsappEventLabels).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between">
                <Label
                  htmlFor={`whatsappVendedor.${key}`}
                  className="cursor-pointer"
                >
                  {label}
                </Label>
                <Switch
                  id={`whatsappVendedor.${key}`}
                  checked={watch(`whatsappVendedor.${key as keyof NotificationSettings["whatsappVendedor"]}`)}
                  onCheckedChange={(checked) =>
                    setValue(
                      `whatsappVendedor.${key as keyof NotificationSettings["whatsappVendedor"]}`,
                      checked,
                      { shouldDirty: true }
                    )
                  }
                  disabled={readOnly}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificacoes do Sistema
          </CardTitle>
          <CardDescription>
            Configure o comportamento das notificacoes no sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="sistema.tempoReal" className="cursor-pointer">
                Notificacoes em tempo real
              </Label>
              <Switch
                id="sistema.tempoReal"
                checked={watch("sistema.tempoReal")}
                onCheckedChange={(checked) =>
                  setValue("sistema.tempoReal", checked, { shouldDirty: true })
                }
                disabled={readOnly}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="sistema.tocarSom" className="cursor-pointer">
                Tocar som ao receber
              </Label>
              <Switch
                id="sistema.tocarSom"
                checked={watch("sistema.tocarSom")}
                onCheckedChange={(checked) =>
                  setValue("sistema.tocarSom", checked, { shouldDirty: true })
                }
                disabled={readOnly}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="sistema.mostrarBadge" className="cursor-pointer">
                Mostrar badge de contagem
              </Label>
              <Switch
                id="sistema.mostrarBadge"
                checked={watch("sistema.mostrarBadge")}
                onCheckedChange={(checked) =>
                  setValue("sistema.mostrarBadge", checked, { shouldDirty: true })
                }
                disabled={readOnly}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="sistema.diasAutoLida">
              Marcar como lida automaticamente apos (dias)
            </Label>
            <Input
              id="sistema.diasAutoLida"
              type="number"
              {...register("sistema.diasAutoLida", { valueAsNumber: true })}
              className="w-32"
              min={1}
              max={30}
              disabled={readOnly}
            />
            {errors.sistema?.diasAutoLida && (
              <p className="text-sm text-destructive">
                {errors.sistema.diasAutoLida.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Notificacoes serao marcadas como lidas automaticamente apos este periodo
            </p>
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
