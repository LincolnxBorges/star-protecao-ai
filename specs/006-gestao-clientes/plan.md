# Implementation Plan: Gestao de Clientes

**Branch**: `006-gestao-clientes` | **Date**: 2025-11-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-gestao-clientes/spec.md`

## Summary

Implementacao da tela de Lista de Clientes para gerenciamento completo da base de clientes. A feature permitira visualizacao de clientes com KPIs, busca/filtros avancados, perfil detalhado em modal, historico de cotacoes, registro de interacoes e acoes rapidas de contato. Segue arquitetura orientada a contextos com modulo `lib/clients.ts` para logica de negocio e Server Components para pagina principal.

## Technical Context

**Language/Version**: TypeScript 5.x com Next.js 15 (App Router)
**Primary Dependencies**: React 19, Drizzle ORM, Better Auth, shadcn/ui, Tailwind CSS 4, Zod, react-hook-form, lucide-react
**Storage**: PostgreSQL via Drizzle ORM (schema em `lib/schema.ts`)
**Testing**: Vitest para testes unitarios e de integracao (TBD no projeto)
**Target Platform**: Web (desktop e mobile responsivo)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: Lista de ate 100 clientes em menos de 3 segundos (SC-004)
**Constraints**: Interface responsiva minimo 320px, busca em tempo real
**Scale/Scope**: Base de clientes por vendedor, paginacao com 10 itens por pagina

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Status | Evidencia |
|-----------|--------|-----------|
| I. Arquitetura Orientada a Contextos | PASS | Novo modulo `lib/clients.ts` para logica de clientes |
| II. Server-First com Client Components | PASS | Pagina como Server Component, modais como Client Components |
| III. Logica de Negocio em Modulos de Contexto | PASS | Todas as funcoes em `lib/clients.ts` com Drizzle direto |
| IV. Integracao com Drizzle ORM | PASS | Nova tabela `clientInteractions` em `lib/schema.ts` |
| V. Organizacao de Componentes | PASS | Componentes prefixados com `clients-` em `components/` |
| VI. Tailwind CSS 4 e shadcn/ui | PASS | Tokens de cor shadcn, componentes da biblioteca |
| VII. Validacao Zod | PASS | Schemas Zod para formulario de interacao |
| VIII. TDD | ACKNOWLEDGE | Testes para modulo `lib/clients.ts` |
| IX. Vercel AI SDK | N/A | Feature nao envolve IA |
| X. Conventional Commits | PASS | Commits seguirao formato padrao |

## Project Structure

### Documentation (this feature)

```text
specs/006-gestao-clientes/
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
│   └── clientes/
│       └── page.tsx                    # Server Component - Pagina principal de clientes

lib/
├── schema.ts                           # Adicionar tabela clientInteractions
├── clients.ts                          # NOVO - Modulo de contexto para clientes

components/
├── clients-kpi-cards.tsx               # Cards de KPIs da base
├── clients-search-filters.tsx          # Client Component - Busca e filtros
├── clients-table.tsx                   # Tabela/lista de clientes (desktop)
├── clients-card-list.tsx               # Lista em cards (mobile)
├── clients-profile-modal.tsx           # Modal de perfil completo
├── clients-quotations-modal.tsx        # Modal de historico de cotacoes
├── clients-interaction-modal.tsx       # Modal de adicionar interacao
├── clients-actions-menu.tsx            # Menu de acoes dropdown
└── clients-empty-state.tsx             # Estado vazio
```

**Structure Decision**: Web application usando Next.js App Router. Pagina principal em `app/(admin)/clientes/page.tsx` como Server Component com fetch de dados. Componentes interativos (filtros, modais) como Client Components isolados.

## Complexity Tracking

> **No violations detected. Feature follows constitution principles.**

## Dependencies

### Existing Dependencies (Reuse)

- `lib/customers.ts` - Entidade Customer ja existe
- `lib/quotations.ts` - Entidade Quotation ja existe
- `lib/sellers.ts` - Entidade Seller ja existe
- `lib/schema.ts` - Schema existente com tabelas customers, quotations, sellers
- Componentes shadcn/ui ja instalados

### New Dependencies Required

- Nenhuma nova dependencia npm necessaria
- Novos componentes shadcn podem ser necessarios: Dialog, DropdownMenu, Badge, Tabs

## Design Decisions

### 1. Status do Cliente (Calculado)

O status do cliente sera calculado dinamicamente baseado em suas cotacoes:

```typescript
type ClientStatus = 'CONVERTED' | 'NEGOTIATING' | 'INACTIVE' | 'LOST' | 'NEW';

function calculateClientStatus(quotations: Quotation[]): ClientStatus {
  if (quotations.some(q => q.status === 'ACCEPTED')) return 'CONVERTED';
  if (quotations.some(q => ['PENDING', 'CONTACTED'].includes(q.status))) return 'NEGOTIATING';
  if (quotations.every(q => ['EXPIRED', 'CANCELLED'].includes(q.status))) return 'LOST';
  // Inativo: sem cotacao nos ultimos 30 dias
  // Novo: cadastrado nos ultimos 7 dias
}
```

### 2. Tabela de Interacoes (Nova)

Nova tabela `clientInteractions` para historico de contatos:

```typescript
// Tipos de interacao
type InteractionType =
  | 'CALL_MADE' | 'CALL_RECEIVED'
  | 'WHATSAPP_SENT' | 'WHATSAPP_RECEIVED'
  | 'EMAIL_SENT' | 'EMAIL_RECEIVED'
  | 'MEETING' | 'NOTE';

// Resultado da interacao
type InteractionResult = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'NO_CONTACT';
```

### 3. Permissoes por Role

- **Vendedor**: Ve apenas seus proprios clientes, pode registrar interacoes
- **Admin**: Ve todos os clientes, pode filtrar por vendedor, pode editar/excluir

### 4. Busca Full-Text

Busca ILIKE em multiplos campos: nome, CPF, telefone, email, cidade, e placa de veiculos cotados.

## Implementation Phases

### Phase 1: Schema e Modulo de Contexto
- Criar tabela `clientInteractions` em schema.ts
- Criar modulo `lib/clients.ts` com funcoes de negocio
- Testes unitarios para funcoes de calculo de status e KPIs

### Phase 2: Pagina e Componentes Base
- Criar pagina `app/(admin)/clientes/page.tsx`
- Implementar componentes de listagem (tabela e cards)
- Implementar KPI cards

### Phase 3: Busca, Filtros e Ordenacao
- Implementar componente de busca com debounce
- Implementar filtros (status, cidade, periodo, vendedor)
- Implementar ordenacao por colunas

### Phase 4: Modais de Visualizacao
- Modal de perfil completo do cliente
- Modal de historico de cotacoes
- Integracao com dados existentes

### Phase 5: Interacoes e Acoes
- Modal de adicionar interacao
- Acoes rapidas (ligar, WhatsApp, email, copiar)
- Exportacao CSV

### Phase 6: Responsividade e Polish
- Layout responsivo mobile (cards)
- Estados vazios
- Loading states
- Testes e2e
