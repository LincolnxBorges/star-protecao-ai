# Quickstart: Gestao de Vendedores

**Feature**: 005-gestao-vendedores
**Date**: 2025-11-27

## Pre-requisitos

- Node.js 18+
- PostgreSQL rodando
- Variaveis de ambiente configuradas (`.env`)

## Setup Rapido

```bash
# 1. Instalar dependencias (se necessario)
npm install

# 2. Executar migrations
npm run db:generate
npm run db:migrate

# 3. Iniciar dev server
npm run dev
```

## Acessar a Feature

1. Acesse `http://localhost:3000/login`
2. Faca login com usuario ADMIN
3. No menu lateral, clique em "Vendedores"

## Estrutura de Arquivos Criados

```
app/(admin)/vendedores/
├── page.tsx           # Pagina principal
└── actions.ts         # Server actions

lib/
├── sellers.ts         # Contexto expandido
├── schema.ts          # Schema atualizado
└── types/sellers.ts   # Tipos

components/
├── vendedores-list.tsx
├── vendedores-kpi-cards.tsx
├── vendedores-card.tsx
├── vendedores-search.tsx
├── vendedores-modal-form.tsx
├── vendedores-modal-profile.tsx
├── vendedores-modal-deactivate.tsx
├── vendedores-modal-reassign.tsx
├── vendedores-round-robin-card.tsx
└── vendedores-round-robin-modal.tsx
```

## Fluxo de Desenvolvimento

### 1. Schema e Migrations

Atualizar `lib/schema.ts`:
- Adicionar `sellerStatusEnum`
- Adicionar `roundRobinMethodEnum`
- Expandir tabela `sellers`
- Expandir tabela `round_robin_config`

```bash
npm run db:generate
npm run db:migrate
```

### 2. Contexto (lib/sellers.ts)

Adicionar funcoes:
- `listSellersWithMetrics()`
- `getSellerProfile()`
- `createSeller()`
- `updateSeller()`
- `changeSellerStatus()`
- `getTeamMetrics()`
- `getRoundRobinConfig()`
- `updateRoundRobinConfig()`
- `reorderQueue()`
- `reassignLeads()`

### 3. Server Actions

Criar `app/(admin)/vendedores/actions.ts` com todas as actions documentadas em `contracts/server-actions.md`.

### 4. Pagina e Componentes

1. Criar pagina server component
2. Criar componentes client na ordem:
   - KPI Cards
   - Search/Filters
   - Card do Vendedor
   - Lista
   - Modais

## Comandos Uteis

```bash
# Ver schema atual
npm run db:studio

# Resetar banco (dev only)
npm run db:push

# Lint
npm run lint

# Build
npm run build
```

## Padrao de Commit

```bash
git commit -m "feat: adiciona listagem de vendedores com KPIs"
git commit -m "feat: implementa CRUD de vendedores"
git commit -m "feat: adiciona perfil detalhado do vendedor"
git commit -m "feat: implementa configuracao de round-robin"
```

## Checklist de Implementacao

- [ ] Schema atualizado com novos campos e enums
- [ ] Migration executada com sucesso
- [ ] Tipos criados em `lib/types/sellers.ts`
- [ ] Contexto `lib/sellers.ts` expandido
- [ ] Server actions implementadas
- [ ] Pagina `/vendedores` criada
- [ ] KPI cards funcionando
- [ ] Lista com busca e filtros
- [ ] Modal criar/editar vendedor
- [ ] Modal perfil detalhado
- [ ] Modal desativar vendedor
- [ ] Modal reatribuir leads
- [ ] Card round-robin
- [ ] Modal configurar round-robin
- [ ] Responsividade mobile verificada
- [ ] Permissoes de admin verificadas
