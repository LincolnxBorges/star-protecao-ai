# API Contract: Admin (Pricing & Blacklist)

**Feature**: 001-cotacao-veicular
**Date**: 2025-11-26

**Authorization**: Todas as rotas requerem autenticacao com role ADMIN.

---

## Pricing Rules

### GET /api/pricing

Lista regras de preco.

#### Request

```typescript
// Headers
Authorization: Bearer {token}

// Query params
?categoria=NORMAL            // Filtro por categoria (opcional)
&active=true                 // Filtro por status (opcional)
```

#### Response (200 OK)

```typescript
{
  "success": true,
  "data": [
    {
      "id": string,
      "categoria": "NORMAL" | "ESPECIAL" | "UTILITARIO" | "MOTO",
      "faixaMin": number,
      "faixaMax": number,
      "mensalidade": number,
      "cotaParticipacao": number | null,
      "isActive": boolean,
      "createdAt": string
    }
  ]
}
```

---

### POST /api/pricing

Cria nova regra de preco.

#### Request

```typescript
// Headers
Authorization: Bearer {token}
Content-Type: application/json

// Body
{
  "categoria": "NORMAL" | "ESPECIAL" | "UTILITARIO" | "MOTO",
  "faixaMin": number,
  "faixaMax": number,
  "mensalidade": number,
  "cotaParticipacao"?: number
}
```

#### Response (201 Created)

```typescript
{
  "success": true,
  "data": {
    "id": string,
    "categoria": string,
    "faixaMin": number,
    "faixaMax": number,
    "mensalidade": number,
    "cotaParticipacao": number | null,
    "isActive": boolean,
    "createdAt": string
  }
}
```

#### Error - Conflict (409)

```typescript
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Ja existe uma faixa de preco para esta categoria com este valor minimo"
  }
}
```

#### Validation Rules

- `categoria`: Obrigatoria, um dos valores do enum
- `faixaMin`: Obrigatoria, >= 0
- `faixaMax`: Obrigatoria, > faixaMin
- `mensalidade`: Obrigatoria, > 0
- `cotaParticipacao`: Opcional, >= 0

---

### PATCH /api/pricing/:id

Atualiza regra de preco.

#### Request

```typescript
// Headers
Authorization: Bearer {token}
Content-Type: application/json

// Body (todos opcionais)
{
  "faixaMin"?: number,
  "faixaMax"?: number,
  "mensalidade"?: number,
  "cotaParticipacao"?: number | null,
  "isActive"?: boolean
}
```

#### Response (200 OK)

```typescript
{
  "success": true,
  "data": {
    "id": string,
    "categoria": string,
    "faixaMin": number,
    "faixaMax": number,
    "mensalidade": number,
    "cotaParticipacao": number | null,
    "isActive": boolean,
    "createdAt": string
  }
}
```

---

### DELETE /api/pricing/:id

Remove regra de preco (soft delete - isActive = false).

#### Response (200 OK)

```typescript
{
  "success": true,
  "data": {
    "id": string,
    "isActive": false
  }
}
```

---

## Blacklist

### GET /api/blacklist

Lista itens da blacklist.

#### Request

```typescript
// Headers
Authorization: Bearer {token}

// Query params
?active=true                 // Filtro por status (opcional)
```

#### Response (200 OK)

```typescript
{
  "success": true,
  "data": [
    {
      "id": string,
      "marca": string,
      "modelo": string | null,
      "motivo": string,
      "isActive": boolean,
      "createdAt": string
    }
  ]
}
```

---

### POST /api/blacklist

Adiciona item a blacklist.

#### Request

```typescript
// Headers
Authorization: Bearer {token}
Content-Type: application/json

// Body
{
  "marca": string,
  "modelo"?: string | null,   // null = toda a marca
  "motivo"?: string           // default: "Nao trabalhamos com este veiculo"
}
```

#### Response (201 Created)

```typescript
{
  "success": true,
  "data": {
    "id": string,
    "marca": string,
    "modelo": string | null,
    "motivo": string,
    "isActive": boolean,
    "createdAt": string
  }
}
```

#### Error - Conflict (409)

```typescript
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Ja existe um registro na blacklist para esta marca/modelo"
  }
}
```

#### Validation Rules

- `marca`: Obrigatoria, max 100 caracteres
- `modelo`: Opcional, max 100 caracteres (null bloqueia toda a marca)
- `motivo`: Opcional, max 255 caracteres

---

### DELETE /api/blacklist/:id

Remove item da blacklist (soft delete - isActive = false).

#### Response (200 OK)

```typescript
{
  "success": true,
  "data": {
    "id": string,
    "isActive": false
  }
}
```

---

## Error Responses (Common)

### Unauthorized (401)

```typescript
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Autenticacao necessaria"
  }
}
```

### Forbidden (403)

```typescript
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Acesso restrito a administradores"
  }
}
```

### Not Found (404)

```typescript
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Recurso nao encontrado"
  }
}
```

### Validation Error (400)

```typescript
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados invalidos",
    "details": [
      {
        "field": string,
        "message": string
      }
    ]
  }
}
```
