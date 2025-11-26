import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import { getSellerByUserId } from "@/lib/sellers";
import { AdminBlacklistTable } from "@/components/admin-blacklist-table";

export const metadata = {
  title: "Blacklist - Star Protecao",
  description: "Gestao de marcas e modelos bloqueados",
};

export default async function BlacklistPage() {
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
        <h1 className="text-2xl font-bold">Blacklist</h1>
        <p className="text-muted-foreground">
          Gerencie marcas e modelos que nao sao aceitos para cotacao
        </p>
      </div>

      <AdminBlacklistTable />
    </div>
  );
}
