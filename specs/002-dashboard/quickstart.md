# Quickstart: Dashboard do Vendedor

**Feature**: 002-dashboard
**Date**: 2025-11-26

## Prerequisites

- Node.js 18+
- PostgreSQL database running
- Project dependencies installed (`npm install`)
- Database migrated (`npm run db:migrate`)

## Quick Setup

### 1. Install Additional shadcn Components

```bash
npx shadcn@latest add progress
npx shadcn@latest add sheet
npx shadcn@latest add tooltip
```

### 2. Create Database Migration for Goals

```bash
# After adding sellerGoals to lib/schema.ts
npm run db:generate
npm run db:migrate
```

### 3. Seed Test Data (Optional)

```bash
npm run db:seed
```

## File Structure to Create

```
app/
└── (admin)/
    └── dashboard/
        └── page.tsx

lib/
└── dashboard.ts

components/
├── dashboard-kpi-cards.tsx
├── dashboard-urgent-alerts.tsx
├── dashboard-quotations-list.tsx
├── dashboard-status-chart.tsx
├── dashboard-ranking.tsx
├── dashboard-goal-progress.tsx
├── dashboard-greeting.tsx
├── dashboard-period-filter.tsx
├── dashboard-sidebar.tsx
├── dashboard-contact-confirm.tsx
└── dashboard-polling-wrapper.tsx
```

## Implementation Order

### Phase 1: Foundation (P1 Features)

1. **lib/dashboard.ts** - Módulo de contexto com funções de negócio
2. **app/(admin)/dashboard/page.tsx** - Server Component principal
3. **dashboard-kpi-cards.tsx** - Cards de KPI (US1)
4. **dashboard-urgent-alerts.tsx** - Alertas urgentes (US2)
5. **dashboard-quotations-list.tsx** - Lista de cotações (US3)

### Phase 2: Analytics (P2 Features)

6. **dashboard-status-chart.tsx** - Gráfico de status (US4)
7. **dashboard-ranking.tsx** - Ranking de vendedores (US5)
8. **dashboard-goal-progress.tsx** - Progresso de meta (US6)

### Phase 3: UX Polish (P3 Features)

9. **dashboard-greeting.tsx** - Saudação personalizada (US7)
10. **dashboard-period-filter.tsx** - Filtro de período (US7)
11. **dashboard-sidebar.tsx** - Sidebar de navegação (US8)
12. **dashboard-polling-wrapper.tsx** - Auto-refresh

## Key Code Patterns

### Server Component Page

```tsx
// app/(admin)/dashboard/page.tsx
import { getDashboardData } from "@/lib/dashboard"
import { auth } from "@/lib/auth-server"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const data = await getDashboardData(session.user.sellerId, "today")

  return (
    <DashboardPollingWrapper>
      <DashboardGreeting name={data.user.name} />
      <DashboardKpiCards kpis={data.kpis} />
      <DashboardUrgentAlerts alerts={data.urgentAlerts} />
      <DashboardQuotationsList quotations={data.recentQuotations} />
      {/* ... */}
    </DashboardPollingWrapper>
  )
}
```

### Context Module Pattern

```tsx
// lib/dashboard.ts
import { db } from "@/lib/db"
import { quotations, sellers, customers, vehicles } from "@/lib/schema"
import { eq, and, gte, lte, count, sql } from "drizzle-orm"

export async function getKpis(sellerId: string, period: PeriodFilter) {
  const range = getPeriodRange(period)

  const [pending] = await db
    .select({ count: count() })
    .from(quotations)
    .where(
      and(
        eq(quotations.sellerId, sellerId),
        eq(quotations.status, "PENDING"),
        gte(quotations.createdAt, range.start),
        lte(quotations.createdAt, range.end)
      )
    )

  // ... other KPI queries

  return { pending, accepted, potential, conversion }
}
```

### Client Component for Interactivity

```tsx
// components/dashboard-period-filter.tsx
"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function DashboardPeriodFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const period = searchParams.get("period") || "today"

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams)
    params.set("period", value)
    router.push(`/dashboard?${params.toString()}`)
  }

  return (
    <Select value={period} onValueChange={handleChange}>
      <SelectTrigger className="w-[140px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="today">Hoje</SelectItem>
        <SelectItem value="week">Esta semana</SelectItem>
        <SelectItem value="month">Este mês</SelectItem>
      </SelectContent>
    </Select>
  )
}
```

### Server Action for Contact Confirmation

```tsx
// app/(admin)/dashboard/actions.ts
"use server"

import { markAsContacted } from "@/lib/dashboard"
import { revalidatePath } from "next/cache"

export async function confirmContactAction(quotationId: string) {
  await markAsContacted(quotationId)
  revalidatePath("/dashboard")
  return { success: true }
}
```

## Testing Commands

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Run specific test file
npm run test -- dashboard.test.ts
```

## Development Workflow

1. Start dev server: `npm run dev`
2. Open http://localhost:3000/dashboard
3. Login with test credentials
4. Verify KPIs, alerts, and quotation list
5. Test contact flow (ligar → confirmar)
6. Verify polling (changes every 60s)

## Common Issues

### "Seller not found"
Ensure the logged-in user has a corresponding `sellers` record linked via `userId`.

### "No quotations displayed"
Check that quotations have `sellerId` matching the current seller and are within the selected period.

### "Goals widget shows 'not defined'"
Create a `seller_goals` record for the current month/year for the seller.
