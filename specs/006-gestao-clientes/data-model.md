# Data Model: Gestao de Clientes

**Feature**: 006-gestao-clientes
**Date**: 2025-11-27

## Entity Relationship Diagram

```
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│     customers    │       │    quotations    │       │     sellers      │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ id (PK)          │◄──────│ customerId (FK)  │       │ id (PK)          │
│ name             │       │ vehicleId (FK)   │       │ userId (FK)      │
│ email            │       │ sellerId (FK)    │──────►│ name             │
│ phone            │       │ mensalidade      │       │ email            │
│ cpf (UNIQUE)     │       │ adesao           │       │ phone            │
│ cep              │       │ status           │       │ status           │
│ street           │       │ createdAt        │       │ role             │
│ number           │       │ expiresAt        │       │ ...              │
│ complement       │       │ acceptedAt       │       └──────────────────┘
│ neighborhood     │       │ ...              │
│ city             │       └──────────────────┘
│ state            │
│ deletedAt (NEW)  │       ┌──────────────────────┐
│ createdAt        │       │  clientInteractions  │ (NEW)
│ updatedAt        │       ├──────────────────────┤
└──────────────────┘       │ id (PK)              │
        ▲                  │ customerId (FK)      │───────┐
        │                  │ sellerId (FK)        │───────│
        │                  │ type                 │       │
        └──────────────────│ result               │       │
                           │ description          │       ▼
                           │ scheduledFollowUp    │  ┌──────────────┐
                           │ createdAt            │  │   sellers    │
                           └──────────────────────┘  └──────────────┘
```

## Schema Changes

### 1. Update: customers table

Add soft delete support:

```typescript
// In lib/schema.ts - UPDATE existing table
export const customers = pgTable("customers", {
  // ... existing fields ...

  // NEW FIELD: Soft delete support
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});
```

### 2. New: Interaction Type Enum

```typescript
export const interactionTypeEnum = pgEnum("interaction_type", [
  "CALL_MADE",       // Ligacao realizada
  "CALL_RECEIVED",   // Ligacao recebida
  "WHATSAPP_SENT",   // WhatsApp enviado
  "WHATSAPP_RECEIVED", // WhatsApp recebido
  "EMAIL_SENT",      // Email enviado
  "EMAIL_RECEIVED",  // Email recebido
  "MEETING",         // Reuniao/Visita
  "NOTE",            // Observacao geral
]);
```

### 3. New: Interaction Result Enum

```typescript
export const interactionResultEnum = pgEnum("interaction_result", [
  "POSITIVE",    // Cliente interessado
  "NEUTRAL",     // Aguardando retorno
  "NEGATIVE",    // Cliente desinteressado
  "NO_CONTACT",  // Nao atendeu
]);
```

### 4. New: clientInteractions table

```typescript
export const clientInteractions = pgTable("client_interactions", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Foreign keys
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  sellerId: uuid("seller_id")
    .notNull()
    .references(() => sellers.id),

  // Interaction details
  type: interactionTypeEnum("type").notNull(),
  result: interactionResultEnum("result"),
  description: text("description").notNull(),

  // Optional follow-up scheduling
  scheduledFollowUp: timestamp("scheduled_follow_up", { withTimezone: true }),

  // Metadata
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
```

## Entities

### Customer (Existing - Extended)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK, auto | Identificador unico |
| name | varchar(255) | NOT NULL | Nome completo |
| email | varchar(255) | NOT NULL | Email de contato |
| phone | varchar(20) | NOT NULL | Telefone com DDD |
| cpf | varchar(14) | NOT NULL, UNIQUE | CPF formatado |
| cep | varchar(9) | NOT NULL | CEP |
| street | varchar(255) | NOT NULL | Logradouro |
| number | varchar(20) | NOT NULL | Numero |
| complement | varchar(100) | NULL | Complemento |
| neighborhood | varchar(100) | NOT NULL | Bairro |
| city | varchar(100) | NOT NULL | Cidade |
| state | varchar(2) | NOT NULL | UF |
| **deletedAt** | timestamp | NULL | **NEW** - Soft delete |
| createdAt | timestamp | DEFAULT NOW | Data de criacao |
| updatedAt | timestamp | DEFAULT NOW | Data de atualizacao |

### ClientInteraction (New)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK, auto | Identificador unico |
| customerId | uuid | FK, NOT NULL | Referencia ao cliente |
| sellerId | uuid | FK, NOT NULL | Vendedor que registrou |
| type | enum | NOT NULL | Tipo de interacao |
| result | enum | NULL | Resultado da interacao |
| description | text | NOT NULL | Descricao/anotacao |
| scheduledFollowUp | timestamp | NULL | Agendamento de retorno |
| createdAt | timestamp | DEFAULT NOW | Data da interacao |

## Computed/Virtual Fields

Os seguintes campos sao calculados em runtime, nao armazenados:

### ClientStatus (Computed)

```typescript
type ClientStatus = 'CONVERTED' | 'NEGOTIATING' | 'INACTIVE' | 'LOST' | 'NEW';
```

**Regras de Calculo**:
1. **CONVERTED** - Tem pelo menos 1 cotacao com status ACCEPTED
2. **NEGOTIATING** - Tem cotacao PENDING ou CONTACTED
3. **NEW** - Cadastrado nos ultimos 7 dias sem cotacoes
4. **LOST** - Todas cotacoes sao EXPIRED, CANCELLED ou REJECTED
5. **INACTIVE** - Sem cotacao nos ultimos 30 dias

### QuotationCount (Computed)

```typescript
interface QuotationMetrics {
  total: number;      // Total de cotacoes
  accepted: number;   // Cotacoes aceitas
  pending: number;    // Cotacoes pendentes
  monthlyValue: number; // Soma das mensalidades aceitas
}
```

### LastInteractionAt (Computed)

```typescript
// Data da ultima interacao registrada
lastInteractionAt: Date | null;
```

## Validation Rules

### CustomerInteraction Validation

```typescript
const createInteractionSchema = z.object({
  customerId: z.string().uuid(),
  type: z.enum([
    'CALL_MADE', 'CALL_RECEIVED',
    'WHATSAPP_SENT', 'WHATSAPP_RECEIVED',
    'EMAIL_SENT', 'EMAIL_RECEIVED',
    'MEETING', 'NOTE'
  ]),
  result: z.enum(['POSITIVE', 'NEUTRAL', 'NEGATIVE', 'NO_CONTACT']).optional(),
  description: z.string().min(1, 'Descricao obrigatoria').max(2000),
  scheduledFollowUp: z.date().optional(),
});
```

## Indexes (Recommendations)

```sql
-- Performance indexes for client queries
CREATE INDEX idx_customers_deleted_at ON customers(deleted_at);
CREATE INDEX idx_customers_city ON customers(city);
CREATE INDEX idx_customers_name_search ON customers USING gin(name gin_trgm_ops);

-- Client interactions indexes
CREATE INDEX idx_client_interactions_customer ON client_interactions(customer_id);
CREATE INDEX idx_client_interactions_seller ON client_interactions(seller_id);
CREATE INDEX idx_client_interactions_created ON client_interactions(created_at DESC);
```

## Migration Steps

1. Add `deletedAt` column to `customers` table
2. Create `interaction_type` enum
3. Create `interaction_result` enum
4. Create `client_interactions` table
5. Add indexes for performance

**Migration Command**:
```bash
npm run db:generate
npm run db:migrate
```
