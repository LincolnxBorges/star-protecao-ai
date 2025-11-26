# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comandos Essenciais

```bash
# Desenvolvimento
npm run dev              # Inicia servidor de desenvolvimento Next.js (porta 3000)

# Build e Produção
npm run build            # Build de produção do Next.js
npm start                # Inicia servidor de produção

# Qualidade de Código
npm run lint             # Executa ESLint

# Banco de Dados (Drizzle ORM)
npm run db:generate      # Gera migrations a partir do schema
npm run db:migrate       # Aplica migrations pendentes
npm run db:push          # Push direto do schema (desenvolvimento rápido)
npm run db:studio        # Abre interface visual Drizzle Studio
```

## Arquitetura do Projeto

### Arquitetura Orientada a Contextos

O projeto usa uma arquitetura inspirada nos **contextos do Phoenix** e **bounded contexts do DDD**. Toda a lógica de negócio deve residir em arquivos de contexto na pasta `lib/`:

```
lib/
├── [contextName].ts    # Cada contexto = um arquivo com funções de negócio
├── auth.ts             # Contexto de autenticação (Better Auth)
├── db.ts               # Conexão com banco de dados (Drizzle)
└── schema.ts           # Schema completo do banco de dados
```

**Padrão de Contexto:**
- Cada arquivo `lib/[contextName].ts` exporta funções simples (não classes)
- Funções que acessam o banco DEVEM usar a API do Drizzle diretamente
- Sem camadas de abstração (repositories, services, interfaces)
- Exemplo: `export function listProducts() { return db.select().from(products); }`

### Estrutura de Componentes

```
components/
├── ui/                 # Componentes shadcn/ui (gerenciados via CLI)
└── [page-name]-*.tsx   # Componentes gerais prefixados pelo nome da página
                        # Exemplo: login-form.tsx, signup-form.tsx
```

**Regras de Componentes:**
- Páginas em `app/` são **Server Components** por padrão
- Use `"use client"` APENAS quando necessário (interatividade, hooks)
- Quebre componentes para isolar lógica client-side em partes pequenas
- Adicione componentes shadcn via: `npx shadcn@latest add [component]`

### Rotas API e Autenticação

```
app/
├── api/
│   ├── auth/[...all]/route.ts    # Endpoints Better Auth (catch-all)
│   └── chat/route.ts              # Endpoint de chat com IA (Vercel AI SDK)
├── login/page.tsx                 # Página de login
├── signup/page.tsx                # Página de cadastro
└── page.tsx                       # Página principal (chat)
```

**Fluxo de Autenticação:**
- Better Auth configurado em `lib/auth.ts` (servidor)
- Cliente usa `lib/auth-client.ts` (exports: `signIn`, `signUp`, `signOut`, `useSession`)
- Adaptador Drizzle conecta Better Auth ao banco PostgreSQL
- Middleware em `middleware.ts` protege rotas (redireciona para `/login` se não autenticado)

### Integração com IA

- Usa **Vercel AI SDK** exclusivamente
- Route handler em `app/api/chat/route.ts` com `streamText()` do SDK
- Client-side usa `useChat()` hook do `@ai-sdk/react`
- Modelo configurado: `openai("gpt-4o")`

## Banco de Dados e Schema

### Schema Centralizado

Todo o schema do banco está em **`lib/schema.ts`**. Usa Drizzle ORM com PostgreSQL:

```typescript
// Exemplo de estrutura atual
export const user = pgTable("user", { ... });
export const session = pgTable("session", { ... });
export const account = pgTable("account", { ... });
export const verification = pgTable("verification", { ... });
```

### Workflow de Migrations

1. Modifique `lib/schema.ts`
2. Gere migration: `npm run db:generate`
3. Revise arquivo gerado em `drizzle/`
4. Aplique: `npm run db:migrate`

Para iteração rápida em dev (sem migrations): `npm run db:push`

### Conexão com Banco

Configurada em `lib/db.ts`:
```typescript
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
```

Use `db` importado de `@/lib/db` em todas as operações de banco.

## Estilização

### Tailwind CSS 4

- **NÃO criar `tailwind.config.js`** (projeto usa Tailwind CSS 4 com configuração CSS)
- Configuração em `app/globals.css` usando `@theme inline` e custom properties
- Nunca use cores hardcoded (ex: `#fff`, `rgb()`), sempre use tokens do shadcn

### Sistema de Cores shadcn

Tokens disponíveis (definem tema claro/escuro automaticamente):
- `bg-background`, `text-foreground`
- `bg-primary`, `text-primary-foreground`
- `bg-secondary`, `text-secondary-foreground`
- `bg-muted`, `text-muted-foreground`
- `bg-accent`, `text-accent-foreground`
- `bg-destructive`, `text-destructive`
- `border-border`, `border-input`
- `ring-ring`

Para adicionar novas cores: edite custom properties em `app/globals.css`.

## Validação de Formulários

### Padrão Zod + react-hook-form

- Use **Zod** para validação tanto no cliente quanto em server actions
- Formulários seguem padrão shadcn com `Field` components
- Sempre valide entrada de server actions com schemas Zod antes de processar

Exemplo de validação:
```typescript
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// No server action
export async function loginAction(formData: FormData) {
  const result = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  
  if (!result.success) {
    return { error: result.error };
  }
  // ... processar
}
```

## Convenções de Código

### Commits

Siga **Conventional Commits**:
- Formato: `<tipo>: <descrição>`
- Tipos válidos: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `style`
- Uma linha apenas, sem corpo ou co-autores
- Descrição em português, concisa e descritiva

Exemplos:
```
feat: adiciona página de chat com IA
fix: corrige validação de email no login
refactor: simplifica lógica de autenticação
```

### Testes

- Framework de testes ainda não configurado (TBD)
- Quando implementar: priorizar testes de lógica de negócio em `lib/` e fluxos críticos end-to-end
- Testes DEVEM ser escritos antes da implementação (TDD é princípio não-negociável)

## Variáveis de Ambiente

Necessárias para desenvolvimento:

```env
DATABASE_URL=postgresql://...           # Conexão PostgreSQL
BETTER_AUTH_SECRET=...                  # Secret para Better Auth
NEXT_PUBLIC_APP_URL=http://localhost:3000  # URL da aplicação
OPENAI_API_KEY=...                      # API key OpenAI (para chat IA)
```

## Princípios Arquiteturais

Consulte `.specify/memory/constitution.md` para os 10 princípios fundamentais do projeto, incluindo:

1. Arquitetura orientada a contextos (lib/)
2. Server-first com client components estratégicos
3. Lógica de negócio em módulos de contexto (sem abstrações)
4. Drizzle ORM direto (sem repositories)
5. Organização de componentes com prefixo de página
6. Tailwind CSS 4 + shadcn/ui
7. Validação com Zod
8. TDD (não-negociável)
9. Vercel AI SDK exclusivo para IA
10. Conventional Commits

A constituição é a fonte definitiva de verdade para decisões arquiteturais.

## Active Technologies
- TypeScript 5.x com Next.js 15 (App Router) + Next.js, React, Drizzle ORM, Better Auth, Zod, react-hook-form, shadcn/ui, Tailwind CSS 4 (001-cotacao-veicular)
- PostgreSQL via Drizzle ORM (schema em `lib/schema.ts`) (001-cotacao-veicular)

## Recent Changes
- 001-cotacao-veicular: Added TypeScript 5.x com Next.js 15 (App Router) + Next.js, React, Drizzle ORM, Better Auth, Zod, react-hook-form, shadcn/ui, Tailwind CSS 4
