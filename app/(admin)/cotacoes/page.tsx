import { Suspense } from "react";
import { CotacoesList } from "@/components/cotacoes-list";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Cotacoes - Star Protecao",
  description: "Lista de cotacoes de protecao veicular",
};

function CotacoesListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-[200px]" />
        <Skeleton className="h-10 w-[100px]" />
      </div>
      <div className="border rounded-md">
        <div className="space-y-2 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function QuotationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cotacoes</h1>
        <p className="text-muted-foreground">
          Gerencie as cotacoes de protecao veicular
        </p>
      </div>

      <Suspense fallback={<CotacoesListSkeleton />}>
        <CotacoesList />
      </Suspense>
    </div>
  );
}
