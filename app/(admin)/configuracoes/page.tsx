import { Suspense } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Settings, Eye } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sellers } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { SettingsTabs } from "@/components/settings-tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  getSettings,
  initializeDefaultSettings,
  initializeDefaultTemplates,
} from "@/lib/settings";
import type {
  CompanySettings,
  QuotationSettings,
  WhatsAppSettings,
  NotificationSettings,
  SystemSettings,
} from "@/lib/settings-schemas";
import {
  defaultCompanySettings,
  defaultQuotationSettings,
  defaultWhatsappSettings,
  defaultNotificationSettings,
  defaultSystemSettings,
} from "@/lib/settings-schemas";

export const dynamic = "force-dynamic";

async function SettingsContent() {
  // Get session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  // Get seller info
  const [seller] = await db
    .select()
    .from(sellers)
    .where(eq(sellers.userId, session.user.id));

  if (!seller) {
    redirect("/login");
  }

  const isAdmin = seller.role === "ADMIN";

  // Initialize default settings and templates if not present
  await initializeDefaultSettings();
  await initializeDefaultTemplates();

  // Load all settings
  const [
    companySettings,
    quotationSettings,
    whatsappSettings,
    notificationSettings,
    systemSettings,
  ] = await Promise.all([
    getSettings<CompanySettings>("company").catch(() => defaultCompanySettings),
    getSettings<QuotationSettings>("quotation").catch(() => defaultQuotationSettings),
    getSettings<WhatsAppSettings>("whatsapp").catch(() => defaultWhatsappSettings),
    getSettings<NotificationSettings>("notification").catch(() => defaultNotificationSettings),
    getSettings<SystemSettings>("system").catch(() => defaultSystemSettings),
  ]);

  return (
    <>
      {!isAdmin && (
        <Alert className="mb-6">
          <Eye className="h-4 w-4" />
          <AlertDescription>
            Voce esta visualizando as configuracoes em modo somente leitura.
            Apenas administradores podem editar.
          </AlertDescription>
        </Alert>
      )}
      <SettingsTabs
        companySettings={companySettings}
        quotationSettings={quotationSettings}
        whatsappSettings={whatsappSettings}
        notificationSettings={notificationSettings}
        systemSettings={systemSettings}
        readOnly={!isAdmin}
      />
    </>
  );
}

function SettingsLoading() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Carregando configuracoes...</p>
      </div>
    </div>
  );
}

export default function ConfiguracoesPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configuracoes</h1>
          <p className="text-muted-foreground">
            Gerencie as configuracoes do sistema
          </p>
        </div>
      </div>

      {/* Content */}
      <Suspense fallback={<SettingsLoading />}>
        <SettingsContent />
      </Suspense>
    </div>
  );
}
