# Tasks: Configuracoes Gerais

**Input**: Design documents from `/specs/007-configuracoes-gerais/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Incluidos conforme constituicao do projeto (TDD e principio nao-negociavel).

**Organization**: Tasks organizadas por user story para permitir implementacao e teste independente de cada historia.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependencias)
- **[Story]**: Qual user story esta task pertence (US1, US2, etc.)
- Inclui caminhos exatos de arquivos nas descricoes

## Path Conventions

Paths seguem estrutura Next.js App Router conforme plan.md:
- `app/` - Paginas e rotas
- `lib/` - Modulos de contexto e logica de negocio
- `components/` - Componentes React

---

## Phase 1: Setup

**Purpose**: Inicializacao do projeto e estrutura basica

- [x] T001 Adicionar variavel ENCRYPTION_KEY ao .env.example
- [x] T002 [P] Instalar dependencias necessarias (se ausentes): zod, react-hook-form
- [x] T003 [P] Criar diretorio lib/integrations/ para modulos de integracao
- [x] T004 [P] Criar diretorio public/uploads/ para armazenamento de logos

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infraestrutura core que DEVE estar completa antes de qualquer user story

**CRITICAL**: Nenhum trabalho de user story pode comecar ate esta fase estar completa

- [x] T005 Adicionar tabelas settings, settingsAuditLog, messageTemplate, messageQueue em lib/schema.ts
- [x] T006 Gerar e aplicar migration: npm run db:generate && npm run db:migrate
- [x] T007 [P] Implementar funcoes de criptografia encrypt/decrypt em lib/crypto.ts
- [x] T008 [P] Criar Zod schemas para cada categoria de settings em lib/settings-schemas.ts
- [x] T009 Implementar contexto settings basico (getSettings, updateSettings) em lib/settings.ts
- [x] T010 [P] Implementar funcoes de auditoria (createAuditLog, getSensitiveFields) em lib/settings.ts
- [x] T011 Criar API route base GET/PUT settings por categoria em app/api/settings/route.ts
- [x] T012 [P] Implementar middleware de verificacao de admin em lib/settings.ts
- [x] T013 [P] Criar seed de configuracoes padrao em lib/settings.ts (initializeDefaultSettings)

**Checkpoint**: Fundacao pronta - implementacao de user stories pode comecar

---

## Phase 3: User Story 1 - Configurar Dados da Empresa (Priority: P1)

**Goal**: Permitir que administrador cadastre e mantenha dados da empresa (nome, CNPJ, logo, contato, endereco)

**Independent Test**: Acessar aba Empresa, preencher dados, verificar persistencia e exibicao

### Implementation for User Story 1

- [x] T014 [P] [US1] Implementar integracao ViaCEP com timeout em lib/integrations/viacep.ts
- [x] T015 [P] [US1] Implementar validacao de CNPJ com digitos verificadores em lib/validators.ts
- [x] T016 [US1] Criar API route para busca de CEP em app/api/settings/cep/[cep]/route.ts
- [x] T017 [P] [US1] Criar API route para upload de logo em app/api/settings/upload-logo/route.ts
- [x] T018 [US1] Criar componente settings-logo-upload.tsx em components/
- [x] T019 [US1] Criar componente settings-empresa-form.tsx com react-hook-form e Zod em components/
- [x] T020 [US1] Implementar mascaras de CNPJ, telefone e CEP no formulario empresa
- [x] T021 [US1] Adicionar busca automatica de endereco ao preencher CEP no formulario
- [x] T022 [US1] Criar componente settings-tabs.tsx para navegacao entre abas em components/

**Checkpoint**: User Story 1 funcional - admin pode configurar dados da empresa

---

## Phase 4: User Story 2 - Configurar Regras de Cotacao (Priority: P1)

**Goal**: Permitir definicao de parametros de cotacao (validade, taxas, descontos, cotas)

**Independent Test**: Configurar taxa e desconto, criar cotacao e verificar calculo correto

### Implementation for User Story 2

- [x] T023 [P] [US2] Criar componente settings-cotacao-form.tsx em components/
- [x] T024 [US2] Implementar calculo em tempo real da taxa de adesao no formulario
- [x] T025 [US2] Implementar configuracao de cotas por categoria (Normal, Especial, Utilitario, Moto)
- [x] T026 [US2] Implementar configuracao de alerta de expiracao com dias de antecedencia
- [x] T027 [US2] Adicionar links para telas existentes de Precos e Blacklist no formulario

**Checkpoint**: User Story 2 funcional - admin pode configurar regras de cotacao

---

## Phase 5: User Story 3 - Integrar com WhatsApp API (Priority: P2)

**Goal**: Permitir configuracao da integracao WhatsApp para envio automatico de mensagens

**Independent Test**: Configurar credenciais, testar conexao, verificar status conectado/erro

### Implementation for User Story 3

- [x] T028 [P] [US3] Implementar interface WhatsAppProvider em lib/integrations/whatsapp.ts
- [x] T029 [P] [US3] Implementar adapter EvolutionAdapter em lib/integrations/whatsapp.ts
- [x] T030 [P] [US3] Implementar adapter ZApiAdapter em lib/integrations/whatsapp.ts
- [x] T031 [US3] Implementar factory createWhatsAppProvider em lib/integrations/whatsapp.ts
- [x] T032 [US3] Criar API route para testar conexao WhatsApp em app/api/settings/test-connection/route.ts
- [x] T033 [US3] Criar componente settings-connection-status.tsx em components/
- [x] T034 [US3] Criar componente settings-whatsapp-form.tsx em components/
- [x] T035 [US3] Implementar criptografia de API Key antes de salvar no formulario

**Checkpoint**: User Story 3 funcional - admin pode configurar e testar integracao WhatsApp

---

## Phase 6: User Story 4 - Gerenciar Templates de Mensagens (Priority: P2)

**Goal**: Permitir criacao e edicao de templates com variaveis dinamicas

**Independent Test**: Criar template com variaveis, editar, visualizar preview

### Implementation for User Story 4

- [x] T036 [P] [US4] Criar API routes CRUD para templates em app/api/settings/templates/route.ts
- [x] T037 [P] [US4] Criar API route para validar variaveis em app/api/settings/templates/validate/route.ts
- [x] T038 [US4] Implementar funcoes de template (listTemplates, createTemplate, updateTemplate, deleteTemplate) em lib/settings.ts
- [x] T039 [US4] Implementar validacao de variaveis de template em lib/settings.ts
- [x] T040 [US4] Criar componente settings-template-editor.tsx em components/
- [x] T041 [US4] Adicionar lista de variaveis disponiveis no editor de templates
- [x] T042 [US4] Implementar seed de templates padrao (Cotacao Criada, Expirando, Aceita) em lib/settings.ts

**Checkpoint**: User Story 4 funcional - admin pode gerenciar templates de mensagens

---

## Phase 7: User Story 5 - Configurar Notificacoes do Sistema (Priority: P3)

**Goal**: Permitir configuracao de eventos que disparam notificacoes por email, WhatsApp e sistema

**Independent Test**: Habilitar notificacao por email, testar SMTP, verificar envio

### Implementation for User Story 5

- [x] T043 [P] [US5] Implementar integracao SMTP com TLS em lib/integrations/smtp.ts
- [x] T044 [US5] Adicionar teste de conexao SMTP no endpoint test-connection
- [x] T045 [US5] Criar componente settings-notificacoes-form.tsx em components/
- [x] T046 [US5] Implementar configuracao de eventos por canal (email, WhatsApp, sistema)
- [x] T047 [US5] Implementar criptografia de senha SMTP antes de salvar

**Checkpoint**: User Story 5 funcional - admin pode configurar notificacoes

---

## Phase 8: User Story 6 - Configurar Preferencias do Sistema (Priority: P3)

**Goal**: Permitir configuracao de preferencias regionais e integracoes de API externas

**Independent Test**: Alterar formato de data, verificar exibicao em todo sistema

### Implementation for User Story 6

- [x] T048 [P] [US6] Criar secao de preferencias regionais no formulario sistema
- [x] T049 [US6] Adicionar teste de conexao para APIs externas (WDAPI2, FIPE, ViaCEP)
- [x] T050 [US6] Criar componente settings-sistema-form.tsx em components/
- [x] T051 [US6] Implementar configuracao de URL e credenciais WDAPI2 com criptografia

**Checkpoint**: User Story 6 funcional - admin pode configurar preferencias regionais

---

## Phase 9: User Story 7 - Gerenciar Backup e Dados (Priority: P3)

**Goal**: Permitir backup manual/automatico, exportacao e importacao de dados

**Independent Test**: Clicar em backup agora, verificar arquivo gerado

### Implementation for User Story 7

- [x] T052 [P] [US7] Criar API route para backup em app/api/settings/backup/route.ts
- [x] T053 [US7] Implementar funcao de backup manual (pg_dump) em lib/settings.ts
- [x] T054 [US7] Implementar listagem de backups existentes em lib/settings.ts
- [x] T055 [US7] Adicionar secao de backup no formulario sistema
- [x] T056 [US7] Implementar configuracao de backup automatico e retencao
- [x] T057 [P] [US7] Criar API route para export/import em app/api/settings/export/route.ts
- [x] T058 [US7] Implementar exportacao de dados em JSON/CSV em lib/settings.ts

**Checkpoint**: User Story 7 funcional - admin pode fazer backup e exportar dados

---

## Phase 10: Integration & Page Assembly

**Purpose**: Montar pagina principal integrando todos os componentes

- [x] T059 Criar pagina principal Server Component em app/configuracoes/page.tsx
- [x] T060 Integrar todos os formularios de aba na pagina principal
- [x] T061 Implementar persistencia de aba ativa na URL (query param)
- [x] T062 Implementar mensagens de sucesso/erro globais com toast
- [x] T063 Adicionar item de menu Configuracoes no layout principal

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Melhorias que afetam multiplas user stories

- [x] T064 [P] Implementar logs de sistema (Debug, Info, Warning, Error)
- [x] T065 [P] Criar API route para visualizar logs em app/api/settings/logs/route.ts
- [x] T066 [P] Criar API route para audit log em app/api/settings/audit/route.ts
- [x] T067 [P] Implementar funcao de reset para valores padrao em lib/settings.ts
- [x] T068 [P] Criar API route para reset em app/api/settings/reset/route.ts
- [x] T069 Adicionar visualizacao de audit log na aba Sistema
- [x] T070 Validar quickstart.md executando setup completo
- [x] T071 Revisar responsividade em dispositivos moveis
- [x] T072 Garantir acessibilidade (aria labels, keyboard navigation)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependencias - pode comecar imediatamente
- **Foundational (Phase 2)**: Depende de Setup - BLOQUEIA todas as user stories
- **User Stories (Phases 3-9)**: Dependem de Foundational estar completa
  - US1 e US2 sao P1 e podem rodar em paralelo
  - US3 e US4 sao P2 e podem rodar em paralelo
  - US5, US6 e US7 sao P3 e podem rodar em paralelo
- **Integration (Phase 10)**: Depende de todas as user stories desejadas
- **Polish (Phase 11)**: Depende de Integration

### User Story Dependencies

- **US1 (P1)**: Independente - pode comecar apos Foundational
- **US2 (P1)**: Independente - pode comecar apos Foundational
- **US3 (P2)**: Independente - pode comecar apos Foundational
- **US4 (P2)**: Depende de US3 (templates usam WhatsApp)
- **US5 (P3)**: Independente - pode comecar apos Foundational
- **US6 (P3)**: Independente - pode comecar apos Foundational
- **US7 (P3)**: Independente - pode comecar apos Foundational

### Within Each User Story

- Models/schemas antes de services
- Services antes de API routes
- API routes antes de componentes
- Componentes antes de integracao

### Parallel Opportunities

**Phase 2 - Foundational:**
```
T007 (crypto) || T008 (schemas) || T010 (audit) || T012 (middleware) || T013 (seed)
```

**Phase 3 - US1:**
```
T014 (viacep) || T015 (cnpj) || T017 (upload)
```

**Phase 5 - US3:**
```
T028 (interface) || T029 (evolution) || T030 (zapi)
```

**Phase 6 - US4:**
```
T036 (crud api) || T037 (validate api)
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: US1 - Dados Empresa
4. Complete Phase 4: US2 - Regras Cotacao
5. Complete Phase 10: Integration (apenas abas Empresa e Cotacao)
6. **STOP and VALIDATE**: Testar MVP independente
7. Deploy se pronto

### Incremental Delivery

1. Setup + Foundational -> Foundation ready
2. Add US1 + US2 -> Test -> Deploy (MVP!)
3. Add US3 + US4 -> Test -> Deploy (WhatsApp)
4. Add US5 + US6 + US7 -> Test -> Deploy (Full)
5. Polish -> Deploy (Final)

### Parallel Team Strategy

Com multiplos desenvolvedores:

1. Time completa Setup + Foundational juntos
2. Uma vez Foundational pronto:
   - Dev A: US1 (Empresa)
   - Dev B: US2 (Cotacao)
3. Apos P1 completo:
   - Dev A: US3 (WhatsApp)
   - Dev B: US4 (Templates)
4. Apos P2 completo:
   - Dev A: US5 (Notificacoes)
   - Dev B: US6 + US7 (Sistema + Backup)

---

## Summary

| Metric | Value |
|--------|-------|
| Total Tasks | 72 |
| Setup Tasks | 4 |
| Foundational Tasks | 9 |
| US1 Tasks | 9 |
| US2 Tasks | 5 |
| US3 Tasks | 8 |
| US4 Tasks | 7 |
| US5 Tasks | 5 |
| US6 Tasks | 4 |
| US7 Tasks | 7 |
| Integration Tasks | 5 |
| Polish Tasks | 9 |
| Parallel Opportunities | 25+ tasks marked [P] |

## Notes

- [P] tasks = arquivos diferentes, sem dependencias
- [Story] label mapeia task para user story especifica
- Cada user story e completavel e testavel independentemente
- Commit apos cada task ou grupo logico
- Pare em qualquer checkpoint para validar story
- Evitar: tasks vagas, conflitos no mesmo arquivo, dependencias cross-story
