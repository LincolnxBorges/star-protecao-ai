import { AdminQuotationsList } from "@/components/admin-quotations-list";

export const metadata = {
  title: "Cotacoes - Star Protecao",
  description: "Lista de cotacoes de protecao veicular",
};

export default function QuotationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cotacoes</h1>
        <p className="text-muted-foreground">
          Gerencie as cotacoes de protecao veicular
        </p>
      </div>

      <AdminQuotationsList />
    </div>
  );
}
