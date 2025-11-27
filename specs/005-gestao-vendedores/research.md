# Research: Gestao de Vendedores

**Feature**: 005-gestao-vendedores
**Date**: 2025-11-27

## 1. Estrutura de Dados Existente

### Decision: Expandir tabela `sellers` existente

**Rationale**: Ja existe tabela `sellers` com campos basicos. Adicionar campos necessarios para gestao completa.

**Campos existentes**:
- id, userId, name, email, phone, isActive, role, lastAssignmentAt, assignmentCount, createdAt

**Campos a adicionar**:
- status: enum (ACTIVE, INACTIVE, VACATION) - mais granular que isActive boolean
- cargo: varchar - titulo/funcao do vendedor
- deactivationReason: text - motivo da desativacao
- deactivatedAt: timestamp - quando foi desativado
- roundRobinPosition: integer - posicao na fila
- notifyEmail: boolean - receber notificacoes por email
- notifyWhatsapp: boolean - receber notificacoes por WhatsApp
- image: text - URL da foto do vendedor

**Alternatives considered**:
- Criar tabela separada para configuracoes - rejeitado por adicionar complexidade desnecessaria

## 2. Configuracoes de Round-Robin

### Decision: Expandir tabela `round_robin_config` existente

**Rationale**: Tabela ja existe mas so tem currentIndex. Adicionar campos para metodos e limites.

**Campos a adicionar**:
- method: enum (SEQUENTIAL, LOAD_BALANCE, PERFORMANCE, SPEED)
- pendingLeadLimit: integer - limite de leads pendentes por vendedor
- skipOverloaded: boolean - pular vendedores sobrecarregados
- notifyWhenAllOverloaded: boolean - notificar admin

**Alternatives considered**:
- Configuracao por vendedor - rejeitado, configuracao e global

## 3. Metricas de Performance

### Decision: Calcular metricas em tempo real via queries

**Rationale**: Projeto ja usa este padrao em `lib/dashboard.ts`. Nao criar tabelas de cache para metricas.

**Metricas calculadas**:
- Total cotacoes (por periodo)
- Cotacoes aceitas
- Taxa de conversao (aceitas/total)
- Tempo medio ate primeiro contato
- Potencial em R$ (soma mensalidades aceitas)

**Alternatives considered**:
- Tabela de metricas pre-calculadas - rejeitado por violar principio de simplicidade

## 4. Graficos de Evolucao

### Decision: Usar biblioteca de graficos leve

**Rationale**: Grafico de evolucao mensal no perfil do vendedor.

**Opcao escolhida**: recharts (ja usado em outros projetos React/Next.js)

**Alternatives considered**:
- Chart.js - mais pesado, menos integracao com React
- Graficos CSS puros - limitados para series temporais

## 5. Permissoes de Acesso

### Decision: Verificar role ADMIN no server component

**Rationale**: Projeto ja usa Better Auth com roles em `sellers.role`.

**Implementacao**:
- Pagina verifica `seller.role === 'ADMIN'` antes de renderizar
- Server actions validam role antes de executar

**Alternatives considered**:
- Middleware - mais complexo, verificacao no componente e suficiente

## 6. Paginacao e Busca

### Decision: Seguir padrao de `/cotacoes`

**Rationale**: Projeto ja tem implementacao robusta de paginacao e busca em cotacoes.

**Implementacao**:
- URL query params para estado (page, limit, search, status, sort)
- Server action para busca com filtros
- Debounce na busca client-side

## 7. Modais

### Decision: Usar Dialog do shadcn/ui

**Rationale**: Projeto ja usa shadcn/ui. Dialog oferece acessibilidade e animacoes.

**Implementacao**:
- Cada modal em componente separado
- Estado controlado pelo pai (VendedoresList)
- Formularios com react-hook-form + zod

## 8. Reatribuicao de Leads

### Decision: Batch update via server action

**Rationale**: Manter simplicidade, evitar transacoes complexas.

**Implementacao**:
- Server action recebe array de quotationIds e targetSellerId
- Update em batch com Drizzle
- Se "distribuir igualmente", calcular distribuicao no servidor

## 9. Drag-and-Drop para Fila

### Decision: Usar @dnd-kit/core

**Rationale**: Biblioteca leve e acessivel para drag-and-drop em React.

**Alternatives considered**:
- react-beautiful-dnd - descontinuado
- Implementacao manual - complexo demais
