# Server Actions: Gestao de Vendedores

**Feature**: 005-gestao-vendedores
**Date**: 2025-11-27

## Arquivo: `app/(admin)/vendedores/actions.ts`

### 1. listSellersAction

Lista vendedores com filtros e paginacao.

**Input**:
```typescript
interface ListSellersParams {
  page?: number;           // Default: 1
  limit?: number;          // Default: 10, opcoes: 10, 25, 50
  search?: string;         // Busca por nome, email, telefone
  status?: SellerStatus[]; // Filtro por status
  sortBy?: SortField;      // Campo de ordenacao
  sortOrder?: 'asc' | 'desc';
}

type SellerStatus = 'ACTIVE' | 'INACTIVE' | 'VACATION';
type SortField = 'name' | 'quotations' | 'accepted' | 'conversion' | 'responseTime' | 'lastLead' | 'createdAt';
```

**Output**:
```typescript
interface ListSellersResult {
  success: boolean;
  data?: {
    items: SellerWithMetrics[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    teamMetrics: TeamMetrics;
  };
  error?: string;
}
```

---

### 2. getSellerProfileAction

Busca perfil detalhado de um vendedor.

**Input**:
```typescript
interface GetSellerProfileParams {
  sellerId: string;
  period?: {
    startDate: Date;
    endDate: Date;
  };
}
```

**Output**:
```typescript
interface GetSellerProfileResult {
  success: boolean;
  data?: {
    seller: Seller;
    metrics: SellerMetrics;
    monthlyEvolution: MonthlyData[];
    recentQuotations: QuotationSummary[];
  };
  error?: string;
}
```

---

### 3. createSellerAction

Cria novo vendedor.

**Input**:
```typescript
interface CreateSellerParams {
  name: string;
  email: string;
  phone: string;
  cargo?: string;
  role: 'SELLER' | 'ADMIN';
  password: string;
  status: SellerStatus;
  participateRoundRobin: boolean;
  notifyEmail: boolean;
  notifyWhatsapp: boolean;
}
```

**Output**:
```typescript
interface CreateSellerResult {
  success: boolean;
  data?: Seller;
  error?: string;
}
```

**Validacoes**:
- Email unico
- Email formato valido
- Senha: min 8 chars, 1 numero, 1 maiuscula
- Nome: min 3 chars
- Telefone: formato brasileiro

---

### 4. updateSellerAction

Atualiza dados do vendedor.

**Input**:
```typescript
interface UpdateSellerParams {
  sellerId: string;
  data: {
    name?: string;
    email?: string;
    phone?: string;
    cargo?: string;
    role?: 'SELLER' | 'ADMIN';
    notifyEmail?: boolean;
    notifyWhatsapp?: boolean;
  };
}
```

**Output**:
```typescript
interface UpdateSellerResult {
  success: boolean;
  data?: Seller;
  error?: string;
}
```

---

### 5. changeSellerStatusAction

Ativa, desativa ou coloca vendedor em ferias.

**Input**:
```typescript
interface ChangeSellerStatusParams {
  sellerId: string;
  newStatus: SellerStatus;
  reason?: string;
  pendingLeadsAction?: 'keep' | 'redistribute' | 'assign';
  assignToSellerId?: string; // Se pendingLeadsAction === 'assign'
}
```

**Output**:
```typescript
interface ChangeSellerStatusResult {
  success: boolean;
  data?: {
    seller: Seller;
    reassignedLeads?: number;
  };
  error?: string;
}
```

**Regras**:
- Se desativando e tem leads pendentes, exigir pendingLeadsAction
- Se 'redistribute', distribuir igualmente entre ativos
- Se 'assign', atribuir todos ao vendedor especificado
- Se voltando para ACTIVE, colocar no final da fila

---

### 6. resetSellerPasswordAction

Redefine senha do vendedor (admin only).

**Input**:
```typescript
interface ResetSellerPasswordParams {
  sellerId: string;
  newPassword: string;
  requireChangeOnLogin?: boolean;
}
```

**Output**:
```typescript
interface ResetSellerPasswordResult {
  success: boolean;
  error?: string;
}
```

---

### 7. deleteSellerAction

Exclui vendedor (soft delete ou hard delete).

**Input**:
```typescript
interface DeleteSellerParams {
  sellerId: string;
  pendingLeadsAction: 'redistribute' | 'assign';
  assignToSellerId?: string;
}
```

**Output**:
```typescript
interface DeleteSellerResult {
  success: boolean;
  error?: string;
}
```

---

### 8. reassignLeadsAction

Reatribui leads de um vendedor para outros.

**Input**:
```typescript
interface ReassignLeadsParams {
  fromSellerId: string;
  quotationIds: string[];
  distribution: 'equal' | 'specific';
  toSellerId?: string; // Se distribution === 'specific'
}
```

**Output**:
```typescript
interface ReassignLeadsResult {
  success: boolean;
  data?: {
    reassignedCount: number;
    assignments: { quotationId: string; toSellerId: string }[];
  };
  error?: string;
}
```

---

### 9. getRoundRobinConfigAction

Busca configuracoes do round-robin.

**Input**: none

**Output**:
```typescript
interface GetRoundRobinConfigResult {
  success: boolean;
  data?: {
    config: RoundRobinConfig;
    queue: SellerQueueItem[];
  };
  error?: string;
}

interface SellerQueueItem {
  seller: Seller;
  position: number;
  isNext: boolean;
}
```

---

### 10. updateRoundRobinConfigAction

Atualiza configuracoes do round-robin.

**Input**:
```typescript
interface UpdateRoundRobinConfigParams {
  method?: RoundRobinMethod;
  pendingLeadLimit?: number;
  skipOverloaded?: boolean;
  notifyWhenAllOverloaded?: boolean;
}

type RoundRobinMethod = 'SEQUENTIAL' | 'LOAD_BALANCE' | 'PERFORMANCE' | 'SPEED';
```

**Output**:
```typescript
interface UpdateRoundRobinConfigResult {
  success: boolean;
  data?: RoundRobinConfig;
  error?: string;
}
```

---

### 11. reorderRoundRobinQueueAction

Reordena fila do round-robin.

**Input**:
```typescript
interface ReorderRoundRobinQueueParams {
  sellerIds: string[]; // Array ordenado de IDs
}
```

**Output**:
```typescript
interface ReorderRoundRobinQueueResult {
  success: boolean;
  error?: string;
}
```

---

### 12. resetRoundRobinQueueAction

Reseta fila para ordem alfabetica.

**Input**: none

**Output**:
```typescript
interface ResetRoundRobinQueueResult {
  success: boolean;
  error?: string;
}
```

---

## Authorization

Todas as actions verificam:
1. Usuario autenticado via `getSession()`
2. Usuario tem role ADMIN via `getSellerByUserId()` -> seller.role === 'ADMIN'

Se nao autorizado, retorna `{ success: false, error: "Acesso nao autorizado" }`
