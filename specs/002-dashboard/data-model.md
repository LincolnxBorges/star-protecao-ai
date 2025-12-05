# Data Model: Dashboard do Vendedor

**Feature**: 002-dashboard
**Date**: 2025-11-26

## Entities Overview

Este dashboard utiliza principalmente entidades existentes no schema (`lib/schema.ts`), com uma extensão para metas de vendedores.

## Existing Entities (Read-Only for Dashboard)

### Quotation (quotations)

Entidade central para cálculos de KPI e listagens.

| Field | Type | Dashboard Usage |
|-------|------|-----------------|
| `id` | uuid | Identificador único |
| `customerId` | uuid FK | Referência ao cliente |
| `vehicleId` | uuid FK | Referência ao veículo |
| `sellerId` | uuid FK | Filtro por vendedor logado |
| `mensalidade` | decimal(10,2) | Cálculo de Potencial Mensal |
| `status` | enum | KPIs, distribuição por status |
| `createdAt` | timestamp | Ordenação, filtro por período |
| `expiresAt` | timestamp | Alertas de cotações expirando |
| `contactedAt` | timestamp | Alertas de leads sem contato |

**Status Enum Values**:
- `PENDING` → Pendente (amarelo)
- `CONTACTED` → Contatado (azul)
- `ACCEPTED` → Aceita (verde)
- `EXPIRED` → Expirada (cinza)
- `CANCELLED` → Cancelada (vermelho)
- `REJECTED` → Rejeitada (vermelho)

### Seller (sellers)

Usuário vendedor para ranking e autenticação.

| Field | Type | Dashboard Usage |
|-------|------|-----------------|
| `id` | uuid | Identificador único |
| `userId` | text FK | Vínculo com auth user |
| `name` | varchar(255) | Exibição no ranking |
| `role` | enum | Diferenciação Admin/Seller |
| `isActive` | boolean | Filtro de ativos |

### Customer (customers)

Dados do cliente para exibição na lista de cotações.

| Field | Type | Dashboard Usage |
|-------|------|-----------------|
| `id` | uuid | Identificador único |
| `name` | varchar(255) | Nome na lista de cotações |
| `phone` | varchar(20) | Ação rápida: ligar/WhatsApp |

### Vehicle (vehicles)

Dados do veículo para exibição na lista de cotações.

| Field | Type | Dashboard Usage |
|-------|------|-----------------|
| `id` | uuid | Identificador único |
| `marca` | varchar(100) | Exibição do veículo |
| `modelo` | varchar(100) | Exibição do veículo |
| `ano` | varchar(10) | Exibição do veículo |
| `valorFipe` | decimal(12,2) | Exibição do valor FIPE |
| `categoria` | enum | Ícone do tipo de veículo |

**Category Enum → Icon Mapping**:
- `NORMAL` → Car icon
- `ESPECIAL` → Car icon
- `UTILITARIO` → Truck icon
- `MOTO` → Bike icon

## New Entity: Seller Goals

### seller_goals

Nova tabela para armazenar metas mensais de vendedores.

```typescript
// lib/schema.ts - Addition
export const sellerGoals = pgTable("seller_goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  sellerId: uuid("seller_id")
    .notNull()
    .references(() => sellers.id, { onDelete: "cascade" }),
  month: integer("month").notNull(), // 1-12
  year: integer("year").notNull(),
  targetAccepted: integer("target_accepted").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
})
```

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | uuid | PK, auto | Identificador único |
| `sellerId` | uuid | FK, NOT NULL | Referência ao vendedor |
| `month` | integer | NOT NULL, 1-12 | Mês da meta |
| `year` | integer | NOT NULL | Ano da meta |
| `targetAccepted` | integer | NOT NULL, > 0 | Número de cotações aceitas como meta |
| `createdAt` | timestamp | DEFAULT now() | Data de criação |

**Unique Constraint**: (`sellerId`, `month`, `year`) - Um vendedor só pode ter uma meta por mês/ano.

## Relationships Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   sellers   │────<│  quotations │>────│  customers  │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │
       │                   │
       ▼                   ▼
┌─────────────┐     ┌─────────────┐
│seller_goals │     │  vehicles   │
│   (NEW)     │     └─────────────┘
└─────────────┘

Legend:
────< One-to-Many
>──── Many-to-One
```

## Computed Values (Not Stored)

Valores calculados em runtime no módulo `lib/dashboard.ts`:

### KPIs

| KPI | Calculation | Period |
|-----|-------------|--------|
| Pendentes | `COUNT(quotations WHERE status = PENDING AND sellerId = ?)` | Selected period |
| Aceitas | `COUNT(quotations WHERE status = ACCEPTED AND sellerId = ?)` | Selected period |
| Potencial Mensal | `SUM(mensalidade WHERE status = ACCEPTED AND sellerId = ?)` | Current month |
| Conversão | `(Aceitas / Total) * 100` | Selected period |

### Alerts

| Alert | Condition |
|-------|-----------|
| Expiring Today | `expiresAt BETWEEN today_start AND today_end AND status = PENDING` |
| No Contact 24h+ | `contactedAt IS NULL AND createdAt < now() - 24h AND status = PENDING` |

### Ranking

```sql
SELECT
  sellers.id,
  sellers.name,
  COUNT(quotations.id) as accepted_count
FROM sellers
LEFT JOIN quotations ON quotations.sellerId = sellers.id
WHERE quotations.status = 'ACCEPTED'
  AND quotations.acceptedAt >= month_start
  AND quotations.acceptedAt <= month_end
GROUP BY sellers.id
ORDER BY accepted_count DESC
LIMIT 5
```

## State Transitions

### Quotation Status Flow

```
                    ┌─────────────┐
                    │   PENDING   │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
       ┌──────────┐  ┌──────────┐  ┌──────────┐
       │CONTACTED │  │ EXPIRED  │  │CANCELLED │
       └────┬─────┘  └──────────┘  └──────────┘
            │
    ┌───────┼───────┐
    │       │       │
    ▼       ▼       ▼
┌────────┐ ┌────────┐ ┌────────┐
│ACCEPTED│ │REJECTED│ │EXPIRED │
└────────┘ └────────┘ └────────┘
```

**Transitions Triggered by Dashboard**:
- `PENDING → CONTACTED`: Confirmação manual após contato (FR-010a)

**Auto Transitions (Background Job)**:
- `PENDING → EXPIRED`: Quando `expiresAt < now()`
- `CONTACTED → EXPIRED`: Quando `expiresAt < now()`

## Validation Rules

### Period Filter

```typescript
const periodSchema = z.enum(["today", "week", "month"])
```

### Goal Target

```typescript
const goalSchema = z.object({
  sellerId: z.string().uuid(),
  month: z.number().min(1).max(12),
  year: z.number().min(2024).max(2100),
  targetAccepted: z.number().min(1),
})
```

## Migration Required

```bash
# Generate migration for seller_goals table
npm run db:generate

# Apply migration
npm run db:migrate
```
