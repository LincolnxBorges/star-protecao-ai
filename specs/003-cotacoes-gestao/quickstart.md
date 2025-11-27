# Quickstart: Telas de Gestao de Cotacoes

**Feature**: 003-cotacoes-gestao
**Date**: 2025-11-26

## Pre-requisitos

1. Node.js 18+
2. PostgreSQL rodando localmente ou via Docker
3. Variaveis de ambiente configuradas (`.env`)

## Setup Inicial

### 1. Instalar Dependencias

```bash
pnpm install
```

### 2. Adicionar Componentes shadcn

```bash
# Componentes necessarios para esta feature
npx shadcn@latest add tabs
npx shadcn@latest add table
npx shadcn@latest add dialog
npx shadcn@latest add badge
npx shadcn@latest add progress
npx shadcn@latest add textarea
npx shadcn@latest add radio-group
npx shadcn@latest add dropdown-menu
npx shadcn@latest add skeleton
```

### 3. Gerar e Aplicar Migration

```bash
# Gerar migration para nova tabela quotation_activities
pnpm db:generate

# Aplicar migration
pnpm db:migrate

# Ou para desenvolvimento rapido (sem migration)
pnpm db:push
```

### 4. Popular Dados de Teste (opcional)

```bash
# Se houver script de seed
pnpm db:seed
```

## Estrutura de Desenvolvimento

### Ordem de Implementacao Sugerida

1. **Schema e Tipos**
   - Adicionar `quotation_activities` em `lib/schema.ts`
   - Criar tipos em `lib/types/quotations.ts`

2. **Funcoes de Contexto**
   - Extender `lib/quotations.ts` com novas funcoes
   - Testes unitarios em `__tests__/unit/lib/quotations.test.ts`

3. **Server Actions**
   - Criar `app/(admin)/cotacoes/actions.ts`
   - Validacao com Zod

4. **Componentes da Lista**
   - `cotacoes-status-tabs.tsx`
   - `cotacoes-search.tsx`
   - `cotacoes-filters.tsx`
   - `cotacoes-table.tsx`
   - `cotacoes-row.tsx`

5. **Pagina da Lista**
   - Atualizar `app/(admin)/cotacoes/page.tsx`
   - Integrar componentes

6. **Componentes de Detalhes**
   - `cotacoes-detail-header.tsx`
   - `cotacoes-detail-client.tsx`
   - `cotacoes-detail-vehicle.tsx`
   - `cotacoes-detail-values.tsx`
   - `cotacoes-detail-status.tsx`
   - `cotacoes-detail-history.tsx`
   - `cotacoes-note-dialog.tsx`

7. **Pagina de Detalhes**
   - Atualizar `app/(admin)/cotacoes/[id]/page.tsx`
   - Integrar componentes

8. **Testes E2E**
   - `e2e/cotacoes/list.spec.ts`
   - `e2e/cotacoes/details.spec.ts`

## Comandos Uteis

```bash
# Desenvolvimento
pnpm dev                    # Iniciar servidor (porta 3000)

# Testes
pnpm test                   # Rodar testes unitarios
pnpm test:e2e               # Rodar testes E2E
pnpm test:watch             # Testes em modo watch

# Banco de dados
pnpm db:studio              # Abrir Drizzle Studio
pnpm db:generate            # Gerar migrations
pnpm db:migrate             # Aplicar migrations
pnpm db:push                # Push direto (dev)

# Qualidade
pnpm lint                   # Rodar ESLint
pnpm typecheck              # Verificar tipos
```

## Verificacao de Sucesso

Apos implementacao, verificar:

- [ ] Lista de cotacoes carrega em <2s
- [ ] Filtros por status funcionam
- [ ] Busca encontra por placa, telefone, nome
- [ ] Paginacao funciona corretamente
- [ ] Detalhes mostram todos os dados
- [ ] Alteracao de status funciona
- [ ] Historico de atividades exibe corretamente
- [ ] Adicao de notas funciona
- [ ] Botoes de contato (WhatsApp, telefone) funcionam
- [ ] Responsividade mobile ok
- [ ] Testes unitarios passando
- [ ] Testes E2E passando

## Arquivos Chave

| Arquivo | Proposito |
|---------|-----------|
| `lib/schema.ts` | Schema Drizzle (adicionar quotation_activities) |
| `lib/quotations.ts` | Funcoes de contexto |
| `app/(admin)/cotacoes/page.tsx` | Pagina da lista |
| `app/(admin)/cotacoes/[id]/page.tsx` | Pagina de detalhes |
| `app/(admin)/cotacoes/actions.ts` | Server Actions |
| `components/cotacoes-*.tsx` | Componentes da feature |

## Troubleshooting

### Erro de Migracao

```bash
# Resetar banco e reaplicar
pnpm db:drop
pnpm db:push
pnpm db:seed
```

### Tipos nao sincronizados

```bash
# Regenerar tipos do Drizzle
pnpm db:generate
```

### Componente shadcn nao encontrado

```bash
# Verificar instalacao
npx shadcn@latest add [component-name]
```
