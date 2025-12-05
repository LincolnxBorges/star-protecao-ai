# Data Model: Configuracoes Gerais

**Feature**: 007-configuracoes-gerais
**Date**: 2025-11-27

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                              settings                                │
├─────────────────────────────────────────────────────────────────────┤
│ PK  id: uuid                                                         │
│     category: varchar(50) [company|quotation|whatsapp|notification|system] │
│     data: jsonb                                                      │
│     createdAt: timestamp                                             │
│     updatedAt: timestamp                                             │
├─────────────────────────────────────────────────────────────────────┤
│ UNIQUE (category) - apenas um registro por categoria                 │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ auditado por
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         settingsAuditLog                             │
├─────────────────────────────────────────────────────────────────────┤
│ PK  id: uuid                                                         │
│ FK  userId: uuid → user.id                                           │
│     category: varchar(50)                                            │
│     field: varchar(100)                                              │
│     previousValue: text (masked para credenciais)                    │
│     changedAt: timestamp                                             │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                          messageTemplate                             │
├─────────────────────────────────────────────────────────────────────┤
│ PK  id: uuid                                                         │
│     name: varchar(100)                                               │
│     eventType: varchar(50) [quotation_created|quotation_expiring|quotation_accepted] │
│     content: text (com variaveis {{...}})                            │
│     isActive: boolean                                                │
│     createdAt: timestamp                                             │
│     updatedAt: timestamp                                             │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                           messageQueue                               │
├─────────────────────────────────────────────────────────────────────┤
│ PK  id: uuid                                                         │
│     type: varchar(50) [whatsapp|email]                               │
│     payload: jsonb                                                   │
│     status: varchar(20) [pending|processing|completed|failed]        │
│     attempts: integer (max 5)                                        │
│     nextRetryAt: timestamp                                           │
│     lastError: text                                                  │
│     createdAt: timestamp                                             │
└─────────────────────────────────────────────────────────────────────┘
```

## Drizzle Schema

```typescript
// lib/schema.ts (adicoes)

import { pgTable, uuid, varchar, jsonb, timestamp, text, boolean, integer } from 'drizzle-orm/pg-core'

// === SETTINGS ===

export const settings = pgTable('settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  category: varchar('category', { length: 50 }).notNull().unique(),
  data: jsonb('data').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export type Settings = typeof settings.$inferSelect
export type NewSettings = typeof settings.$inferInsert

// === SETTINGS AUDIT LOG ===

export const settingsAuditLog = pgTable('settings_audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => user.id),
  category: varchar('category', { length: 50 }).notNull(),
  field: varchar('field', { length: 100 }).notNull(),
  previousValue: text('previous_value'),
  changedAt: timestamp('changed_at').defaultNow().notNull(),
})

export type SettingsAuditLog = typeof settingsAuditLog.$inferSelect
export type NewSettingsAuditLog = typeof settingsAuditLog.$inferInsert

// === MESSAGE TEMPLATE ===

export const messageTemplate = pgTable('message_template', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  eventType: varchar('event_type', { length: 50 }).notNull(),
  content: text('content').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export type MessageTemplate = typeof messageTemplate.$inferSelect
export type NewMessageTemplate = typeof messageTemplate.$inferInsert

// === MESSAGE QUEUE ===

export const messageQueue = pgTable('message_queue', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: varchar('type', { length: 50 }).notNull(),
  payload: jsonb('payload').notNull(),
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  attempts: integer('attempts').default(0).notNull(),
  nextRetryAt: timestamp('next_retry_at'),
  lastError: text('last_error'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export type MessageQueue = typeof messageQueue.$inferSelect
export type NewMessageQueue = typeof messageQueue.$inferInsert
```

## JSON Schemas por Categoria

### Company Settings

```typescript
const companySettingsSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  nomeFantasia: z.string().optional(),
  cnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ invalido'),
  inscricaoEstadual: z.string().optional(),
  telefonePrincipal: z.string().min(10, 'Telefone invalido'),
  telefoneSecundario: z.string().optional(),
  whatsappComercial: z.string().optional(),
  email: z.string().email('Email invalido'),
  website: z.string().url().optional().or(z.literal('')),
  logo: z.string().optional(), // path para arquivo
  endereco: z.object({
    cep: z.string().regex(/^\d{5}-\d{3}$/, 'CEP invalido'),
    logradouro: z.string().min(1),
    numero: z.string().min(1),
    complemento: z.string().optional(),
    bairro: z.string().min(1),
    cidade: z.string().min(1),
    estado: z.string().length(2),
  }),
})
```

### Quotation Settings

```typescript
const quotationSettingsSchema = z.object({
  diasValidade: z.number().int().min(1).max(30),
  taxaAdesao: z.number().min(0).max(10), // percentual
  desconto: z.number().min(0).max(100), // percentual
  cotasParticipacao: z.object({
    normal: z.number().positive(),
    especial: z.number().positive(),
    utilitario: z.number().positive(),
    moto: z.number().positive(),
  }),
  alertaExpiracao: z.object({
    habilitado: z.boolean(),
    diasAntecedencia: z.number().int().min(1).max(30),
  }),
  permitirReativar: z.object({
    habilitado: z.boolean(),
    diasMaximo: z.number().int().min(1).max(90),
  }),
})
```

### WhatsApp Settings

```typescript
const whatsappSettingsSchema = z.object({
  provider: z.enum(['evolution', 'zapi', 'baileys', 'outro']),
  apiUrl: z.string().url(),
  apiKey: z.string().min(1), // armazenado criptografado
  instanceName: z.string().min(1),
  status: z.enum(['connected', 'disconnected', 'error']).optional(),
  lastSync: z.string().datetime().optional(),
})
```

### Notification Settings

```typescript
const notificationSettingsSchema = z.object({
  smtp: z.object({
    server: z.string().min(1),
    port: z.number().int().min(1).max(65535),
    user: z.string().min(1),
    password: z.string().min(1), // armazenado criptografado
    useTls: z.boolean(),
  }),
  emailEvents: z.object({
    novaCotacaoCriada: z.boolean(),
    cotacaoAceita: z.boolean(),
    cotacaoExpirando: z.boolean(),
    cotacaoExpirada: z.boolean(),
    resumoDiario: z.boolean(),
    resumoSemanal: z.boolean(),
  }),
  whatsappVendedor: z.object({
    novoLead: z.boolean(),
    cotacaoAceita: z.boolean(),
    cotacaoExpirando: z.boolean(),
    resumoDiario: z.boolean(),
  }),
  sistema: z.object({
    tempoReal: z.boolean(),
    tocarSom: z.boolean(),
    mostrarBadge: z.boolean(),
    diasAutoLida: z.number().int().min(1).max(30),
  }),
})
```

### System Settings

```typescript
const systemSettingsSchema = z.object({
  regional: z.object({
    fusoHorario: z.string(), // ex: 'America/Sao_Paulo'
    formatoData: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']),
    formatoMoeda: z.enum(['BRL', 'USD', 'EUR']),
    idioma: z.enum(['pt-BR', 'en-US', 'es-ES']),
  }),
  apis: z.object({
    wdapi2: z.object({
      url: z.string().url(),
      apiKey: z.string().min(1), // armazenado criptografado
    }),
    fipe: z.object({
      url: z.string().url(),
    }),
    viacep: z.object({
      url: z.string().url(),
    }),
  }),
  backup: z.object({
    automaticoHabilitado: z.boolean(),
    horario: z.string(), // ex: '03:00'
    retencaoDias: z.number().int().min(1).max(365),
  }),
  logs: z.object({
    nivel: z.enum(['debug', 'info', 'warning', 'error']),
    retencaoDias: z.number().int().min(1).max(365),
  }),
})
```

## Validation Rules

| Entity | Field | Rule |
|--------|-------|------|
| settings.company | cnpj | Formato + digitos verificadores |
| settings.company | email | Formato email valido |
| settings.company | logo | JPG/PNG, max 2MB |
| settings.company | cep | 8 digitos numericos |
| settings.quotation | diasValidade | 1-30 |
| settings.quotation | taxaAdesao | 0-10% |
| settings.quotation | desconto | 0-100% |
| settings.whatsapp | apiUrl | URL valida |
| settings.notification | smtp.port | 1-65535 |
| messageTemplate | content | Variaveis validas |

## State Transitions

### Message Queue Status

```
     ┌──────────┐
     │ pending  │
     └────┬─────┘
          │ job picks up
          ▼
     ┌──────────────┐
     │ processing   │
     └──────┬───────┘
            │
    ┌───────┴───────┐
    │               │
success          error
    │               │
    ▼               ▼
┌──────────┐  ┌─────────────┐
│ completed│  │ attempts < 5│
└──────────┘  └──────┬──────┘
                     │
             ┌───────┴───────┐
             │               │
           yes              no
             │               │
             ▼               ▼
     ┌───────────┐    ┌────────┐
     │ pending   │    │ failed │
     │(nextRetry)│    └────────┘
     └───────────┘
```

## Default Values

### Initial Company Settings
```json
{
  "nome": "",
  "cnpj": "",
  "email": "",
  "telefonePrincipal": "",
  "endereco": {
    "cep": "",
    "logradouro": "",
    "numero": "",
    "bairro": "",
    "cidade": "",
    "estado": ""
  }
}
```

### Initial Quotation Settings
```json
{
  "diasValidade": 7,
  "taxaAdesao": 0.8,
  "desconto": 20,
  "cotasParticipacao": {
    "normal": 2400,
    "especial": 3200,
    "utilitario": 4000,
    "moto": 1500
  },
  "alertaExpiracao": {
    "habilitado": true,
    "diasAntecedencia": 2
  },
  "permitirReativar": {
    "habilitado": true,
    "diasMaximo": 30
  }
}
```

### Initial System Settings
```json
{
  "regional": {
    "fusoHorario": "America/Sao_Paulo",
    "formatoData": "DD/MM/YYYY",
    "formatoMoeda": "BRL",
    "idioma": "pt-BR"
  },
  "apis": {
    "wdapi2": { "url": "https://api.wdapi2.com.br", "apiKey": "" },
    "fipe": { "url": "https://parallelum.com.br/fipe/api/v2" },
    "viacep": { "url": "https://viacep.com.br/ws" }
  },
  "backup": {
    "automaticoHabilitado": true,
    "horario": "03:00",
    "retencaoDias": 30
  },
  "logs": {
    "nivel": "warning",
    "retencaoDias": 90
  }
}
```

## Default Message Templates

```json
[
  {
    "name": "Cotacao Criada",
    "eventType": "quotation_created",
    "content": "Ola {{cliente_nome}}! Sua cotacao de protecao veicular esta pronta!\n\n🚗 *Veiculo:* {{veiculo_marca}} {{veiculo_modelo}} {{veiculo_ano}}\n📋 *Placa:* {{veiculo_placa}}\n💰 *Valor FIPE:* R$ {{valor_fipe}}\n\n📊 *Valores:*\n• Mensalidade: *R$ {{mensalidade}}*\n• Adesao: R$ {{adesao}}\n• Cota participacao: R$ {{cota_participacao}}\n\n⏰ Esta cotacao e valida por {{validade_dias}} dias.",
    "isActive": true
  },
  {
    "name": "Cotacao Expirando",
    "eventType": "quotation_expiring",
    "content": "Ola {{cliente_nome}}! Sua cotacao para o *{{veiculo_modelo}}* expira em *{{dias_restantes}} dias*!\n\n💰 Mensalidade: *R$ {{mensalidade}}*\n\nNao perca essa oportunidade de proteger seu veiculo.",
    "isActive": true
  },
  {
    "name": "Cotacao Aceita",
    "eventType": "quotation_accepted",
    "content": "Parabens {{cliente_nome}}! 🎉\n\nSua protecao veicular foi ativada com sucesso!\n\n🚗 *Veiculo:* {{veiculo_modelo}}\n📋 *Placa:* {{veiculo_placa}}\n\nBem-vindo a familia {{empresa_nome}}!",
    "isActive": true
  }
]
```

## Migration Commands

```bash
# Gerar migration
npm run db:generate

# Aplicar migration
npm run db:migrate

# Desenvolvimento rapido (sem migration)
npm run db:push
```
