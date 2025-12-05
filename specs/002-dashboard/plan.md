# Implementation Plan: Dashboard do Vendedor

**Branch**: `002-dashboard` | **Date**: 2025-11-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-dashboard/spec.md`

## Summary

Dashboard do vendedor para visualização de KPIs (Pendentes, Aceitas, Potencial Mensal, Conversão), alertas urgentes (cotações expirando e leads sem contato), lista de cotações recentes com ações rápidas (ligar, WhatsApp), ranking de vendedores e progresso de meta mensal. Implementação segue arquitetura Server-First do Next.js 15 com Client Components estratégicos para polling (60s) e interatividade.

## Technical Context

**Language/Version**: TypeScript 5.x com Next.js 15 (App Router)
**Primary Dependencies**: React 19, Drizzle ORM, Better Auth, shadcn/ui (tema new-york), Tailwind CSS 4, lucide-react
**Storage**: PostgreSQL via Drizzle ORM (schema em `lib/schema.ts`)
**Testing**: Vitest (unitário), Playwright (E2E)
**Target Platform**: Web (desktop, tablet, mobile responsivo)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: Dashboard carrega em < 3 segundos, polling a cada 60 segundos
**Constraints**: Server Components por padrão, Client Components apenas para interatividade
**Scale/Scope**: ~10 componentes de dashboard, 1 módulo de contexto (`lib/dashboard.ts`)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Status | Evidência |
|-----------|--------|-----------|
| I. Arquitetura Orientada a Contextos | ✅ PASS | Lógica de negócio em `lib/dashboard.ts` |
| II. Server-First com Client Components | ✅ PASS | Página principal como Server Component, polling isolado em Client Component |
| III. Lógica de Negócio em Módulos | ✅ PASS | Funções de cálculo KPI, alertas, ranking em `lib/dashboard.ts` |
| IV. Drizzle ORM | ✅ PASS | Queries diretas usando schema existente |
| V. Organização de Componentes | ✅ PASS | Componentes prefixados: `dashboard-*.tsx` |
| VI. Tailwind CSS 4 + shadcn/ui | ✅ PASS | Uso de componentes Card, Badge, Button, Progress do shadcn |
| VII. Validação com Zod | ✅ PASS | Validação de parâmetros de filtro de período |
| VIII. Testes | ✅ PASS | Testes unitários para cálculos KPI, E2E para fluxos críticos |
| IX. Vercel AI SDK | N/A | Dashboard não usa funcionalidade de IA |
| X. Conventional Commits | ✅ PASS | Commits seguirão formato padrão |

## Project Structure

### Documentation (this feature)

```text
specs/002-dashboard/
├── plan.md              # Este arquivo
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── dashboard-api.ts # Tipos e interfaces
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
app/
├── (admin)/
│   ├── layout.tsx           # Layout compartilhado com sidebar
│   └── dashboard/
│       └── page.tsx         # Server Component principal do dashboard

lib/
├── dashboard.ts             # Módulo de contexto com lógica de negócio
└── schema.ts                # Schema existente (quotations, sellers, etc.)

components/
├── dashboard-kpi-cards.tsx          # Cards de KPI (Server Component)
├── dashboard-urgent-alerts.tsx      # Alertas urgentes
├── dashboard-quotations-list.tsx    # Lista de cotações recentes
├── dashboard-status-chart.tsx       # Gráfico de distribuição por status
├── dashboard-ranking.tsx            # Ranking de vendedores
├── dashboard-goal-progress.tsx      # Widget de progresso de meta
├── dashboard-greeting.tsx           # Saudação personalizada
├── dashboard-period-filter.tsx      # Filtro de período (Client Component)
├── dashboard-sidebar.tsx            # Sidebar de navegação
├── dashboard-contact-confirm.tsx    # Modal de confirmação de contato
└── dashboard-polling-wrapper.tsx    # Client Component para polling
```

**Structure Decision**: Seguindo a arquitetura do projeto, o dashboard será implementado dentro do route group `(admin)` que já possui um layout compartilhado. Componentes seguem o padrão de nomenclatura `dashboard-*.tsx` conforme Princípio V da Constituição.

## Complexity Tracking

> Nenhuma violação identificada. Design segue todos os princípios constitucionais.

| Violação | Por que Necessário | Alternativa Rejeitada |
|----------|-------------------|----------------------|
| - | - | - |
