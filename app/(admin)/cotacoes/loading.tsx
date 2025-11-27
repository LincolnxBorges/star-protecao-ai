/**
 * Cotacoes List Loading State
 * @module app/(admin)/cotacoes/loading
 *
 * Skeleton loading state for quotations list page.
 */

import { Skeleton } from "@/components/ui/skeleton";

export default function CotacoesListLoading() {
  return (
    <div className="space-y-4">
      {/* Page title skeleton */}
      <Skeleton className="h-8 w-48" />

      {/* Status tabs skeleton */}
      <div className="flex gap-2 overflow-x-auto">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 shrink-0" />
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

      {/* Count and items per page skeleton */}
      <div className="flex items-center justify-between">
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
      <div className="hidden lg:block border rounded-md">
        <div className="space-y-2 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>

      {/* Pagination skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
    </div>
  );
}
