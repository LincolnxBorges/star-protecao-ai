# Research: Telas de Gestao de Cotacoes

**Feature**: 003-cotacoes-gestao
**Date**: 2025-11-26

## Decisoes de Design

### 1. Armazenamento do Historico de Atividades

**Decision**: Nova tabela `quotation_activities` com colunas tipadas

**Rationale**:
- Permite queries SQL eficientes para filtrar por tipo de atividade
- Facilita criacao de indices para performance
- Suporta relatorios futuros (ex: tempo medio de contato)
- Separa dados de auditoria dos dados principais da cotacao

**Alternatives Considered**:
- Coluna JSONB na tabela `quotations`: Rejeitado por dificultar queries e indices
- Event sourcing completo: Over-engineering para o caso de uso

### 2. Visibilidade de Cotacoes por Perfil

**Decision**: Vendedores veem apenas cotacoes atribuidas a eles; administradores veem todas

**Rationale**:
- Padrao comum em CRMs de vendas
- Protege leads e evita conflitos entre vendedores
- Simplifica regras de autorizacao
- Administradores mantem visao global para supervisao

**Alternatives Considered**:
- Acesso total para todos: Rejeitado por questoes de privacidade e conflito de leads
- Acesso parcial (proprias + nao atribuidas): Complexidade adicional sem beneficio claro

### 3. Estrategia de Busca

**Decision**: Busca client-side com debounce 300ms chamando Server Action

**Rationale**:
- Debounce reduz carga no servidor
- Server Action permite busca full-text no PostgreSQL
- Mantém arquitetura server-first com interatividade controlada

**Alternatives Considered**:
- Busca apenas client-side com dados em memoria: Nao escala para muitas cotacoes
- API Route dedicada: Server Actions sao mais simples no App Router

### 4. Filtros na URL vs Estado Local

**Decision**: Filtros persistidos na URL via searchParams

**Rationale**:
- Permite compartilhar links com filtros aplicados
- Suporta navegacao back/forward do browser
- Sincroniza estado entre Server e Client Components
- Facilita testes E2E

**Alternatives Considered**:
- Estado local com useState: Perde filtros ao recarregar pagina

### 5. Paginacao

**Decision**: Paginacao server-side com offset/limit

**Rationale**:
- Evita carregar todas as cotacoes na memoria
- Performance consistente independente do volume de dados
- Compativel com Drizzle ORM

**Alternatives Considered**:
- Cursor-based pagination: Mais complexo, beneficio limitado para volume esperado
- Infinite scroll: Menos adequado para contexto administrativo

### 6. Componentes shadcn Necessarios

**Decision**: Instalar via CLI os componentes necessarios

**Components to Add**:
- `tabs` - Para filtros por status
- `table` - Para lista de cotacoes
- `dialog` - Para modais de nota e confirmacao
- `badge` - Para status e categorias
- `progress` - Para barra de validade
- `textarea` - Para campo de notas
- `radio-group` - Para selecao de status
- `dropdown-menu` - Para acoes na linha da tabela
- `toast` - Para notificacoes de sucesso/erro
- `skeleton` - Para loading states

### 7. Tipos de Atividade

**Decision**: Enum para tipos de atividade no banco

**Types**:
- `CREATION` - Cotacao criada
- `STATUS_CHANGE` - Mudanca de status
- `WHATSAPP_SENT` - Mensagem enviada
- `NOTE` - Observacao geral
- `CALL` - Ligacao realizada
- `EMAIL` - Email enviado
- `ASSIGNMENT` - Atribuicao de vendedor

**Rationale**:
- Permite filtrar e agrupar atividades
- Facilita icones e formatacao na timeline
- Tipo-seguro com TypeScript

## Best Practices Identificadas

### Next.js App Router

1. **Server Components para dados**: Paginas buscam dados no servidor, passam para Client Components
2. **URL State**: Usar `searchParams` para filtros, sincronizar com `useSearchParams`
3. **Server Actions**: Para mutacoes (alterar status, adicionar nota)
4. **Parallel Routes**: Considerar para modais (nao necessario nesta feature)

### Drizzle ORM

1. **Queries tipadas**: Usar inferencia de tipos do Drizzle
2. **Indices**: Criar indices para campos de busca (status, sellerId, createdAt)
3. **Transacoes**: Usar `db.transaction` para operacoes que afetam multiplas tabelas

### shadcn/ui

1. **Composicao**: Combinar componentes primitivos para criar complexos
2. **Tokens de cor**: Usar variaveis CSS do tema (`bg-primary`, `text-muted-foreground`)
3. **Acessibilidade**: Componentes ja incluem ARIA attributes

### Performance

1. **Suspense boundaries**: Envolver componentes que fazem fetch
2. **Loading states**: Skeletons enquanto dados carregam
3. **Optimistic updates**: Para mudancas de status (opcional)

## Riscos e Mitigacoes

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|---------------|---------|-----------|
| Performance com muitas cotacoes | Media | Alto | Paginacao server-side, indices no banco |
| Conflito de edicao simultanea | Baixa | Medio | Timestamps de atualizacao, mensagem de conflito |
| Complexidade da busca full-text | Baixa | Baixo | Comeca com ILIKE, evolui para pg_trgm se necessario |

## Referencias

- [Next.js App Router Patterns](https://nextjs.org/docs/app)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)
- [shadcn/ui Components](https://ui.shadcn.com/docs/components)
- [Tailwind CSS 4](https://tailwindcss.com/docs)
