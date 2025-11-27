# Research: Gestao de Clientes

**Feature**: 006-gestao-clientes
**Date**: 2025-11-27

## Research Topics

### 1. Relacionamento Cliente-Vendedor

**Decision**: Cliente vinculado ao vendedor atraves das cotacoes (relacao indireta)

**Rationale**: A tabela `quotations` ja possui `sellerId`, entao o vendedor responsavel por um cliente e determinado pela cotacao mais recente ou pela cotacao aceita. Isso evita duplicacao de dados e mantem consistencia com o modelo existente.

**Alternatives Considered**:
- Adicionar `sellerId` direto na tabela `customers` - rejeitado porque um cliente pode ter cotacoes de diferentes vendedores ao longo do tempo
- Criar tabela de associacao `customer_seller` - over-engineering para o caso de uso atual

### 2. Calculo de Status do Cliente

**Decision**: Status calculado dinamicamente baseado nas cotacoes

**Rationale**: O status e derivado do estado das cotacoes, nao precisa ser armazenado. Isso garante consistencia automatica quando cotacoes mudam de status.

**Logica de Calculo**:
```typescript
function calculateClientStatus(customer, quotations, lastInteraction) {
  // Prioridade 1: Se tem cotacao aceita = CONVERTED
  if (quotations.some(q => q.status === 'ACCEPTED')) {
    return 'CONVERTED';
  }

  // Prioridade 2: Se tem cotacao pendente/contatada = NEGOTIATING
  if (quotations.some(q => ['PENDING', 'CONTACTED'].includes(q.status))) {
    return 'NEGOTIATING';
  }

  // Prioridade 3: Se cadastrado nos ultimos 7 dias e sem cotacao = NEW
  const sevenDaysAgo = subDays(new Date(), 7);
  if (customer.createdAt > sevenDaysAgo && quotations.length === 0) {
    return 'NEW';
  }

  // Prioridade 4: Se so tem cotacoes expiradas/canceladas = LOST
  if (quotations.length > 0 &&
      quotations.every(q => ['EXPIRED', 'CANCELLED', 'REJECTED'].includes(q.status))) {
    return 'LOST';
  }

  // Prioridade 5: Se sem cotacao nos ultimos 30 dias = INACTIVE
  const thirtyDaysAgo = subDays(new Date(), 30);
  const recentQuotation = quotations.some(q => q.createdAt > thirtyDaysAgo);
  if (!recentQuotation) {
    return 'INACTIVE';
  }

  // Default
  return 'NEGOTIATING';
}
```

### 3. Tabela de Interacoes

**Decision**: Criar nova tabela `clientInteractions` separada de `quotationActivities`

**Rationale**: As interacoes de cliente sao independentes de cotacoes especificas. Um vendedor pode ligar para um cliente para fazer follow-up geral, nao necessariamente sobre uma cotacao especifica. A tabela `quotationActivities` existente e especifica para atividades de cotacao.

**Schema**:
```typescript
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
```

### 4. KPIs - Calculo de Metricas

**Decision**: KPIs calculados via queries agregadas no servidor

**Rationale**: Server Components permitem acesso direto ao banco, entao calcularemos os KPIs em tempo real com queries otimizadas.

**Queries**:
```typescript
// Total de clientes (por vendedor ou total para admin)
const total = await db.select({ count: sql`count(distinct ${customers.id})` })
  .from(customers)
  .innerJoin(quotations, eq(quotations.customerId, customers.id))
  .where(vendedorCondition);

// Convertidos (clientes com pelo menos 1 cotacao aceita)
const converted = await db.select({ count: sql`count(distinct ${customers.id})` })
  .from(customers)
  .innerJoin(quotations, eq(quotations.customerId, customers.id))
  .where(and(vendedorCondition, eq(quotations.status, 'ACCEPTED')));

// Em negociacao (clientes com cotacao pendente/contatada)
const negotiating = await db.select({ count: sql`count(distinct ${customers.id})` })
  .from(customers)
  .innerJoin(quotations, eq(quotations.customerId, customers.id))
  .where(and(
    vendedorCondition,
    sql`${quotations.status} IN ('PENDING', 'CONTACTED')`
  ));

// Inativos (sem cotacao nos ultimos 30 dias)
// Calculado por diferenca ou subquery
```

### 5. Busca Full-Text

**Decision**: Usar ILIKE com OR para busca simples

**Rationale**: Para bases pequenas/medias (ate milhares de clientes), ILIKE e suficiente e nao requer configuracao adicional de full-text search do PostgreSQL.

**Implementacao**:
```typescript
function buildSearchCondition(search: string) {
  const term = `%${search}%`;
  return or(
    ilike(customers.name, term),
    ilike(customers.cpf, term),
    ilike(customers.phone, term),
    ilike(customers.email, term),
    ilike(customers.city, term),
    // Para placa, precisa join com vehicles via quotations
    ilike(vehicles.placa, term)
  );
}
```

**Alternativas Futuras**: Se performance se tornar problema, considerar:
- Indice GIN com pg_trgm para busca parcial
- Full-text search nativo do PostgreSQL
- Elasticsearch para bases muito grandes

### 6. Paginacao e Ordenacao

**Decision**: Paginacao offset-based com ordenacao dinamica

**Rationale**: Para listas de clientes com dezenas a centenas de itens, offset-based e simples e eficiente. Cursor-based seria over-engineering.

**Campos de Ordenacao**:
- `name` - Nome alfabetico
- `createdAt` - Data de cadastro
- `quotationCount` - Quantidade de cotacoes (calculado)
- `lastInteractionAt` - Ultimo contato (requer join)
- `monthlyValue` - Valor mensal das cotacoes aceitas (calculado)

### 7. Permissoes e Autorizacao

**Decision**: Verificacao de role no servidor, filtragem por vendedor

**Rationale**: Segue padrao ja implementado em `lib/quotations.ts` e `lib/sellers.ts`.

**Implementacao**:
```typescript
async function listClients(sellerId: string | null, isAdmin: boolean, filters: ClientFilters) {
  // Se nao for admin, forcar filtro pelo vendedor logado
  const effectiveSellerId = isAdmin ? filters.sellerId : sellerId;

  // Vendedor so ve clientes com cotacoes atribuidas a ele
  if (effectiveSellerId) {
    conditions.push(
      exists(
        db.select({ one: sql`1` })
          .from(quotations)
          .where(and(
            eq(quotations.customerId, customers.id),
            eq(quotations.sellerId, effectiveSellerId)
          ))
      )
    );
  }
}
```

### 8. Acoes Rapidas - Integracao Externa

**Decision**: URLs padrao para ligacao, WhatsApp e email

**Rationale**: Usar protocolos padrao suportados por todos os navegadores e dispositivos.

**Implementacao**:
```typescript
// Ligacao
const callUrl = `tel:+55${phone.replace(/\D/g, '')}`;

// WhatsApp (usando wa.me para compatibilidade)
const whatsappUrl = `https://wa.me/55${phone.replace(/\D/g, '')}`;

// Email
const emailUrl = `mailto:${email}`;
```

### 9. Exportacao CSV

**Decision**: Gerar CSV no servidor e retornar como download

**Rationale**: Server Actions podem gerar o arquivo e retornar como blob. Evita carregar todos os dados no cliente.

**Implementacao**:
```typescript
async function exportClientsCSV(filters: ClientFilters): Promise<Blob> {
  const clients = await listAllClients(filters); // Sem limite de paginacao

  const headers = ['Nome', 'CPF', 'Telefone', 'Email', 'Cidade', 'Status', 'Cotacoes', 'Valor Mensal', 'Ultimo Contato'];
  const rows = clients.map(c => [
    c.name,
    c.cpf,
    c.phone,
    c.email,
    c.city,
    translateStatus(c.status),
    c.quotationCount,
    formatCurrency(c.monthlyValue),
    formatDate(c.lastInteractionAt)
  ]);

  const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
  return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
}
```

### 10. Soft Delete

**Decision**: Adicionar campo `deletedAt` na tabela customers

**Rationale**: Soft delete permite recuperacao e mantem historico de cotacoes integro.

**Schema Update**:
```typescript
// Adicionar ao customers
deletedAt: timestamp("deleted_at", { withTimezone: true }),
```

**Query Filter**:
```typescript
// Em todas as queries de listagem
.where(isNull(customers.deletedAt))
```

## Resolved Clarifications

Nenhuma clarificacao pendente foi identificada na especificacao.

## Technical Risks

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|--------------|---------|-----------|
| Performance de busca com muitos clientes | Baixa | Medio | Indices no banco, paginacao, cache |
| Concorrencia em registro de interacoes | Muito Baixa | Baixo | Sistema aceita multiplas interacoes sem conflito |
| Dados inconsistentes de status | Baixa | Baixo | Status calculado, nao armazenado |

## Conclusion

Todas as questoes tecnicas foram resolvidas. A implementacao pode prosseguir para a fase de design (data-model.md e contracts/).
