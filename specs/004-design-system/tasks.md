# Tasks: Design System Star Protecao IA

**Input**: Design documents from `/specs/004-design-system/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Nao solicitados explicitamente na especificacao. Tarefas de teste nao incluidas.

**Organization**: Tarefas agrupadas por user story para implementacao e teste independente.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode executar em paralelo (arquivos diferentes, sem dependencias)
- **[Story]**: Qual user story a tarefa pertence (US1, US2, US3, US4)
- Caminhos exatos incluidos nas descricoes

## Path Conventions

- **app/globals.css**: Design tokens (cores, tipografia, espacamentos)
- **app/layout.tsx**: Configuracao da fonte Inter
- **components/ui/**: Componentes shadcn/ui customizados
- **components/**: Componentes de layout e dashboard

---

## Phase 1: Setup (Infraestrutura Compartilhada)

**Purpose**: Preparacao do ambiente e instalacao de dependencias shadcn necessarias

- [x] T001 Adicionar componente switch via shadcn CLI: `npx shadcn@latest add switch`
- [x] T002 Adicionar componente alert via shadcn CLI: `npx shadcn@latest add alert`
- [x] T003 [P] Instalar next-themes para gerenciamento de dark mode: `npm install next-themes`

**Checkpoint**: Dependencias instaladas - pronto para implementar tokens

---

## Phase 2: Foundational (Pre-requisitos Bloqueantes)

**Purpose**: Configuracoes base que DEVEM estar completas antes de qualquer user story

**CRITICAL**: Nenhuma user story pode comecar ate esta fase estar completa

- [x] T004 Configurar fonte Inter com next/font em app/layout.tsx
- [x] T005 [P] Configurar ThemeProvider do next-themes em app/layout.tsx

**Checkpoint**: Foundation pronta - implementacao de user stories pode comecar

---

## Phase 3: User Story 1 - Implementar Tokens de Design (Priority: P1) MVP

**Goal**: Disponibilizar tokens de design (cores, tipografia, espacamentos) para toda aplicacao

**Independent Test**: Verificar se variaveis CSS estao disponiveis em globals.css e classes Tailwind funcionam corretamente com as cores do Figma

### Implementation for User Story 1

- [x] T006 [US1] Definir paleta Light Green (50-900) em OKLCH em app/globals.css
- [x] T007 [P] [US1] Definir paleta Dark Green (50-900) em OKLCH em app/globals.css
- [x] T008 [P] [US1] Definir paleta Blue (50-900) em OKLCH em app/globals.css
- [x] T009 [P] [US1] Definir paleta Red (50-900) em OKLCH em app/globals.css
- [x] T010 [P] [US1] Definir paleta Yellow (50-900) em OKLCH em app/globals.css
- [x] T011 [P] [US1] Definir paleta Grey (50-900) em OKLCH em app/globals.css
- [x] T012 [US1] Atualizar tokens semanticos (--primary, --secondary, etc) para usar Light Green em app/globals.css
- [x] T013 [US1] Atualizar tokens semanticos dark mode (.dark) em app/globals.css
- [x] T014 [P] [US1] Definir escala tipografica Website Heading (H1-H6) em app/globals.css
- [x] T015 [P] [US1] Definir escala tipografica Dashboard Heading (H1-H6) em app/globals.css
- [x] T016 [P] [US1] Definir escala tipografica Body (XLarge-XSmall) em app/globals.css
- [x] T017 [US1] Registrar novas cores no @theme inline do Tailwind CSS 4 em app/globals.css
- [x] T018 [US1] Definir tokens de sidebar (--sidebar-*) com Dark Green em app/globals.css
- [x] T019 [US1] Definir tokens de alert (--alert-success-*, --alert-warning-*, etc) em app/globals.css

**Checkpoint**: User Story 1 completa - tokens de design funcionais em light/dark mode

---

## Phase 4: User Story 2 - Utilizar Componentes Base (Priority: P2)

**Goal**: Fornecer componentes base (Button, Input, Toggle, Radio, Chip) customizados com design system

**Independent Test**: Criar pagina simples usando cada componente e verificar estilos corretos

**Dependencies**: Depende de US1 (tokens devem estar definidos)

### Implementation for User Story 2

- [x] T020 [US2] Customizar variantes do Button (primary verde, secondary, ghost, destructive) em components/ui/button.tsx
- [x] T021 [US2] Customizar estados do Input (focus com Light Green, error com Red) em components/ui/input.tsx
- [x] T022 [US2] Customizar Switch/Toggle com cores Light Green on/off em components/ui/switch.tsx
- [x] T023 [US2] Customizar RadioGroup com indicator Light Green em components/ui/radio-group.tsx
- [x] T024 [US2] Criar componente Chip com variantes filled/outline em components/ui/chip.tsx
- [x] T025 [US2] Adicionar estados hover/active/disabled acessiveis em todos componentes base
- [x] T026 [US2] Garantir focus-visible ring em todos componentes interativos para WCAG 2.1 AA

**Checkpoint**: User Story 2 completa - componentes base funcionais e acessiveis

---

## Phase 5: User Story 3 - Implementar Layout de Dashboard (Priority: P3)

**Goal**: Fornecer componentes de layout (Sidebar, Navbar, Footer, Cards) para construir dashboards

**Independent Test**: Montar pagina de dashboard basica com sidebar, navbar e cards, verificar responsividade

**Dependencies**: Depende de US1 (tokens) e parcialmente US2 (Button para Navbar)

### Implementation for User Story 3

- [x] T027 [US3] Criar componente DashboardSidebar com fundo Dark Green, logo, menu items em components/dashboard-sidebar.tsx
- [x] T028 [US3] Implementar navegacao por teclado e indicador de item ativo na Sidebar
- [x] T029 [US3] Criar componente DashboardNavbar com logo, links, botoes Sign up/Login em components/dashboard-navbar.tsx
- [x] T030 [US3] Implementar versao mobile da Navbar com menu hamburguer (Sheet)
- [x] T031 [US3] Criar componente DashboardFooter com newsletter, quick links, social icons em components/dashboard-footer.tsx
- [x] T032 [US3] Criar componente DashboardMetricCard com titulo, valor, variacao, borda colorida em components/dashboard-metric-card.tsx
- [x] T033 [US3] Criar componente DashboardPageHeader com titulo e descricao em components/dashboard-page-header.tsx
- [x] T034 [US3] Garantir responsividade em todos componentes de layout (breakpoints Tailwind)

**Checkpoint**: User Story 3 completa - layout de dashboard funcional e responsivo

---

## Phase 6: User Story 4 - Utilizar Componentes de Feedback (Priority: P4)

**Goal**: Fornecer componentes de feedback (Alert, Badge, Platform Card, Wizard) para comunicar estados

**Independent Test**: Renderizar cada tipo de alert/badge e verificar cores e icones corretos

**Dependencies**: Depende de US1 (tokens de alert definidos)

### Implementation for User Story 4

- [x] T035 [US4] Customizar Alert com variantes success/warning/error/info usando tokens em components/ui/alert.tsx
- [x] T036 [US4] Customizar Badge com variantes de status (success verde, error vermelho) em components/ui/badge.tsx
- [x] T037 [US4] Criar componente PlatformCard para Shopify, WooCommerce, WordPress, Magento, Wix em components/platform-card.tsx
- [x] T038 [US4] Implementar indicador de conexao (connected/disconnected) no PlatformCard
- [x] T039 [US4] Criar componente WizardStep para processos multi-step em components/wizard-step.tsx
- [x] T040 [US4] Implementar estados do WizardStep (idle, active, completed, error)

**Checkpoint**: User Story 4 completa - componentes de feedback funcionais

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Melhorias que afetam multiplas user stories

- [ ] T041 [P] Verificar contraste WCAG 2.1 AA em todas combinacoes de cor
- [ ] T042 [P] Adicionar aria-label em todos icones sem texto
- [ ] T043 Testar navegacao por teclado em todos componentes interativos
- [ ] T044 [P] Validar dark mode em todos componentes
- [ ] T045 Executar validacao do quickstart.md (testar exemplos de uso)
- [ ] T046 Remover CSS nao utilizado e otimizar globals.css

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependencias - pode comecar imediatamente
- **Foundational (Phase 2)**: Depende de Setup - BLOQUEIA todas user stories
- **User Story 1 (Phase 3)**: Depende de Foundational - Foundation dos tokens
- **User Story 2 (Phase 4)**: Depende de US1 (tokens devem existir)
- **User Story 3 (Phase 5)**: Depende de US1 (tokens) e parcialmente US2 (Button)
- **User Story 4 (Phase 6)**: Depende de US1 (tokens de alert)
- **Polish (Phase 7)**: Depende de todas user stories desejadas completas

### User Story Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational)
    ↓
Phase 3 (US1: Tokens) ← MVP
    ↓
    ├── Phase 4 (US2: Componentes Base)
    │       ↓
    │   Phase 5 (US3: Layout Dashboard)
    │
    └── Phase 6 (US4: Feedback) [pode paralelo com US2/US3]
            ↓
        Phase 7 (Polish)
```

### Within Each User Story

- Tokens/models antes de componentes
- Componentes simples antes de compostos
- Funcionalidade core antes de estados/variantes
- Acessibilidade apos funcionalidade base

### Parallel Opportunities

**Phase 1**: Todas tarefas marcadas [P] podem rodar em paralelo
**Phase 3 (US1)**: T006-T011 (paletas) podem rodar em paralelo, T014-T016 (tipografia) podem rodar em paralelo
**Phase 4 (US2)**: T020-T024 podem rodar parcialmente em paralelo (arquivos diferentes)
**Phase 5 (US3)**: T027, T029, T031, T032, T033 podem iniciar em paralelo (componentes independentes)
**Phase 6 (US4)**: T035, T036, T037, T039 podem rodar em paralelo

---

## Parallel Example: User Story 1 (Tokens)

```bash
# Paletas de cores podem ser definidas em paralelo:
Task: "Definir paleta Light Green (50-900) em app/globals.css"
Task: "Definir paleta Dark Green (50-900) em app/globals.css"
Task: "Definir paleta Blue (50-900) em app/globals.css"
Task: "Definir paleta Red (50-900) em app/globals.css"
Task: "Definir paleta Yellow (50-900) em app/globals.css"
Task: "Definir paleta Grey (50-900) em app/globals.css"

# Apos paletas, tipografia pode ser paralela:
Task: "Definir escala Website Heading em app/globals.css"
Task: "Definir escala Dashboard Heading em app/globals.css"
Task: "Definir escala Body em app/globals.css"
```

---

## Parallel Example: User Story 3 (Layout)

```bash
# Componentes de layout sao independentes:
Task: "Criar DashboardSidebar em components/dashboard-sidebar.tsx"
Task: "Criar DashboardNavbar em components/dashboard-navbar.tsx"
Task: "Criar DashboardFooter em components/dashboard-footer.tsx"
Task: "Criar DashboardMetricCard em components/dashboard-metric-card.tsx"
Task: "Criar DashboardPageHeader em components/dashboard-page-header.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (shadcn components, next-themes)
2. Complete Phase 2: Foundational (Inter font, ThemeProvider)
3. Complete Phase 3: User Story 1 (Design Tokens)
4. **STOP and VALIDATE**: Verificar se cores e tipografia funcionam em light/dark mode
5. Deploy/demo se pronto - design system base funcional!

### Incremental Delivery

1. Setup + Foundational → Ambiente pronto
2. **US1: Tokens** → Deploy/Demo (MVP - base do design system)
3. **US2: Componentes Base** → Deploy/Demo (formularios funcionais)
4. **US3: Layout Dashboard** → Deploy/Demo (dashboards completos)
5. **US4: Feedback** → Deploy/Demo (sistema de feedback completo)
6. Polish → Deploy/Demo (versao final polida)

### Recommended Execution Order

Para desenvolvedor solo:
1. T001-T005 (Setup + Foundational)
2. T006-T019 (US1 - Tokens) ← **MVP**
3. T020-T026 (US2 - Componentes Base)
4. T027-T034 (US3 - Layout)
5. T035-T040 (US4 - Feedback)
6. T041-T046 (Polish)

---

## Notes

- [P] tasks = arquivos diferentes, sem dependencias entre si
- [Story] label mapeia tarefa para user story especifica
- Cada user story deve ser independentemente completavel e testavel
- Commit apos cada tarefa ou grupo logico
- Pare em qualquer checkpoint para validar story independentemente
- Evitar: tarefas vagas, conflitos de arquivo, dependencias cross-story que quebrem independencia
- **Importante**: Todas cores devem ser em formato OKLCH (Tailwind CSS 4)
- **Importante**: Nao modificar arquivos shadcn diretamente - customizar via CSS custom properties
