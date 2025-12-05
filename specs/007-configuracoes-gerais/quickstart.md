# Quickstart: Configuracoes Gerais

**Feature**: 007-configuracoes-gerais
**Date**: 2025-11-27

## Pre-requisitos

- Node.js 18+
- PostgreSQL rodando
- Variaveis de ambiente configuradas

## Setup Inicial

### 1. Adicionar Variavel de Ambiente

Adicione ao `.env`:

```env
# Chave de criptografia (32 bytes em hex = 64 caracteres)
# Gerar com: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=sua_chave_de_32_bytes_em_hexadecimal_aqui
```

### 2. Aplicar Migration

```bash
# Gerar migration para novas tabelas
npm run db:generate

# Aplicar migration
npm run db:migrate
```

### 3. Seed de Dados Iniciais (Opcional)

Executar script de seed para criar configuracoes default:

```bash
npm run db:seed:settings
```

## Estrutura de Arquivos a Criar

```
lib/
├── settings.ts         # Contexto de settings
├── crypto.ts           # Funcoes de criptografia
└── integrations/
    ├── viacep.ts       # Busca CEP
    ├── whatsapp.ts     # Integracao WhatsApp
    └── smtp.ts         # Envio de emails

app/
├── configuracoes/
│   └── page.tsx        # Pagina principal
└── api/settings/
    ├── route.ts        # GET/PUT settings
    └── ...             # Outras rotas

components/
├── settings-tabs.tsx
├── settings-empresa-form.tsx
└── ...                 # Outros componentes
```

## Ordem de Implementacao Sugerida

### Fase 1: Fundacao (Backend)

1. `lib/schema.ts` - Adicionar tabelas settings, messageTemplate, settingsAuditLog, messageQueue
2. `lib/crypto.ts` - Implementar encrypt/decrypt
3. `lib/settings.ts` - CRUD basico de settings

### Fase 2: APIs

4. `app/api/settings/route.ts` - GET/PUT por categoria
5. `app/api/settings/test-connection/route.ts` - Testar conexoes
6. `app/api/settings/upload-logo/route.ts` - Upload de logo

### Fase 3: Integracoes

7. `lib/integrations/viacep.ts` - Busca de endereco
8. `lib/integrations/whatsapp.ts` - Adapters WhatsApp
9. `lib/integrations/smtp.ts` - Envio de email

### Fase 4: Frontend

10. `app/configuracoes/page.tsx` - Server Component principal
11. `components/settings-tabs.tsx` - Navegacao por abas
12. `components/settings-empresa-form.tsx` - Formulario Empresa
13. Demais formularios de aba

### Fase 5: Funcionalidades Avancadas

14. Templates de mensagem
15. Backup e export
16. Logs e auditoria

## Comandos Uteis

```bash
# Desenvolvimento
npm run dev

# Verificar schema
npm run db:studio

# Rodar testes
npm run test

# Build
npm run build
```

## Verificacao Rapida

Apos implementar, verificar:

1. [ ] Pagina `/configuracoes` carrega sem erros
2. [ ] Todas as 5 abas estao visiveis
3. [ ] Formulario da aba Empresa salva e carrega dados
4. [ ] Upload de logo funciona (JPG/PNG < 2MB)
5. [ ] Busca de CEP preenche endereco
6. [ ] API Key e salva criptografada (verificar no DB)
7. [ ] Apenas admin acessa a pagina

## Troubleshooting

### Erro de Criptografia

```
Error: Invalid key length
```

Verifique se `ENCRYPTION_KEY` tem exatamente 64 caracteres hexadecimais.

### Tabelas nao existem

```bash
npm run db:push  # desenvolvimento rapido
# ou
npm run db:migrate  # com migration
```

### Permissao negada

Verifique se o usuario logado tem role `admin` no Better Auth.

## Links Uteis

- [Spec Completo](./spec.md)
- [Data Model](./data-model.md)
- [API Contracts](./contracts/settings-api.md)
- [Constituicao do Projeto](../../.specify/memory/constitution.md)
