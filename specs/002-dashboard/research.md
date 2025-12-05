# Research: Dashboard do Vendedor

**Feature**: 002-dashboard
**Date**: 2025-11-26

## 1. Polling Strategy for Dashboard Updates

**Decision**: Usar `useEffect` com `setInterval` de 60 segundos em Client Component wrapper

**Rationale**:
- Polling simples é suficiente para dashboard de vendas onde mudanças não são críticas em tempo real
- Server Actions do Next.js 15 permitem revalidação eficiente via `revalidatePath`
- Alternativa WebSocket/SSE seria over-engineering para este caso de uso

**Alternatives Considered**:
- WebSocket (Supabase Realtime): Complexidade adicional, não necessário para updates de 60s
- Server-Sent Events: Requer infraestrutura adicional, não suportado nativamente pelo Next.js
- SWR/React Query: Adicionaria dependência extra, polling nativo é suficiente

**Implementation Pattern**:
```typescript
// dashboard-polling-wrapper.tsx
"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export function DashboardPollingWrapper({ children, interval = 60000 }) {
  const router = useRouter()

  useEffect(() => {
    const timer = setInterval(() => {
      router.refresh() // Revalida Server Components
    }, interval)
    return () => clearInterval(timer)
  }, [router, interval])

  return <>{children}</>
}
```

## 2. KPI Calculation Queries

**Decision**: Queries agregadas diretamente no módulo `lib/dashboard.ts` usando Drizzle ORM

**Rationale**:
- Segue Princípio III da Constituição (lógica em módulos de contexto)
- Drizzle suporta agregações SQL performantes
- Cálculos no banco são mais eficientes que no código

**Key Queries**:

```typescript
// Cotações pendentes
export async function getKpiPendentes(sellerId: string, period: DateRange) {
  return db
    .select({ count: count() })
    .from(quotations)
    .where(
      and(
        eq(quotations.sellerId, sellerId),
        eq(quotations.status, "PENDING"),
        gte(quotations.createdAt, period.start),
        lte(quotations.createdAt, period.end)
      )
    )
}

// Taxa de conversão
export async function getKpiConversion(sellerId: string, period: DateRange) {
  const total = await db.select({ count: count() }).from(quotations)
    .where(and(eq(quotations.sellerId, sellerId), ...periodFilter))

  const accepted = await db.select({ count: count() }).from(quotations)
    .where(and(eq(quotations.sellerId, sellerId), eq(quotations.status, "ACCEPTED"), ...periodFilter))

  return total > 0 ? (accepted / total) * 100 : 0
}
```

## 3. Sidebar Component Strategy

**Decision**: Criar novo componente `dashboard-sidebar.tsx` reutilizável no layout `(admin)`

**Rationale**:
- Layout `(admin)/layout.tsx` já existe e é compartilhado por rotas admin
- Sidebar deve ser Server Component (sem estado de navegação)
- Mobile drawer usa shadcn Sheet component

**Alternatives Considered**:
- Sidebar no layout raiz: Não, pois só rotas admin precisam de sidebar
- Usar biblioteca de sidebar: Não necessário, shadcn Sheet é suficiente

## 4. Status Color Mapping

**Decision**: Mapeamento de cores em constante exportada de `lib/dashboard.ts`

**Rationale**:
- Centraliza definição de cores de status
- Usa tokens do Tailwind CSS (sem valores hardcoded)
- Facilita manutenção e consistência

**Implementation**:
```typescript
export const STATUS_COLORS = {
  PENDING: "bg-amber-500 text-amber-50",     // Amarelo
  CONTACTED: "bg-blue-500 text-blue-50",     // Azul
  ACCEPTED: "bg-green-500 text-green-50",    // Verde
  EXPIRED: "bg-gray-500 text-gray-50",       // Cinza
  CANCELLED: "bg-red-500 text-red-50",       // Vermelho
  REJECTED: "bg-red-500 text-red-50",        // Vermelho
} as const

export const URGENCY_COLORS = {
  expiring: "bg-red-50 border-red-200 text-red-700",
  noContact: "bg-amber-50 border-amber-200 text-amber-700",
} as const
```

## 5. Meta/Goal Schema Extension

**Decision**: Adicionar tabela `seller_goals` ao schema para armazenar metas mensais

**Rationale**:
- Schema atual de `sellers` não possui campo de meta
- Meta varia por mês, necessita tabela separada
- Permite histórico de metas

**Schema Addition**:
```typescript
export const sellerGoals = pgTable("seller_goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  sellerId: uuid("seller_id").notNull().references(() => sellers.id),
  month: integer("month").notNull(), // 1-12
  year: integer("year").notNull(),
  targetAccepted: integer("target_accepted").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
})
```

## 6. Contact Confirmation Flow

**Decision**: Server Action com modal de confirmação no cliente

**Rationale**:
- Ação de atualizar status deve ser Server Action (Princípio II)
- Modal usa shadcn Dialog
- Atualiza `contactedAt` timestamp e status

**Flow**:
1. Usuário clica em Ligar/WhatsApp → abre app nativo
2. Ao retornar, exibe modal "Contato realizado?"
3. Sim → Server Action atualiza status para CONTACTED
4. Não → Fecha modal, nenhuma ação

## 7. Responsive Breakpoints

**Decision**: Seguir breakpoints padrão do Tailwind CSS

**Rationale**:
- Projeto já usa Tailwind CSS 4
- Breakpoints padrão cobrem casos de uso do dashboard

**Breakpoints**:
- Mobile: < 640px (`sm:`)
- Tablet: 640px - 1023px (`md:`, `lg:`)
- Desktop: >= 1024px (`lg:`, `xl:`)

**Sidebar Behavior**:
- Desktop (>= 1024px): Sidebar fixa visível
- Tablet/Mobile (< 1024px): Sidebar oculta, acessível via menu hamburguer

## 8. shadcn Components Required

**Decision**: Instalar componentes adicionais via CLI do shadcn

**Components Needed**:
```bash
npx shadcn@latest add progress    # Barras de progresso
npx shadcn@latest add sheet       # Sidebar mobile
npx shadcn@latest add tooltip     # Tooltips informativos
```

**Already Available**: Card, Badge, Button, Dialog, Avatar, Table, Select

## Summary of Decisions

| Area | Decision | Complexity |
|------|----------|------------|
| Polling | useEffect + setInterval 60s | Low |
| KPI Queries | Drizzle agregações no `lib/dashboard.ts` | Medium |
| Sidebar | Server Component + Sheet para mobile | Low |
| Status Colors | Constante centralizada com tokens Tailwind | Low |
| Goals/Metas | Nova tabela `seller_goals` | Medium |
| Contact Flow | Server Action + Dialog confirm | Low |
| Responsive | Tailwind breakpoints padrão | Low |
| Components | +3 shadcn (progress, sheet, tooltip) | Low |
