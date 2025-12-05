# Tasks: Dashboard do Vendedor

**Input**: Design documents from `/specs/002-dashboard/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Incluídos conforme Princípio VIII da Constituição (Desenvolvimento Orientado a Testes)

**Organization**: Tasks são agrupadas por user story para permitir implementação e testes independentes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências)
- **[Story]**: User story relacionada (US1-US8)
- Caminhos exatos incluídos nas descrições

## Path Conventions (Next.js App Router)

- **Pages**: `app/(admin)/dashboard/`
- **Components**: `components/dashboard-*.tsx`
- **Context Module**: `lib/dashboard.ts`
- **Schema**: `lib/schema.ts`
- **Tests**: `__tests__/` (unitários), `e2e/` (Playwright)

---

## Phase 1: Setup

**Purpose**: Instalação de dependências e estrutura básica

- [x] T001 Instalar componentes shadcn adicionais: `npx shadcn@latest add progress sheet tooltip`
- [x] T002 [P] Criar estrutura de diretório `app/(admin)/dashboard/`
- [x] T003 [P] Criar arquivo de tipos em `lib/types/dashboard.ts` (copiar de contracts/dashboard-api.ts)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema de banco e módulo de contexto que TODAS as user stories dependem

**CRITICAL**: Nenhuma user story pode iniciar até esta fase estar completa

- [x] T004 Adicionar tabela `sellerGoals` em `lib/schema.ts` conforme data-model.md
- [x] T005 Gerar migration: `npm run db:generate`
- [x] T006 Aplicar migration: `npm run db:migrate`
- [x] T007 Criar módulo de contexto base `lib/dashboard.ts` com imports e helpers de período
- [x] T008 [P] Implementar função `getPeriodRange()` em `lib/dashboard.ts`
- [x] T009 [P] Implementar função `getSellerByUserId()` em `lib/dashboard.ts`

**Checkpoint**: Fundação pronta - implementação das user stories pode começar

---

## Phase 3: User Story 1 - KPIs Principais (Priority: P1)

**Goal**: Exibir 4 cards de KPI: Pendentes, Aceitas, Potencial Mensal e Conversão

**Independent Test**: Acessar `/dashboard` e verificar que os 4 cards aparecem com dados corretos

### Tests for User Story 1

- [x] T010 [P] [US1] Teste unitário para `getKpis()` em `__tests__/lib/dashboard.test.ts`
- [x] T011 [P] [US1] Teste E2E para visualização de KPIs em `e2e/dashboard-kpis.spec.ts`

### Implementation for User Story 1

- [x] T012 [P] [US1] Implementar `getKpiPending()` em `lib/dashboard.ts`
- [x] T013 [P] [US1] Implementar `getKpiAccepted()` em `lib/dashboard.ts`
- [x] T014 [P] [US1] Implementar `getKpiPotential()` em `lib/dashboard.ts`
- [x] T015 [P] [US1] Implementar `getKpiConversion()` em `lib/dashboard.ts`
- [x] T016 [US1] Implementar `getKpis()` agregador em `lib/dashboard.ts`
- [x] T017 [P] [US1] Criar componente `components/dashboard-kpi-card.tsx` (card individual)
- [x] T018 [US1] Criar componente `components/dashboard-kpi-cards.tsx` (grid de 4 cards)
- [x] T019 [US1] Criar página base `app/(admin)/dashboard/page.tsx` com KPIs

**Checkpoint**: KPIs funcionais e testáveis independentemente

---

## Phase 4: User Story 2 - Alertas Urgentes (Priority: P1)

**Goal**: Exibir alertas para cotações expirando hoje e leads sem contato há 24h+

**Independent Test**: Criar cotação expirando hoje e verificar que alerta vermelho aparece

### Tests for User Story 2

- [x] T020 [P] [US2] Teste unitário para `getUrgentAlerts()` em `__tests__/lib/dashboard.test.ts`
- [x] T021 [P] [US2] Teste E2E para alertas urgentes em `e2e/dashboard-alerts.spec.ts`

### Implementation for User Story 2

- [x] T022 [P] [US2] Implementar `getExpiringTodayAlerts()` em `lib/dashboard.ts`
- [x] T023 [P] [US2] Implementar `getNoContactAlerts()` em `lib/dashboard.ts`
- [x] T024 [US2] Implementar `getUrgentAlerts()` agregador em `lib/dashboard.ts`
- [x] T025 [US2] Criar componente `components/dashboard-urgent-alerts.tsx`
- [x] T026 [US2] Integrar alertas na página `app/(admin)/dashboard/page.tsx`

**Checkpoint**: Alertas funcionais e testáveis independentemente

---

## Phase 5: User Story 3 - Lista de Cotações Recentes (Priority: P1)

**Goal**: Exibir lista das 4 cotações mais recentes com ações rápidas (ligar, WhatsApp, detalhes)

**Independent Test**: Verificar que lista mostra cotações com todas as informações e botões de ação

### Tests for User Story 3

- [x] T027 [P] [US3] Teste unitário para `getRecentQuotations()` em `__tests__/lib/dashboard.test.ts`
- [x] T028 [P] [US3] Teste unitário para `markAsContacted()` em `__tests__/lib/dashboard.test.ts`
- [x] T029 [P] [US3] Teste E2E para lista de cotações em `e2e/dashboard-quotations.spec.ts`

### Implementation for User Story 3

- [x] T030 [US3] Implementar `getRecentQuotations()` em `lib/dashboard.ts` com joins
- [x] T031 [US3] Implementar `markAsContacted()` em `lib/dashboard.ts`
- [x] T032 [P] [US3] Criar componente `components/dashboard-quotation-row.tsx`
- [x] T033 [P] [US3] Criar componente `components/dashboard-contact-confirm.tsx` (modal)
- [x] T034 [US3] Criar Server Action `app/(admin)/dashboard/actions.ts` para confirmar contato
- [x] T035 [US3] Criar componente `components/dashboard-quotations-list.tsx`
- [x] T036 [US3] Integrar lista de cotações na página `app/(admin)/dashboard/page.tsx`

**Checkpoint**: Lista de cotações funcional com ações de contato

---

## Phase 6: User Story 4 - Gráfico de Status (Priority: P2)

**Goal**: Exibir gráfico de distribuição de cotações por status

**Independent Test**: Verificar que barras horizontais mostram status com porcentagens corretas

### Tests for User Story 4

- [x] T037 [P] [US4] Teste unitário para `getStatusDistribution()` em `__tests__/lib/dashboard.test.ts`
- [x] T038 [P] [US4] Teste E2E para gráfico de status em `e2e/dashboard-status.spec.ts`

### Implementation for User Story 4

- [x] T039 [US4] Implementar `getStatusDistribution()` em `lib/dashboard.ts`
- [x] T040 [US4] Criar componente `components/dashboard-status-chart.tsx`
- [x] T041 [US4] Integrar gráfico na página `app/(admin)/dashboard/page.tsx`

**Checkpoint**: Gráfico de status funcional

---

## Phase 7: User Story 5 - Ranking de Vendedores (Priority: P2)

**Goal**: Exibir ranking dos 5 vendedores com mais cotações aceitas no mês

**Independent Test**: Verificar que ranking mostra vendedores ordenados com destaque do usuário atual

### Tests for User Story 5

- [x] T042 [P] [US5] Teste unitário para `getRanking()` em `__tests__/lib/dashboard.test.ts`
- [x] T043 [P] [US5] Teste E2E para ranking em `e2e/dashboard-ranking.spec.ts`

### Implementation for User Story 5

- [x] T044 [US5] Implementar `getRanking()` em `lib/dashboard.ts`
- [x] T045 [P] [US5] Criar componente `components/dashboard-ranking-item.tsx`
- [x] T046 [US5] Criar componente `components/dashboard-ranking.tsx`
- [x] T047 [US5] Integrar ranking na página `app/(admin)/dashboard/page.tsx`

**Checkpoint**: Ranking de vendedores funcional

---

## Phase 8: User Story 6 - Progresso da Meta (Priority: P2)

**Goal**: Exibir widget circular com progresso em relação à meta mensal

**Independent Test**: Verificar que círculo de progresso mostra porcentagem correta ou "Meta não definida"

### Tests for User Story 6

- [x] T048 [P] [US6] Teste unitário para `getGoalProgress()` em `__tests__/lib/dashboard.test.ts`
- [x] T049 [P] [US6] Teste E2E para widget de meta em `e2e/dashboard-goal.spec.ts`

### Implementation for User Story 6

- [x] T050 [US6] Implementar `getGoalProgress()` em `lib/dashboard.ts`
- [x] T051 [US6] Criar componente `components/dashboard-goal-progress.tsx` com círculo SVG
- [x] T052 [US6] Integrar widget de meta na página `app/(admin)/dashboard/page.tsx`

**Checkpoint**: Widget de meta funcional

---

## Phase 9: User Story 7 - Saudação e Filtro de Período (Priority: P3)

**Goal**: Exibir saudação personalizada e filtro de período funcional

**Independent Test**: Verificar saudação por horário e que filtro atualiza dados

### Tests for User Story 7

- [x] T053 [P] [US7] Teste unitário para `getGreeting()` em `__tests__/lib/dashboard.test.ts`
- [x] T054 [P] [US7] Teste E2E para filtro de período em `e2e/dashboard-filter.spec.ts`

### Implementation for User Story 7

- [x] T055 [US7] Implementar `getGreeting()` helper em `lib/dashboard.ts`
- [x] T056 [P] [US7] Criar componente `components/dashboard-greeting.tsx`
- [x] T057 [US7] Criar componente `components/dashboard-period-filter.tsx` (Client Component)
- [x] T058 [US7] Atualizar página para usar searchParams de período `app/(admin)/dashboard/page.tsx`
- [x] T059 [US7] Integrar saudação e filtro no header do dashboard

**Checkpoint**: Saudação e filtro funcionais

---

## Phase 10: User Story 8 - Sidebar de Navegação (Priority: P3)

**Goal**: Sidebar responsiva com navegação para seções do sistema

**Independent Test**: Verificar sidebar visível em desktop e drawer em mobile

### Tests for User Story 8

- [x] T060 [P] [US8] Teste E2E para sidebar responsiva em `e2e/dashboard-sidebar.spec.ts`

### Implementation for User Story 8

- [x] T061 [P] [US8] Criar componente `components/dashboard-sidebar-item.tsx`
- [x] T062 [US8] Criar componente `components/dashboard-sidebar.tsx` com Sheet para mobile
- [x] T063 [US8] Atualizar layout `app/(admin)/layout.tsx` com sidebar
- [x] T064 [US8] Adicionar botão de menu mobile no header

**Checkpoint**: Sidebar responsiva funcional

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Polling, estados vazios, responsividade final

- [x] T065 Criar componente `components/dashboard-polling-wrapper.tsx` (Client Component)
- [x] T066 Implementar polling a cada 60s com `router.refresh()` no wrapper
- [x] T067 [P] Criar componentes de estado vazio para cada widget
- [x] T068 [P] Adicionar tratamento de erros com mensagens amigáveis
- [x] T069 Revisar responsividade em todos os breakpoints (mobile, tablet, desktop)
- [x] T070 [P] Adicionar loading states (skeletons) para cada seção
- [x] T071 Executar todos os testes: `npm run test && npm run test:e2e`
- [x] T072 Validar quickstart.md com teste manual completo

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) → Phase 2 (Foundational) → [User Stories podem começar em paralelo]
                                          ↓
                                    Phase 3-10 (US1-US8)
                                          ↓
                                    Phase 11 (Polish)
```

### User Story Dependencies

| User Story | Depende de | Pode começar após |
|------------|------------|-------------------|
| US1 (KPIs) | Foundational | Phase 2 |
| US2 (Alertas) | Foundational | Phase 2 |
| US3 (Cotações) | Foundational | Phase 2 |
| US4 (Status) | Foundational | Phase 2 |
| US5 (Ranking) | Foundational | Phase 2 |
| US6 (Meta) | Foundational, sellerGoals table | Phase 2 |
| US7 (Saudação/Filtro) | US1 (para testar filtro) | Phase 3 |
| US8 (Sidebar) | Foundational | Phase 2 |

### Within Each User Story

1. Testes DEVEM ser escritos e FALHAR antes da implementação
2. Funções de contexto (`lib/dashboard.ts`) antes de componentes
3. Componentes menores antes dos agregadores
4. Integração na página por último

### Parallel Opportunities

**Por User Story**:
- US1: T012, T013, T014, T015 podem rodar em paralelo
- US2: T022, T023 podem rodar em paralelo
- US3: T032, T033 podem rodar em paralelo
- US5: T045 pode rodar em paralelo com T044
- US7: T056 pode rodar em paralelo com T055

**Entre User Stories** (após Phase 2):
- US1, US2, US3, US4, US5, US6, US8 podem começar em paralelo
- US7 deve esperar US1 para testar filtro

---

## Parallel Example: User Story 1

```bash
# Launch all tests for US1 together:
Task: "Teste unitário para getKpis() em __tests__/lib/dashboard.test.ts"
Task: "Teste E2E para visualização de KPIs em e2e/dashboard-kpis.spec.ts"

# After tests fail, launch all KPI functions in parallel:
Task: "Implementar getKpiPending() em lib/dashboard.ts"
Task: "Implementar getKpiAccepted() em lib/dashboard.ts"
Task: "Implementar getKpiPotential() em lib/dashboard.ts"
Task: "Implementar getKpiConversion() em lib/dashboard.ts"
```

---

## Implementation Strategy

### MVP First (User Stories P1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: US1 - KPIs
4. Complete Phase 4: US2 - Alertas
5. Complete Phase 5: US3 - Cotações
6. **STOP and VALIDATE**: Dashboard MVP funcional com KPIs, alertas e cotações
7. Deploy/demo se pronto

### Incremental Delivery

| Release | User Stories | Valor Entregue |
|---------|-------------|----------------|
| MVP | US1 + US2 + US3 | Dashboard básico funcional |
| v1.1 | + US4 + US5 + US6 | Analytics e gamificação |
| v1.2 | + US7 + US8 | UX completa |
| v1.3 | + Polish | Produção-ready |

### Parallel Team Strategy

Com 3 desenvolvedores após Phase 2:
- Dev A: US1 (KPIs) → US4 (Status)
- Dev B: US2 (Alertas) → US5 (Ranking)
- Dev C: US3 (Cotações) → US6 (Meta)

---

## Notes

- [P] tasks = arquivos diferentes, sem dependências
- [Story] label mapeia task para user story específica
- Cada user story deve ser completável e testável independentemente
- Verificar que testes falham antes de implementar
- Commit após cada task ou grupo lógico
- Parar em qualquer checkpoint para validar story independentemente
- Evitar: tasks vagas, conflitos no mesmo arquivo, dependências cross-story
