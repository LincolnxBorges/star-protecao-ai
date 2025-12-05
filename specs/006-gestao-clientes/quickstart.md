# Quickstart: Gestao de Clientes

**Feature**: 006-gestao-clientes
**Date**: 2025-11-27

## Prerequisites

- Node.js 18+
- PostgreSQL rodando
- Projeto configurado com `npm install`
- Variavel `DATABASE_URL` configurada

## Setup Steps

### 1. Atualizar Schema do Banco

Adicionar ao arquivo `lib/schema.ts`:

```typescript
// Novos enums
export const interactionTypeEnum = pgEnum("interaction_type", [
  "CALL_MADE",
  "CALL_RECEIVED",
  "WHATSAPP_SENT",
  "WHATSAPP_RECEIVED",
  "EMAIL_SENT",
  "EMAIL_RECEIVED",
  "MEETING",
  "NOTE",
]);

export const interactionResultEnum = pgEnum("interaction_result", [
  "POSITIVE",
  "NEUTRAL",
  "NEGATIVE",
  "NO_CONTACT",
]);

// Nova tabela
export const clientInteractions = pgTable("client_interactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  sellerId: uuid("seller_id")
    .notNull()
    .references(() => sellers.id),
  type: interactionTypeEnum("type").notNull(),
  result: interactionResultEnum("result"),
  description: text("description").notNull(),
  scheduledFollowUp: timestamp("scheduled_follow_up", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Atualizar customers - adicionar deletedAt
// Na tabela customers existente, adicionar:
deletedAt: timestamp("deleted_at", { withTimezone: true }),
```

### 2. Gerar e Aplicar Migration

```bash
npm run db:generate
npm run db:migrate
```

### 3. Criar Modulo de Contexto

Criar arquivo `lib/clients.ts` com as funcoes:
- `listClients()`
- `getClientKPIs()`
- `getClientProfile()`
- `getClientQuotations()`
- `createClientInteraction()`
- `softDeleteClient()`
- `exportClientsCSV()`

### 4. Adicionar Componentes shadcn (se necessario)

```bash
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add badge
npx shadcn@latest add tabs
npx shadcn@latest add textarea
```

### 5. Criar Pagina

Criar `app/(admin)/clientes/page.tsx` como Server Component.

### 6. Criar Componentes

Criar em `components/`:
- `clients-kpi-cards.tsx`
- `clients-search-filters.tsx`
- `clients-table.tsx`
- `clients-card-list.tsx`
- `clients-profile-modal.tsx`
- `clients-quotations-modal.tsx`
- `clients-interaction-modal.tsx`
- `clients-actions-menu.tsx`
- `clients-empty-state.tsx`

## Development Commands

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Abrir Drizzle Studio para visualizar dados
npm run db:studio

# Rodar testes (quando configurados)
npm test
```

## Verificacao

1. Acessar `/clientes` no navegador
2. Verificar que KPIs carregam corretamente
3. Testar busca e filtros
4. Abrir perfil de um cliente
5. Registrar uma interacao
6. Verificar responsividade mobile

## Arquivos Principais

```
app/(admin)/clientes/
├── page.tsx              # Server Component principal
└── actions.ts            # Server Actions

lib/
├── schema.ts             # Schema atualizado com clientInteractions
├── clients.ts            # Modulo de contexto
└── types/clients.ts      # Types da feature

components/
├── clients-*.tsx         # Componentes da feature
```

## Troubleshooting

### Migration falhou
```bash
# Resetar migration
npm run db:push

# Ou recriar do zero (dev only)
npm run db:drop && npm run db:push
```

### Dados de teste
Usar dados existentes de customers/quotations ou rodar seed:
```bash
npm run db:seed
```
