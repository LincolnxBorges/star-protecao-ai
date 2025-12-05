# Research: Configuracoes Gerais

**Feature**: 007-configuracoes-gerais
**Date**: 2025-11-27

## 1. Criptografia Simetrica para Credenciais

### Decision
Usar Node.js crypto com AES-256-GCM para criptografar credenciais sensiveis (API Keys, senhas SMTP) antes de persistir no banco.

### Rationale
- AES-256-GCM fornece criptografia autenticada (confidencialidade + integridade)
- Node.js crypto e nativo, sem dependencias externas
- Chave derivada de variavel de ambiente `ENCRYPTION_KEY`
- IV (Initialization Vector) unico para cada criptografia, armazenado junto ao ciphertext

### Alternatives Considered
- **bcrypt/scrypt**: Descartado - sao para hashing de senhas, nao criptografia reversivel
- **AWS KMS/Vault**: Descartado - complexidade excessiva para MVP single-tenant
- **Texto plano**: Descartado - risco de seguranca inaceitavel

### Implementation Pattern
```typescript
// lib/crypto.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex') // 32 bytes

export function encrypt(plaintext: string): string {
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGORITHM, KEY, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  // formato: iv:authTag:ciphertext (base64)
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`
}

export function decrypt(ciphertext: string): string {
  const [ivB64, authTagB64, encryptedB64] = ciphertext.split(':')
  const iv = Buffer.from(ivB64, 'base64')
  const authTag = Buffer.from(authTagB64, 'base64')
  const encrypted = Buffer.from(encryptedB64, 'base64')
  const decipher = createDecipheriv(ALGORITHM, KEY, iv)
  decipher.setAuthTag(authTag)
  return decipher.update(encrypted) + decipher.final('utf8')
}
```

---

## 2. Estrutura JSON Tipada para Settings

### Decision
Usar coluna JSONB no PostgreSQL com tipo discriminado por categoria. Cada categoria tem seu proprio schema Zod para validacao.

### Rationale
- Flexibilidade para adicionar novos campos sem migrations
- Type safety via Zod schemas
- Queries eficientes com JSONB indexes se necessario
- Single source of truth para todas as configuracoes

### Alternatives Considered
- **Tabelas separadas**: Descartado - muitas tabelas para poucos registros, joins desnecessarios
- **Key-value generico**: Descartado - perda de type safety, queries complexas

### Schema Pattern
```typescript
// Tipos discriminados por categoria
type SettingsCategory = 'company' | 'quotation' | 'whatsapp' | 'notification' | 'system'

// Cada categoria tem seu schema Zod
const companySettingsSchema = z.object({
  nome: z.string().min(3),
  nomeFantasia: z.string().optional(),
  cnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/),
  // ...
})
```

---

## 3. Integracao WhatsApp APIs

### Decision
Abstrait integracao com interface comum para suportar Evolution API, Z-API e Baileys. Configuracao do provedor determina qual adapter usar.

### Rationale
- Diferentes clientes podem usar diferentes provedores
- Interface comum simplifica codigo de negocio
- Adapter pattern permite adicionar novos provedores sem mudancas no core

### Alternatives Considered
- **Suportar apenas um provedor**: Descartado - limita flexibilidade do cliente
- **Integracoes separadas sem abstracao**: Descartado - duplicacao de codigo

### Integration Pattern
```typescript
// lib/integrations/whatsapp.ts
interface WhatsAppProvider {
  testConnection(): Promise<{ connected: boolean; error?: string }>
  sendMessage(phone: string, message: string): Promise<void>
}

function createWhatsAppProvider(settings: WhatsAppSettings): WhatsAppProvider {
  switch (settings.provider) {
    case 'evolution': return new EvolutionAdapter(settings)
    case 'zapi': return new ZApiAdapter(settings)
    case 'baileys': return new BaileysAdapter(settings)
    default: throw new Error('Provider not supported')
  }
}
```

---

## 4. Fila de Mensagens com Retry

### Decision
Usar tabela `messageQueue` no banco de dados com job scheduler baseado em cron para processar fila e implementar backoff exponencial.

### Rationale
- Sem dependencia de servicos externos (Redis, RabbitMQ)
- Persistencia garantida no PostgreSQL
- Backoff exponencial: 1min, 2min, 4min, 8min, 16min (5 tentativas)
- Compativel com arquitetura serverless do Next.js

### Alternatives Considered
- **Redis Queue**: Descartado - dependencia adicional desnecessaria para volume esperado
- **Vercel Cron**: Viavel - pode ser usado para trigger do job
- **Sem fila (fail fast)**: Descartado - perda de mensagens inaceitavel

### Queue Pattern
```typescript
// Schema
const messageQueue = pgTable('message_queue', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: varchar('type', { length: 50 }).notNull(), // 'whatsapp', 'email'
  payload: jsonb('payload').notNull(),
  status: varchar('status', { length: 20 }).default('pending'),
  attempts: integer('attempts').default(0),
  nextRetryAt: timestamp('next_retry_at'),
  lastError: text('last_error'),
  createdAt: timestamp('created_at').defaultNow(),
})
```

---

## 5. Upload de Logo

### Decision
Armazenar logo no sistema de arquivos local em `public/uploads/` com nome unico baseado em timestamp. Path salvo no settings.

### Rationale
- Simples e direto para MVP single-tenant
- Servido estaticamente pelo Next.js
- Sem custo adicional de CDN/S3

### Alternatives Considered
- **Base64 no banco**: Descartado - aumenta tamanho do banco, lento para carregar
- **S3/Cloudinary**: Descartado - complexidade desnecessaria para MVP
- **Vercel Blob**: Viavel para futuro - pode migrar se necessario

### Upload Pattern
```typescript
// app/api/settings/upload-logo/route.ts
export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('logo') as File

  // Validacoes
  if (file.size > 2 * 1024 * 1024) throw new Error('File too large')
  if (!['image/jpeg', 'image/png'].includes(file.type)) throw new Error('Invalid format')

  const filename = `logo-${Date.now()}.${file.type.split('/')[1]}`
  const path = `/uploads/${filename}`
  // Salvar arquivo e atualizar settings.company.logo
}
```

---

## 6. Auditoria de Configuracoes Sensiveis

### Decision
Tabela `settingsAuditLog` com registro de alteracoes em campos sensiveis (credenciais, taxas, descontos). Armazena valor anterior, nao o atual.

### Rationale
- Rastreabilidade para compliance e seguranca
- Valor anterior util para rollback/investigacao
- Nao armazenar valor atual evita exposicao de credenciais no log

### Fields to Audit
- `whatsapp.apiKey` (masked)
- `notification.smtpPassword` (masked)
- `quotation.taxaAdesao`
- `quotation.desconto`
- `quotation.cotasParticipacao`
- `system.wdapi2ApiKey` (masked)

### Audit Pattern
```typescript
// lib/settings.ts
async function updateSettings(category: string, data: unknown, userId: string) {
  const current = await getSettings(category)
  const sensitiveFields = getSensitiveFields(category)

  for (const field of sensitiveFields) {
    if (current[field] !== data[field]) {
      await createAuditLog({
        userId,
        category,
        field,
        previousValue: maskSensitive(current[field]),
        changedAt: new Date()
      })
    }
  }

  // Proceed with update
}
```

---

## 7. Validacao de CNPJ

### Decision
Implementar validacao completa de CNPJ incluindo digitos verificadores usando algoritmo padrao da Receita Federal.

### Rationale
- Garante dados validos na origem
- Evita erros em integrações futuras
- Melhor UX com feedback imediato

### Validation Pattern
```typescript
// Algoritmo de validacao de CNPJ
function validateCNPJ(cnpj: string): boolean {
  const numbers = cnpj.replace(/\D/g, '')
  if (numbers.length !== 14) return false
  if (/^(\d)\1+$/.test(numbers)) return false // todos iguais

  // Calculo dos digitos verificadores
  const calc = (digits: string, weights: number[]) => {
    const sum = digits.split('').reduce((acc, d, i) => acc + parseInt(d) * weights[i], 0)
    const rest = sum % 11
    return rest < 2 ? 0 : 11 - rest
  }

  const weights1 = [5,4,3,2,9,8,7,6,5,4,3,2]
  const weights2 = [6,5,4,3,2,9,8,7,6,5,4,3,2]

  const d1 = calc(numbers.slice(0,12), weights1)
  const d2 = calc(numbers.slice(0,12) + d1, weights2)

  return numbers.slice(12) === `${d1}${d2}`
}
```

---

## 8. Integracao ViaCEP

### Decision
Usar API publica ViaCEP para busca de enderecos. Implementar timeout e fallback para preenchimento manual.

### Rationale
- API gratuita e confiavel
- Amplamente usada no Brasil
- Sem necessidade de cadastro/chave

### Integration Pattern
```typescript
// lib/integrations/viacep.ts
interface ViaCEPResponse {
  cep: string
  logradouro: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
}

export async function fetchAddressByCEP(cep: string): Promise<ViaCEPResponse | null> {
  const cleanCep = cep.replace(/\D/g, '')
  if (cleanCep.length !== 8) return null

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 2000) // 2s timeout

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
      signal: controller.signal
    })
    const data = await response.json()
    return data.erro ? null : data
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}
```

---

## Summary

Todas as decisoes tecnicas foram tomadas priorizando:
1. **Simplicidade** - Sem over-engineering, solucoes diretas
2. **Seguranca** - Criptografia adequada para dados sensiveis
3. **Conformidade** - Alinhamento com constituicao do projeto
4. **Pragmatismo** - Solucoes MVP que podem evoluir
