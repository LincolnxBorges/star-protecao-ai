# Data Model: Gestao de Vendedores

**Feature**: 005-gestao-vendedores
**Date**: 2025-11-27

## Entities

### 1. Seller (Vendedor) - Expandido

**Tabela**: `sellers` (existente, expandir)

| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| id | uuid | Sim | PK, auto-gerado |
| userId | text | Nao | FK para user (Better Auth) |
| name | varchar(255) | Sim | Nome completo |
| email | varchar(255) | Sim | Email unico |
| phone | varchar(20) | Nao | Telefone |
| cargo | varchar(100) | Nao | Titulo/funcao |
| image | text | Nao | URL da foto |
| status | enum | Sim | ACTIVE, INACTIVE, VACATION |
| role | enum | Sim | SELLER, ADMIN |
| deactivationReason | text | Nao | Motivo da desativacao |
| deactivatedAt | timestamp | Nao | Data da desativacao |
| roundRobinPosition | integer | Nao | Posicao na fila |
| notifyEmail | boolean | Sim | Default: true |
| notifyWhatsapp | boolean | Sim | Default: true |
| lastAssignmentAt | timestamp | Nao | Ultimo lead atribuido |
| assignmentCount | integer | Sim | Default: 0 |
| createdAt | timestamp | Sim | Auto |

**Enum sellerStatusEnum**:
```
ACTIVE    - Ativo, recebendo leads
INACTIVE  - Inativo, nao recebe leads
VACATION  - Ferias, temporariamente inativo
```

**Validacoes**:
- Email deve ser unico
- Email deve ter formato valido
- Telefone deve ter formato brasileiro
- Nome minimo 3 caracteres

**Transicoes de Status**:
```
ACTIVE -> INACTIVE (requer motivo opcional)
ACTIVE -> VACATION (requer motivo opcional)
INACTIVE -> ACTIVE (vai para final da fila)
VACATION -> ACTIVE (vai para final da fila)
```

### 2. RoundRobinConfig - Expandido

**Tabela**: `round_robin_config` (existente, expandir)

| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| id | uuid | Sim | PK |
| method | enum | Sim | Metodo de distribuicao |
| currentIndex | integer | Sim | Default: 0 |
| pendingLeadLimit | integer | Nao | Limite de leads pendentes |
| skipOverloaded | boolean | Sim | Default: true |
| notifyWhenAllOverloaded | boolean | Sim | Default: true |
| updatedAt | timestamp | Sim | Auto |

**Enum roundRobinMethodEnum**:
```
SEQUENTIAL     - Round-robin classico
LOAD_BALANCE   - Por quantidade de leads pendentes
PERFORMANCE    - Por taxa de conversao
SPEED          - Por tempo medio de resposta
```

## Relationships

```
sellers 1--N quotations (sellerId)
sellers 1--N seller_goals (sellerId)
user 1--1 sellers (userId)
```

## Calculated Fields (nao persistidos)

### SellerMetrics

| Campo | Calculo |
|-------|---------|
| totalQuotations | COUNT(quotations) WHERE sellerId AND periodo |
| acceptedQuotations | COUNT(quotations) WHERE status=ACCEPTED AND periodo |
| conversionRate | acceptedQuotations / totalQuotations * 100 |
| avgResponseTime | AVG(contactedAt - createdAt) WHERE contactedAt IS NOT NULL |
| potentialRevenue | SUM(mensalidade) WHERE status=ACCEPTED AND periodo |
| pendingQuotations | COUNT(quotations) WHERE status=PENDING |
| expiredQuotations | COUNT(quotations) WHERE status=EXPIRED AND periodo |
| cancelledQuotations | COUNT(quotations) WHERE status=CANCELLED AND periodo |
| ranking | Posicao baseada em acceptedQuotations |

### TeamMetrics

| Campo | Calculo |
|-------|---------|
| totalSellers | COUNT(sellers) |
| activeSellers | COUNT(sellers) WHERE status=ACTIVE |
| teamConversionRate | AVG(conversionRate) de todos sellers |
| teamAvgResponseTime | AVG(avgResponseTime) de todos sellers |
| totalQuotationsMonth | SUM(totalQuotations) do mes |
| totalAcceptedMonth | SUM(acceptedQuotations) do mes |
| totalPotentialMonth | SUM(potentialRevenue) do mes |
| topSeller | Seller com mais acceptedQuotations no mes |

## Indexes Recomendados

```sql
CREATE INDEX idx_sellers_status ON sellers(status);
CREATE INDEX idx_sellers_role ON sellers(role);
CREATE INDEX idx_sellers_round_robin_position ON sellers(round_robin_position);
CREATE INDEX idx_quotations_seller_status ON quotations(seller_id, status);
CREATE INDEX idx_quotations_seller_created ON quotations(seller_id, created_at);
```

## Migration Notes

1. Adicionar enum `seller_status_enum` (ACTIVE, INACTIVE, VACATION)
2. Adicionar enum `round_robin_method_enum` (SEQUENTIAL, LOAD_BALANCE, PERFORMANCE, SPEED)
3. Migrar `is_active=true` para `status=ACTIVE`
4. Migrar `is_active=false` para `status=INACTIVE`
5. Adicionar novos campos em `sellers`
6. Adicionar novos campos em `round_robin_config`
7. Popular `round_robin_position` baseado em `created_at`
