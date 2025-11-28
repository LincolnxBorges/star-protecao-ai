"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Loader2, MessageSquare, Key, Server, Wifi, Eye, EyeOff } from "lucide-react";
import { SettingsConnectionStatus } from "@/components/settings-connection-status";
import {
  whatsappSettingsSchema,
  type WhatsAppSettings,
} from "@/lib/settings-schemas";

interface SettingsWhatsappFormProps {
  initialData: WhatsAppSettings;
  onSave: (data: WhatsAppSettings) => Promise<void>;
}

type ConnectionStatus = "connected" | "disconnected" | "error" | "testing" | "unknown";

const providerOptions = [
  { value: "evolution", label: "Evolution API", description: "API open-source auto-hospedada" },
  { value: "zapi", label: "Z-API", description: "Servico de API WhatsApp" },
  { value: "baileys", label: "Baileys", description: "Biblioteca Node.js (nao disponivel)" },
];

export function SettingsWhatsappForm({
  initialData,
  onSave,
}: SettingsWhatsappFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    initialData.status || "unknown"
  );
  const [connectionMessage, setConnectionMessage] = useState<string | undefined>();
  const [instanceInfo, setInstanceInfo] = useState<{
    name?: string;
    number?: string;
    status?: string;
  } | undefined>();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<WhatsAppSettings>({
    resolver: zodResolver(whatsappSettingsSchema),
    defaultValues: initialData,
  });

  const provider = watch("provider");
  const apiUrl = watch("apiUrl");
  const apiKey = watch("apiKey");
  const instanceName = watch("instanceName");

  // Reset success message after 3 seconds
  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => setSaveSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess]);

  const testConnection = async () => {
    setIsTesting(true);
    setConnectionStatus("testing");
    setConnectionMessage(undefined);
    setInstanceInfo(undefined);

    try {
      const response = await fetch("/api/settings/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "whatsapp",
          settings: {
            provider,
            apiUrl,
            apiKey,
            instanceName,
          },
        }),
      });

      const data = await response.json();

      if (data.connected) {
        setConnectionStatus("connected");
        setInstanceInfo(data.instanceInfo);
        // Update status in form
        setValue("status", "connected", { shouldDirty: true });
        setValue("lastSync", new Date().toISOString(), { shouldDirty: true });
      } else {
        setConnectionStatus(data.status || "error");
        setConnectionMessage(data.error);
        setValue("status", data.status || "error", { shouldDirty: true });
      }
    } catch (error) {
      setConnectionStatus("error");
      setConnectionMessage(
        error instanceof Error ? error.message : "Erro ao testar conexao"
      );
      setValue("status", "error", { shouldDirty: true });
    } finally {
      setIsTesting(false);
    }
  };

  const onSubmit = async (data: WhatsAppSettings) => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // API Key will be encrypted server-side in lib/settings.ts
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

  const getProviderPlaceholders = () => {
    switch (provider) {
      case "evolution":
        return {
          apiUrl: "https://sua-instancia.evolution-api.com",
          apiKey: "Sua API Key da Evolution",
          instanceName: "Nome da instancia (ex: star-protecao)",
        };
      case "zapi":
        return {
          apiUrl: "https://api.z-api.io/instances/SUA_INSTANCIA/token/SEU_TOKEN",
          apiKey: "Client-Token da Z-API",
          instanceName: "ID da instancia Z-API",
        };
      default:
        return {
          apiUrl: "URL da API",
          apiKey: "API Key",
          instanceName: "Nome da instancia",
        };
    }
  };

  const placeholders = getProviderPlaceholders();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Provider Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Provedor WhatsApp
          </CardTitle>
          <CardDescription>
            Selecione o provedor de API WhatsApp que voce utiliza
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="provider">Provedor *</Label>
            <Select
              value={provider}
              onValueChange={(value) =>
                setValue("provider", value as WhatsAppSettings["provider"], {
                  shouldDirty: true,
                })
              }
            >
              <SelectTrigger id="provider">
                <SelectValue placeholder="Selecione o provedor" />
              </SelectTrigger>
              <SelectContent>
                {providerOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    disabled={option.value === "baileys"}
                  >
                    <div className="flex flex-col">
                      <span>{option.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Configuracao da API
          </CardTitle>
          <CardDescription>
            Configure as credenciais de acesso a API do {provider === "evolution" ? "Evolution" : provider === "zapi" ? "Z-API" : "provedor"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiUrl">URL da API</Label>
            <Input
              id="apiUrl"
              {...register("apiUrl")}
              placeholder={placeholders.apiUrl}
            />
            {errors.apiUrl && (
              <p className="text-sm text-destructive">{errors.apiUrl.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              API Key
            </Label>
            <div className="relative">
              <Input
                id="apiKey"
                type={showApiKey ? "text" : "password"}
                {...register("apiKey")}
                placeholder={placeholders.apiKey}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {errors.apiKey && (
              <p className="text-sm text-destructive">{errors.apiKey.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              A API Key sera criptografada antes de salvar
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="instanceName">Nome da Instancia</Label>
            <Input
              id="instanceName"
              {...register("instanceName")}
              placeholder={placeholders.instanceName}
            />
            {errors.instanceName && (
              <p className="text-sm text-destructive">
                {errors.instanceName.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            Status da Conexao
          </CardTitle>
          <CardDescription>
            Verifique se a conexao com o WhatsApp esta funcionando
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingsConnectionStatus
            status={connectionStatus}
            message={connectionMessage}
            instanceInfo={instanceInfo}
          />

          <Button
            type="button"
            variant="outline"
            onClick={testConnection}
            disabled={isTesting || !apiUrl || !apiKey}
          >
            {isTesting ? (
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
        </CardContent>
      </Card>

      {/* Submit Section */}
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
    </form>
  );
}
