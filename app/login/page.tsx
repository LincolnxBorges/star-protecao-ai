import { LoginForm } from "@/components/login-form";
import { LoginHeader } from "@/components/login-header";
import { LoginFooter } from "@/components/login-footer";
import { getSettings } from "@/lib/settings";
import type { CompanySettings } from "@/lib/settings-schemas";

export default async function LoginPage() {
  const companySettings = await getSettings<CompanySettings>("company");
  const companyName = companySettings.nomeFantasia || companySettings.nome;

  return (
    <div className="min-h-svh flex flex-col bg-background">
      <LoginHeader
        companyName={companyName}
        logo={companySettings.logo}
        whatsapp={companySettings.whatsappComercial}
      />

      <main className="flex-1 flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <LoginForm />
        </div>
      </main>

      <LoginFooter
        companyName={companyName}
        phone={companySettings.telefonePrincipal}
        email={companySettings.email}
      />
    </div>
  );
}
