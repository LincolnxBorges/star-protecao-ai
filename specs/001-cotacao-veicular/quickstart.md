# Quickstart: Sistema de Cotacao Veicular

**Feature**: 001-cotacao-veicular
**Date**: 2025-11-26

## Pre-requisitos

- Node.js 18+
- PostgreSQL 14+
- Conta nas APIs: PowerCRM, WDAPI2, Evolution API

## Setup do Ambiente

### 1. Variaveis de Ambiente

Adicionar ao arquivo `.env.local`:

```env
# Existentes (ja configuradas)
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=...
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Novas para cotacao
POWER_CRM_API_KEY=sua-api-key-powercrm
WDAPI2_TOKEN=seu-token-wdapi2
EVOLUTION_API_URL=https://sua-instancia.evolution.api
EVOLUTION_API_KEY=sua-api-key-evolution
EVOLUTION_INSTANCE=nome-da-instancia
```

### 2. Criar Schema do Banco

```bash
# Gerar migration
npm run db:generate

# Aplicar migration
npm run db:migrate

# OU para desenvolvimento rapido
npm run db:push
```

### 3. Popular Dados Iniciais

Executar seed SQL para tabela de precos e blacklist:

```bash
# Conectar ao banco e executar seed
psql $DATABASE_URL < seed-database.sql
```

O arquivo seed contem:
- 76 regras de preco (19 por categoria)
- 16 itens na blacklist (10 marcas + 6 modelos)

### 4. Cadastrar Vendedores

Criar vendedores manualmente no banco ou via script:

```sql
INSERT INTO sellers (name, email, phone, role, is_active) VALUES
('Maria Santos', 'maria@empresa.com', '11999999999', 'ADMIN', true),
('Joao Silva', 'joao@empresa.com', '11888888888', 'SELLER', true),
('Ana Costa', 'ana@empresa.com', '11777777777', 'SELLER', true);
```

## Estrutura de Arquivos a Criar

```
lib/
├── quotations.ts           # Contexto de cotacoes
├── customers.ts            # Contexto de clientes
├── vehicles.ts             # Contexto de veiculos + APIs
├── sellers.ts              # Contexto de vendedores
├── pricing.ts              # Contexto de precos
├── blacklist.ts            # Contexto de blacklist
├── notifications.ts        # WhatsApp via Evolution
└── validations/
    ├── cpf.ts
    ├── placa.ts
    └── schemas.ts

app/
├── (public)/cotacao/
│   ├── page.tsx
│   └── [id]/page.tsx
├── (admin)/
│   ├── layout.tsx
│   ├── cotacoes/
│   ├── precos/
│   └── blacklist/
└── api/
    ├── vehicles/lookup/route.ts
    ├── quotations/
    ├── pricing/
    └── blacklist/

components/
├── cotacao-form-vehicle.tsx
├── cotacao-form-customer.tsx
├── cotacao-result.tsx
├── cotacao-rejected.tsx
├── admin-quotations-list.tsx
├── admin-quotation-details.tsx
├── admin-pricing-table.tsx
└── admin-blacklist-table.tsx
```

## Fluxo de Desenvolvimento

### Ordem Sugerida de Implementacao

1. **Schema do Banco** (`lib/schema.ts`)
   - Adicionar tabelas: customers, vehicles, quotations, sellers, pricing_rules, blacklist

2. **Validacoes** (`lib/validations/`)
   - CPF, placa, schemas Zod

3. **Contextos Base**
   - `lib/customers.ts` - CRUD de clientes
   - `lib/vehicles.ts` - Integracao APIs + consulta
   - `lib/pricing.ts` - Busca de faixas de preco
   - `lib/blacklist.ts` - Verificacao de blacklist

4. **Contexto Principal**
   - `lib/quotations.ts` - Criar cotacao, calcular valores
   - `lib/sellers.ts` - Round-robin

5. **APIs**
   - `/api/vehicles/lookup` - Consulta de placa
   - `/api/quotations` - CRUD de cotacoes

6. **Formulario Publico**
   - `app/(public)/cotacao/page.tsx`
   - Componentes: form-vehicle, form-customer, result

7. **Notificacoes**
   - `lib/notifications.ts` - WhatsApp

8. **Painel Admin**
   - Layout, lista de cotacoes, detalhes
   - Gestao de precos e blacklist

## Comandos Uteis

```bash
# Desenvolvimento
npm run dev

# Banco de dados
npm run db:generate    # Gerar migration
npm run db:migrate     # Aplicar migration
npm run db:push        # Push direto (dev)
npm run db:studio      # Interface visual

# Testes
npm run test           # Testes unitarios
npm run test:e2e       # Testes E2E

# Lint
npm run lint
```

## Verificacao de Funcionamento

### 1. Testar Consulta de Placa

```bash
curl -X POST http://localhost:3000/api/vehicles/lookup \
  -H "Content-Type: application/json" \
  -d '{"placa": "ABC1234", "categoria": "LEVE", "tipoUso": "PARTICULAR"}'
```

### 2. Testar Criacao de Cotacao

```bash
curl -X POST http://localhost:3000/api/quotations \
  -H "Content-Type: application/json" \
  -d '{
    "vehicle": { ... },
    "customer": {
      "name": "Teste",
      "email": "teste@email.com",
      "phone": "11999999999",
      "cpf": "123.456.789-09",
      ...
    }
  }'
```

### 3. Verificar Painel Admin

1. Fazer login como vendedor
2. Acessar `/cotacoes`
3. Verificar se cotacoes aparecem

## Proximos Passos

Apos setup inicial, executar `/speckit.tasks` para gerar lista de tarefas detalhadas.
