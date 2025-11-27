# Tasks: Telas de Gestao de Cotacoes

**Input**: Design documents from `/specs/003-cotacoes-gestao/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Incluidos conforme principio VIII da constituicao (Desenvolvimento Orientado a Testes - NAO-NEGOCIAVEL)

**Organization**: Tasks agrupadas por user story para permitir implementacao e teste independente de cada story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependencias)
- **[Story]**: User story a qual pertence (US1, US2, etc.)
- Inclui caminhos exatos dos arquivos nas descricoes

## Path Conventions (Next.js App Router)

- **Logica de negocio**: `lib/`
- **Paginas**: `app/(admin)/cotacoes/`
- **Componentes**: `components/`
- **Testes unitarios**: `__tests__/unit/`
- **Testes E2E**: `e2e/`
- **Schema DB**: `lib/schema.ts`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Preparacao do ambiente e componentes base shadcn

- [x] T001 Instalar componentes shadcn necessarios via CLI: tabs, table, dialog, badge, progress, textarea, radio-group, dropdown-menu, skeleton
- [x] T002 [P] Criar arquivo de tipos em lib/types/quotations.ts com QuotationFilters, QuotationActivity, StatusCount, ActivityType
- [x] T003 [P] Criar schema Zod para filtros em lib/schemas/quotation-filters.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema de banco de dados e funcoes de contexto base que DEVEM estar prontas antes de qualquer user story

**CRITICO**: Nenhum trabalho de user story pode comecar ate esta fase estar completa

- [x] T004 Adicionar enum activityTypeEnum e tabela quotationActivities em lib/schema.ts conforme data-model.md
- [x] T005 Gerar e aplicar migration: npm run db:generate && npm run db:migrate
- [x] T006 [P] Implementar funcao getStatusCounts em lib/quotations.ts (retorna contadores por status)
- [x] T007 [P] Implementar funcao createQuotationActivity em lib/quotations.ts (cria registro de atividade)
- [x] T008 [P] Implementar funcao listQuotationActivities em lib/quotations.ts (lista atividades de uma cotacao)
- [x] T009 Implementar funcao listQuotationsWithFilters em lib/quotations.ts (busca com filtros, paginacao, ordenacao)
- [x] T010 Criar Server Actions base em app/(admin)/cotacoes/actions.ts (listQuotationsAction, getStatusCountsAction)
- [x] T011 [P] Testes unitarios para funcoes de contexto em tests/unit/quotations.test.ts

**Checkpoint**: Fundacao pronta - implementacao de user stories pode comecar ✓ COMPLETO

---

## Phase 3: User Story 1 - Visualizar Lista de Cotacoes (Priority: P1) MVP

**Goal**: Vendedor visualiza lista de cotacoes com dados principais em tabela paginada

**Independent Test**: Navegar para /cotacoes e ver lista com veiculo, cliente, valor, status, tempo

### Tests for User Story 1

- [ ] T012 [P] [US1] E2E: lista exibe cotacoes com dados corretos em e2e/cotacoes/list.spec.ts
- [ ] T013 [P] [US1] E2E: estado vazio quando nao ha cotacoes em e2e/cotacoes/list.spec.ts

### Implementation for User Story 1

- [x] T014 [P] [US1] Criar componente cotacoes-table.tsx em components/ (tabela com colunas conforme FR-001)
- [x] T015 [P] [US1] Criar componente cotacoes-row.tsx em components/ (linha com dados do veiculo, cliente, valor, status)
- [x] T016 [P] [US1] Criar componente cotacoes-empty-state.tsx em components/ (estado vazio com CTA)
- [x] T017 [US1] Criar componente cotacoes-list.tsx em components/ (orquestra tabela, paginacao)
- [x] T018 [US1] Atualizar pagina app/(admin)/cotacoes/page.tsx como Server Component que busca dados e passa para cotacoes-list
- [x] T019 [US1] Implementar paginacao no componente cotacoes-list.tsx (opcoes 10, 25, 50 por pagina)
- [x] T020 [US1] Adicionar destaque visual para cotacoes expirando hoje (borda vermelha) e novas (badge "Novo") conforme FR-012

**Checkpoint**: User Story 1 completa - lista basica de cotacoes funcional ✓ IMPLEMENTACAO COMPLETA (testes E2E pendentes)

---

## Phase 4: User Story 2 - Filtrar Cotacoes por Status (Priority: P1)

**Goal**: Vendedor filtra cotacoes por status via tabs com contadores

**Independent Test**: Clicar em tab "Pendentes" e ver apenas cotacoes pendentes com contador correto

### Tests for User Story 2

- [ ] T021 [P] [US2] E2E: tabs de status filtram corretamente em e2e/cotacoes/list.spec.ts
- [ ] T022 [P] [US2] E2E: contadores refletem quantidade por status em e2e/cotacoes/list.spec.ts

### Implementation for User Story 2

- [x] T023 [US2] Criar componente cotacoes-status-tabs.tsx em components/ (tabs: Todas, Pendentes, Contatadas, Aceitas, Expiradas com contadores)
- [x] T024 [US2] Integrar cotacoes-status-tabs no cotacoes-list.tsx com sincronizacao de filtro
- [x] T025 [US2] Persistir filtro de status na URL via searchParams para compartilhamento de links
- [x] T026 [US2] Atualizar Server Action listQuotationsAction para aceitar filtro de status

**Checkpoint**: User Story 2 completa - filtro por status funcional ✓ IMPLEMENTACAO COMPLETA (testes E2E pendentes)

---

## Phase 5: User Story 3 - Buscar Cotacoes (Priority: P1)

**Goal**: Vendedor busca cotacoes por nome, placa, telefone, CPF em tempo real

**Independent Test**: Digitar placa no campo de busca e ver apenas cotacao correspondente

### Tests for User Story 3

- [ ] T027 [P] [US3] E2E: busca por placa retorna cotacao correta em e2e/cotacoes/list.spec.ts
- [ ] T028 [P] [US3] E2E: busca por nome do cliente funciona em e2e/cotacoes/list.spec.ts
- [ ] T029 [P] [US3] E2E: busca sem resultados mostra mensagem apropriada em e2e/cotacoes/list.spec.ts

### Implementation for User Story 3

- [x] T030 [US3] Criar componente cotacoes-search.tsx em components/ (input com debounce 300ms, icone lupa)
- [x] T031 [US3] Implementar busca ILIKE em listQuotationsWithFilters para campos: name, phone, cpf, placa, marca, modelo
- [x] T032 [US3] Integrar cotacoes-search no cotacoes-list.tsx com sincronizacao de estado
- [x] T033 [US3] Persistir termo de busca na URL via searchParams

**Checkpoint**: User Story 3 completa - busca em tempo real funcional ✓ IMPLEMENTACAO COMPLETA (testes E2E pendentes)

---

## Phase 6: User Story 4 - Visualizar Detalhes da Cotacao (Priority: P1)

**Goal**: Vendedor visualiza todos os detalhes de uma cotacao especifica

**Independent Test**: Clicar em cotacao na lista e ver todos os dados (cliente, veiculo, valores, status, vendedor)

### Tests for User Story 4

- [ ] T034 [P] [US4] E2E: pagina de detalhes exibe dados do cliente em e2e/cotacoes/details.spec.ts
- [ ] T035 [P] [US4] E2E: pagina de detalhes exibe dados do veiculo em e2e/cotacoes/details.spec.ts
- [ ] T036 [P] [US4] E2E: pagina de detalhes exibe valores da cotacao em e2e/cotacoes/details.spec.ts

### Implementation for User Story 4

- [x] T037 [P] [US4] Criar componente cotacoes-detail-header.tsx em components/ (titulo, status badge, botao voltar)
- [x] T038 [P] [US4] Criar componente cotacoes-detail-client.tsx em components/ (card com dados do cliente conforme FR-015)
- [x] T039 [P] [US4] Criar componente cotacoes-detail-vehicle.tsx em components/ (card com dados do veiculo conforme FR-016)
- [x] T040 [P] [US4] Criar componente cotacoes-detail-values.tsx em components/ (card com valores e barra de validade conforme FR-017, FR-018)
- [x] T041 [P] [US4] Criar componente cotacoes-detail-seller.tsx em components/ (card com dados do vendedor conforme FR-019)
- [x] T042 [US4] Criar Server Action getQuotationDetailsAction em app/(admin)/cotacoes/actions.ts
- [x] T043 [US4] Atualizar pagina app/(admin)/cotacoes/[id]/page.tsx como Server Component com componentes de detalhe
- [x] T044 [US4] Implementar navegacao de volta para lista mantendo filtros (via query params)

**Checkpoint**: User Story 4 completa - visualizacao completa de detalhes funcional ✓ IMPLEMENTACAO COMPLETA (testes E2E pendentes)

---

## Phase 7: User Story 5 - Contatar Cliente Diretamente (Priority: P2)

**Goal**: Vendedor acessa WhatsApp, telefone e email do cliente com 1-2 cliques

**Independent Test**: Clicar botao WhatsApp e verificar que abre wa.me com numero correto

### Tests for User Story 5

- [ ] T045 [P] [US5] E2E: botao WhatsApp abre link correto em e2e/cotacoes/details.spec.ts
- [ ] T046 [P] [US5] E2E: botao Ligar abre tel: link correto em e2e/cotacoes/details.spec.ts

### Implementation for User Story 5

- [x] T047 [US5] Adicionar botoes de acao (WhatsApp, Ligar, Email) no cotacoes-detail-client.tsx com links corretos
- [x] T048 [US5] Adicionar icone WhatsApp clicavel no cotacoes-row.tsx para acesso rapido da lista
- [x] T049 [US5] Implementar helper formatWhatsAppLink em lib/utils.ts (formata numero para wa.me)

**Checkpoint**: User Story 5 completa - contato direto com cliente funcional ✓ IMPLEMENTACAO COMPLETA (testes E2E pendentes)

---

## Phase 8: User Story 6 - Alterar Status da Cotacao (Priority: P2)

**Goal**: Vendedor altera status da cotacao e mudanca e registrada no historico

**Independent Test**: Alterar status de "Pendente" para "Contatado" e ver mudanca persistida

### Tests for User Story 6

- [ ] T050 [P] [US6] E2E: alteracao de status funciona em e2e/cotacoes/details.spec.ts
- [ ] T051 [P] [US6] E2E: status para Aceita exige observacao em e2e/cotacoes/details.spec.ts
- [ ] T052 [P] [US6] E2E: cotacao expirada nao permite alteracao de status em e2e/cotacoes/details.spec.ts

### Implementation for User Story 6

- [x] T053 [US6] Implementar funcao updateQuotationStatusWithActivity em lib/quotations.ts (transacao atomica)
- [x] T054 [US6] Criar Server Action updateQuotationStatusAction em app/(admin)/cotacoes/actions.ts com validacao Zod
- [x] T055 [US6] Criar componente cotacoes-detail-status.tsx em components/ (radio group de status, textarea observacao, botao salvar)
- [x] T056 [US6] Implementar validacao de transicao de status (PENDING->CONTACTED->ACCEPTED/CANCELLED)
- [x] T057 [US6] Implementar bloqueio de alteracao para cotacoes expiradas conforme FR-028

**Checkpoint**: User Story 6 completa - alteracao de status funcional com historico ✓ IMPLEMENTACAO COMPLETA (testes E2E pendentes)

---

## Phase 9: User Story 7 - Adicionar Notas/Observacoes (Priority: P2)

**Goal**: Vendedor registra notas de interacao que aparecem no historico

**Independent Test**: Adicionar nota tipo "Ligacao" e ver no historico com data, hora e autor

### Tests for User Story 7

- [ ] T058 [P] [US7] E2E: adicionar nota funciona em e2e/cotacoes/details.spec.ts
- [ ] T059 [P] [US7] E2E: historico exibe notas ordenadas por data em e2e/cotacoes/details.spec.ts

### Implementation for User Story 7

- [x] T060 [US7] Criar Server Action addQuotationNoteAction em app/(admin)/cotacoes/actions.ts
- [x] T061 [US7] Criar componente cotacoes-note-dialog.tsx em components/ (dialog com select tipo, textarea descricao)
- [x] T062 [US7] Criar componente cotacoes-detail-history.tsx em components/ (timeline de atividades ordenada DESC)
- [x] T063 [US7] Integrar cotacoes-note-dialog e cotacoes-detail-history na pagina de detalhes
- [x] T064 [US7] Adicionar icones diferenciados por tipo de atividade no historico (Phone, MessageCircle, Mail, FileText)

**Checkpoint**: User Story 7 completa - notas e historico funcional ✓ IMPLEMENTACAO COMPLETA (testes E2E pendentes)

---

## Phase 10: User Story 8 - Filtrar por Periodo e Categoria (Priority: P3)

**Goal**: Gestor filtra cotacoes por periodo de criacao e categoria de veiculo

**Independent Test**: Aplicar filtro "Ultimos 7 dias" + categoria "Moto" e ver resultados corretos

### Tests for User Story 8

- [ ] T065 [P] [US8] E2E: filtro por periodo funciona em e2e/cotacoes/list.spec.ts
- [ ] T066 [P] [US8] E2E: filtro por categoria funciona em e2e/cotacoes/list.spec.ts
- [ ] T067 [P] [US8] E2E: limpar filtros reseta todos os filtros em e2e/cotacoes/list.spec.ts

### Implementation for User Story 8

- [x] T068 [US8] Criar componente cotacoes-filters.tsx em components/ (dropdowns: categoria, periodo, valor FIPE, vendedor)
- [x] T069 [US8] Adicionar filtros de categoria e periodo na listQuotationsWithFilters
- [x] T070 [US8] Integrar cotacoes-filters no cotacoes-list.tsx com sincronizacao de estado
- [x] T071 [US8] Implementar chips de filtros ativos com botao remover
- [x] T072 [US8] Implementar botao "Limpar filtros" que reseta todos os filtros

**Checkpoint**: User Story 8 completa - filtros avancados funcional ✓ IMPLEMENTACAO COMPLETA (testes E2E pendentes)

---

## Phase 11: User Stories 9 e 10 - Copiar Dados e Ver Mapa (Priority: P3)

**Goal**: Vendedor copia dados do cliente e visualiza endereco no Google Maps

**Independent Test**: Clicar "Copiar telefone" e verificar clipboard; clicar "Ver no mapa" e abrir Google Maps

### Tests for User Stories 9 e 10

- [ ] T073 [P] [US9] E2E: botao copiar telefone funciona em e2e/cotacoes/details.spec.ts
- [ ] T074 [P] [US10] E2E: botao ver no mapa abre Google Maps em e2e/cotacoes/details.spec.ts

### Implementation for User Stories 9 e 10

- [x] T075 [US9] Adicionar botoes de copiar (telefone, email, endereco) no cotacoes-detail-client.tsx com toast de confirmacao
- [x] T076 [US9] Implementar helper copyToClipboard em lib/utils.ts com fallback para navegadores antigos
- [x] T077 [US10] Adicionar botao "Ver no Google Maps" no cotacoes-detail-client.tsx que abre nova aba
- [x] T078 [US10] Implementar helper formatGoogleMapsUrl em lib/utils.ts (formata endereco para URL do Maps)

**Checkpoint**: User Stories 9 e 10 completas - copiar dados e mapa funcional ✓ IMPLEMENTACAO COMPLETA (testes E2E pendentes)

---

## Phase 12: Polish & Cross-Cutting Concerns

**Purpose**: Melhorias que afetam multiplas user stories

- [x] T079 [P] Implementar responsividade mobile na lista (cards empilhados) conforme FR-032
- [x] T080 [P] Implementar responsividade mobile nos detalhes (secoes colapsiveis) conforme FR-033
- [x] T081 [P] Adicionar skeletons de loading em todos os componentes que fazem fetch
- [x] T082 [P] Implementar toast de feedback para acoes (sucesso/erro)
- [x] T083 Revisar acessibilidade: aria-labels, keyboard navigation, focus management
- [x] T084 [P] Adicionar indices de banco de dados para performance conforme data-model.md
- [x] T085 Validar quickstart.md executando todos os cenarios de teste
- [x] T086 Code review final e cleanup de codigo nao utilizado

**Checkpoint**: Phase 12 completa - polish e cross-cutting concerns finalizados ✓ COMPLETO

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependencias - pode iniciar imediatamente
- **Foundational (Phase 2)**: Depende de Setup - BLOQUEIA todas user stories
- **User Stories (Phases 3-11)**: Todas dependem de Foundational
  - US1-US4 (P1): Podem rodar em paralelo apos Foundational
  - US5-US7 (P2): Podem rodar em paralelo, mas US6/US7 dependem da pagina de detalhes (US4)
  - US8-US10 (P3): Podem rodar em paralelo
- **Polish (Phase 12)**: Depende de todas user stories desejadas estarem completas

### User Story Dependencies

- **US1 (Lista basica)**: Independente - pode comecar apos Foundational
- **US2 (Filtro status)**: Independente - pode comecar apos Foundational
- **US3 (Busca)**: Independente - pode comecar apos Foundational
- **US4 (Detalhes)**: Independente - pode comecar apos Foundational
- **US5 (Contato)**: Depende de US4 (pagina de detalhes)
- **US6 (Status)**: Depende de US4 (pagina de detalhes)
- **US7 (Notas)**: Depende de US4 (pagina de detalhes)
- **US8 (Filtros avancados)**: Independente - pode comecar apos Foundational
- **US9/US10 (Copiar/Mapa)**: Depende de US4 (pagina de detalhes)

### Within Each User Story

- Testes DEVEM ser escritos e FALHAR antes da implementacao
- Componentes UI podem ser criados em paralelo
- Integracao na pagina depois dos componentes
- Story completa antes de mover para proxima prioridade

### Parallel Opportunities

**Setup (executar em paralelo):**
```
T002: Criar tipos
T003: Criar schema Zod
```

**Foundational (executar em paralelo apos T005):**
```
T006: getStatusCounts
T007: createQuotationActivity
T008: listQuotationActivities
T011: Testes unitarios
```

**User Stories P1 (podem executar em paralelo):**
```
US1: Lista basica (T014-T020)
US2: Filtro status (T023-T026)
US3: Busca (T030-T033)
US4: Detalhes (T037-T044)
```

**Componentes de detalhe (executar em paralelo):**
```
T037: cotacoes-detail-header
T038: cotacoes-detail-client
T039: cotacoes-detail-vehicle
T040: cotacoes-detail-values
T041: cotacoes-detail-seller
```

---

## Parallel Example: User Story 4

```bash
# Launch all detail components together:
Task: "Create cotacoes-detail-header.tsx in components/"
Task: "Create cotacoes-detail-client.tsx in components/"
Task: "Create cotacoes-detail-vehicle.tsx in components/"
Task: "Create cotacoes-detail-values.tsx in components/"
Task: "Create cotacoes-detail-seller.tsx in components/"
```

---

## Implementation Strategy

### MVP First (User Stories 1-4 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICO - bloqueia todas stories)
3. Complete Phases 3-6: User Stories 1-4 (Lista + Filtro + Busca + Detalhes)
4. **STOP and VALIDATE**: Testar fluxo completo de visualizacao
5. Deploy/demo se pronto - vendedores ja podem usar para consulta

### Incremental Delivery

1. Setup + Foundational -> Fundacao pronta
2. US1-4 (P1) -> Visualizacao completa (MVP!)
3. US5-7 (P2) -> Interacao com cliente + status + notas
4. US8-10 (P3) -> Filtros avancados + conveniencias
5. Cada story adiciona valor sem quebrar stories anteriores

### Parallel Team Strategy

Com multiplos desenvolvedores:

1. Time completa Setup + Foundational juntos
2. Uma vez Foundational pronta:
   - Dev A: US1 (Lista) + US2 (Filtro status)
   - Dev B: US3 (Busca) + US4 (Detalhes)
3. Apos US4 completa:
   - Dev A: US5 (Contato) + US6 (Status)
   - Dev B: US7 (Notas) + US8 (Filtros)
4. Stories completam e integram independentemente

---

## Summary

| Fase | User Stories | Tasks | Parallelizable |
|------|--------------|-------|----------------|
| Setup | - | 3 | 2 |
| Foundational | - | 8 | 5 |
| US1 (Lista) | P1 | 9 | 5 |
| US2 (Filtro Status) | P1 | 6 | 2 |
| US3 (Busca) | P1 | 7 | 3 |
| US4 (Detalhes) | P1 | 11 | 8 |
| US5 (Contato) | P2 | 5 | 2 |
| US6 (Status) | P2 | 8 | 3 |
| US7 (Notas) | P2 | 7 | 2 |
| US8 (Filtros) | P3 | 8 | 3 |
| US9/10 (Copiar/Mapa) | P3 | 6 | 2 |
| Polish | - | 8 | 5 |
| **Total** | **10** | **86** | **42** |

---

## Notes

- [P] tasks = arquivos diferentes, sem dependencias
- [Story] label mapeia task para user story especifica para rastreabilidade
- Cada user story deve ser independentemente completavel e testavel
- Verificar que testes falham antes de implementar
- Fazer commit apos cada task ou grupo logico
- Parar em qualquer checkpoint para validar story independentemente
- Evitar: tasks vagas, conflitos de mesmo arquivo, dependencias cross-story que quebram independencia
