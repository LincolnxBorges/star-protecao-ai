/**
 * Public Layout
 * @module app/(public)/layout
 *
 * Layout para paginas publicas com Header e Footer da empresa.
 * Busca configuracoes da empresa do banco de dados.
 */

import { CotacaoHeader } from "@/components/cotacao-header";
import { CotacaoFooter } from "@/components/cotacao-footer";
import { getSettings } from "@/lib/settings";
import type { CompanySettings } from "@/lib/settings-schemas";

// Force dynamic rendering (accesses database)
export const dynamic = "force-dynamic";

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default async function PublicLayout({ children }: PublicLayoutProps) {
  // Fetch company settings from database
  const companySettings = await getSettings<CompanySettings>("company");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <CotacaoHeader
        companyName={companySettings.nomeFantasia || companySettings.nome}
        logo={companySettings.logo}
        phone={companySettings.telefonePrincipal}
        whatsapp={companySettings.whatsappComercial}
      />

      <main className="flex-1">
        {children}
      </main>

      <CotacaoFooter
        companyName={companySettings.nomeFantasia || companySettings.nome}
        cnpj={companySettings.cnpj}
        email={companySettings.email}
        phone={companySettings.telefonePrincipal}
        whatsapp={companySettings.whatsappComercial}
        address={companySettings.endereco}
      />
    </div>
  );
}
