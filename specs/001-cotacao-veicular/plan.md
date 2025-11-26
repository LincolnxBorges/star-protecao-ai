# Implementation Plan: Sistema de Cotacao Veicular

**Branch**: `001-cotacao-veicular` | **Date**: 2025-11-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-cotacao-veicular/spec.md`

## Summary

Sistema de cotacao online para protecao veicular que permite clientes consultarem placas de veiculos, receberem cotacoes instantaneas baseadas em tabela de precos por categoria/valor FIPE, e serem atendidos por vendedores via round-robin. Inclui formulario publico de cotacao, integracao com APIs externas (PowerCRM, WDAPI2, ViaCEP), notificacoes via WhatsApp (Evolution API), e painel administrativo para gestao de cotacoes, precos e blacklist.

## Technical Context

**Language/Version**: TypeScript 5.x com Next.js 15 (App Router)
**Primary Dependencies**: Next.js, React, Drizzle ORM, Better Auth, Zod, react-hook-form, shadcn/ui, Tailwind CSS 4
**Storage**: PostgreSQL via Drizzle ORM (schema em `lib/schema.ts`)
**Testing**: Framework TBD (conforme constitution - deve suportar testes unitarios, integracao e e2e)
**Target Platform**: Web (servidor Node.js, cliente browser moderno)
**Project Type**: Web application (Next.js fullstack)
**Performance Goals**: 95% das consultas de placa em <5s, 100 cotacoes simultaneas sem degradacao
**Constraints**: Cotacao completa em <3 minutos, notificacao WhatsApp em <30s
**Scale/Scope**: Volume inicial moderado, preparado para escala futura

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Status | Notas |
|-----------|--------|-------|
| I. Arquitetura Orientada a Contextos | PASS | Contextos: `lib/quotations.ts`, `lib/customers.ts`, `lib/vehicles.ts`, `lib/sellers.ts`, `lib/pricing.ts`, `lib/blacklist.ts` |
| II. Server-First com Client Components | PASS | Paginas como Server Components, Client Components isolados para formularios interativos |
| III. Logica de Negocio em Modulos de Contexto | PASS | Todas as funcoes de negocio em `lib/`, sem repositories ou services abstratos |
| IV. Drizzle ORM | PASS | Schema em `lib/schema.ts`, queries diretas nos contextos |
| V. Organizacao de Componentes | PASS | `components/cotacao-*.tsx`, `components/admin-*.tsx`, `components/ui/*` |
| VI. Tailwind CSS 4 + shadcn/ui | PASS | Sem `tailwind.config.js`, tokens de cor do shadcn |
| VII. Validacao com Zod + react-hook-form | PASS | Schemas Zod para formularios e server actions |
| VIII. Desenvolvimento Orientado a Testes | PASS | Testes para contextos e fluxos criticos |
| IX. Vercel AI SDK | N/A | Feature nao requer integracao com IA |
| X. Conventional Commits | PASS | Commits seguirao formato padrao |

**GATE STATUS: PASSED** - Nenhuma violacao identificada.

## Project Structure

### Documentation (this feature)

```text
specs/001-cotacao-veicular/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── vehicles-api.md
│   ├── quotations-api.md
│   └── admin-api.md
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
app/
├── (public)/
│   └── cotacao/
│       ├── page.tsx                    # Formulario de cotacao (Server Component)
│       └── [id]/
│           └── page.tsx                # Resultado da cotacao
├── (admin)/
│   ├── layout.tsx                      # Layout admin com sidebar
│   ├── cotacoes/
│   │   ├── page.tsx                    # Lista de cotacoes
│   │   └── [id]/
│   │       └── page.tsx                # Detalhes da cotacao
│   ├── precos/
│   │   └── page.tsx                    # Gestao de tabela de precos
│   └── blacklist/
│       └── page.tsx                    # Gestao de blacklist
├── api/
│   ├── vehicles/
│   │   └── lookup/
│   │       └── route.ts                # POST: consulta placa (PowerCRM + WDAPI2)
│   ├── quotations/
│   │   ├── route.ts                    # POST: criar cotacao
│   │   └── [id]/
│   │       └── route.ts                # GET, PATCH: detalhes/status
│   ├── pricing/
│   │   └── route.ts                    # GET, POST, PATCH: regras de preco
│   └── blacklist/
│       └── route.ts                    # GET, POST, DELETE: blacklist

lib/
├── schema.ts                           # Schema Drizzle (customers, vehicles, quotations, sellers, pricing_rules, blacklist)
├── db.ts                               # Conexao PostgreSQL
├── auth.ts                             # Better Auth config
├── auth-client.ts                      # Better Auth client
├── quotations.ts                       # Contexto: cotacoes
├── customers.ts                        # Contexto: clientes
├── vehicles.ts                         # Contexto: veiculos + integracao APIs
├── sellers.ts                          # Contexto: vendedores + round-robin
├── pricing.ts                          # Contexto: regras de preco
├── blacklist.ts                        # Contexto: blacklist
├── notifications.ts                    # Contexto: WhatsApp via Evolution API
└── validations/
    ├── cpf.ts                          # Validacao CPF
    ├── placa.ts                        # Validacao placa (antigo + Mercosul)
    └── schemas.ts                      # Schemas Zod compartilhados

components/
├── ui/                                 # shadcn components
├── cotacao-form-vehicle.tsx            # Step 1: dados do veiculo
├── cotacao-form-customer.tsx           # Step 2: dados do cliente
├── cotacao-result.tsx                  # Resultado da cotacao
├── cotacao-rejected.tsx                # Tela de recusa
├── admin-quotations-list.tsx           # Lista de cotacoes (admin)
├── admin-quotation-details.tsx         # Detalhes cotacao (admin)
├── admin-pricing-table.tsx             # Tabela de precos (admin)
└── admin-blacklist-table.tsx           # Blacklist (admin)
```

**Structure Decision**: Next.js App Router fullstack com route groups `(public)` e `(admin)` para separar rotas publicas das autenticadas. Logica de negocio em contextos (`lib/*.ts`) conforme constitution. APIs externas encapsuladas no contexto `vehicles.ts`.

## Complexity Tracking

> Nenhuma violacao identificada. Estrutura segue principios constitucionais.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| - | - | - |
