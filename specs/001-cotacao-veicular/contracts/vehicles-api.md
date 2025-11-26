# API Contract: Vehicles

**Feature**: 001-cotacao-veicular
**Date**: 2025-11-26

## POST /api/vehicles/lookup

Consulta dados de um veiculo pela placa.

### Request

```typescript
// Headers
Content-Type: application/json

// Body
{
  "placa": string,           // Placa do veiculo (ABC-1234 ou ABC1D23)
  "categoria": string,       // "LEVE" | "UTILITARIO" (selecionado pelo cliente)
  "tipoUso": string          // "PARTICULAR" | "COMERCIAL"
}
```

### Response

#### Success (200 OK)

```typescript
{
  "success": true,
  "data": {
    "placa": string,         // Placa normalizada
    "marca": string,         // Ex: "TOYOTA"
    "modelo": string,        // Ex: "ETIOS SD XLS"
    "ano": string,           // Ex: "2014/2014"
    "valorFipe": number,     // Ex: 42540.00
    "codigoFipe": string,    // Ex: "002127-0"
    "combustivel": string,   // Ex: "ALCOOL / GASOLINA"
    "cor": string,           // Ex: "PRATA"
    "categoria": string,     // "NORMAL" | "ESPECIAL" | "UTILITARIO" | "MOTO"
    "tipoUso": string        // "PARTICULAR" | "COMERCIAL"
  }
}
```

#### Error - Placa nao encontrada (404)

```typescript
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Placa nao encontrada"
  }
}
```

#### Error - Veiculo na blacklist (422)

```typescript
{
  "success": false,
  "error": {
    "code": "BLACKLISTED",
    "message": "Nao trabalhamos com este veiculo",
    "details": {
      "marca": string,
      "modelo": string | null,
      "motivo": string
    }
  },
  "saveAsLead": true  // Indica que deve coletar dados para follow-up
}
```

#### Error - Valor acima do limite (422)

```typescript
{
  "success": false,
  "error": {
    "code": "OVER_LIMIT",
    "message": "Valor acima do limite para categoria {categoria}",
    "details": {
      "categoria": string,
      "valorFipe": number,
      "limite": number
    }
  },
  "saveAsLead": true  // Indica que deve coletar dados para follow-up
}
```

#### Error - Falha na API externa (503)

```typescript
{
  "success": false,
  "error": {
    "code": "API_ERROR",
    "message": "Erro ao consultar veiculo. Tente novamente."
  }
}
```

### Validation Rules

- `placa`: Obrigatoria, formato antigo (ABC-1234) ou Mercosul (ABC1D23)
- `categoria`: Obrigatoria, "LEVE" ou "UTILITARIO"
- `tipoUso`: Obrigatorio, "PARTICULAR" ou "COMERCIAL"

### Business Logic

1. Normalizar placa (uppercase, remover hifen)
2. Consultar PowerCRM API com retry (1 tentativa adicional apos 2s)
3. Se MOTOCICLETA, categoria = MOTO (ignora selecao do cliente)
4. Se CAMINHAO, categoria = UTILITARIO (ignora selecao do cliente)
5. Consultar WDAPI2 API com retry
6. Selecionar valor FIPE (codigo exato ou maior score)
7. Verificar blacklist (marca e modelo)
8. Verificar limite por categoria
9. Determinar categoria final baseado em tipo veiculo + selecao cliente + tipo uso

### Category Determination Logic

```
IF vehicleType == 'MOTOCICLETA' THEN categoria = 'MOTO'
ELSE IF vehicleType == 'CAMINHAO' THEN categoria = 'UTILITARIO'
ELSE IF categoriaCliente == 'UTILITARIO' THEN categoria = 'UTILITARIO'
ELSE IF tipoUso == 'COMERCIAL' THEN categoria = 'ESPECIAL'
ELSE categoria = 'NORMAL'
```

### FIPE Limits

| Categoria | Limite Maximo |
|-----------|---------------|
| NORMAL | R$ 180.000 |
| ESPECIAL | R$ 190.000 |
| UTILITARIO | R$ 450.000 |
| MOTO | R$ 90.000 |
