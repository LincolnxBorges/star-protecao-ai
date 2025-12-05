# Implementation Plan: Configuracoes Gerais

**Branch**: `007-configuracoes-gerais` | **Date**: 2025-11-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-configuracoes-gerais/spec.md`

## Summary

Implementar tela de Configuracoes Gerais centralizada com 5 abas (Empresa, Cotacao, WhatsApp, Notificacoes, Sistema) seguindo arquitetura orientada a contextos. A feature utiliza tabela unica de settings com JSON tipado por categoria, criptografia simetrica para credenciais sensiveis, e integracao com telas existentes de Precos e Blacklist.

## Technical Context

**Language/Version**: TypeScript 5.x com Next.js 15 (App Router)
**Primary Dependencies**: React 19, Drizzle ORM, Better Auth, shadcn/ui, Tailwind CSS 4, Zod, react-hook-form, lucide-react
**Storage**: PostgreSQL via Drizzle ORM (schema em `lib/schema.ts`)
**Testing**: Framework TBD (deve suportar testes unitarios, integracao e e2e)
**Target Platform**: Web application (browser moderno)
**Project Type**: Web (Next.js App Router - monolito fullstack)
**Performance Goals**: Busca CEP < 2s, teste conexao APIs < 5s, backup < 2min para 500MB
**Constraints**: Criptografia simetrica para credenciais, Server Components por padrao, sem tailwind.config.js
**Scale/Scope**: Sistema single-tenant, ~50 configuracoes distribuidas em 5 categorias

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Status | Verificacao |
|-----------|--------|-------------|
| I. Arquitetura Orientada a Contextos | PASS | Logica de negocio em `lib/settings.ts` com funcoes simples |
| II. Server-First com Client Components | PASS | Pagina Server Component, formularios como Client Components isolados |
| III. Logica de Negocio em Modulos | PASS | CRUD de settings, criptografia, validacao em `lib/settings.ts` |
| IV. Drizzle ORM | PASS | Schema em `lib/schema.ts`, queries diretas via Drizzle |
| V. Organizacao de Componentes | PASS | `components/settings-*.tsx` prefixados, kebab-case |
| VI. Tailwind CSS 4 + shadcn/ui | PASS | Tokens de cor shadcn, sem valores fixos |
| VII. Zod + react-hook-form | PASS | Schemas Zod para cada categoria, validacao client e server |
| VIII. TDD | PASS | Testes para contexto settings, validacoes, criptografia |
| IX. Vercel AI SDK | N/A | Feature nao usa IA |
| X. Conventional Commits | PASS | Commits seguem formato padrao |

**Gate Result**: PASS - Todos os principios aplicaveis estao em conformidade.

## Project Structure

### Documentation (this feature)

```text
specs/007-configuracoes-gerais/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── settings-api.md  # API contracts
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
app/
├── configuracoes/
│   └── page.tsx                    # Server Component - pagina principal
├── api/
│   └── settings/
│       ├── route.ts                # GET/PUT settings por categoria
│       ├── upload-logo/route.ts    # POST upload de logo
│       ├── test-connection/route.ts # POST testar conexoes (WhatsApp, SMTP, APIs)
│       └── backup/route.ts         # POST criar backup, GET listar backups

lib/
├── schema.ts                       # +settings, +messageTemplate, +settingsAuditLog
├── settings.ts                     # Contexto de settings (CRUD, criptografia, validacao)
├── crypto.ts                       # Funcoes de criptografia simetrica
└── integrations/
    ├── viacep.ts                   # Integracao ViaCEP
    ├── whatsapp.ts                 # Integracao WhatsApp API (Evolution, Z-API, etc)
    └── smtp.ts                     # Envio de email via SMTP

components/
├── settings-tabs.tsx               # Client Component - navegacao por abas
├── settings-empresa-form.tsx       # Client Component - formulario aba Empresa
├── settings-cotacao-form.tsx       # Client Component - formulario aba Cotacao
├── settings-whatsapp-form.tsx      # Client Component - formulario aba WhatsApp
├── settings-notificacoes-form.tsx  # Client Component - formulario aba Notificacoes
├── settings-sistema-form.tsx       # Client Component - formulario aba Sistema
├── settings-logo-upload.tsx        # Client Component - upload de logo
├── settings-template-editor.tsx    # Client Component - editor de templates
└── settings-connection-status.tsx  # Client Component - status de conexao

tests/
├── unit/
│   ├── settings.test.ts            # Testes do contexto settings
│   └── crypto.test.ts              # Testes de criptografia
├── integration/
│   ├── settings-api.test.ts        # Testes das APIs
│   └── viacep.test.ts              # Testes integracao ViaCEP
└── e2e/
    └── configuracoes.test.ts       # Testes E2E da pagina
```

**Structure Decision**: Next.js App Router monolito fullstack seguindo constituicao do projeto. Logica de negocio centralizada em `lib/settings.ts`, componentes de formulario isolados como Client Components, pagina principal como Server Component.

## Complexity Tracking

> Nenhuma violacao da constituicao identificada. Todas as decisoes seguem principios de simplicidade.
