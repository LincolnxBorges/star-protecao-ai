import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import { getSellerByUserId } from "@/lib/sellers";
import { AdminPricingTable } from "@/components/admin-pricing-table";

export const metadata = {
  title: "Tabela de Precos - Star Protecao",
  description: "Gestao de regras de preco por categoria",
};

export default async function PricingPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const seller = await getSellerByUserId(session.user.id);

  if (!seller || seller.role !== "ADMIN") {
    redirect("/cotacoes");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tabela de Precos</h1>
        <p className="text-muted-foreground">
          Gerencie as faixas de preco por categoria de veiculo
        </p>
      </div>

      <AdminPricingTable />
    </div>
  );
}
