# Tasks: Gestao de Vendedores

**Input**: Design documents from `/specs/005-gestao-vendedores/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Nao incluidos (framework de testes TBD no projeto)

**Organization**: Tasks agrupadas por user story para implementacao e teste independentes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependencias)
- **[Story]**: User story a qual a task pertence (US1, US2, etc.)
- Caminhos exatos incluidos nas descricoes

---

## Phase 1: Setup (Infraestrutura Compartilhada)

**Purpose**: Atualizacao do schema e tipos base

- [x] T001 Adicionar enum `sellerStatusEnum` (ACTIVE, INACTIVE, VACATION) em lib/schema.ts
- [x] T002 Adicionar enum `roundRobinMethodEnum` (SEQUENTIAL, LOAD_BALANCE, PERFORMANCE, SPEED) em lib/schema.ts
- [x] T003 Expandir tabela `sellers` com novos campos em lib/schema.ts (status, cargo, image, deactivationReason, deactivatedAt, roundRobinPosition, notifyEmail, notifyWhatsapp)
- [x] T004 Expandir tabela `round_robin_config` com novos campos em lib/schema.ts (method, pendingLeadLimit, skipOverloaded, notifyWhenAllOverloaded)
- [ ] T005 Executar migration: npm run db:generate && npm run db:migrate (PENDENTE - requer input interativo no terminal)
- [x] T006 [P] Criar arquivo de tipos em lib/types/sellers.ts com interfaces Seller, SellerMetrics, TeamMetrics, SellerFilters, etc.

---

## Phase 2: Foundational (Pre-requisitos Bloqueantes)

**Purpose**: Funcoes de contexto e server actions base que DEVEM estar prontas antes das user stories

**⚠️ CRITICAL**: Nenhuma user story pode comecar ate esta fase estar completa

- [x] T007 Implementar funcao `listSellersWithMetrics()` em lib/sellers.ts (busca vendedores com metricas calculadas)
- [x] T008 Implementar funcao `getTeamMetrics()` em lib/sellers.ts (KPIs agregados do time)
- [x] T009 Implementar funcao `getSellerWithMetrics()` em lib/sellers.ts (vendedor individual com metricas)
- [x] T010 [P] Implementar funcao `getRoundRobinConfig()` em lib/sellers.ts
- [x] T011 Criar arquivo de server actions base em app/(admin)/vendedores/actions.ts com funcao de autorizacao admin
- [x] T012 Implementar `listSellersAction` em app/(admin)/vendedores/actions.ts
- [x] T013 [P] Criar componente `DashboardPageHeader` reutilizavel se nao existir em components/dashboard-page-header.tsx

**Checkpoint**: Foundation ready - implementacao de user stories pode comecar

---

## Phase 3: User Story 1 - Visualizar Lista de Vendedores com KPIs (Priority: P1) - MVP

**Goal**: Administrador visualiza todos vendedores com indicadores de performance

**Independent Test**: Acessar /vendedores e verificar lista com KPIs (cotacoes, aceitas, conversao, tempo medio)

### Implementation for User Story 1

- [x] T014 [US1] Criar componente `vendedores-kpi-cards.tsx` em components/ (cards: total, ativos, conversao media, tempo medio, cotacoes mes, aceitas, potencial R$, top vendedor)
- [x] T015 [US1] Criar componente `vendedores-card.tsx` em components/ (card individual: avatar, nome, cargo, email, telefone, status badge, metricas)
- [x] T016 [US1] Criar componente `vendedores-table.tsx` em components/ (tabela desktop com mesmos dados)
- [x] T017 [US1] Criar componente `vendedores-list.tsx` em components/ (container que gerencia lista, integra cards e tabela, responsivo)
- [x] T018 [US1] Criar pagina server component em app/(admin)/vendedores/page.tsx (header, Suspense, skeleton loading)
- [x] T019 [US1] Criar skeleton loading em app/(admin)/vendedores/page.tsx para estado de carregamento
- [x] T020 [US1] Adicionar item "Vendedores" no menu lateral em components/admin-sidebar.tsx

**Checkpoint**: User Story 1 completa - lista de vendedores com KPIs funcional

---

## Phase 4: User Story 2 - Cadastrar Novo Vendedor (Priority: P1)

**Goal**: Administrador cadastra novos vendedores no sistema

**Independent Test**: Clicar "Novo Vendedor", preencher formulario, verificar vendedor na lista

### Implementation for User Story 2

- [x] T021 [US2] Criar schema Zod `createSellerSchema` em lib/types/sellers.ts (validacoes: email, senha, telefone, nome min 3 chars)
- [x] T022 [US2] Implementar funcao `createSeller()` expandida em lib/sellers.ts (com campos novos: cargo, status, notificacoes, round-robin position)
- [x] T023 [US2] Implementar `createSellerAction` em app/(admin)/vendedores/actions.ts
- [x] T024 [US2] Criar componente `vendedores-modal-form.tsx` em components/ (modal criar/editar com react-hook-form, campos: nome, email, telefone, cargo, role, senha, status, notificacoes, participar round-robin)
- [x] T025 [US2] Integrar botao "Novo Vendedor" no header da pagina em app/(admin)/vendedores/page.tsx
- [x] T026 [US2] Integrar modal no `vendedores-list.tsx` com estado e refresh apos criar

**Checkpoint**: User Stories 1 e 2 completas - listagem e cadastro funcionais

---

## Phase 5: User Story 3 - Editar Dados do Vendedor (Priority: P2)

**Goal**: Administrador edita informacoes de vendedores existentes

**Independent Test**: Clicar "Editar" em vendedor, alterar dados, verificar alteracoes salvas

### Implementation for User Story 3

- [x] T027 [US3] Criar schema Zod `updateSellerSchema` em lib/types/sellers.ts
- [x] T028 [US3] Implementar `updateSellerAction` em app/(admin)/vendedores/actions.ts
- [x] T029 [US3] Adicionar modo edicao no `vendedores-modal-form.tsx` (preencher dados existentes, validar email unico exceto proprio)
- [x] T030 [US3] Adicionar botao "Editar" no menu de acoes do `vendedores-card.tsx`
- [x] T031 [US3] Integrar edicao no `vendedores-list.tsx` com estado do vendedor selecionado

**Checkpoint**: User Stories 1-3 completas - CRUD basico funcional

---

## Phase 6: User Story 4 - Ativar/Desativar Vendedor (Priority: P2)

**Goal**: Administrador ativa ou desativa vendedores para controlar quem recebe leads

**Independent Test**: Desativar vendedor e verificar que nao recebe mais leads no round-robin

### Implementation for User Story 4

- [x] T032 [US4] Implementar funcao `changeSellerStatus()` em lib/sellers.ts (logica de transicao, atualizar fila round-robin)
- [x] T033 [US4] Implementar funcao `redistributeLeads()` em lib/sellers.ts (redistribuir leads pendentes)
- [x] T034 [US4] Implementar `changeSellerStatusAction` em app/(admin)/vendedores/actions.ts
- [x] T035 [US4] Criar componente `vendedores-modal-deactivate.tsx` em components/ (confirmacao, motivo, opcoes para leads pendentes: manter/redistribuir/atribuir)
- [x] T036 [US4] Adicionar botoes "Ativar/Desativar" no menu de acoes do `vendedores-card.tsx`
- [x] T037 [US4] Integrar modal de desativacao no `vendedores-list.tsx`
- [x] T038 [US4] Exibir indicacao visual diferenciada para vendedores inativos/ferias no `vendedores-card.tsx`

**Checkpoint**: User Stories 1-4 completas - gestao de status funcional

---

## Phase 7: User Story 5 - Buscar e Filtrar Vendedores (Priority: P2)

**Goal**: Administrador busca e filtra vendedores rapidamente

**Independent Test**: Digitar nome na busca e verificar lista filtrada

### Implementation for User Story 5

- [x] T039 [US5] Criar componente `vendedores-search.tsx` em components/ (input busca com debounce, select status, select ordenacao)
- [x] T040 [US5] Criar componente `vendedores-status-tabs.tsx` em components/ (tabs: Todos, Ativos, Inativos, Ferias com contagem)
- [x] T041 [US5] Atualizar `listSellersWithMetrics()` em lib/sellers.ts para suportar todos filtros e ordenacoes
- [x] T042 [US5] Integrar componentes de filtro no `vendedores-list.tsx` com URL query params
- [x] T043 [US5] Adicionar paginacao no `vendedores-list.tsx` (10, 25, 50 itens)

**Checkpoint**: User Stories 1-5 completas - busca e filtros funcionais

---

## Phase 8: User Story 6 - Visualizar Perfil Completo do Vendedor (Priority: P2)

**Goal**: Administrador visualiza perfil detalhado com historico de performance

**Independent Test**: Clicar "Ver perfil" e verificar metricas detalhadas e historico

### Implementation for User Story 6

- [x] T044 [US6] Implementar funcao `getSellerProfile()` em lib/sellers.ts (metricas detalhadas, evolucao mensal, cotacoes recentes)
- [x] T045 [US6] Implementar `getSellerProfileAction` em app/(admin)/vendedores/actions.ts
- [x] T046 [US6] Criar componente `vendedores-modal-profile.tsx` em components/ (dados pessoais, metricas do periodo, grafico evolucao, cotacoes recentes)
- [x] T047 [US6] Adicionar seletor de periodo no modal de perfil (este mes, ultimos 3 meses, ultimos 6 meses, ultimo ano)
- [x] T048 [US6] Implementar grafico de evolucao mensal usando recharts no modal de perfil
- [x] T049 [US6] Adicionar botao "Ver perfil" no menu de acoes do `vendedores-card.tsx`
- [x] T050 [US6] Integrar modal de perfil no `vendedores-list.tsx`

**Checkpoint**: User Stories 1-6 completas - perfil detalhado funcional

---

## Phase 9: User Story 7 - Configurar Round-Robin (Priority: P3)

**Goal**: Administrador configura metodo de distribuicao de leads

**Independent Test**: Alterar metodo de distribuicao e verificar novos leads seguem nova regra

### Implementation for User Story 7

- [x] T051 [US7] Implementar funcao `updateRoundRobinConfig()` em lib/sellers.ts
- [x] T052 [US7] Implementar `updateRoundRobinConfigAction` em app/(admin)/vendedores/actions.ts
- [x] T053 [US7] Implementar `getRoundRobinConfigAction` em app/(admin)/vendedores/actions.ts
- [x] T054 [US7] Criar componente `vendedores-round-robin-card.tsx` em components/ (exibe metodo atual, vendedores na fila, proximo a receber)
- [x] T055 [US7] Criar componente `vendedores-round-robin-modal.tsx` em components/ (modal config: metodo, limite leads pendentes, skip overloaded)
- [x] T056 [US7] Integrar card round-robin na pagina de vendedores

**Checkpoint**: User Stories 1-7 completas - configuracao round-robin funcional

---

## Phase 10: User Story 8 - Gerenciar Fila do Round-Robin (Priority: P3)

**Goal**: Administrador visualiza e reordena fila do round-robin

**Independent Test**: Reordenar vendedores na fila e verificar proximo lead vai para vendedor correto

### Implementation for User Story 8

- [x] T057 [US8] Implementar funcao `reorderRoundRobinQueue()` em lib/sellers.ts
- [x] T058 [US8] Implementar funcao `resetRoundRobinQueue()` em lib/sellers.ts (ordem alfabetica)
- [x] T059 [US8] Implementar `reorderRoundRobinQueueAction` em app/(admin)/vendedores/actions.ts
- [x] T060 [US8] Implementar `resetRoundRobinQueueAction` em app/(admin)/vendedores/actions.ts
- [x] T061 [US8] Adicionar lista drag-and-drop no `vendedores-round-robin-card.tsx` usando @dnd-kit/core
- [x] T062 [US8] Adicionar botao "Resetar fila" no card round-robin
- [x] T063 [US8] Indicar visualmente proximo vendedor a receber lead na fila

**Checkpoint**: User Stories 1-8 completas - gestao de fila funcional

---

## Phase 11: User Story 9 - Reatribuir Leads de um Vendedor (Priority: P3)

**Goal**: Administrador reatribui leads de um vendedor para outros

**Independent Test**: Selecionar leads de vendedor e atribuir a outro, verificar leads no novo vendedor

### Implementation for User Story 9

- [x] T064 [US9] Implementar funcao `reassignLeads()` em lib/sellers.ts (batch update, distribuicao igual ou especifica)
- [x] T065 [US9] Implementar funcao `getSellerPendingLeads()` em lib/sellers.ts (lista leads pendentes do vendedor)
- [x] T066 [US9] Implementar `reassignLeadsAction` em app/(admin)/vendedores/actions.ts
- [x] T067 [US9] Criar componente `vendedores-modal-reassign.tsx` em components/ (lista leads com checkbox, opcoes: distribuir igual ou vendedor especifico)
- [x] T068 [US9] Adicionar botao "Reatribuir leads" no menu de acoes do `vendedores-card.tsx`
- [x] T069 [US9] Integrar modal de reatribuicao no `vendedores-list.tsx`

**Checkpoint**: Todas User Stories completas - feature completa

---

## Phase 12: Polish & Cross-Cutting Concerns

**Purpose**: Melhorias que afetam multiplas user stories

- [x] T070 [P] Adicionar toast notifications para feedback de acoes (criar, editar, desativar, etc.)
- [x] T071 [P] Implementar tratamento de erros consistente em todos os modais
- [x] T072 [P] Verificar e ajustar responsividade mobile em todos os componentes
- [x] T073 [P] Adicionar estados empty para lista sem vendedores
- [x] T074 [P] Adicionar estados loading em todos os modais
- [x] T075 Verificar permissoes de admin em todas as acoes
- [x] T076 Adicionar animacoes de transicao nos modais usando shadcn Dialog
- [x] T077 Executar lint e corrigir warnings: npm run lint
- [x] T078 Testar fluxo completo seguindo quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependencias - pode comecar imediatamente
- **Foundational (Phase 2)**: Depende do Setup - BLOQUEIA todas user stories
- **User Stories (Phase 3-11)**: Todas dependem da Phase 2 estar completa
  - US1 e US2 podem ser feitas em paralelo (ambas P1)
  - US3-US6 podem ser feitas em paralelo apos US1/US2 (todas P2)
  - US7-US9 podem ser feitas em paralelo apos US6 (todas P3)
- **Polish (Phase 12)**: Depende de todas user stories desejadas estarem completas

### User Story Dependencies

| User Story | Prioridade | Pode comecar apos | Integracao com |
|------------|------------|-------------------|----------------|
| US1 - Lista com KPIs | P1 | Phase 2 | - |
| US2 - Cadastrar | P1 | Phase 2 | US1 (refresh lista) |
| US3 - Editar | P2 | US2 (modal form) | US1 (refresh lista) |
| US4 - Ativar/Desativar | P2 | Phase 2 | US1 (refresh lista) |
| US5 - Buscar/Filtrar | P2 | US1 | US1 (lista) |
| US6 - Perfil | P2 | Phase 2 | US1 (acoes card) |
| US7 - Config Round-Robin | P3 | Phase 2 | - |
| US8 - Fila Round-Robin | P3 | US7 | US7 (card) |
| US9 - Reatribuir Leads | P3 | US4 | US1 (acoes card) |

### Parallel Opportunities

- **Phase 1**: T001-T003 sequenciais (mesmo arquivo), T006 paralelo
- **Phase 2**: T010, T013 podem rodar em paralelo com outras
- **Phase 3-11**: Cada phase pode ter tasks [P] em paralelo (arquivos diferentes)
- **Phase 12**: Todas tasks [P] podem rodar em paralelo

---

## Parallel Example: Phase 3 (User Story 1)

```bash
# Lancar criacao de componentes em paralelo:
Task: "Criar componente vendedores-kpi-cards.tsx em components/"
Task: "Criar componente vendedores-card.tsx em components/"
Task: "Criar componente vendedores-table.tsx em components/"

# Depois, sequencialmente:
Task: "Criar componente vendedores-list.tsx em components/"
Task: "Criar pagina server component em app/(admin)/vendedores/page.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (Lista com KPIs)
4. Complete Phase 4: User Story 2 (Cadastrar)
5. **STOP e VALIDAR**: Testar listagem e cadastro independentemente
6. Deploy/demo se pronto

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 + US2 → Lista + Cadastro funcional (MVP!)
3. US3 + US4 → CRUD completo + Gestao status
4. US5 + US6 → Busca + Perfil detalhado
5. US7 + US8 + US9 → Round-robin avancado
6. Cada incremento adiciona valor sem quebrar funcionalidades anteriores

---

## Summary

| Metrica | Valor |
|---------|-------|
| Total de tasks | 78 |
| Tasks Phase 1 (Setup) | 6 |
| Tasks Phase 2 (Foundational) | 7 |
| Tasks US1 (Lista KPIs) | 7 |
| Tasks US2 (Cadastrar) | 6 |
| Tasks US3 (Editar) | 5 |
| Tasks US4 (Ativar/Desativar) | 7 |
| Tasks US5 (Buscar/Filtrar) | 5 |
| Tasks US6 (Perfil) | 7 |
| Tasks US7 (Config Round-Robin) | 6 |
| Tasks US8 (Fila Round-Robin) | 7 |
| Tasks US9 (Reatribuir) | 6 |
| Tasks Polish | 9 |
| MVP sugerido | US1 + US2 (20 tasks) |

---

## Notes

- [P] tasks = arquivos diferentes, sem dependencias
- [Story] label mapeia task para user story especifica
- Cada user story deve ser independentemente completavel e testavel
- Fazer commit apos cada task ou grupo logico
- Parar em qualquer checkpoint para validar story independentemente
- Evitar: tasks vagas, conflitos no mesmo arquivo, dependencias que quebrem independencia
