# Tasks: Gestao de Clientes

**Input**: Design documents from `/specs/006-gestao-clientes/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests not explicitly requested in specification. TDD is acknowledged but framework TBD.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Next.js App Router**: `app/` for pages, `lib/` for context modules, `components/` for UI
- Paths follow project structure from plan.md

---

## Phase 1: Setup

**Purpose**: Schema changes and type definitions

- [x] T001 [P] Create types file with ClientStatus, InteractionType, InteractionResult types in lib/types/clients.ts
- [x] T002 [P] Create Zod validation schemas for client interactions in lib/validations/clients.ts
- [x] T003 Add interactionTypeEnum to lib/schema.ts
- [x] T004 Add interactionResultEnum to lib/schema.ts
- [x] T005 Add deletedAt field to customers table in lib/schema.ts
- [x] T006 Create clientInteractions table in lib/schema.ts
- [x] T007 Generate and apply database migration with npm run db:generate && npm run db:migrate
- [x] T008 [P] Verify shadcn components are installed (Dialog, DropdownMenu, Badge, Tabs) or add missing ones

---

## Phase 2: Foundational (Context Module)

**Purpose**: Core business logic in lib/clients.ts that ALL user stories depend on

**CRITICAL**: No UI work can begin until this phase is complete

- [x] T009 Create lib/clients.ts with module structure and imports
- [x] T010 Implement calculateClientStatus helper function in lib/clients.ts
- [x] T011 Implement listClients function with filters, search, pagination, ordering in lib/clients.ts
- [x] T012 Implement getClientKPIs function for dashboard cards in lib/clients.ts
- [x] T013 Implement getDistinctCities function for filter dropdown in lib/clients.ts
- [x] T014 Implement getClientProfile function in lib/clients.ts
- [x] T015 Implement getClientQuotations function in lib/clients.ts
- [x] T016 Implement createClientInteraction function in lib/clients.ts
- [x] T017 Implement getClientInteractions function in lib/clients.ts
- [x] T018 Implement softDeleteClient function in lib/clients.ts
- [x] T019 Implement exportClientsCSV function in lib/clients.ts
- [x] T020 Create Server Actions file app/(admin)/clientes/actions.ts with createInteractionAction, exportCSVAction, deleteClientAction

**Checkpoint**: Foundation ready - UI implementation can now begin

---

## Phase 3: User Story 1 - Visualizar Lista de Clientes (Priority: P1) MVP

**Goal**: Vendedor visualiza lista paginada de clientes com nome, CPF, contato, cotacoes e status

**Independent Test**: Acessar /clientes e verificar que lista de clientes e exibida com colunas corretas e paginacao

### Implementation for User Story 1

- [x] T021 [US1] Create page app/(admin)/clientes/page.tsx as Server Component with data fetching
- [x] T022 [P] [US1] Create clients-table.tsx component for desktop list view in components/
- [x] T023 [P] [US1] Create clients-empty-state.tsx component for empty/no results state in components/
- [x] T024 [US1] Implement status badge colors (verde=convertido, amarelo=negociacao, cinza=inativo, vermelho=perdido) in clients-table.tsx
- [x] T025 [US1] Implement pagination component and logic in clients-table.tsx

**Checkpoint**: User Story 1 complete - list view with pagination working

---

## Phase 4: User Story 2 - Ver Cards de KPIs (Priority: P1)

**Goal**: Exibir 4 cards de KPIs: Total, Convertidos, Em Negociacao, Inativos

**Independent Test**: Verificar que cards KPIs mostram valores corretos baseados nos dados

### Implementation for User Story 2

- [x] T026 [P] [US2] Create clients-kpi-cards.tsx component in components/
- [x] T027 [US2] Integrate KPI cards into page app/(admin)/clientes/page.tsx
- [x] T028 [US2] Add percentage calculation display for Convertidos card

**Checkpoint**: User Story 2 complete - KPIs displayed above client list

---

## Phase 5: User Story 3 - Buscar e Filtrar Clientes (Priority: P1)

**Goal**: Busca em tempo real e filtros por status, cidade, periodo

**Independent Test**: Digitar termo de busca e aplicar filtros, verificar lista filtrada corretamente

### Implementation for User Story 3

- [x] T029 [US3] Create clients-search-filters.tsx as Client Component in components/
- [x] T030 [US3] Implement search input with debounce (300ms) in clients-search-filters.tsx
- [x] T031 [US3] Implement status filter dropdown (Todos, Convertidos, Em negociacao, Inativos, Perdidos) in clients-search-filters.tsx
- [x] T032 [US3] Implement city filter dropdown with getDistinctCities data in clients-search-filters.tsx
- [x] T033 [US3] Implement period filter (Hoje, 7 dias, 30 dias, 90 dias, Este ano, Personalizado) in clients-search-filters.tsx
- [x] T034 [US3] Implement active filter chips display with individual remove option in clients-search-filters.tsx
- [x] T035 [US3] Implement "Limpar tudo" button to reset all filters in clients-search-filters.tsx
- [x] T036 [US3] Integrate search-filters with page using URL search params for state in app/(admin)/clientes/page.tsx

**Checkpoint**: User Story 3 complete - search and filters working

---

## Phase 6: User Story 4 - Ver Perfil Completo do Cliente (Priority: P2)

**Goal**: Modal com perfil completo: dados pessoais, contato, endereco, cotacoes resumidas, veiculos, historico

**Independent Test**: Clicar "Ver perfil" e verificar modal com todas as secoes de informacao

### Implementation for User Story 4

- [x] T037 [US4] Create clients-profile-modal.tsx as Client Component in components/
- [x] T038 [US4] Implement personal info section (nome, CPF) in clients-profile-modal.tsx
- [x] T039 [US4] Implement contact section with copy, call, WhatsApp, email actions in clients-profile-modal.tsx
- [x] T040 [US4] Implement address section with copy and map link in clients-profile-modal.tsx
- [x] T041 [US4] Implement quotations summary section with status badges in clients-profile-modal.tsx
- [x] T042 [US4] Implement vehicles section with protection status in clients-profile-modal.tsx
- [x] T043 [US4] Implement interactions timeline section (chronological desc) in clients-profile-modal.tsx
- [x] T044 [US4] Implement seller info section in clients-profile-modal.tsx
- [x] T045 [US4] Add "Ver perfil" action button to clients-table.tsx and wire modal

**Checkpoint**: User Story 4 complete - profile modal working

---

## Phase 7: User Story 5 - Ver Historico de Cotacoes (Priority: P2)

**Goal**: Modal com todas cotacoes do cliente: resumo, cards por status, opcao de nova cotacao

**Independent Test**: Clicar "Ver cotacoes" e verificar modal com lista de cotacoes e resumo

### Implementation for User Story 5

- [x] T046 [US5] Create clients-quotations-modal.tsx as Client Component in components/
- [x] T047 [US5] Implement summary header (total, aceitas, valor mensal ativo) in clients-quotations-modal.tsx
- [x] T048 [US5] Implement quotation card with status badge (verde=Aceita, amarelo=Pendente, vermelho=Expirada) in clients-quotations-modal.tsx
- [x] T049 [US5] Implement expiring soon alert for pending quotations in clients-quotations-modal.tsx
- [x] T050 [US5] Implement "Recotar veiculo" action for expired quotations in clients-quotations-modal.tsx
- [x] T051 [US5] Implement "Nova cotacao para cliente" button with pre-filled data in clients-quotations-modal.tsx
- [x] T052 [US5] Add "Ver cotacoes" action button to clients-table.tsx and wire modal

**Checkpoint**: User Story 5 complete - quotations modal working

---

## Phase 8: User Story 6 - Registrar Interacao (Priority: P2)

**Goal**: Modal para registrar interacoes com tipo, resultado, descricao e agendamento opcional

**Independent Test**: Clicar "Adicionar nota", preencher formulario, verificar interacao no historico

### Implementation for User Story 6

- [x] T053 [US6] Create clients-interaction-modal.tsx as Client Component in components/
- [x] T054 [US6] Implement interaction type selector (8 tipos) in clients-interaction-modal.tsx
- [x] T055 [US6] Implement result selector (positivo, neutro, negativo, sem contato) in clients-interaction-modal.tsx
- [x] T056 [US6] Implement description textarea (required, max 2000 chars) in clients-interaction-modal.tsx
- [x] T057 [US6] Implement scheduled follow-up date/time picker in clients-interaction-modal.tsx
- [x] T058 [US6] Implement form submission with Zod validation and Server Action in clients-interaction-modal.tsx
- [x] T059 [US6] Add "Adicionar nota" action button to clients-table.tsx and profile modal, wire modal
- [x] T060 [US6] Add success feedback toast after interaction saved

**Checkpoint**: User Story 6 complete - interaction recording working

---

## Phase 9: User Story 7 - Acoes Rapidas (Priority: P2)

**Goal**: Botoes de acao rapida: ligar, WhatsApp, email, copiar na lista de clientes

**Independent Test**: Clicar botoes de acao e verificar que aplicativos externos abrem corretamente

### Implementation for User Story 7

- [x] T061 [US7] Create clients-actions-menu.tsx as Client Component in components/
- [x] T062 [US7] Implement "Ligar" action with tel: protocol in clients-actions-menu.tsx
- [x] T063 [US7] Implement "WhatsApp" action with wa.me URL in clients-actions-menu.tsx
- [x] T064 [US7] Implement "Email" action with mailto: protocol in clients-actions-menu.tsx
- [x] T065 [US7] Implement "Copiar telefone/email" with clipboard API and feedback toast in clients-actions-menu.tsx
- [x] T066 [US7] Integrate actions menu into clients-table.tsx for each row

**Checkpoint**: User Story 7 complete - quick actions working

---

## Phase 10: User Story 8 - Filtrar por Vendedor Admin (Priority: P3)

**Goal**: Admin ve filtro adicional de vendedor para ver clientes de qualquer vendedor

**Independent Test**: Como admin, selecionar vendedor no filtro e verificar lista filtrada

### Implementation for User Story 8

- [x] T067 [US8] Add seller filter dropdown to clients-search-filters.tsx (visible only for admin)
- [x] T068 [US8] Implement seller list fetch for filter dropdown
- [x] T069 [US8] Update listClients in page.tsx to pass sellerId filter when admin selects

**Checkpoint**: User Story 8 complete - admin seller filter working

---

## Phase 11: User Story 9 - Exportar CSV (Priority: P3)

**Goal**: Exportar lista de clientes em CSV respeitando filtros aplicados

**Independent Test**: Clicar "Exportar CSV" e verificar arquivo baixado com dados corretos

### Implementation for User Story 9

- [x] T070 [US9] Add "Exportar CSV" button to clients-search-filters.tsx
- [x] T071 [US9] Implement CSV export with current filters using exportCSVAction
- [x] T072 [US9] Implement file download trigger in browser

**Checkpoint**: User Story 9 complete - CSV export working

---

## Phase 12: User Story 10 - Ordenar Lista (Priority: P3)

**Goal**: Ordenar lista por nome, data cadastro, cotacoes, ultimo contato, valor mensal

**Independent Test**: Clicar cabecalhos de coluna e verificar ordenacao correta

### Implementation for User Story 10

- [x] T073 [US10] Add sortable column headers to clients-table.tsx
- [x] T074 [US10] Implement sort state management with URL params in clients-list.tsx
- [x] T075 [US10] Implement toggle asc/desc on repeated click
- [x] T076 [US10] Add visual indicator (arrow) for current sort column and direction

**Checkpoint**: User Story 10 complete - sorting working

---

## Phase 13: Polish & Cross-Cutting Concerns

**Purpose**: Responsiveness, states, and final touches

- [x] T077 [P] Create clients-card-list.tsx for mobile responsive view in components/
- [x] T078 Implement responsive breakpoint switching (table on desktop, cards on mobile) in clients-list.tsx
- [x] T079 [P] Add loading skeleton states to clients-table.tsx and clients-kpi-cards.tsx
- [x] T080 Implement soft delete confirmation dialog with warning for active quotations
- [x] T081 Test all flows on mobile viewport (320px minimum)
- [x] T082 Verify all edge cases from spec: empty states, no results, client status transitions
- [x] T083 Run quickstart.md validation checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all UI work
- **User Stories (Phase 3-12)**: All depend on Foundational completion
- **Polish (Phase 13)**: Depends on all user stories

### User Story Dependencies

- **US1-US3 (P1)**: Can start immediately after Foundational - Core MVP
- **US4-US7 (P2)**: Can start after Foundational - Depend on US1 for table integration
- **US8-US10 (P3)**: Can start after Foundational - Depend on US3 for filter integration

### Within Each User Story

- Components before integration
- Modal components before action buttons
- Server Actions before Client Component submission

### Parallel Opportunities

- **Setup Phase**: T001, T002, T003-T004, T008 can run in parallel
- **Foundational Phase**: T010-T019 can be parallelized (different functions)
- **User Story Phases**: Different story components can be built in parallel by different developers

---

## Parallel Example: Phase 3 (User Story 1)

```bash
# Launch parallel tasks for User Story 1:
Task T022: "Create clients-table.tsx component"
Task T023: "Create clients-empty-state.tsx component"
# Then sequential tasks that depend on both
```

---

## Implementation Strategy

### MVP First (User Stories 1-3 Only)

1. Complete Phase 1: Setup (schema, types)
2. Complete Phase 2: Foundational (lib/clients.ts)
3. Complete Phase 3: US1 - Lista de Clientes
4. Complete Phase 4: US2 - KPI Cards
5. Complete Phase 5: US3 - Busca e Filtros
6. **STOP and VALIDATE**: Test MVP independently
7. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational -> Foundation ready
2. Add US1 (Lista) -> Test -> Deploy (minimal MVP)
3. Add US2 (KPIs) + US3 (Filtros) -> Test -> Deploy (full P1 MVP)
4. Add US4-US7 (P2 features) -> Test -> Deploy
5. Add US8-US10 (P3 features) -> Test -> Deploy
6. Polish Phase -> Final release

### Suggested MVP Scope

**Minimal MVP**: User Stories 1-3 (P1 only)
- Delivers: List view, KPIs, Search/Filters
- ~25 tasks (T001-T036)
- Immediately useful for vendedor

---

## Notes

- [P] tasks = different files, no dependencies within same phase
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
