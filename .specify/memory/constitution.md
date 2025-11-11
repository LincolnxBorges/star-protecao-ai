<!--
RELATÓRIO DE IMPACTO DE SINCRONIZAÇÃO
======================================
Mudança de Versão: Inicial → 1.0.0
Criado: 2025-11-11

Princípios Modificados:
- NOVO: I. Arquitetura Orientada a Contextos
- NOVO: II. Server-First com Client Components Estratégicos
- NOVO: III. Lógica de Negócio em Módulos de Contexto
- NOVO: IV. Integração com Banco de Dados via Drizzle ORM
- NOVO: V. Organização e Nomenclatura de Componentes
- NOVO: VI. Estilização com Tailwind CSS 4 e shadcn/ui
- NOVO: VII. Validação e Integração de Formulários
- NOVO: VIII. Desenvolvimento Orientado a Testes
- NOVO: IX. Integração com IA via Vercel SDK
- NOVO: X. Conventional Commits

Seções Adicionadas:
- Princípios Fundamentais (10 princípios)
- Requisitos da Stack Tecnológica
- Fluxo de Desenvolvimento
- Governança

Status dos Templates:
- ✅ spec-template.md (requer verificação de alinhamento)
- ✅ plan-template.md (requer verificação de alinhamento)
- ✅ tasks-template.md (requer verificação de alinhamento)
- ✅ checklist-template.md (requer verificação de alinhamento)

TODOs de Acompanhamento:
- Verificar que todos os templates enforcem arquitetura orientada a contextos
- Garantir que requisitos de testes estão refletidos nos templates de tarefas
- Atualizar orientações do agente para preferir server components
-->

# Star Proteção IA - Constituição do Projeto

## Princípios Fundamentais

### I. Arquitetura Orientada a Contextos

O projeto segue uma arquitetura orientada a contextos inspirada nos contextos do Phoenix e nos bounded contexts do DDD. Cada contexto é representado por um único arquivo no diretório `lib/` (ex: `lib/products.ts`, `lib/orders.ts`, `lib/auth.ts`).

**Requisitos:**
- DEVE organizar a lógica de negócio por contexto de domínio em `lib/[contextName].ts`
- Cada arquivo de contexto DEVE ser responsável por seus próprios dados e operações
- Módulos de contexto DEVEM exportar funções simples, não classes ou abstrações complexas
- Funções que interagem com o banco de dados DEVEM usar a API do Drizzle ORM diretamente
- Manter a implementação simples e pragmática - evitar over-engineering

**Justificativa:** Esta abordagem mantém fronteiras claras entre domínios enquanto mantém o código simples e manutenível. Chamadas diretas ao banco de dados em funções de contexto eliminam camadas de abstração desnecessárias.

### II. Server-First com Client Components Estratégicos

As páginas DEVEM ser Server Components por padrão. Client Components devem ser usados apenas para partes que genuinamente requerem interatividade no lado do cliente.

**Requisitos:**
- DEVE usar Server Components para todas as páginas a menos que recursos do lado do cliente sejam necessários
- DEVE quebrar componentes para isolar lógica do lado do cliente
- Client Components DEVEM ser marcados com a diretiva `"use client"`
- Server Components DEVEM ser preferidos para busca de dados e renderização

**Justificativa:** Server Components melhoram a performance, reduzem o tamanho do bundle e permitem acesso direto ao banco de dados. Uso estratégico de Client Components garante interatividade onde necessário sem sacrificar performance.

### III. Lógica de Negócio em Módulos de Contexto

Todas as regras de negócio e operações de dados DEVEM residir em módulos de contexto dentro do diretório `lib/`.

**Requisitos:**
- DEVE definir todas as funções de lógica de negócio em `lib/[contextName].ts`
- Funções DEVEM usar diretamente a API do Drizzle ORM para operações de banco de dados
- NÃO DEVE criar interfaces intermediárias, repositories ou classes de serviço
- Funções DEVEM ser simples, focadas e fáceis de testar
- Padrão exemplo: `export function listProducts() { return db.select()... }`

**Justificativa:** Simplicidade e objetividade tornam o código mais fácil de entender, manter e testar. Evitar camadas de abstração reduz a sobrecarga cognitiva.

### IV. Integração com Banco de Dados via Drizzle ORM

O projeto usa Drizzle ORM (não Prisma) para todas as operações de banco de dados.

**Requisitos:**
- DEVE usar Drizzle ORM para todas as interações com banco de dados
- Definições de schema DEVEM estar em `lib/schema.ts`
- DEVE usar a API TypeScript-first do Drizzle diretamente nas funções de contexto
- Migrações de banco de dados DEVEM usar comandos `drizzle-kit`
- DEVE aproveitar a type safety do Drizzle para queries

**Justificativa:** Drizzle fornece excelente integração com TypeScript e performance mantendo simplicidade e padrões de query similares ao SQL.

### V. Organização e Nomenclatura de Componentes

Componentes seguem um padrão de organização estruturado com convenções de nomenclatura claras.

**Requisitos:**
- Componentes de UI (shadcn) DEVEM estar em `components/ui/`
- Componentes gerais DEVEM estar em `components/`
- Componentes gerais DEVEM ser prefixados com o nome da página (ex: `/login` → `components/login-form.tsx`)
- DEVE usar o CLI do shadcn para adicionar novos componentes de UI: `npx shadcn@latest add [component]`
- Arquivos de componentes DEVEM usar nomenclatura kebab-case

**Justificativa:** Nomenclatura e organização consistentes tornam os componentes fáceis de localizar e entender seu propósito rapidamente.

### VI. Estilização com Tailwind CSS 4 e shadcn/ui

Toda estilização usa Tailwind CSS 4 com o sistema de design shadcn/ui.

**Requisitos:**
- DEVE usar Tailwind CSS 4 (NÃO versão 3)
- NÃO DEVE criar arquivo `tailwind.config.js` (usando configuração baseada em CSS do Tailwind 4)
- DEVE usar o sistema de componentes shadcn/ui para elementos de UI
- NÃO DEVE usar valores de cor fixos nos componentes
- Novas cores DEVEM ser adicionadas em `app/globals.css` usando custom properties CSS
- DEVE seguir o sistema de tokens de cor do shadcn (ex: `bg-primary`, `text-muted-foreground`)

**Justificativa:** A configuração baseada em CSS do Tailwind CSS 4 é mais manutenível. O sistema de cores do shadcn garante temas consistentes e suporte a modo escuro.

### VII. Validação e Integração de Formulários

Formulários usam Zod para validação com integração react-hook-form seguindo padrões do shadcn.

**Requisitos:**
- DEVE usar Zod tanto para validação de formulários no cliente quanto para validação de server actions
- DEVE usar react-hook-form com integração shadcn para formulários
- Componentes de formulário DEVEM usar os componentes Field do shadcn para consistência
- Server actions DEVEM validar entrada com schemas Zod antes de processar
- DEVE fornecer mensagens de erro claras e amigáveis ao usuário

**Justificativa:** Zod fornece validação type-safe que funciona perfeitamente em cliente e servidor. Integração com shadcn garante UX consistente nos formulários.

### VIII. Desenvolvimento Orientado a Testes (NÃO-NEGOCIÁVEL)

Testes abrangentes são obrigatórios do início ao fim do desenvolvimento.

**Requisitos:**
- DEVE priorizar bons testes durante todo o ciclo de vida do desenvolvimento
- Testes DEVEM cobrir lógica de negócio nos módulos de contexto
- Testes DEVEM cobrir fluxos críticos de usuário end-to-end
- DEVE escrever testes que validem tanto caminhos felizes quanto casos de erro
- Testes de integração DEVEM ser escritos para operações de banco de dados
- DEVE garantir que testes sejam manuteníveis e forneçam valor

**Justificativa:** Testar desde o início previne bugs, permite refatoração confiante e serve como documentação viva do comportamento do sistema.

### IX. Integração com IA via Vercel SDK

Toda funcionalidade de IA usa o Vercel AI SDK.

**Requisitos:**
- DEVE usar Vercel AI SDK para todas as integrações com IA
- NÃO DEVE usar outros SDKs de IA ou chamadas diretas à API quando o Vercel SDK suportar o caso de uso
- Respostas de streaming de IA DEVEM aproveitar os utilitários de streaming do SDK
- DEVE tratar erros de IA graciosamente com mensagens amigáveis ao usuário

**Justificativa:** O Vercel AI SDK fornece padrões otimizados para Next.js e lida com streaming, gerenciamento de estado e tratamento de erros efetivamente.

### X. Conventional Commits

Todos os commits DEVEM seguir a especificação Conventional Commits.

**Requisitos:**
- Mensagens de commit DEVEM seguir o formato: `<tipo>: <descrição>`
- DEVE usar tipos padrão: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `style`
- Mensagem de commit DEVE ser uma única linha sem corpo
- NÃO DEVE incluir `Co-authored-by` ou outros metadados
- Descrição DEVE ser concisa e descritiva

**Justificativa:** Conventional Commits permitem geração automática de changelog, versionamento semântico e histórico claro do projeto.

## Requisitos da Stack Tecnológica

**Framework Principal:**
- Next.js com TypeScript (App Router)
- React Server Components por padrão

**Banco de Dados:**
- PostgreSQL
- Drizzle ORM (schema em `lib/schema.ts`)

**Autenticação:**
- Better Auth

**Estilização:**
- Tailwind CSS 4 (configuração baseada em CSS em `app/globals.css`)
- Sistema de componentes shadcn/ui

**Formulários & Validação:**
- Zod
- react-hook-form com integração shadcn

**IA:**
- Vercel AI SDK

**Testes:**
- Framework de testes TBD (deve suportar testes unitários, de integração e e2e)

## Fluxo de Desenvolvimento

**Estrutura de Arquivos:**
- `/app` - Páginas e rotas Next.js (Server Components por padrão)
- `/lib` - Módulos de contexto com lógica de negócio (`[contextName].ts`)
- `/lib/schema.ts` - Schema do banco de dados Drizzle
- `/components` - Componentes gerais (prefixados pelo nome da página)
- `/components/ui` - Componentes de UI shadcn

**Processo de Desenvolvimento:**
1. Definir requisitos e escrever testes primeiro
2. Implementar lógica de negócio no módulo de contexto apropriado (`lib/[contextName].ts`)
3. Criar Server Components para páginas
4. Extrair Client Components apenas onde necessário (marcados com `"use client"`)
5. Usar CLI do shadcn para adicionar componentes de UI conforme necessário
6. Validar com Zod tanto em formulários quanto em server actions
7. Garantir que todos os testes passem antes de fazer commit
8. Fazer commit com formato Conventional Commits

**Fluxo de Banco de Dados:**
1. Definir ou modificar schema em `lib/schema.ts`
2. Gerar migração: `npm run db:generate`
3. Aplicar migração: `npm run db:migrate`
4. Desenvolvimento: `npm run db:push` para iteração rápida

## Governança

**Autoridade da Constituição:**
Esta constituição substitui todas as outras práticas e convenções do projeto. Quando houver conflito, os princípios constitucionais têm precedência.

**Processo de Emenda:**
- Emendas requerem documentação clara da justificativa
- Versão deve ser incrementada seguindo versionamento semântico:
  - MAJOR: Mudanças ou remoções de princípios incompatíveis com versões anteriores
  - MINOR: Novos princípios ou expansões materiais
  - PATCH: Esclarecimentos, correções de redação, refinamentos não-semânticos
- Todos os templates dependentes devem ser atualizados para consistência

**Conformidade:**
- Todas as revisões de código DEVEM verificar aderência aos princípios constitucionais
- Desvios dos princípios DEVEM ser explicitamente justificados e documentados
- Complexidade que viole princípios de simplicidade DEVE ser refatorada

**Versão**: 1.0.0 | **Ratificado**: 2025-11-11 | **Última Emenda**: 2025-11-11
