# Data Model: Sistema de Cotacao Veicular

**Feature**: 001-cotacao-veicular
**Date**: 2025-11-26

## Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    customers    │       │    vehicles     │       │    sellers      │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │       │ id (PK)         │
│ name            │       │ placa           │       │ userId (FK)     │
│ email           │       │ marca           │       │ name            │
│ phone           │       │ modelo          │       │ email           │
│ cpf (UNIQUE)    │       │ ano             │       │ phone           │
│ cep             │       │ valorFipe       │       │ isActive        │
│ street          │       │ codigoFipe      │       │ role            │
│ number          │       │ combustivel     │       │ lastAssignmentAt│
│ complement      │       │ cor             │       │ assignmentCount │
│ neighborhood    │       │ categoria       │       │ createdAt       │
│ city            │       │ tipoUso         │       └────────┬────────┘
│ state           │       │ createdAt       │                │
│ createdAt       │       └────────┬────────┘                │
│ updatedAt       │                │                         │
└────────┬────────┘                │                         │
         │                         │                         │
         │         ┌───────────────┴─────────────────────────┘
         │         │
         ▼         ▼
┌─────────────────────────────────────┐
│            quotations               │
├─────────────────────────────────────┤
│ id (PK)                             │
│ customerId (FK) → customers.id      │
│ vehicleId (FK) → vehicles.id        │
│ sellerId (FK) → sellers.id          │
│ mensalidade                         │
│ adesao                              │
│ adesaoDesconto                      │
│ cotaParticipacao                    │
│ status                              │
│ rejectionReason                     │
│ createdAt                           │
│ expiresAt                           │
│ contactedAt                         │
│ acceptedAt                          │
│ notes                               │
└─────────────────────────────────────┘

┌─────────────────┐       ┌─────────────────┐
│  pricing_rules  │       │    blacklist    │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ categoria       │       │ marca           │
│ faixaMin        │       │ modelo          │
│ faixaMax        │       │ motivo          │
│ mensalidade     │       │ isActive        │
│ cotaParticipacao│       │ createdAt       │
│ isActive        │       └─────────────────┘
│ createdAt       │
└─────────────────┘

┌─────────────────┐
│round_robin_config│
├─────────────────┤
│ id (PK)         │
│ currentIndex    │
│ updatedAt       │
└─────────────────┘
```

## Entities

### customers

Clientes que solicitam cotacoes.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Identificador unico |
| name | VARCHAR(255) | NOT NULL | Nome completo |
| email | VARCHAR(255) | NOT NULL | Email do cliente |
| phone | VARCHAR(20) | NOT NULL | WhatsApp (formato brasileiro) |
| cpf | VARCHAR(14) | NOT NULL, UNIQUE | CPF formatado |
| cep | VARCHAR(9) | NOT NULL | CEP |
| street | VARCHAR(255) | NOT NULL | Logradouro |
| number | VARCHAR(20) | NOT NULL | Numero |
| complement | VARCHAR(100) | NULLABLE | Complemento |
| neighborhood | VARCHAR(100) | NOT NULL | Bairro |
| city | VARCHAR(100) | NOT NULL | Cidade |
| state | VARCHAR(2) | NOT NULL | UF |
| createdAt | TIMESTAMPTZ | DEFAULT NOW() | Data de criacao |
| updatedAt | TIMESTAMPTZ | DEFAULT NOW() | Data de atualizacao |

**Validation Rules**:
- CPF: formato valido com digitos verificadores
- Email: formato valido
- Phone: formato brasileiro (11 digitos)
- CEP: formato 00000-000

**Indexes**:
- `idx_customers_cpf` ON cpf

### vehicles

Veiculos consultados para cotacao.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Identificador unico |
| placa | VARCHAR(8) | NOT NULL | Placa normalizada |
| marca | VARCHAR(100) | NOT NULL | Marca do veiculo |
| modelo | VARCHAR(100) | NOT NULL | Modelo do veiculo |
| ano | VARCHAR(10) | NOT NULL | Ano modelo (ex: 2014/2014) |
| valorFipe | DECIMAL(12,2) | NOT NULL | Valor FIPE em reais |
| codigoFipe | VARCHAR(20) | NOT NULL | Codigo FIPE |
| combustivel | VARCHAR(50) | NULLABLE | Tipo de combustivel |
| cor | VARCHAR(50) | NULLABLE | Cor do veiculo |
| categoria | ENUM | NOT NULL | NORMAL, ESPECIAL, UTILITARIO, MOTO |
| tipoUso | ENUM | NOT NULL | PARTICULAR, COMERCIAL |
| createdAt | TIMESTAMPTZ | DEFAULT NOW() | Data de criacao |

**Validation Rules**:
- Placa: formato antigo ou Mercosul, normalizada (sem hifen, uppercase)
- Categoria: um dos valores do enum
- TipoUso: um dos valores do enum
- ValorFipe: maior que 0

### quotations

Cotacoes geradas pelo sistema.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Identificador unico |
| customerId | UUID | FK → customers.id, NOT NULL | Cliente |
| vehicleId | UUID | FK → vehicles.id, NOT NULL | Veiculo |
| sellerId | UUID | FK → sellers.id, NULLABLE | Vendedor atribuido |
| mensalidade | DECIMAL(10,2) | NOT NULL | Valor da mensalidade |
| adesao | DECIMAL(10,2) | NOT NULL | Valor da adesao |
| adesaoDesconto | DECIMAL(10,2) | NOT NULL | Adesao com 20% desconto |
| cotaParticipacao | DECIMAL(10,2) | NULLABLE | Cota de participacao |
| status | ENUM | NOT NULL, DEFAULT 'PENDING' | Status da cotacao |
| rejectionReason | VARCHAR(255) | NULLABLE | Motivo se REJECTED |
| createdAt | TIMESTAMPTZ | DEFAULT NOW() | Data de criacao |
| expiresAt | TIMESTAMPTZ | DEFAULT NOW() + 7 days | Data de expiracao |
| contactedAt | TIMESTAMPTZ | NULLABLE | Data do contato |
| acceptedAt | TIMESTAMPTZ | NULLABLE | Data de aceite |
| notes | TEXT | NULLABLE | Observacoes |

**Status Enum Values**:
- `PENDING`: Aguardando contato
- `CONTACTED`: Vendedor entrou em contato
- `ACCEPTED`: Cliente aceitou
- `EXPIRED`: Expirou apos 7 dias
- `CANCELLED`: Cancelada
- `REJECTED`: Recusada (blacklist ou limite)

**State Transitions**:
```
PENDING → CONTACTED → ACCEPTED
       → EXPIRED (automatico apos 7 dias)
       → CANCELLED
REJECTED (estado final, criado ja com este status)
```

**Indexes**:
- `idx_quotations_status` ON status
- `idx_quotations_seller` ON sellerId
- `idx_quotations_expires` ON expiresAt WHERE status = 'PENDING'

### sellers

Vendedores que atendem leads.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Identificador unico |
| userId | UUID | FK → auth.users.id, NULLABLE | Usuario autenticado |
| name | VARCHAR(255) | NOT NULL | Nome do vendedor |
| email | VARCHAR(255) | NOT NULL | Email |
| phone | VARCHAR(20) | NULLABLE | Telefone |
| isActive | BOOLEAN | DEFAULT true | Se esta ativo |
| role | ENUM | NOT NULL, DEFAULT 'SELLER' | SELLER ou ADMIN |
| lastAssignmentAt | TIMESTAMPTZ | NULLABLE | Ultima atribuicao |
| assignmentCount | INTEGER | DEFAULT 0 | Total de atribuicoes |
| createdAt | TIMESTAMPTZ | DEFAULT NOW() | Data de criacao |

**Role Enum Values**:
- `SELLER`: Ve apenas cotacoes proprias
- `ADMIN`: Acesso completo (todas cotacoes, precos, blacklist)

**Indexes**:
- `idx_sellers_active` ON isActive WHERE isActive = true

### pricing_rules

Regras de preco por categoria e faixa de valor FIPE.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Identificador unico |
| categoria | ENUM | NOT NULL | NORMAL, ESPECIAL, UTILITARIO, MOTO |
| faixaMin | DECIMAL(12,2) | NOT NULL | Valor minimo da faixa |
| faixaMax | DECIMAL(12,2) | NOT NULL | Valor maximo da faixa |
| mensalidade | DECIMAL(10,2) | NOT NULL | Valor da mensalidade |
| cotaParticipacao | DECIMAL(10,2) | NULLABLE | Cota de participacao |
| isActive | BOOLEAN | DEFAULT true | Se esta ativa |
| createdAt | TIMESTAMPTZ | DEFAULT NOW() | Data de criacao |

**Business Rules**:
- Faixas nao devem se sobrepor dentro da mesma categoria
- Adesao = mensalidade * 2
- Adesao com desconto = adesao * 0.80

**Indexes**:
- `idx_pricing_categoria` ON (categoria, faixaMin)
- UNIQUE(categoria, faixaMin)

### blacklist

Marcas e modelos de veiculos nao aceitos.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Identificador unico |
| marca | VARCHAR(100) | NOT NULL | Marca bloqueada |
| modelo | VARCHAR(100) | NULLABLE | Modelo especifico (NULL = toda marca) |
| motivo | VARCHAR(255) | DEFAULT 'Nao trabalhamos com este veiculo' | Motivo |
| isActive | BOOLEAN | DEFAULT true | Se esta ativa |
| createdAt | TIMESTAMPTZ | DEFAULT NOW() | Data de criacao |

**Business Rules**:
- Se modelo = NULL, toda a marca esta bloqueada
- Se modelo especificado, apenas aquele modelo da marca

**Indexes**:
- `idx_blacklist_marca` ON marca WHERE isActive = true
- UNIQUE(marca, modelo)

### round_robin_config

Configuracao do algoritmo round-robin (opcional, pode usar lastAssignmentAt).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Identificador unico |
| currentIndex | INTEGER | DEFAULT 0 | Indice atual |
| updatedAt | TIMESTAMPTZ | DEFAULT NOW() | Ultima atualizacao |

## Drizzle Schema

```typescript
// lib/schema.ts

import { pgTable, uuid, varchar, text, decimal, boolean, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core';

// Enums
export const vehicleCategoryEnum = pgEnum('vehicle_category', ['NORMAL', 'ESPECIAL', 'UTILITARIO', 'MOTO']);
export const usageTypeEnum = pgEnum('usage_type', ['PARTICULAR', 'COMERCIAL']);
export const quotationStatusEnum = pgEnum('quotation_status', ['PENDING', 'CONTACTED', 'ACCEPTED', 'EXPIRED', 'CANCELLED', 'REJECTED']);
export const sellerRoleEnum = pgEnum('seller_role', ['SELLER', 'ADMIN']);

// Tables
export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  cpf: varchar('cpf', { length: 14 }).notNull().unique(),
  cep: varchar('cep', { length: 9 }).notNull(),
  street: varchar('street', { length: 255 }).notNull(),
  number: varchar('number', { length: 20 }).notNull(),
  complement: varchar('complement', { length: 100 }),
  neighborhood: varchar('neighborhood', { length: 100 }).notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  state: varchar('state', { length: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const vehicles = pgTable('vehicles', {
  id: uuid('id').primaryKey().defaultRandom(),
  placa: varchar('placa', { length: 8 }).notNull(),
  marca: varchar('marca', { length: 100 }).notNull(),
  modelo: varchar('modelo', { length: 100 }).notNull(),
  ano: varchar('ano', { length: 10 }).notNull(),
  valorFipe: decimal('valor_fipe', { precision: 12, scale: 2 }).notNull(),
  codigoFipe: varchar('codigo_fipe', { length: 20 }).notNull(),
  combustivel: varchar('combustivel', { length: 50 }),
  cor: varchar('cor', { length: 50 }),
  categoria: vehicleCategoryEnum('categoria').notNull(),
  tipoUso: usageTypeEnum('tipo_uso').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const sellers = pgTable('sellers', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id'),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  isActive: boolean('is_active').default(true),
  role: sellerRoleEnum('role').notNull().default('SELLER'),
  lastAssignmentAt: timestamp('last_assignment_at', { withTimezone: true }),
  assignmentCount: integer('assignment_count').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const quotations = pgTable('quotations', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id').notNull().references(() => customers.id),
  vehicleId: uuid('vehicle_id').notNull().references(() => vehicles.id),
  sellerId: uuid('seller_id').references(() => sellers.id),
  mensalidade: decimal('mensalidade', { precision: 10, scale: 2 }).notNull(),
  adesao: decimal('adesao', { precision: 10, scale: 2 }).notNull(),
  adesaoDesconto: decimal('adesao_desconto', { precision: 10, scale: 2 }).notNull(),
  cotaParticipacao: decimal('cota_participacao', { precision: 10, scale: 2 }),
  status: quotationStatusEnum('status').notNull().default('PENDING'),
  rejectionReason: varchar('rejection_reason', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  contactedAt: timestamp('contacted_at', { withTimezone: true }),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  notes: text('notes'),
});

export const pricingRules = pgTable('pricing_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoria: vehicleCategoryEnum('categoria').notNull(),
  faixaMin: decimal('faixa_min', { precision: 12, scale: 2 }).notNull(),
  faixaMax: decimal('faixa_max', { precision: 12, scale: 2 }).notNull(),
  mensalidade: decimal('mensalidade', { precision: 10, scale: 2 }).notNull(),
  cotaParticipacao: decimal('cota_participacao', { precision: 10, scale: 2 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const blacklist = pgTable('blacklist', {
  id: uuid('id').primaryKey().defaultRandom(),
  marca: varchar('marca', { length: 100 }).notNull(),
  modelo: varchar('modelo', { length: 100 }),
  motivo: varchar('motivo', { length: 255 }).default('Nao trabalhamos com este veiculo'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const roundRobinConfig = pgTable('round_robin_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  currentIndex: integer('current_index').default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
```

## Seed Data Reference

Os dados iniciais para `pricing_rules` e `blacklist` estao definidos no arquivo SQL fornecido pelo cliente:
- `/Users/lincolnborges/Downloads/MA projeto de cotacao/seed-database.sql`

Contem:
- 19 faixas de preco para categoria NORMAL
- 19 faixas de preco para categoria ESPECIAL
- 19 faixas de preco para categoria UTILITARIO
- 19 faixas de preco para categoria MOTO
- 10 marcas bloqueadas (Audi, BMW, Mercedes-Benz, etc)
- 6 modelos especificos bloqueados (Ford Focus/Fusion, Citroen Cactus, etc)
