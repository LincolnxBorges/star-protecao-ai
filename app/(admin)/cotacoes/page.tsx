import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { CotacoesList } from "@/components/cotacoes-list";
import { DashboardPageHeader } from "@/components/dashboard-page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const metadata = {
  title: "Cotacoes - Star Protecao",
  description: "Lista de cotacoes de protecao veicular",
};

function CotacoesListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Filters Card Skeleton */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-5 w-16" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status tabs skeleton */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-28 shrink-0 rounded-full" />
            ))}
          </div>

          {/* Search skeleton */}
          <Skeleton className="h-10 w-full" />

          {/* Filters skeleton */}
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-36" />
            <Skeleton className="h-9 w-40" />
          </div>
        </CardContent>
      </Card>

      {/* Results Card Skeleton */}
      <Card>
        <CardContent className="pt-6">
          {/* Count and items per page skeleton */}
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-5 w-[150px]" />
            <Skeleton className="h-9 w-[100px]" />
          </div>

          {/* Mobile: Card skeletons */}
          <div className="lg:hidden space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-9 flex-1" />
                  <Skeleton className="h-9 flex-1" />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Table skeleton */}
          <div className="hidden lg:block border rounded-lg overflow-hidden">
            <div className="bg-muted/50 p-3">
              <div className="flex gap-4">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 flex-1" />
                ))}
              </div>
            </div>
            <div className="divide-y">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function QuotationsPage() {
  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Cotacoes"
        description="Gerencie as cotacoes de protecao veicular"
        actions={
          <Button asChild>
            <Link href="/cotacoes/nova">
              <Plus className="h-4 w-4 mr-2" />
              Nova Cotacao
            </Link>
          </Button>
        }
      />

      <Suspense fallback={<CotacoesListSkeleton />}>
        <CotacoesList />
      </Suspense>
    </div>
  );
}
