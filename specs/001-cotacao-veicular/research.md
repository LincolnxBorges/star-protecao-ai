# Research: Sistema de Cotacao Veicular

**Feature**: 001-cotacao-veicular
**Date**: 2025-11-26

## 1. Integracao com APIs Externas

### 1.1 PowerCRM API

**Decision**: Usar API PowerCRM para consulta inicial de placa

**Rationale**:
- API ja definida nos requisitos do projeto
- Retorna `codFipe` e `vehicleType` necessarios para classificacao do veiculo
- Endpoint: `GET /api/quotation/plates/{placa}`

**Alternatives Considered**:
- Consulta direta a base FIPE: rejeitado pois nao fornece dados do veiculo pela placa
- Outras APIs de consulta veicular: PowerCRM ja contratado pelo cliente

**Implementation Notes**:
```typescript
// lib/vehicles.ts
interface PowerCrmResponse {
  codFipe: string;
  vehicleType: 'AUTOMOVEL' | 'MOTOCICLETA' | 'CAMINHAO';
  brand: string;
  year: string;
  fuel: string;
  color: string;
  error?: string;
}

// Headers: Authorization: {API_KEY}
// Retry: 1 tentativa adicional apos 2s em caso de falha
```

### 1.2 WDAPI2 API

**Decision**: Usar WDAPI2 para obter valor FIPE atual

**Rationale**:
- Retorna array de valores FIPE com score de match
- Permite selecao do valor mais preciso usando `codFipe` do PowerCRM ou maior score

**Implementation Notes**:
```typescript
// lib/vehicles.ts
interface WdApi2FipeData {
  codigo_fipe: string;
  texto_modelo: string;
  texto_valor: string; // "R$ 42.540,00"
  score: number;
}

// Estrategia de selecao:
// 1. Buscar por codigo_fipe exato (do PowerCRM)
// 2. Fallback: maior score
```

### 1.3 ViaCEP API

**Decision**: Usar ViaCEP para busca automatica de endereco

**Rationale**:
- API gratuita e confiavel
- Padrao de mercado brasileiro
- Sem necessidade de autenticacao

**Implementation Notes**:
```typescript
// Endpoint: https://viacep.com.br/ws/{cep}/json/
// Retorna: logradouro, bairro, localidade, uf
```

### 1.4 Evolution API (WhatsApp)

**Decision**: Usar Evolution API para envio de mensagens WhatsApp

**Rationale**:
- Ja definida nos requisitos
- Permite envio de mensagens formatadas
- Integracao via REST API

**Implementation Notes**:
```typescript
// lib/notifications.ts
// POST /message/sendText/{instance}
// Headers: apikey: {EVOLUTION_API_KEY}
// Body: { number: "5511999999999", text: "..." }
```

## 2. Validacoes

### 2.1 Validacao de CPF

**Decision**: Implementar validacao completa de CPF com digitos verificadores

**Rationale**:
- Padrao brasileiro obrigatorio
- Previne erros de digitacao
- Necessario para identificacao unica de clientes

**Implementation Notes**:
```typescript
// lib/validations/cpf.ts
// 1. Remover caracteres nao numericos
// 2. Verificar 11 digitos
// 3. Rejeitar sequencias repetidas (111.111.111-11)
// 4. Calcular e validar digitos verificadores
```

### 2.2 Validacao de Placa

**Decision**: Aceitar formatos antigo (ABC-1234) e Mercosul (ABC1D23)

**Rationale**:
- Brasil em transicao entre formatos
- Ambos validos atualmente

**Implementation Notes**:
```typescript
// lib/validations/placa.ts
// Regex antigo: /^[A-Z]{3}-?\d{4}$/i
// Regex Mercosul: /^[A-Z]{3}\d[A-Z]\d{2}$/i
// Normalizar: uppercase, remover hifen
```

## 3. Algoritmo Round-Robin

**Decision**: Implementar round-robin simples baseado em `last_assignment_at`

**Rationale**:
- Distribuicao justa de leads entre vendedores
- Implementacao simples sem necessidade de fila externa
- Resiliente a adicao/remocao de vendedores

**Implementation Notes**:
```typescript
// lib/sellers.ts
export async function getNextSeller() {
  // 1. Buscar vendedor ativo com last_assignment_at mais antigo (ou null)
  // 2. Atualizar last_assignment_at e assignment_count
  // 3. Retornar vendedor ou null se nenhum ativo
  return db.query.sellers.findFirst({
    where: eq(sellers.isActive, true),
    orderBy: [asc(sellers.lastAssignmentAt), asc(sellers.createdAt)]
  });
}
```

## 4. Calculo de Cotacao

**Decision**: Busca em tabela de faixas de preco por categoria

**Rationale**:
- Tabela de precos pre-definida permite atualizacoes sem deploy
- Regras claras: mensalidade, adesao (2x), desconto (20%)

**Implementation Notes**:
```typescript
// lib/pricing.ts
export async function calculateQuotation(categoria: string, valorFipe: number) {
  // 1. Buscar faixa onde faixa_min <= valorFipe <= faixa_max
  // 2. Calcular valores
  const rule = await findPricingRule(categoria, valorFipe);
  return {
    mensalidade: rule.mensalidade,
    adesao: rule.mensalidade * 2,
    adesaoDesconto: rule.mensalidade * 2 * 0.80,
    cotaParticipacao: rule.cotaParticipacao, // pode ser null
    validadeAte: addDays(new Date(), 7)
  };
}
```

## 5. Autenticacao e Autorizacao

**Decision**: Usar Better Auth existente com campo `role` para perfis

**Rationale**:
- Better Auth ja configurado no projeto
- Adicionar campo `role` (SELLER/ADMIN) na tabela sellers
- Middleware para proteger rotas admin

**Implementation Notes**:
```typescript
// middleware.ts - ja existe, estender para checar role
// Rotas publicas: /cotacao/*
// Rotas protegidas: /(admin)/* - requer autenticacao + role SELLER ou ADMIN
// Rotas admin-only: /precos, /blacklist - requer role ADMIN
```

## 6. Expiracao Automatica de Cotacoes

**Decision**: Cron job ou verificacao on-demand

**Rationale**:
- Cotacoes expiram apos 7 dias
- Pode ser implementado via cron externo ou verificacao ao listar

**Alternatives Considered**:
- Vercel Cron: ideal para producao
- Verificacao on-demand: mais simples, suficiente para MVP

**Implementation Notes**:
```typescript
// lib/quotations.ts
export async function expireOldQuotations() {
  return db.update(quotations)
    .set({ status: 'EXPIRED' })
    .where(and(
      eq(quotations.status, 'PENDING'),
      lt(quotations.expiresAt, new Date())
    ));
}
// Chamar no inicio de listQuotations() ou via cron
```

## 7. Framework de Testes

**Decision**: Vitest para testes unitarios/integracao, Playwright para E2E

**Rationale**:
- Vitest: rapido, compativel com Vite/Next.js, API similar ao Jest
- Playwright: padrao para E2E em aplicacoes web modernas
- Ambos suportados no ecossistema Next.js

**Implementation Notes**:
```bash
# Instalar
npm install -D vitest @testing-library/react playwright

# Scripts em package.json
"test": "vitest",
"test:e2e": "playwright test"
```

## 8. Variaveis de Ambiente

**Decision**: Adicionar variaveis necessarias para APIs externas

**Required Environment Variables**:
```env
# Existentes
DATABASE_URL=
BETTER_AUTH_SECRET=
NEXT_PUBLIC_APP_URL=

# Novas para cotacao
POWER_CRM_API_KEY=
WDAPI2_TOKEN=
EVOLUTION_API_URL=
EVOLUTION_API_KEY=
EVOLUTION_INSTANCE=
```

## Summary

| Topico | Decisao | Status |
|--------|---------|--------|
| PowerCRM API | Usar para consulta de placa | Resolved |
| WDAPI2 API | Usar para valor FIPE | Resolved |
| ViaCEP API | Usar para busca CEP | Resolved |
| Evolution API | Usar para WhatsApp | Resolved |
| Validacao CPF | Implementar completa | Resolved |
| Validacao Placa | Antigo + Mercosul | Resolved |
| Round-Robin | Baseado em last_assignment_at | Resolved |
| Calculo Cotacao | Tabela de faixas | Resolved |
| Autenticacao | Better Auth + role | Resolved |
| Expiracao | On-demand ou cron | Resolved |
| Testes | Vitest + Playwright | Resolved |
| Env Vars | Documentadas | Resolved |
