# Implementation Plan: Telas de Gestao de Cotacoes

**Branch**: `003-cotacoes-gestao` | **Date**: 2025-11-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-cotacoes-gestao/spec.md`

## Summary

Implementar telas completas de gestao de cotacoes no painel administrativo: lista com filtros/busca/paginacao e detalhes com historico de atividades, mudanca de status e notas. O sistema segue arquitetura orientada a contextos com Server Components por padrao e Client Components estrategicos para interatividade.

## Technical Context

**Language/Version**: TypeScript 5.x com Next.js 15 (App Router)
**Primary Dependencies**: React 19, Drizzle ORM, Better Auth, shadcn/ui, Tailwind CSS 4, Zod, react-hook-form, lucide-react
**Storage**: PostgreSQL via Drizzle ORM (schema em `lib/schema.ts`)
**Testing**: Vitest (unitarios), Playwright (E2E)
**Target Platform**: Web (desktop + mobile responsivo)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: Lista de 50 cotacoes em <2s, busca com debounce 300ms
**Constraints**: Server Components por padrao, sem repositories/services abstratos
**Scale/Scope**: ~10 componentes novos, 1 nova tabela, ~15 funcoes de contexto

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Status | Evidencia |
|-----------|--------|-----------|
| I. Arquitetura Orientada a Contextos | PASS | Logica em `lib/quotations.ts` existente, extender com novas funcoes |
| II. Server-First com Client Components | PASS | Paginas como Server Components, Client Components isolados para filtros/busca |
| III. Logica de Negocio em Contextos | PASS | Funcoes em `lib/quotations.ts`, sem classes ou abstractions |
| IV. Drizzle ORM | PASS | Schema existente em `lib/schema.ts`, nova tabela `quotation_activities` |
| V. Organizacao de Componentes | PASS | Componentes prefixados: `cotacoes-*` em `components/` |
| VI. Tailwind CSS 4 + shadcn/ui | PASS | Usar tokens de cor shadcn, componentes via CLI |
| VII. Validacao com Zod | PASS | Schemas para filtros e formularios de status/notas |
| VIII. Testes (NAO-NEGOCIAVEL) | PASS | Testes unitarios para funcoes de contexto, E2E para fluxos criticos |
| IX. Vercel AI SDK | N/A | Feature nao envolve IA |
| X. Conventional Commits | PASS | Commits seguirao formato padrao |

**Gate Status**: PASSED - Nenhuma violacao identificada.

## Project Structure

### Documentation (this feature)

```text
specs/003-cotacoes-gestao/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
lib/
├── schema.ts            # Adicionar quotation_activities table
├── quotations.ts        # Extender com funcoes de listagem/filtro/atividades
└── activities.ts        # Novo contexto para quotation_activities (opcional, pode ficar em quotations.ts)

app/(admin)/
├── cotacoes/
│   ├── page.tsx         # ATUALIZAR: Server Component com dados iniciais
│   └── [id]/
│       └── page.tsx     # ATUALIZAR: Detalhes completos da cotacao

components/
├── cotacoes-list.tsx           # Client: tabela com filtros/busca/paginacao
├── cotacoes-filters.tsx        # Client: filtros avancados (categoria, periodo, valor)
├── cotacoes-search.tsx         # Client: busca com debounce
├── cotacoes-status-tabs.tsx    # Client: tabs de status com contadores
├── cotacoes-table.tsx          # Server/Client: tabela de cotacoes
├── cotacoes-row.tsx            # Linha da tabela com acoes
├── cotacoes-detail-header.tsx  # Header da pagina de detalhes
├── cotacoes-detail-client.tsx  # Client: card cliente com acoes
├── cotacoes-detail-vehicle.tsx # Card veiculo
├── cotacoes-detail-values.tsx  # Card valores com barra de validade
├── cotacoes-detail-status.tsx  # Client: alteracao de status
├── cotacoes-detail-history.tsx # Client: timeline de atividades
├── cotacoes-note-dialog.tsx    # Client: modal para adicionar nota
└── ui/                         # shadcn components (tabs, dialog, etc)

__tests__/
├── unit/
│   └── lib/
│       └── quotations.test.ts  # Testes das funcoes de contexto
└── e2e/
    └── cotacoes/
        ├── list.spec.ts        # E2E lista de cotacoes
        └── details.spec.ts     # E2E detalhes da cotacao
```

**Structure Decision**: Web application com Next.js App Router. Paginas em `app/(admin)/cotacoes/` como Server Components que passam dados para Client Components de interatividade. Logica de negocio centralizada em `lib/quotations.ts`.

## Complexity Tracking

> Nenhuma violacao identificada. Implementacao segue principios constitucionais.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |
