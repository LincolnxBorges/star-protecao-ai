# Server Actions: Telas de Gestao de Cotacoes

**Feature**: 003-cotacoes-gestao
**Date**: 2025-11-26

## Overview

Server Actions para operacoes de mutacao nas telas de gestao de cotacoes. Definidos em `app/(admin)/cotacoes/actions.ts`.

---

## listQuotationsAction

**Purpose**: Buscar lista de cotacoes com filtros, busca e paginacao.

### Input Schema (Zod)

```typescript
const listQuotationsSchema = z.object({
  status: z.array(z.enum([
    "PENDING", "CONTACTED", "ACCEPTED", "EXPIRED", "CANCELLED", "REJECTED"
  ])).optional(),
  category: z.array(z.enum([
    "NORMAL", "ESPECIAL", "UTILITARIO", "MOTO"
  ])).optional(),
  sellerId: z.string().uuid().optional(),
  search: z.string().max(100).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  fipeMin: z.number().min(0).optional(),
  fipeMax: z.number().max(1000000).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(10).max(50).default(10),
  orderBy: z.enum(["createdAt", "mensalidade", "valorFipe", "customerName"]).default("createdAt"),
  orderDir: z.enum(["asc", "desc"]).default("desc"),
});
```

### Output

```typescript
interface ListQuotationsResult {
  items: QuotationWithRelations[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  statusCounts: StatusCount[];
}
```

### Authorization

- Vendedores: Automaticamente filtrado por `sellerId` do usuario logado
- Administradores: Podem filtrar por qualquer `sellerId` ou ver todas

---

## getQuotationDetailsAction

**Purpose**: Buscar detalhes completos de uma cotacao com atividades.

### Input Schema

```typescript
const getQuotationDetailsSchema = z.object({
  id: z.string().uuid(),
});
```

### Output

```typescript
interface QuotationDetailsResult {
  quotation: QuotationWithRelations;
  activities: QuotationActivity[];
  canEdit: boolean;
  canDelete: boolean;
  canReassign: boolean;
}
```

### Authorization

- Vendedores: Apenas cotacoes atribuidas a eles
- Administradores: Todas as cotacoes

### Errors

- `NOT_FOUND`: Cotacao nao existe
- `FORBIDDEN`: Usuario nao tem permissao

---

## updateQuotationStatusAction

**Purpose**: Alterar status de uma cotacao.

### Input Schema

```typescript
const updateStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["CONTACTED", "ACCEPTED", "CANCELLED"]),
  notes: z.string().min(1).max(500).optional(),
}).refine(
  (data) => {
    // Observacao obrigatoria para ACCEPTED e CANCELLED
    if (data.status === "ACCEPTED" || data.status === "CANCELLED") {
      return !!data.notes;
    }
    return true;
  },
  { message: "Observacao obrigatoria para este status" }
);
```

### Output

```typescript
interface UpdateStatusResult {
  success: boolean;
  quotation: Quotation;
  activity: QuotationActivity;
}
```

### Authorization

- Vendedores: Apenas cotacoes atribuidas a eles
- Administradores: Todas as cotacoes

### Business Rules

1. Validar transicao de status permitida
2. Cotacoes expiradas nao podem ter status alterado
3. Registrar atividade no historico
4. Atualizar timestamps (contactedAt, acceptedAt)

### Errors

- `NOT_FOUND`: Cotacao nao existe
- `FORBIDDEN`: Usuario nao tem permissao
- `INVALID_TRANSITION`: Transicao de status invalida
- `EXPIRED`: Cotacao expirada

---

## addQuotationNoteAction

**Purpose**: Adicionar nota/observacao ao historico da cotacao.

### Input Schema

```typescript
const addNoteSchema = z.object({
  quotationId: z.string().uuid(),
  type: z.enum(["NOTE", "CALL", "EMAIL", "WHATSAPP_SENT"]),
  description: z.string().min(1).max(1000),
});
```

### Output

```typescript
interface AddNoteResult {
  success: boolean;
  activity: QuotationActivity;
}
```

### Authorization

- Vendedores: Apenas cotacoes atribuidas a eles
- Administradores: Todas as cotacoes

---

## reassignQuotationAction

**Purpose**: Reatribuir cotacao para outro vendedor.

### Input Schema

```typescript
const reassignSchema = z.object({
  quotationId: z.string().uuid(),
  newSellerId: z.string().uuid(),
});
```

### Output

```typescript
interface ReassignResult {
  success: boolean;
  quotation: Quotation;
  activity: QuotationActivity;
}
```

### Authorization

- Apenas administradores

---

## deleteQuotationAction

**Purpose**: Excluir cotacao (soft delete).

### Input Schema

```typescript
const deleteSchema = z.object({
  id: z.string().uuid(),
});
```

### Output

```typescript
interface DeleteResult {
  success: boolean;
}
```

### Authorization

- Apenas administradores

### Business Rules

- Soft delete: marca como excluida, nao remove do banco
- Considerar adicionar campo `deletedAt` na tabela `quotations`

---

## bulkUpdateStatusAction

**Purpose**: Atualizar status de multiplas cotacoes.

### Input Schema

```typescript
const bulkUpdateSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(50),
  status: z.enum(["CONTACTED"]),
});
```

### Output

```typescript
interface BulkUpdateResult {
  success: boolean;
  updated: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}
```

### Authorization

- Vendedores: Apenas suas cotacoes
- Administradores: Todas

---

## getStatusCountsAction

**Purpose**: Obter contadores de cotacoes por status.

### Input Schema

```typescript
const getStatusCountsSchema = z.object({
  sellerId: z.string().uuid().optional(),
});
```

### Output

```typescript
interface StatusCountsResult {
  counts: Array<{
    status: QuotationStatus;
    count: number;
  }>;
  total: number;
}
```

### Authorization

- Vendedores: Apenas suas cotacoes
- Administradores: Podem especificar `sellerId` ou ver total geral
