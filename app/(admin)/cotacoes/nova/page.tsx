/**
 * Nova Cotacao Page
 * @module app/(admin)/cotacoes/nova/page
 *
 * Pagina para criar cotacao manual no painel administrativo.
 * Segue o mesmo wizard flow da pagina publica /cotacao.
 * A cotacao criada e atribuida diretamente ao seller logado (sem round-robin).
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sellers } from "@/lib/schema";
import { CotacoesNovaForm } from "@/components/cotacoes-nova-form";
import { DashboardPageHeader } from "@/components/dashboard-page-header";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Nova Cotacao - Star Protecao",
  description: "Criar nova cotacao de protecao veicular",
};

export default async function NovaCotacaoPage() {
  // Get current user session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  // Get seller info for the logged-in user
  const [seller] = await db
    .select()
    .from(sellers)
    .where(eq(sellers.userId, session.user.id));

  if (!seller) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Nova Cotacao"
        description="Crie uma cotacao de protecao veicular para um cliente"
        actions={
          <Button variant="outline" asChild>
            <Link href="/cotacoes">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
        }
      />

      <CotacoesNovaForm sellerId={seller.id} />
    </div>
  );
}
