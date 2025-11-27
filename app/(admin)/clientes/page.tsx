import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { sellers } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { listClients, getClientKPIs, getDistinctCities, listSellers } from "@/lib/clients";
import { ClientsList } from "@/components/clients-list";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { ClientsKpiCardsSkeleton } from "@/components/clients-kpi-cards";
import { ClientsTableSkeleton } from "@/components/clients-table";
import type { ClientFilters, ClientStatus } from "@/lib/types/clients";

export const metadata = {
  title: "Clientes - Star Protecao",
  description: "Gestao de clientes e base de contatos",
};

interface PageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    status?: string;
    city?: string;
    dateFrom?: string;
    dateTo?: string;
    sellerId?: string;
    orderBy?: string;
    orderDir?: string;
  }>;
}

function ClientsListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>

      {/* KPI Cards Skeleton */}
      <ClientsKpiCardsSkeleton />

      {/* Results Card Skeleton */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Search and Filters skeleton */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Skeleton className="h-10 flex-1" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-10 w-[140px]" />
              <Skeleton className="h-10 w-[140px]" />
              <Skeleton className="h-10 w-[160px]" />
              <Skeleton className="h-10 w-[120px]" />
            </div>
          </div>

          {/* Header skeleton */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-[150px]" />
            <Skeleton className="h-9 w-[100px]" />
          </div>

          {/* Table skeleton (desktop) */}
          <div className="hidden lg:block">
            <ClientsTableSkeleton rows={10} />
          </div>

          {/* Cards skeleton (mobile) */}
          <div className="lg:hidden space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-20 rounded-full" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-12" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="space-y-1 text-center">
                      <Skeleton className="h-3 w-12 mx-auto" />
                      <Skeleton className="h-4 w-8 mx-auto" />
                    </div>
                    <div className="space-y-1 text-right">
                      <Skeleton className="h-3 w-16 ml-auto" />
                      <Skeleton className="h-4 w-20 ml-auto" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex gap-1">
                      <Skeleton className="h-7 w-7 rounded" />
                      <Skeleton className="h-7 w-7 rounded" />
                      <Skeleton className="h-7 w-7 rounded" />
                      <Skeleton className="h-7 w-7 rounded" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

async function ClientsContent({ searchParams }: PageProps) {
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

  // Parse search params
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const limit = parseInt(params.limit || "10", 10);
  const search = params.search || undefined;
  const city = params.city || undefined;
  const dateFrom = params.dateFrom ? new Date(params.dateFrom) : undefined;
  const dateTo = params.dateTo ? new Date(params.dateTo) : undefined;
  const sellerId = isAdmin ? params.sellerId : undefined;
  const orderBy = (params.orderBy as ClientFilters["orderBy"]) || "name";
  const orderDir = (params.orderDir as "asc" | "desc") || "asc";

  // Parse status filter (can be comma-separated)
  let status: ClientStatus[] | undefined;
  if (params.status) {
    status = params.status.split(",") as ClientStatus[];
  }

  // Build filters
  const filters: ClientFilters = {
    page,
    limit,
    search,
    status,
    city,
    dateFrom,
    dateTo,
    sellerId,
    orderBy,
    orderDir,
  };

  // Fetch data in parallel
  const [data, kpis, cities, sellersList] = await Promise.all([
    listClients(seller.id, isAdmin, filters),
    getClientKPIs(seller.id, isAdmin),
    getDistinctCities(seller.id, isAdmin),
    isAdmin ? listSellers() : Promise.resolve([]),
  ]);

  return (
    <ClientsList
      initialData={data}
      initialFilters={filters}
      initialKPIs={kpis}
      cities={cities}
      isAdmin={isAdmin}
      sellers={sellersList}
    />
  );
}

export default function ClientesPage(props: PageProps) {
  return (
    <Suspense fallback={<ClientsListSkeleton />}>
      <ClientsContent {...props} />
    </Suspense>
  );
}
