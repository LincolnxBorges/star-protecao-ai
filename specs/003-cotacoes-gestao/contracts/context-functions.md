# Context Functions: Telas de Gestao de Cotacoes

**Feature**: 003-cotacoes-gestao
**Date**: 2025-11-26

## Overview

Funcoes do modulo de contexto `lib/quotations.ts` para logica de negocio. Seguem principio de funcoes simples com Drizzle ORM direto.

---

## Funcoes Existentes (a preservar/extender)

### createQuotation

Ja implementada. Mantem como esta.

### getQuotationById

Ja implementada. Mantem como esta.

### listQuotations

Existente, precisa extender para suportar novos filtros.

### updateQuotationStatus

Existente, precisa adicionar criacao de atividade.

### canAccessQuotation

Ja implementada. Mantem como esta.

### getQuotationByIdWithAccessCheck

Ja implementada. Mantem como esta.

---

## Novas Funcoes

### listQuotationsWithFilters

```typescript
interface QuotationFilters {
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

export async function listQuotationsWithFilters(
  filters: QuotationFilters
): Promise<{
  items: QuotationWithRelations[];
  total: number;
}>
```

**Implementation Notes**:
- Usar `sql` template do Drizzle para queries dinamicas
- Aplicar filtro de `sellerId` baseado em autorizacao
- Busca `search` via ILIKE em: customer.name, customer.phone, customer.cpf, vehicle.placa, vehicle.marca, vehicle.modelo

---

### getStatusCounts

```typescript
export async function getStatusCounts(
  sellerId?: string
): Promise<Array<{ status: QuotationStatus; count: number }>>
```

**Implementation Notes**:
- Query com GROUP BY status
- Filtrar por sellerId se fornecido
- Retornar todos os status mesmo com count 0

---

### createQuotationActivity

```typescript
interface CreateActivityData {
  quotationId: string;
  type: ActivityType;
  description: string;
  authorId?: string;
  authorName?: string;
  metadata?: Record<string, unknown>;
}

export async function createQuotationActivity(
  data: CreateActivityData
): Promise<QuotationActivity>
```

**Implementation Notes**:
- Inserir na tabela `quotation_activities`
- `metadata` serializado como JSON string
- Se `authorId` fornecido, buscar nome do usuario

---

### listQuotationActivities

```typescript
export async function listQuotationActivities(
  quotationId: string,
  options?: { limit?: number }
): Promise<QuotationActivity[]>
```

**Implementation Notes**:
- Ordenar por `createdAt DESC`
- Limit padrao 50

---

### updateQuotationStatusWithActivity

```typescript
export async function updateQuotationStatusWithActivity(
  id: string,
  status: QuotationStatus,
  notes: string | undefined,
  authorId: string,
  authorName: string
): Promise<{
  quotation: Quotation;
  activity: QuotationActivity;
}>
```

**Implementation Notes**:
- Usar transacao para garantir atomicidade
- Validar transicao de status
- Criar atividade de STATUS_CHANGE
- Atualizar timestamps (contactedAt, acceptedAt)

---

### reassignQuotation

```typescript
export async function reassignQuotation(
  quotationId: string,
  newSellerId: string,
  authorId: string,
  authorName: string
): Promise<{
  quotation: Quotation;
  activity: QuotationActivity;
}>
```

**Implementation Notes**:
- Validar que novo seller existe e esta ativo
- Criar atividade de ASSIGNMENT
- Incluir vendedor anterior no metadata

---

### softDeleteQuotation

```typescript
export async function softDeleteQuotation(
  id: string
): Promise<void>
```

**Implementation Notes**:
- Adicionar campo `deletedAt` ao schema se nao existir
- Ou usar status especial se preferir

---

### searchQuotations

```typescript
export async function searchQuotations(
  term: string,
  sellerId?: string,
  limit?: number
): Promise<QuotationWithRelations[]>
```

**Implementation Notes**:
- Busca rapida para autocomplete
- ILIKE em campos indexados
- Limit padrao 10

---

## Funcoes Auxiliares

### isQuotationExpired

```typescript
export function isQuotationExpired(
  quotation: { expiresAt: Date | null; status: string }
): boolean
```

### canTransitionStatus

```typescript
export function canTransitionStatus(
  currentStatus: QuotationStatus,
  newStatus: QuotationStatus
): boolean
```

### formatActivityDescription

```typescript
export function formatActivityDescription(
  type: ActivityType,
  metadata?: Record<string, unknown>
): string
```

---

## Testes Unitarios

Cada funcao deve ter testes cobrindo:

1. **Happy path**: Comportamento esperado
2. **Edge cases**: Valores limite, nulos
3. **Error cases**: Validacoes, autorizacao
4. **Transacoes**: Rollback em caso de erro

Exemplo estrutura:

```typescript
// __tests__/unit/lib/quotations.test.ts

describe("listQuotationsWithFilters", () => {
  it("should return paginated results", async () => {});
  it("should filter by status", async () => {});
  it("should filter by sellerId", async () => {});
  it("should search by customer name", async () => {});
  it("should search by vehicle plate", async () => {});
  it("should order by createdAt desc by default", async () => {});
});

describe("updateQuotationStatusWithActivity", () => {
  it("should update status and create activity", async () => {});
  it("should reject invalid transition", async () => {});
  it("should reject expired quotation", async () => {});
  it("should rollback on activity creation failure", async () => {});
});

describe("createQuotationActivity", () => {
  it("should create activity with author", async () => {});
  it("should serialize metadata as JSON", async () => {});
});
```
