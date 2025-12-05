# Tasks: Sistema de Cotacao Veicular

**Input**: Design documents from `/specs/001-cotacao-veicular/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Testes sao incluidos conforme Principio VIII da Constitution (Desenvolvimento Orientado a Testes - NAO-NEGOCIAVEL).

**Organization**: Tasks organizadas por user story para permitir implementacao e teste independente de cada story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependencias)
- **[Story]**: User story a qual a task pertence (US1, US2, etc.)
- Caminhos exatos incluidos nas descricoes

## Path Conventions

Projeto Next.js App Router:
- `/app` - Paginas e rotas
- `/lib` - Modulos de contexto (logica de negocio)
- `/components` - Componentes React
- `/tests` - Testes (quando configurados)

---

## Phase 1: Setup (Infraestrutura Compartilhada)

**Purpose**: Inicializacao do projeto e estrutura basica

- [x] T001 [P] Adicionar variaveis de ambiente para APIs externas em `.env.example` (POWER_CRM_API_KEY, WDAPI2_TOKEN, EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE)
- [x] T002 [P] Instalar dependencias de teste: vitest, @testing-library/react, playwright em `package.json`
- [x] T003 [P] Configurar vitest em `vitest.config.ts`
- [x] T004 [P] Adicionar scripts de teste em `package.json` ("test", "test:e2e")

---

## Phase 2: Foundational (Pre-requisitos Bloqueantes)

**Purpose**: Infraestrutura core que DEVE estar completa antes de QUALQUER user story

**CRITICAL**: Nenhuma user story pode comecar ate esta fase estar completa

- [x] T005 Criar enums do Drizzle (vehicleCategoryEnum, usageTypeEnum, quotationStatusEnum, sellerRoleEnum) em `lib/schema.ts`
- [x] T006 Criar tabela `customers` no schema Drizzle em `lib/schema.ts`
- [x] T007 Criar tabela `vehicles` no schema Drizzle em `lib/schema.ts`
- [x] T008 Criar tabela `sellers` no schema Drizzle em `lib/schema.ts`
- [x] T009 Criar tabela `quotations` no schema Drizzle em `lib/schema.ts`
- [x] T010 Criar tabela `pricing_rules` no schema Drizzle em `lib/schema.ts`
- [x] T011 Criar tabela `blacklist` no schema Drizzle em `lib/schema.ts`
- [x] T012 Gerar e aplicar migration: `npm run db:generate && npm run db:migrate`
- [x] T013 [P] Criar validacao de CPF com digitos verificadores em `lib/validations/cpf.ts`
- [x] T014 [P] Criar validacao de placa (antigo ABC-1234 e Mercosul ABC1D23) em `lib/validations/placa.ts`
- [x] T015 [P] Criar schemas Zod compartilhados (customer, vehicle, quotation) em `lib/validations/schemas.ts`
- [x] T016 Criar arquivo seed SQL com tabela de precos e blacklist inicial em `drizzle/seed.sql`
- [ ] T017 Executar seed no banco de dados: `psql $DATABASE_URL < drizzle/seed.sql`
- [x] T018 [P] Adicionar componentes shadcn necessarios: `npx shadcn@latest add button input form card table select badge`
- [x] T019 Estender proxy.ts para proteger rotas admin `/(admin)/*` e verificar role SELLER/ADMIN

**Checkpoint**: Fundacao pronta - implementacao de user stories pode comecar

---

## Phase 3: User Story 1 - Cotacao de Veiculo por Placa (Priority: P1) - MVP

**Goal**: Cliente consulta placa, seleciona categoria/uso e recebe dados do veiculo com valores calculados

**Independent Test**: Inserir placa valida, selecionar categoria/uso, verificar se sistema retorna dados do veiculo e valores calculados

### Tests for User Story 1

- [x] T020 [P] [US1] Teste unitario: validacao de placa em `tests/unit/placa.test.ts`
- [x] T021 [P] [US1] Teste unitario: calculo de categoria do veiculo em `tests/unit/vehicles.test.ts`
- [x] T022 [P] [US1] Teste unitario: verificacao de blacklist em `tests/unit/blacklist.test.ts`
- [x] T023 [P] [US1] Teste unitario: verificacao de limite FIPE por categoria em `tests/unit/pricing.test.ts`
- [x] T024 [P] [US1] Teste unitario: calculo de valores (mensalidade, adesao, desconto) em `tests/unit/quotations.test.ts`

### Implementation for User Story 1

- [x] T025 [P] [US1] Implementar contexto blacklist com funcao `isBlacklisted(marca, modelo)` em `lib/blacklist.ts`
- [x] T026 [P] [US1] Implementar contexto pricing com funcao `findPricingRule(categoria, valorFipe)` em `lib/pricing.ts`
- [x] T027 [P] [US1] Implementar funcao `calculateQuotationValues(mensalidade)` retornando adesao e desconto em `lib/pricing.ts`
- [x] T028 [US1] Implementar integracao PowerCRM API com retry em `lib/vehicles.ts` - funcao `lookupPlateOnPowerCRM(placa)`
- [x] T029 [US1] Implementar integracao WDAPI2 API com retry em `lib/vehicles.ts` - funcao `getFipeValue(codFipe, placa)`
- [x] T030 [US1] Implementar logica de selecao de valor FIPE (codigo exato ou maior score) em `lib/vehicles.ts`
- [x] T031 [US1] Implementar logica de determinacao de categoria (MOTO, UTILITARIO, ESPECIAL, NORMAL) em `lib/vehicles.ts`
- [x] T032 [US1] Implementar verificacao de limite FIPE por categoria (180k, 190k, 450k, 90k) em `lib/vehicles.ts`
- [x] T033 [US1] Implementar funcao principal `lookupVehicle(placa, categoria, tipoUso)` orquestrando todas as etapas em `lib/vehicles.ts`
- [x] T034 [US1] Criar API route POST /api/vehicles/lookup em `app/api/vehicles/lookup/route.ts`
- [x] T035 [P] [US1] Criar componente de formulario de veiculo (placa, categoria, tipo uso) em `components/cotacao-form-vehicle.tsx`
- [x] T036 [P] [US1] Criar componente de resultado da consulta (dados do veiculo + valores) em `components/cotacao-result.tsx`
- [x] T037 [P] [US1] Criar componente de recusa (blacklist ou limite) em `components/cotacao-rejected.tsx`
- [x] T038 [US1] Criar pagina de cotacao publica (Client Component) em `app/(public)/cotacao/page.tsx`

**Checkpoint**: User Story 1 completa - cliente pode consultar veiculo e ver valores calculados

---

## Phase 4: User Story 2 - Coleta de Dados do Cliente e Finalizacao (Priority: P1)

**Goal**: Cliente preenche dados pessoais, cotacao e salva com vendedor atribuido e notificacao WhatsApp

**Independent Test**: Preencher dados do cliente apos consulta bem-sucedida, verificar se cotacao e salva e notificacao enviada

### Tests for User Story 2

- [x] T039 [P] [US2] Teste unitario: validacao de CPF em `tests/unit/cpf.test.ts`
- [x] T040 [P] [US2] Teste unitario: busca de CEP via ViaCEP em `tests/unit/viacep.test.ts`
- [x] T041 [P] [US2] Teste unitario: criacao/reutilizacao de cliente por CPF em `tests/unit/customers.test.ts`
- [x] T042 [P] [US2] Teste unitario: criacao de cotacao com valores em `tests/unit/quotations.test.ts`

### Implementation for User Story 2

- [x] T043 [P] [US2] Implementar integracao ViaCEP API em `lib/customers.ts` - funcao `lookupCep(cep)`
- [x] T044 [US2] Implementar contexto customers com funcao `findOrCreateByCPF(data)` em `lib/customers.ts`
- [x] T045 [US2] Implementar funcao `createVehicle(data)` em `lib/vehicles.ts`
- [x] T046 [US2] Implementar funcao `createQuotation(customerId, vehicleId, valores, sellerId?, isRejected?)` em `lib/quotations.ts`
- [x] T047 [US2] Criar API route POST /api/quotations em `app/api/quotations/route.ts`
- [x] T048 [P] [US2] Criar componente de formulario do cliente (dados pessoais + endereco) em `components/cotacao-form-customer.tsx`
- [x] T049 [US2] Integrar busca automatica de CEP no componente de formulario do cliente
- [x] T050 [US2] Criar pagina de resultado da cotacao com ID em `app/(public)/cotacao/[id]/page.tsx`
- [x] T051 [US2] Implementar fluxo completo de cotacao: steps veiculo → cliente → resultado na pagina de cotacao

**Checkpoint**: User Stories 1 e 2 completas - fluxo publico de cotacao funcional (MVP Core)

---

## Phase 5: User Story 3 - Notificacao e Atribuicao de Vendedor (Priority: P2)

**Goal**: Cotacao finalizada atribui vendedor via round-robin e notifica cliente e vendedor via WhatsApp

**Independent Test**: Finalizar multiplas cotacoes, verificar distribuicao round-robin e notificacoes enviadas

### Tests for User Story 3

- [x] T052 [P] [US3] Teste unitario: algoritmo round-robin de atribuicao em `tests/unit/sellers.test.ts`
- [x] T053 [P] [US3] Teste unitario: envio de mensagem WhatsApp em `tests/unit/notifications.test.ts`

### Implementation for User Story 3

- [x] T054 [US3] Implementar contexto sellers com funcao `getNextActiveSeller()` (round-robin baseado em lastAssignmentAt) em `lib/sellers.ts`
- [x] T055 [US3] Implementar funcao `assignSellerToQuotation(quotationId)` em `lib/sellers.ts`
- [x] T056 [US3] Implementar integracao Evolution API em `lib/notifications.ts` - funcao `sendWhatsAppMessage(phone, text)`
- [x] T057 [US3] Implementar funcao `notifyCustomerQuotation(quotation)` com template de mensagem em `lib/notifications.ts`
- [x] T058 [US3] Implementar funcao `notifySellerNewLead(seller, quotation)` com template de mensagem em `lib/notifications.ts`
- [x] T059 [US3] Integrar atribuicao de vendedor e notificacoes na criacao de cotacao em `app/api/quotations/route.ts`

**Checkpoint**: User Story 3 completa - cotacoes atribuem vendedores e enviam notificacoes

---

## Phase 6: User Story 4 - Painel Administrativo de Cotacoes (Priority: P2)

**Goal**: Vendedores e admins visualizam cotacoes, filtram por status e atualizam status

**Independent Test**: Login como vendedor, verificar se ve apenas cotacoes atribuidas e consegue atualizar status

### Tests for User Story 4

- [x] T060 [P] [US4] Teste unitario: listagem de cotacoes com filtro de vendedor em `tests/unit/quotations.test.ts`
- [x] T061 [P] [US4] Teste unitario: transicoes de status validas em `tests/unit/quotations.test.ts`
- [x] T062 [P] [US4] Teste unitario: expiracao automatica de cotacoes em `tests/unit/quotations.test.ts`

### Implementation for User Story 4

- [x] T063 [US4] Implementar funcao `listQuotations(sellerId?, status?, pagination)` com filtro por vendedor/admin em `lib/quotations.ts`
- [x] T064 [US4] Implementar funcao `getQuotationById(id, sellerId?)` com verificacao de acesso em `lib/quotations.ts`
- [x] T065 [US4] Implementar funcao `updateQuotationStatus(id, status, notes?, sellerId?)` com validacao de transicao em `lib/quotations.ts`
- [x] T066 [US4] Implementar funcao `expireOldQuotations()` para marcar cotacoes pendentes > 7 dias como EXPIRED em `lib/quotations.ts`
- [x] T067 [US4] Criar API route GET /api/quotations (lista com paginacao) em `app/api/quotations/route.ts`
- [x] T068 [US4] Criar API route GET /api/quotations/[id] em `app/api/quotations/[id]/route.ts`
- [x] T069 [US4] Criar API route PATCH /api/quotations/[id] em `app/api/quotations/[id]/route.ts`
- [x] T070 [P] [US4] Criar componente de lista de cotacoes com filtros em `components/admin-quotations-list.tsx`
- [x] T071 [P] [US4] Criar componente de detalhes da cotacao em `components/admin-quotation-details.tsx`
- [x] T072 [US4] Criar layout admin com sidebar em `app/(admin)/layout.tsx`
- [x] T073 [US4] Criar pagina de lista de cotacoes admin em `app/(admin)/cotacoes/page.tsx`
- [x] T074 [US4] Criar pagina de detalhes da cotacao admin em `app/(admin)/cotacoes/[id]/page.tsx`

**Checkpoint**: User Story 4 completa - painel admin de cotacoes funcional

---

## Phase 7: User Story 5 - Gestao de Tabela de Precos (Priority: P3)

**Goal**: Administradores visualizam e editam tabela de precos por categoria

**Independent Test**: Acessar painel de precos, editar faixa, verificar se alteracao reflete em novas cotacoes

### Tests for User Story 5

- [x] T075 [P] [US5] Teste unitario: CRUD de regras de preco em `tests/unit/pricing.test.ts`

### Implementation for User Story 5

- [x] T076 [US5] Implementar funcao `listPricingRules(categoria?, active?)` em `lib/pricing.ts`
- [x] T077 [US5] Implementar funcao `createPricingRule(data)` em `lib/pricing.ts`
- [x] T078 [US5] Implementar funcao `updatePricingRule(id, data)` em `lib/pricing.ts`
- [x] T079 [US5] Implementar funcao `deletePricingRule(id)` (soft delete) em `lib/pricing.ts`
- [x] T080 [US5] Criar API route GET, POST /api/pricing em `app/api/pricing/route.ts`
- [x] T081 [US5] Criar API route PATCH, DELETE /api/pricing/[id] em `app/api/pricing/[id]/route.ts`
- [x] T082 [P] [US5] Criar componente de tabela de precos editavel em `components/admin-pricing-table.tsx`
- [x] T083 [US5] Criar pagina de gestao de precos admin em `app/(admin)/precos/page.tsx`

**Checkpoint**: User Story 5 completa - gestao de precos funcional

---

## Phase 8: User Story 6 - Gestao de Blacklist (Priority: P3)

**Goal**: Administradores visualizam, adicionam e removem marcas/modelos da blacklist

**Independent Test**: Adicionar marca a blacklist, verificar se cotacoes para aquele veiculo sao recusadas

### Tests for User Story 6

- [x] T084 [P] [US6] Teste unitario: CRUD de blacklist em `tests/unit/blacklist.test.ts`

### Implementation for User Story 6

- [x] T085 [US6] Implementar funcao `listBlacklist(active?)` em `lib/blacklist.ts`
- [x] T086 [US6] Implementar funcao `addToBlacklist(marca, modelo?, motivo?)` em `lib/blacklist.ts`
- [x] T087 [US6] Implementar funcao `removeFromBlacklist(id)` (soft delete) em `lib/blacklist.ts`
- [x] T088 [US6] Criar API route GET, POST /api/blacklist em `app/api/blacklist/route.ts`
- [x] T089 [US6] Criar API route DELETE /api/blacklist/[id] em `app/api/blacklist/[id]/route.ts`
- [x] T090 [P] [US6] Criar componente de tabela de blacklist editavel em `components/admin-blacklist-table.tsx`
- [x] T091 [US6] Criar pagina de gestao de blacklist admin em `app/(admin)/blacklist/page.tsx`

**Checkpoint**: Todas as user stories completas

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Melhorias que afetam multiplas user stories

- [x] T092 [P] Adicionar tratamento de erros consistente em todas as API routes
- [x] T093 [P] Adicionar loading states em todos os componentes de formulario
- [x] T094 [P] Adicionar empty states nas tabelas admin
- [x] T095 Implementar cron job ou chamada on-demand para expiracao de cotacoes
- [x] T096 [P] Revisar e ajustar responsividade dos componentes
- [x] T097 Validar fluxo completo via quickstart.md
- [x] T098 [P] Adicionar testes E2E com Playwright para fluxo de cotacao em `tests/e2e/cotacao.spec.ts`
- [x] T099 [P] Adicionar testes E2E para painel admin em `tests/e2e/admin.spec.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependencias - pode comecar imediatamente
- **Foundational (Phase 2)**: Depende de Setup - BLOQUEIA todas as user stories
- **User Stories (Phase 3-8)**: Todas dependem de Foundational estar completo
  - US1 e US2 sao P1 e devem ser feitas primeiro (MVP)
  - US3 depende de US2 (precisa de cotacoes criadas para atribuir)
  - US4 depende de US2 (precisa de cotacoes para listar)
  - US5 e US6 podem rodar em paralelo apos US2
- **Polish (Phase 9)**: Depende de todas as user stories desejadas estarem completas

### User Story Dependencies

```
Phase 1: Setup
    ↓
Phase 2: Foundational (BLOCKS ALL)
    ↓
┌───────────────────────────────────────┐
│         Phase 3: US1 (P1)             │ ← MVP Start
│  Cotacao de Veiculo por Placa         │
└───────────────┬───────────────────────┘
                ↓
┌───────────────────────────────────────┐
│         Phase 4: US2 (P1)             │ ← MVP Core
│  Coleta de Dados e Finalizacao        │
└───────────────┬───────────────────────┘
                ↓
┌───────────┬───────────┬───────────────┐
│  Phase 5  │  Phase 6  │  Phase 7 & 8  │
│ US3 (P2)  │ US4 (P2)  │ US5/US6 (P3)  │
│ Vendedor  │ Painel    │ Precos/Black  │
└───────────┴───────────┴───────────────┘
                ↓
         Phase 9: Polish
```

### Within Each User Story

- Testes DEVEM ser escritos e FALHAR antes da implementacao
- Contextos antes de API routes
- API routes antes de componentes
- Componentes antes de paginas
- Story completa antes de mover para proxima prioridade

### Parallel Opportunities

**Phase 1 (Setup)**:
- T001, T002, T003, T004 podem rodar em paralelo

**Phase 2 (Foundational)**:
- T013, T014, T015 (validacoes) podem rodar em paralelo
- T018 (shadcn) pode rodar em paralelo com outras tasks

**Phase 3 (US1)**:
- T020-T024 (testes) podem rodar em paralelo
- T025, T026, T027 (contextos independentes) podem rodar em paralelo
- T035, T036, T037 (componentes) podem rodar em paralelo

**Phase 4 (US2)**:
- T039-T042 (testes) podem rodar em paralelo

**Phase 5 (US3)**:
- T052, T053 (testes) podem rodar em paralelo

**Phase 6 (US4)**:
- T060-T062 (testes) podem rodar em paralelo
- T070, T071 (componentes) podem rodar em paralelo

---

## Parallel Example: User Story 1

```bash
# Launch all tests for US1 together:
Task: "T020 [P] [US1] Teste unitario: validacao de placa"
Task: "T021 [P] [US1] Teste unitario: calculo de categoria do veiculo"
Task: "T022 [P] [US1] Teste unitario: verificacao de blacklist"
Task: "T023 [P] [US1] Teste unitario: verificacao de limite FIPE"
Task: "T024 [P] [US1] Teste unitario: calculo de valores"

# Launch parallel contexts:
Task: "T025 [P] [US1] Implementar contexto blacklist"
Task: "T026 [P] [US1] Implementar contexto pricing findPricingRule"
Task: "T027 [P] [US1] Implementar contexto pricing calculateQuotationValues"

# Launch parallel components:
Task: "T035 [P] [US1] Criar componente cotacao-form-vehicle"
Task: "T036 [P] [US1] Criar componente cotacao-result"
Task: "T037 [P] [US1] Criar componente cotacao-rejected"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - bloqueia todas as stories)
3. Complete Phase 3: User Story 1 - Cliente consulta veiculo
4. Complete Phase 4: User Story 2 - Cliente finaliza cotacao
5. **STOP and VALIDATE**: Testar fluxo completo de cotacao
6. Deploy/demo se pronto

### Incremental Delivery

1. Setup + Foundational → Fundacao pronta
2. US1 + US2 → Testar independentemente → Deploy (MVP!)
3. US3 → Testar → Deploy (Notificacoes + Vendedores)
4. US4 → Testar → Deploy (Painel Admin)
5. US5 + US6 → Testar → Deploy (Gestao de Precos/Blacklist)

### Parallel Team Strategy

Com multiplos desenvolvedores:

1. Time completa Setup + Foundational juntos
2. Uma vez que Foundational esta pronto:
   - Dev A: User Stories 1 + 2 (MVP)
   - Dev B: Preparar testes E2E (Phase 9)
3. Apos MVP:
   - Dev A: User Stories 3 + 4
   - Dev B: User Stories 5 + 6

---

## Summary

| Metrica | Valor |
|---------|-------|
| **Total de Tasks** | 99 |
| **Setup** | 4 tasks |
| **Foundational** | 15 tasks |
| **US1 (P1)** | 19 tasks |
| **US2 (P1)** | 13 tasks |
| **US3 (P2)** | 8 tasks |
| **US4 (P2)** | 15 tasks |
| **US5 (P3)** | 9 tasks |
| **US6 (P3)** | 8 tasks |
| **Polish** | 8 tasks |
| **Tasks Paralelizaveis** | 45 tasks (marcadas com [P]) |

### MVP Scope (Recomendado)

- **Phases 1-4**: Setup + Foundational + US1 + US2
- **Total MVP Tasks**: 51 tasks
- **Resultado**: Cliente pode fazer cotacao completa (consulta veiculo → preenche dados → recebe resultado)

---

## Notes

- [P] tasks = arquivos diferentes, sem dependencias
- [Story] label mapeia task para user story especifica para rastreabilidade
- Cada user story deve ser completavel e testavel independentemente
- Verificar que testes falham antes de implementar
- Commit apos cada task ou grupo logico
- Parar em qualquer checkpoint para validar story independentemente
- Evitar: tasks vagas, conflitos de mesmo arquivo, dependencias cross-story que quebram independencia
