# Implementation Plan: Gestao de Vendedores

**Branch**: `005-gestao-vendedores` | **Date**: 2025-11-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-gestao-vendedores/spec.md`

## Summary

Implementar tela de gestao de vendedores para administradores, incluindo listagem com KPIs, CRUD completo de vendedores, perfil detalhado com metricas de performance, e interface para configuracao do round-robin. A implementacao segue a arquitetura existente do projeto com Server Components, modulos de contexto em `lib/`, e componentes shadcn/ui.

## Technical Context

**Language/Version**: TypeScript 5.x com Next.js 15 (App Router)
**Primary Dependencies**: React 19, Drizzle ORM, Better Auth, shadcn/ui, Tailwind CSS 4, Zod, react-hook-form, lucide-react
**Storage**: PostgreSQL via Drizzle ORM (schema em `lib/schema.ts`)
**Testing**: TBD (framework de testes ainda nao configurado)
**Target Platform**: Web (navegadores modernos)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: Listagem em < 3 segundos, operacoes CRUD em < 2 segundos
**Constraints**: Apenas administradores podem acessar
**Scale/Scope**: Suporte para ate 100 vendedores, interface responsiva (desktop + mobile)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Status | Evidencia |
|-----------|--------|-----------|
| I. Arquitetura Orientada a Contextos | PASS | Logica em `lib/sellers.ts` (existente, sera expandido) |
| II. Server-First com Client Components Estrategicos | PASS | Pagina server component, modais e interatividade em client components |
| III. Logica de Negocio em Modulos de Contexto | PASS | Funcoes em `lib/sellers.ts`, sem abstractions |
| IV. Integracao com Banco de Dados via Drizzle ORM | PASS | Usa Drizzle diretamente, schema em `lib/schema.ts` |
| V. Organizacao e Nomenclatura de Componentes | PASS | Componentes prefixados: `vendedores-*.tsx` |
| VI. Estilizacao com Tailwind CSS 4 e shadcn/ui | PASS | Usa tokens shadcn, sem cores hardcoded |
| VII. Validacao e Integracao de Formularios | PASS | Zod + react-hook-form para modais |
| VIII. Desenvolvimento Orientado a Testes | PENDING | Framework TBD, testes serao adicionados |
| IX. Integracao com IA via Vercel SDK | N/A | Feature nao usa IA |
| X. Conventional Commits | PASS | Commits seguirao padrao |

## Project Structure

### Documentation (this feature)

```text
specs/005-gestao-vendedores/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
app/
├── (admin)/
│   └── vendedores/
│       ├── page.tsx              # Server component - lista de vendedores
│       └── actions.ts            # Server actions para CRUD

lib/
├── sellers.ts                    # Contexto expandido com novas funcoes
├── schema.ts                     # Schema (seller status enum, campos adicionais)
└── types/
    └── sellers.ts                # Tipos para vendedores

components/
├── vendedores-list.tsx           # Client - lista com filtros e paginacao
├── vendedores-kpi-cards.tsx      # Client - cards de KPIs do time
├── vendedores-card.tsx           # Client - card individual do vendedor
├── vendedores-search.tsx         # Client - busca e filtros
├── vendedores-modal-form.tsx     # Client - modal criar/editar vendedor
├── vendedores-modal-profile.tsx  # Client - modal perfil detalhado
├── vendedores-modal-deactivate.tsx # Client - modal confirmar desativacao
├── vendedores-modal-reassign.tsx # Client - modal reatribuir leads
├── vendedores-round-robin-card.tsx # Client - card configuracoes round-robin
└── vendedores-round-robin-modal.tsx # Client - modal editar round-robin
```

**Structure Decision**: Segue padrao existente do projeto (ex: `cotacoes-*.tsx`). Pagina em `app/(admin)/vendedores/` com server component que renderiza client components para interatividade.

## Complexity Tracking

> Nenhuma violacao de principios constitucionais. Implementacao segue padroes estabelecidos.

| Item | Justificativa |
|------|---------------|
| Multiplos modais | Necessario para UX - cada acao tem contexto proprio |
| Client components | Apenas para interatividade (filtros, modais, drag-and-drop) |
