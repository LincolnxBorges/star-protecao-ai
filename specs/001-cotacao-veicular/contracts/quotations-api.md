# API Contract: Quotations

**Feature**: 001-cotacao-veicular
**Date**: 2025-11-26

## POST /api/quotations

Cria uma nova cotacao.

### Request

```typescript
// Headers
Content-Type: application/json

// Body
{
  "vehicle": {
    "placa": string,
    "marca": string,
    "modelo": string,
    "ano": string,
    "valorFipe": number,
    "codigoFipe": string,
    "combustivel": string | null,
    "cor": string | null,
    "categoria": "NORMAL" | "ESPECIAL" | "UTILITARIO" | "MOTO",
    "tipoUso": "PARTICULAR" | "COMERCIAL"
  },
  "customer": {
    "name": string,
    "email": string,
    "phone": string,           // WhatsApp: (11) 99999-9999
    "cpf": string,             // 000.000.000-00
    "cep": string,             // 00000-000
    "street": string,
    "number": string,
    "complement": string | null,
    "neighborhood": string,
    "city": string,
    "state": string            // UF: 2 caracteres
  },
  "isRejected"?: boolean,      // true se veiculo foi recusado (blacklist/limite)
  "rejectionReason"?: string   // Motivo da recusa
}
```

### Response

#### Success (201 Created)

```typescript
{
  "success": true,
  "data": {
    "id": string,              // UUID da cotacao
    "mensalidade": number,
    "adesao": number,
    "adesaoDesconto": number,
    "cotaParticipacao": number | null,
    "status": "PENDING" | "REJECTED",
    "expiresAt": string,       // ISO date
    "seller": {
      "id": string,
      "name": string,
      "phone": string | null
    } | null,
    "customer": {
      "id": string,
      "name": string
    },
    "vehicle": {
      "id": string,
      "placa": string,
      "marca": string,
      "modelo": string,
      "valorFipe": number
    }
  }
}
```

#### Error - Validation (400)

```typescript
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados invalidos",
    "details": {
      "field": string,
      "message": string
    }[]
  }
}
```

### Validation Rules

**Customer:**
- `name`: Obrigatorio, min 3 caracteres
- `email`: Obrigatorio, formato email valido
- `phone`: Obrigatorio, formato brasileiro (11 digitos)
- `cpf`: Obrigatorio, CPF valido com digitos verificadores
- `cep`: Obrigatorio, formato 00000-000
- `street`, `number`, `neighborhood`, `city`: Obrigatorios
- `state`: Obrigatorio, 2 caracteres uppercase

**Vehicle:**
- Todos os campos obrigatorios exceto `combustivel`, `cor`
- `valorFipe`: numero positivo
- `categoria`: um dos valores do enum
- `tipoUso`: um dos valores do enum

### Business Logic

1. Validar todos os campos
2. Verificar se cliente existe pelo CPF
   - Se existe: reutilizar registro
   - Se nao: criar novo cliente
3. Criar registro do veiculo
4. Se `isRejected`:
   - Criar cotacao com status REJECTED
   - Nao atribuir vendedor
   - Nao enviar WhatsApp ao cliente
5. Se nao rejeitado:
   - Buscar regra de preco pela categoria e valor FIPE
   - Calcular valores (mensalidade, adesao, desconto)
   - Atribuir vendedor via round-robin
   - Criar cotacao com status PENDING
   - Enviar WhatsApp ao cliente
   - Notificar vendedor
6. Retornar cotacao criada

---

## GET /api/quotations

Lista cotacoes (requer autenticacao).

### Request

```typescript
// Headers
Authorization: Bearer {token}

// Query params
?status=PENDING,CONTACTED    // Filtro por status (opcional, multiplos separados por virgula)
&page=1                      // Paginacao (default: 1)
&limit=20                    // Itens por pagina (default: 20, max: 100)
```

### Response

#### Success (200 OK)

```typescript
{
  "success": true,
  "data": {
    "items": [
      {
        "id": string,
        "status": string,
        "mensalidade": number,
        "createdAt": string,
        "expiresAt": string,
        "customer": {
          "id": string,
          "name": string,
          "phone": string
        },
        "vehicle": {
          "id": string,
          "placa": string,
          "marca": string,
          "modelo": string,
          "valorFipe": number
        },
        "seller": {
          "id": string,
          "name": string
        } | null
      }
    ],
    "pagination": {
      "page": number,
      "limit": number,
      "total": number,
      "totalPages": number
    }
  }
}
```

### Authorization

- **SELLER**: Ve apenas cotacoes atribuidas a ele
- **ADMIN**: Ve todas as cotacoes

---

## GET /api/quotations/:id

Detalhes de uma cotacao (requer autenticacao).

### Response

#### Success (200 OK)

```typescript
{
  "success": true,
  "data": {
    "id": string,
    "status": string,
    "rejectionReason": string | null,
    "mensalidade": number,
    "adesao": number,
    "adesaoDesconto": number,
    "cotaParticipacao": number | null,
    "createdAt": string,
    "expiresAt": string,
    "contactedAt": string | null,
    "acceptedAt": string | null,
    "notes": string | null,
    "customer": {
      "id": string,
      "name": string,
      "email": string,
      "phone": string,
      "cpf": string,
      "address": {
        "cep": string,
        "street": string,
        "number": string,
        "complement": string | null,
        "neighborhood": string,
        "city": string,
        "state": string
      }
    },
    "vehicle": {
      "id": string,
      "placa": string,
      "marca": string,
      "modelo": string,
      "ano": string,
      "valorFipe": number,
      "codigoFipe": string,
      "combustivel": string | null,
      "cor": string | null,
      "categoria": string,
      "tipoUso": string
    },
    "seller": {
      "id": string,
      "name": string,
      "email": string,
      "phone": string | null
    } | null
  }
}
```

#### Error - Not Found (404)

```typescript
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Cotacao nao encontrada"
  }
}
```

#### Error - Forbidden (403)

```typescript
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Acesso negado"
  }
}
```

### Authorization

- **SELLER**: So pode ver cotacoes atribuidas a ele
- **ADMIN**: Pode ver qualquer cotacao

---

## PATCH /api/quotations/:id

Atualiza status de uma cotacao (requer autenticacao).

### Request

```typescript
// Headers
Authorization: Bearer {token}
Content-Type: application/json

// Body
{
  "status": "CONTACTED" | "ACCEPTED" | "CANCELLED",
  "notes"?: string
}
```

### Response

#### Success (200 OK)

```typescript
{
  "success": true,
  "data": {
    "id": string,
    "status": string,
    "contactedAt": string | null,
    "acceptedAt": string | null,
    "notes": string | null
  }
}
```

### Business Logic

1. Verificar autorizacao (SELLER so pode atualizar proprias cotacoes)
2. Validar transicao de status:
   - PENDING → CONTACTED, CANCELLED
   - CONTACTED → ACCEPTED, CANCELLED
   - REJECTED, EXPIRED, ACCEPTED, CANCELLED → nenhuma transicao permitida
3. Atualizar timestamps conforme status:
   - CONTACTED → contactedAt = now
   - ACCEPTED → acceptedAt = now
4. Salvar notes se fornecido

### Authorization

- **SELLER**: So pode atualizar cotacoes atribuidas a ele
- **ADMIN**: Pode atualizar qualquer cotacao
