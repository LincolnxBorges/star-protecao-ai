# API Contracts: Configuracoes Gerais

**Feature**: 007-configuracoes-gerais
**Date**: 2025-11-27

## Base URL

```
/api/settings
```

## Authentication

Todas as rotas requerem autenticacao via Better Auth. Apenas usuarios com role `admin` podem acessar.

---

## 1. Get Settings by Category

### Request

```
GET /api/settings?category={category}
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| category | string | Yes | company, quotation, whatsapp, notification, system |

### Response

**200 OK**
```json
{
  "id": "uuid",
  "category": "company",
  "data": {
    "nome": "Star Protecao Veicular",
    "cnpj": "12.345.678/0001-90",
    // ... campos especificos da categoria
  },
  "updatedAt": "2025-11-27T10:00:00Z"
}
```

**404 Not Found** - Categoria nao existe ou settings nao inicializado
```json
{
  "error": "Settings not found for category: {category}"
}
```

**401 Unauthorized** - Usuario nao autenticado
```json
{
  "error": "Unauthorized"
}
```

**403 Forbidden** - Usuario sem permissao de admin
```json
{
  "error": "Admin access required"
}
```

---

## 2. Update Settings by Category

### Request

```
PUT /api/settings?category={category}
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| category | string | Yes | company, quotation, whatsapp, notification, system |

**Body:**
```json
{
  "data": {
    // Campos especificos da categoria
  }
}
```

### Response

**200 OK**
```json
{
  "id": "uuid",
  "category": "company",
  "data": { /* dados atualizados */ },
  "updatedAt": "2025-11-27T10:00:00Z"
}
```

**400 Bad Request** - Validacao falhou
```json
{
  "error": "Validation failed",
  "details": [
    { "field": "cnpj", "message": "CNPJ invalido" }
  ]
}
```

**401 Unauthorized**
**403 Forbidden**

---

## 3. Upload Logo

### Request

```
POST /api/settings/upload-logo
Content-Type: multipart/form-data
```

**Form Data:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| logo | File | Yes | Imagem JPG/PNG, max 2MB |

### Response

**200 OK**
```json
{
  "path": "/uploads/logo-1701087600000.png",
  "url": "https://domain.com/uploads/logo-1701087600000.png"
}
```

**400 Bad Request** - Arquivo invalido
```json
{
  "error": "Invalid file",
  "details": "File must be JPG or PNG and less than 2MB"
}
```

**401 Unauthorized**
**403 Forbidden**

---

## 4. Delete Logo

### Request

```
DELETE /api/settings/upload-logo
```

### Response

**200 OK**
```json
{
  "success": true
}
```

**404 Not Found** - Logo nao existe
```json
{
  "error": "No logo found"
}
```

**401 Unauthorized**
**403 Forbidden**

---

## 5. Test Connection

### Request

```
POST /api/settings/test-connection
```

**Body:**
```json
{
  "type": "whatsapp" | "smtp" | "wdapi2" | "fipe" | "viacep",
  "config": {
    // Configuracao especifica do tipo
  }
}
```

**WhatsApp Config:**
```json
{
  "type": "whatsapp",
  "config": {
    "provider": "evolution",
    "apiUrl": "https://api.evolution.com.br",
    "apiKey": "xxx",
    "instanceName": "my-instance"
  }
}
```

**SMTP Config:**
```json
{
  "type": "smtp",
  "config": {
    "server": "smtp.gmail.com",
    "port": 587,
    "user": "user@example.com",
    "password": "xxx",
    "useTls": true
  }
}
```

**API Config (WDAPI2, FIPE, ViaCEP):**
```json
{
  "type": "wdapi2",
  "config": {
    "url": "https://api.wdapi2.com.br",
    "apiKey": "xxx"
  }
}
```

### Response

**200 OK** - Conexao bem sucedida
```json
{
  "success": true,
  "message": "Connection successful",
  "details": {
    "latency": 150,
    "version": "1.2.3" // se aplicavel
  }
}
```

**200 OK** - Conexao falhou (nao e erro HTTP)
```json
{
  "success": false,
  "message": "Connection failed",
  "error": "Invalid API key"
}
```

**400 Bad Request** - Tipo invalido
```json
{
  "error": "Invalid connection type"
}
```

**401 Unauthorized**
**403 Forbidden**

---

## 6. Fetch Address by CEP

### Request

```
GET /api/settings/cep/{cep}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| cep | string | Yes | CEP no formato 00000-000 ou 00000000 |

### Response

**200 OK**
```json
{
  "cep": "01310-100",
  "logradouro": "Avenida Paulista",
  "bairro": "Bela Vista",
  "cidade": "Sao Paulo",
  "estado": "SP"
}
```

**404 Not Found** - CEP nao encontrado
```json
{
  "error": "CEP not found"
}
```

**400 Bad Request** - Formato invalido
```json
{
  "error": "Invalid CEP format"
}
```

---

## 7. Message Templates

### List Templates

```
GET /api/settings/templates
```

**Response:**
```json
{
  "templates": [
    {
      "id": "uuid",
      "name": "Cotacao Criada",
      "eventType": "quotation_created",
      "content": "Ola {{cliente_nome}}...",
      "isActive": true,
      "updatedAt": "2025-11-27T10:00:00Z"
    }
  ]
}
```

### Create Template

```
POST /api/settings/templates
```

**Body:**
```json
{
  "name": "Novo Template",
  "eventType": "quotation_created",
  "content": "Ola {{cliente_nome}}...",
  "isActive": true
}
```

**Response:** 201 Created com template criado

### Update Template

```
PUT /api/settings/templates/{id}
```

**Body:** Mesma estrutura do create (campos parciais permitidos)

**Response:** 200 OK com template atualizado

### Delete Template

```
DELETE /api/settings/templates/{id}
```

**Response:** 200 OK
```json
{
  "success": true
}
```

### Validate Template Variables

```
POST /api/settings/templates/validate
```

**Body:**
```json
{
  "content": "Ola {{cliente_nome}}, sua {{invalido}} esta pronta"
}
```

**Response:**
```json
{
  "valid": false,
  "invalidVariables": ["invalido"],
  "validVariables": ["cliente_nome"]
}
```

---

## 8. Backup Operations

### Create Backup

```
POST /api/settings/backup
```

**Response:** 202 Accepted
```json
{
  "message": "Backup started",
  "backupId": "uuid"
}
```

### List Backups

```
GET /api/settings/backup
```

**Response:**
```json
{
  "backups": [
    {
      "id": "uuid",
      "filename": "backup-2025-11-27-030000.sql.gz",
      "size": 1024000,
      "createdAt": "2025-11-27T03:00:00Z"
    }
  ],
  "lastBackup": "2025-11-27T03:00:00Z",
  "databaseSize": 256000000
}
```

### Download Backup

```
GET /api/settings/backup/{id}/download
```

**Response:** Binary file download (application/gzip)

### Delete Backup

```
DELETE /api/settings/backup/{id}
```

**Response:** 200 OK

---

## 9. Export/Import Data

### Export Data

```
POST /api/settings/export
```

**Body:**
```json
{
  "entities": ["quotations", "clients", "sellers"], // opcional, default: all
  "format": "json" | "csv"
}
```

**Response:** 202 Accepted
```json
{
  "message": "Export started",
  "downloadUrl": "/api/settings/export/{exportId}/download"
}
```

### Import Data

```
POST /api/settings/import
Content-Type: multipart/form-data
```

**Form Data:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| file | File | Yes | Arquivo JSON ou CSV |

**Response:** 202 Accepted
```json
{
  "message": "Import started",
  "importId": "uuid"
}
```

---

## 10. System Logs

### Get Logs

```
GET /api/settings/logs
```

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| level | string | No | all | debug, info, warning, error |
| from | datetime | No | -24h | Data inicial |
| to | datetime | No | now | Data final |
| limit | number | No | 100 | Max 1000 |
| offset | number | No | 0 | Paginacao |

**Response:**
```json
{
  "logs": [
    {
      "id": "uuid",
      "level": "warning",
      "message": "WhatsApp connection failed",
      "context": { "provider": "evolution" },
      "createdAt": "2025-11-27T10:00:00Z"
    }
  ],
  "total": 150,
  "hasMore": true
}
```

### Export Logs

```
GET /api/settings/logs/export
```

**Query Parameters:** Mesmos do GET /logs

**Response:** Binary file download (text/csv)

---

## 11. Audit Log

### Get Audit Log

```
GET /api/settings/audit
```

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| category | string | No | all | Filtrar por categoria |
| from | datetime | No | -30d | Data inicial |
| to | datetime | No | now | Data final |
| limit | number | No | 50 | Max 100 |
| offset | number | No | 0 | Paginacao |

**Response:**
```json
{
  "entries": [
    {
      "id": "uuid",
      "user": {
        "id": "uuid",
        "name": "Admin User",
        "email": "admin@example.com"
      },
      "category": "quotation",
      "field": "taxaAdesao",
      "previousValue": "0.8",
      "changedAt": "2025-11-27T10:00:00Z"
    }
  ],
  "total": 25,
  "hasMore": false
}
```

---

## 12. Reset Settings

### Reset to Defaults

```
POST /api/settings/reset
```

**Body:**
```json
{
  "categories": ["quotation", "notification"], // ou ["all"]
  "confirm": true
}
```

**Response:** 200 OK
```json
{
  "success": true,
  "reset": ["quotation", "notification"]
}
```

**400 Bad Request** - Confirmacao ausente
```json
{
  "error": "Confirmation required",
  "message": "Set confirm: true to proceed"
}
```

---

## Template Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| {{cliente_nome}} | Nome do cliente | Joao Silva |
| {{cliente_telefone}} | Telefone do cliente | (11) 99999-9999 |
| {{cliente_email}} | Email do cliente | joao@email.com |
| {{cliente_cpf}} | CPF do cliente | 123.456.789-00 |
| {{veiculo_marca}} | Marca do veiculo | Toyota |
| {{veiculo_modelo}} | Modelo do veiculo | Corolla |
| {{veiculo_ano}} | Ano do veiculo | 2023 |
| {{veiculo_placa}} | Placa do veiculo | ABC-1234 |
| {{veiculo_cor}} | Cor do veiculo | Prata |
| {{valor_fipe}} | Valor FIPE formatado | 85.000,00 |
| {{mensalidade}} | Valor da mensalidade | 350,00 |
| {{adesao}} | Valor da adesao | 680,00 |
| {{adesao_com_desconto}} | Adesao com desconto | 544,00 |
| {{desconto_adesao}} | Percentual de desconto | 20 |
| {{cota_participacao}} | Valor da cota | 2.400,00 |
| {{validade_dias}} | Dias de validade | 7 |
| {{dias_restantes}} | Dias ate expirar | 3 |
| {{vendedor_nome}} | Nome do vendedor | Maria Santos |
| {{empresa_nome}} | Nome da empresa | Star Protecao |

---

## Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | VALIDATION_ERROR | Dados invalidos |
| 400 | INVALID_FORMAT | Formato de arquivo invalido |
| 400 | FILE_TOO_LARGE | Arquivo excede limite |
| 401 | UNAUTHORIZED | Usuario nao autenticado |
| 403 | FORBIDDEN | Sem permissao de admin |
| 404 | NOT_FOUND | Recurso nao encontrado |
| 409 | CONFLICT | Conflito de dados |
| 500 | INTERNAL_ERROR | Erro interno do servidor |
