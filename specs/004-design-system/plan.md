# Implementation Plan: Design System Star Protecao IA

**Branch**: `004-design-system` | **Date**: 2025-11-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-design-system/spec.md`

## Summary

Implementar um Design System completo baseado nos prototipos Figma, incluindo tokens de design (cores, tipografia, espacamentos), componentes base (Button, Input, Toggle, Radio, Chip), componentes de layout (Sidebar, Navbar, Footer, Card) e componentes de feedback (Alert, Badge). O sistema deve suportar modo claro/escuro, ser acessivel (WCAG 2.1 AA) e responsivo usando breakpoints Tailwind padrao.

## Technical Context

**Language/Version**: TypeScript 5.x com Next.js 15 (App Router)
**Primary Dependencies**: React 19, Tailwind CSS 4, shadcn/ui, lucide-react
**Storage**: N/A (design system nao requer persistencia)
**Testing**: Vitest + React Testing Library (testes unitarios de componentes)
**Target Platform**: Web (browsers modernos - Chrome, Firefox, Safari, Edge)
**Project Type**: Web application (Next.js monorepo)
**Performance Goals**: FCP < 100ms impacto da fonte Inter, componentes renderizam em < 16ms
**Constraints**: WCAG 2.1 AA, sem cores hardcoded, customizacao apenas via CSS custom properties
**Scale/Scope**: ~20 componentes, 6 paletas de cores (60 tons), 4 escalas tipograficas

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Status | Verificacao |
|-----------|--------|-------------|
| I. Arquitetura Orientada a Contextos | N/A | Design system nao requer contexto de negocio |
| II. Server-First com Client Components | PASS | Componentes serao Server por padrao, Client apenas para interatividade |
| III. Logica de Negocio em Contextos | N/A | Design system e puramente visual |
| IV. Drizzle ORM | N/A | Sem persistencia necessaria |
| V. Organizacao de Componentes | PASS | Componentes em `components/ui/`, kebab-case, shadcn CLI |
| VI. Tailwind CSS 4 + shadcn/ui | PASS | Cores via CSS custom properties em globals.css |
| VII. Validacao com Zod | N/A | Sem formularios nesta feature |
| VIII. Testes | PASS | Testes unitarios para componentes |
| IX. Vercel AI SDK | N/A | Sem IA nesta feature |
| X. Conventional Commits | PASS | Commits seguirao padrao |

**Gate Status**: PASS - Todos os principios aplicaveis estao em conformidade.

## Project Structure

### Documentation (this feature)

```text
specs/004-design-system/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (design tokens structure)
├── quickstart.md        # Phase 1 output
├── contracts/           # N/A (sem API)
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
app/
├── globals.css          # Design tokens (cores, tipografia, espacamentos)
└── layout.tsx           # Font Inter loading

components/
├── ui/                  # Componentes shadcn/ui customizados
│   ├── button.tsx       # Variantes: primary, secondary, ghost, destructive
│   ├── input.tsx        # Estados: default, focus, error, disabled
│   ├── toggle.tsx       # NEW - on/off states
│   ├── radio-group.tsx  # Ja existe - customizar
│   ├── chip.tsx         # NEW - filled, outline variants
│   ├── alert.tsx        # NEW - success, warning, error, info
│   ├── badge.tsx        # Ja existe - customizar
│   └── ...
├── dashboard-sidebar.tsx      # NEW - sidebar escura com navegacao
├── dashboard-navbar.tsx       # NEW - navbar com logo e acoes
├── dashboard-footer.tsx       # NEW - footer com newsletter
├── dashboard-metric-card.tsx  # NEW - card de metricas
├── dashboard-page-header.tsx  # NEW - header de secao
├── platform-card.tsx          # NEW - card de integracao
└── wizard-step.tsx            # NEW - wizard multi-step
```

**Structure Decision**: Web application usando estrutura Next.js App Router existente. Componentes de UI em `components/ui/` (shadcn), componentes de layout/dashboard prefixados com `dashboard-` em `components/`.

## Complexity Tracking

> Nenhuma violacao de constituicao identificada. Design system segue principios de simplicidade.

| Item | Decisao | Justificativa |
|------|---------|---------------|
| Novos componentes | Adicionar via shadcn CLI quando possivel | Mantem consistencia com shadcn ecosystem |
| Componentes custom | Criar apenas quando shadcn nao oferece | Toggle, Chip, Alert, Sidebar, Cards de metricas |
| CSS custom properties | Todas cores em globals.css | Permite theming e dark mode sem duplicacao |

## Implementation Phases

### Phase 1: Design Tokens (P1)
- Atualizar `app/globals.css` com paleta completa do Figma
- Configurar fonte Inter com font-display: swap
- Definir escala tipografica
- Definir espacamentos

### Phase 2: Componentes Base (P2)
- Customizar Button com variantes do Figma
- Customizar Input com estados
- Criar Toggle component
- Customizar Radio/RadioGroup
- Criar Chip component

### Phase 3: Componentes de Layout (P3)
- Criar dashboard-sidebar
- Criar dashboard-navbar
- Criar dashboard-footer
- Criar dashboard-metric-card
- Criar dashboard-page-header

### Phase 4: Componentes de Feedback (P4)
- Criar Alert component
- Customizar Badge
- Criar platform-card
- Criar wizard-step
