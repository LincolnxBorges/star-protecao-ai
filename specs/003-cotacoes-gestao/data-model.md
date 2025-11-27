# Data Model: Telas de Gestao de Cotacoes

**Feature**: 003-cotacoes-gestao
**Date**: 2025-11-26

## Nova Tabela: quotation_activities

### Schema Definition (Drizzle)

```typescript
// lib/schema.ts - Adicionar

export const activityTypeEnum = pgEnum("activity_type", [
  "CREATION",
  "STATUS_CHANGE",
  "WHATSAPP_SENT",
  "NOTE",
  "CALL",
  "EMAIL",
  "ASSIGNMENT",
]);

export const quotationActivities = pgTable("quotation_activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  quotationId: uuid("quotation_id")
    .notNull()
    .references(() => quotations.id, { onDelete: "cascade" }),
  type: activityTypeEnum("type").notNull(),
  description: text("description").notNull(),
  authorId: text("author_id").references(() => user.id),
  authorName: varchar("author_name", { length: 255 }), // Para atividades do sistema
  metadata: text("metadata"), // JSON string para dados extras
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
```

### SQL Migration

```sql
-- drizzle/XXXX_add_quotation_activities.sql

CREATE TYPE "activity_type" AS ENUM (
  'CREATION',
  'STATUS_CHANGE',
  'WHATSAPP_SENT',
  'NOTE',
  'CALL',
  'EMAIL',
  'ASSIGNMENT'
);

CREATE TABLE "quotation_activities" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "quotation_id" uuid NOT NULL REFERENCES "quotations"("id") ON DELETE CASCADE,
  "type" "activity_type" NOT NULL,
  "description" text NOT NULL,
  "author_id" text REFERENCES "user"("id"),
  "author_name" varchar(255),
  "metadata" text,
  "created_at" timestamptz DEFAULT NOW()
);

-- Indices para performance
CREATE INDEX idx_quotation_activities_quotation_id
  ON quotation_activities(quotation_id);
CREATE INDEX idx_quotation_activities_created_at
  ON quotation_activities(created_at DESC);
CREATE INDEX idx_quotation_activities_type
  ON quotation_activities(type);
```

## Entidades Existentes (Referencia)

### quotations (existente)

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | uuid | PK |
| customerId | uuid | FK -> customers |
| vehicleId | uuid | FK -> vehicles |
| sellerId | uuid | FK -> sellers (nullable) |
| mensalidade | decimal(10,2) | Valor mensal |
| adesao | decimal(10,2) | Taxa de adesao |
| adesaoDesconto | decimal(10,2) | Adesao com desconto |
| cotaParticipacao | decimal(10,2) | Cota em sinistro |
| status | enum | PENDING, CONTACTED, ACCEPTED, EXPIRED, CANCELLED, REJECTED |
| rejectionReason | varchar(255) | Motivo de rejeicao |
| createdAt | timestamptz | Data criacao |
| expiresAt | timestamptz | Data expiracao (7 dias) |
| contactedAt | timestamptz | Data do primeiro contato |
| acceptedAt | timestamptz | Data da aceitacao |
| notes | text | Observacoes (legado, migrar para activities) |

### customers (existente)

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | uuid | PK |
| name | varchar(255) | Nome completo |
| email | varchar(255) | Email |
| phone | varchar(20) | Telefone/WhatsApp |
| cpf | varchar(14) | CPF formatado |
| cep | varchar(9) | CEP |
| street | varchar(255) | Logradouro |
| number | varchar(20) | Numero |
| complement | varchar(100) | Complemento |
| neighborhood | varchar(100) | Bairro |
| city | varchar(100) | Cidade |
| state | varchar(2) | UF |

### vehicles (existente)

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | uuid | PK |
| placa | varchar(8) | Placa do veiculo |
| marca | varchar(100) | Marca |
| modelo | varchar(100) | Modelo |
| ano | varchar(10) | Ano fabricacao/modelo |
| valorFipe | decimal(12,2) | Valor FIPE |
| codigoFipe | varchar(20) | Codigo tabela FIPE |
| combustivel | varchar(50) | Tipo combustivel |
| cor | varchar(50) | Cor |
| categoria | enum | NORMAL, ESPECIAL, UTILITARIO, MOTO |
| tipoUso | enum | PARTICULAR, COMERCIAL |

### sellers (existente)

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | uuid | PK |
| userId | text | FK -> user (nullable) |
| name | varchar(255) | Nome |
| email | varchar(255) | Email |
| phone | varchar(20) | Telefone |
| isActive | boolean | Ativo para round-robin |
| role | enum | SELLER, ADMIN |

## Relacionamentos

```
quotations 1 -----> N quotation_activities
quotations N -----> 1 customers
quotations N -----> 1 vehicles
quotations N -----> 1 sellers (nullable)
quotation_activities N -----> 1 user (nullable, para autor)
```

## Indices Necessarios

### Novos Indices

```sql
-- Para busca de cotacoes
CREATE INDEX idx_quotations_status ON quotations(status);
CREATE INDEX idx_quotations_seller_id ON quotations(seller_id);
CREATE INDEX idx_quotations_created_at ON quotations(created_at DESC);
CREATE INDEX idx_quotations_expires_at ON quotations(expires_at) WHERE status = 'PENDING';

-- Para busca full-text (considerar pg_trgm para LIKE)
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_cpf ON customers(cpf);
CREATE INDEX idx_vehicles_placa ON vehicles(placa);
```

## Transicoes de Estado

```
PENDING -> CONTACTED -> ACCEPTED
                    \-> CANCELLED

PENDING -> CANCELLED

PENDING -> EXPIRED (automatico apos 7 dias)

REJECTED (estado final, sem transicoes)
```

### Regras de Transicao

| De | Para | Requisitos |
|----|------|------------|
| PENDING | CONTACTED | Nenhum |
| PENDING | CANCELLED | Observacao obrigatoria |
| CONTACTED | ACCEPTED | Observacao obrigatoria |
| CONTACTED | CANCELLED | Observacao obrigatoria |
| PENDING | EXPIRED | Automatico via cron/trigger |

## Tipos TypeScript

```typescript
// types/quotations.ts

export type QuotationStatus =
  | "PENDING"
  | "CONTACTED"
  | "ACCEPTED"
  | "EXPIRED"
  | "CANCELLED"
  | "REJECTED";

export type VehicleCategory =
  | "NORMAL"
  | "ESPECIAL"
  | "UTILITARIO"
  | "MOTO";

export type UsageType =
  | "PARTICULAR"
  | "COMERCIAL";

export type ActivityType =
  | "CREATION"
  | "STATUS_CHANGE"
  | "WHATSAPP_SENT"
  | "NOTE"
  | "CALL"
  | "EMAIL"
  | "ASSIGNMENT";

export interface QuotationFilters {
  status?: QuotationStatus[];
  category?: VehicleCategory[];
  sellerId?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  fipeMin?: number;
  fipeMax?: number;
  page?: number;
  limit?: number;
  orderBy?: "createdAt" | "mensalidade" | "valorFipe" | "customerName";
  orderDir?: "asc" | "desc";
}

export interface QuotationActivity {
  id: string;
  quotationId: string;
  type: ActivityType;
  description: string;
  authorId: string | null;
  authorName: string | null;
  metadata: string | null;
  createdAt: Date;
}

export interface StatusCount {
  status: QuotationStatus;
  count: number;
}
```
