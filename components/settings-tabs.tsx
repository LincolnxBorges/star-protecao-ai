"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SettingsEmpresaForm } from "@/components/settings-empresa-form";
import { SettingsCotacaoForm } from "@/components/settings-cotacao-form";
import { SettingsWhatsappForm } from "@/components/settings-whatsapp-form";
import { SettingsTemplateEditor } from "@/components/settings-template-editor";
import { SettingsNotificacoesForm } from "@/components/settings-notificacoes-form";
import { SettingsSistemaForm } from "@/components/settings-sistema-form";
import {
  Building2,
  FileText,
  MessageSquare,
  Bell,
  Settings,
} from "lucide-react";
import type {
  CompanySettings,
  QuotationSettings,
  WhatsAppSettings,
  NotificationSettings,
  SystemSettings,
} from "@/lib/settings-schemas";

type TabValue = "empresa" | "cotacao" | "whatsapp" | "notificacoes" | "sistema";

interface SettingsTabsProps {
  companySettings: CompanySettings;
  quotationSettings: QuotationSettings;
  whatsappSettings: WhatsAppSettings;
  notificationSettings: NotificationSettings;
  systemSettings: SystemSettings;
  readOnly?: boolean;
}

const tabsList: { value: TabValue; label: string; icon: React.ReactNode }[] = [
  { value: "empresa", label: "Empresa", icon: <Building2 className="h-4 w-4" /> },
  { value: "cotacao", label: "Cotacao", icon: <FileText className="h-4 w-4" /> },
  { value: "whatsapp", label: "WhatsApp", icon: <MessageSquare className="h-4 w-4" /> },
  { value: "notificacoes", label: "Notificacoes", icon: <Bell className="h-4 w-4" /> },
  { value: "sistema", label: "Sistema", icon: <Settings className="h-4 w-4" /> },
];

const validTabs = new Set<string>(tabsList.map((t) => t.value));

export function SettingsTabs({
  companySettings,
  quotationSettings,
  whatsappSettings,
  notificationSettings,
  systemSettings,
  readOnly = false,
}: SettingsTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Derive active tab from URL - no state needed
  const activeTab = useMemo(() => {
    const tab = searchParams.get("tab");
    return tab && validTabs.has(tab) ? (tab as TabValue) : "empresa";
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    router.push(`/configuracoes?tab=${value}`, { scroll: false });
  };

  const saveSettings = async (category: string, data: unknown) => {
    const response = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, data }),
    });

    if (!response.ok) {
      const error = await response.json();
      toast.error("Erro ao salvar", {
        description: error.error || "Erro ao salvar configuracoes",
      });
      throw new Error(error.error || "Erro ao salvar configuracoes");
    }

    toast.success("Configuracoes salvas", {
      description: "As alteracoes foram salvas com sucesso.",
    });
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      className="w-full"
      aria-label="Configuracoes do sistema"
    >
      <TabsList
        className="mb-6 flex h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0"
        aria-label="Categorias de configuracao"
      >
        {tabsList.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="flex items-center gap-2 rounded-lg border border-transparent bg-muted px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            aria-label={`Configuracoes de ${tab.label}`}
          >
            <span aria-hidden="true">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sr-only sm:hidden">{tab.label}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="empresa" className="mt-0">
        <SettingsEmpresaForm
          initialData={companySettings}
          onSave={(data) => saveSettings("company", data)}
          readOnly={readOnly}
        />
      </TabsContent>

      <TabsContent value="cotacao" className="mt-0">
        <SettingsCotacaoForm
          initialData={quotationSettings}
          onSave={(data) => saveSettings("quotation", data)}
          readOnly={readOnly}
        />
      </TabsContent>

      <TabsContent value="whatsapp" className="mt-0">
        <div className="space-y-8">
          <SettingsWhatsappForm
            initialData={whatsappSettings}
            onSave={(data) => saveSettings("whatsapp", data)}
            readOnly={readOnly}
          />
          <SettingsTemplateEditor readOnly={readOnly} />
        </div>
      </TabsContent>

      <TabsContent value="notificacoes" className="mt-0">
        <SettingsNotificacoesForm
          initialData={notificationSettings}
          onSave={(data) => saveSettings("notification", data)}
          readOnly={readOnly}
        />
      </TabsContent>

      <TabsContent value="sistema" className="mt-0">
        <SettingsSistemaForm
          initialData={systemSettings}
          onSave={(data) => saveSettings("system", data)}
          readOnly={readOnly}
        />
      </TabsContent>
    </Tabs>
  );
}
