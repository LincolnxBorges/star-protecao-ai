# API Contracts: Gestao de Clientes

**Feature**: 006-gestao-clientes
**Date**: 2025-11-27

## Overview

Esta feature utiliza Server Components do Next.js, entao a maioria das operacoes sao funcoes de servidor chamadas diretamente. As Server Actions sao usadas para operacoes de escrita (criar interacao, exportar CSV).

## Context Module Functions

### lib/clients.ts

#### listClients

Lista clientes com filtros, busca e paginacao.

```typescript
interface ClientFilters {
  search?: string;           // Busca em nome, CPF, telefone, email, cidade, placa
  status?: ClientStatus[];   // Filtro por status calculado
  city?: string;             // Filtro por cidade
  dateFrom?: Date;           // Filtro por data de cadastro
  dateTo?: Date;
  sellerId?: string;         // Filtro por vendedor (admin only)
  page?: number;             // Default: 1
  limit?: number;            // Default: 10
  orderBy?: 'name' | 'createdAt' | 'quotationCount' | 'lastInteractionAt' | 'monthlyValue';
  orderDir?: 'asc' | 'desc';
}

interface ClientWithMetrics {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  city: string;
  state: string;
  status: ClientStatus;
  quotationCount: number;
  acceptedQuotations: number;
  monthlyValue: number;
  lastInteractionAt: Date | null;
  createdAt: Date;
}

interface ListClientsResult {
  items: ClientWithMetrics[];
  total: number;
}

async function listClients(
  currentSellerId: string | null,
  isAdmin: boolean,
  filters: ClientFilters
): Promise<ListClientsResult>
```

#### getClientKPIs

Retorna KPIs da base de clientes.

```typescript
interface ClientKPIs {
  total: number;              // Total de clientes
  converted: number;          // Clientes convertidos (cotacao aceita)
  convertedPercentage: number; // % de conversao
  negotiating: number;        // Em negociacao
  inactive: number;           // Inativos (30+ dias sem cotacao)
}

async function getClientKPIs(
  sellerId: string | null,
  isAdmin: boolean
): Promise<ClientKPIs>
```

#### getClientProfile

Retorna perfil completo de um cliente.

```typescript
interface ClientProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  cep: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  status: ClientStatus;
  createdAt: Date;

  // Cotacoes resumidas
  quotations: {
    id: string;
    vehicleMarca: string;
    vehicleModelo: string;
    vehiclePlaca: string;
    mensalidade: number;
    status: QuotationStatus;
    createdAt: Date;
    acceptedAt: Date | null;
  }[];

  // Veiculos cotados
  vehicles: {
    marca: string;
    modelo: string;
    ano: string;
    placa: string;
    isProtected: boolean; // Tem cotacao aceita
    hasPendingQuotation: boolean;
  }[];

  // Historico de interacoes
  interactions: {
    id: string;
    type: InteractionType;
    result: InteractionResult | null;
    description: string;
    authorName: string;
    createdAt: Date;
  }[];

  // Vendedor responsavel (ultima cotacao ou cotacao aceita)
  seller: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  } | null;
}

async function getClientProfile(
  clientId: string,
  currentSellerId: string | null,
  isAdmin: boolean
): Promise<ClientProfile | null>
```

#### getClientQuotations

Retorna historico completo de cotacoes de um cliente.

```typescript
interface ClientQuotationDetail {
  id: string;
  vehicle: {
    marca: string;
    modelo: string;
    ano: string;
    placa: string;
    valorFipe: number;
  };
  mensalidade: number;
  adesao: number;
  adesaoDesconto: number;
  status: QuotationStatus;
  createdAt: Date;
  expiresAt: Date | null;
  acceptedAt: Date | null;
  seller: {
    id: string;
    name: string;
  } | null;
}

interface ClientQuotationsSummary {
  total: number;
  accepted: number;
  activeMonthlyValue: number;
  quotations: ClientQuotationDetail[];
}

async function getClientQuotations(
  clientId: string,
  currentSellerId: string | null,
  isAdmin: boolean
): Promise<ClientQuotationsSummary | null>
```

#### createClientInteraction

Registra uma nova interacao com o cliente.

```typescript
interface CreateInteractionInput {
  customerId: string;
  type: InteractionType;
  result?: InteractionResult;
  description: string;
  scheduledFollowUp?: Date;
}

interface ClientInteraction {
  id: string;
  customerId: string;
  sellerId: string;
  type: InteractionType;
  result: InteractionResult | null;
  description: string;
  scheduledFollowUp: Date | null;
  createdAt: Date;
}

async function createClientInteraction(
  input: CreateInteractionInput,
  sellerId: string
): Promise<ClientInteraction>
```

#### getClientInteractions

Lista interacoes de um cliente.

```typescript
async function getClientInteractions(
  clientId: string,
  options?: { limit?: number }
): Promise<ClientInteraction[]>
```

#### softDeleteClient

Marca cliente como excluido (soft delete).

```typescript
async function softDeleteClient(
  clientId: string,
  adminId: string
): Promise<{ success: boolean }>
```

#### exportClientsCSV

Gera CSV com dados dos clientes.

```typescript
async function exportClientsCSV(
  currentSellerId: string | null,
  isAdmin: boolean,
  filters: Omit<ClientFilters, 'page' | 'limit'>
): Promise<string> // CSV string
```

#### getDistinctCities

Retorna lista de cidades distintas para o filtro.

```typescript
async function getDistinctCities(
  sellerId: string | null,
  isAdmin: boolean
): Promise<string[]>
```

## Server Actions

### app/(admin)/clientes/actions.ts

```typescript
"use server";

import { auth } from "@/lib/auth-server";
import * as clients from "@/lib/clients";

// Criar interacao
export async function createInteractionAction(
  input: CreateInteractionInput
): Promise<{ success: boolean; interaction?: ClientInteraction; error?: string }>

// Exportar CSV
export async function exportCSVAction(
  filters: ClientFilters
): Promise<{ success: boolean; csv?: string; error?: string }>

// Soft delete (admin only)
export async function deleteClientAction(
  clientId: string
): Promise<{ success: boolean; error?: string }>
```

## Types

### lib/types/clients.ts

```typescript
export type ClientStatus =
  | 'CONVERTED'    // Cliente com cotacao aceita
  | 'NEGOTIATING'  // Em negociacao (cotacao pendente/contatada)
  | 'INACTIVE'     // Sem cotacao nos ultimos 30 dias
  | 'LOST'         // Todas cotacoes expiradas/canceladas
  | 'NEW';         // Cadastrado nos ultimos 7 dias

export type InteractionType =
  | 'CALL_MADE'
  | 'CALL_RECEIVED'
  | 'WHATSAPP_SENT'
  | 'WHATSAPP_RECEIVED'
  | 'EMAIL_SENT'
  | 'EMAIL_RECEIVED'
  | 'MEETING'
  | 'NOTE';

export type InteractionResult =
  | 'POSITIVE'
  | 'NEUTRAL'
  | 'NEGATIVE'
  | 'NO_CONTACT';

export interface ClientFilters {
  search?: string;
  status?: ClientStatus[];
  city?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sellerId?: string;
  page?: number;
  limit?: number;
  orderBy?: 'name' | 'createdAt' | 'quotationCount' | 'lastInteractionAt' | 'monthlyValue';
  orderDir?: 'asc' | 'desc';
}

export interface ClientWithMetrics {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  city: string;
  state: string;
  status: ClientStatus;
  quotationCount: number;
  acceptedQuotations: number;
  monthlyValue: number;
  lastInteractionAt: Date | null;
  createdAt: Date;
}

export interface ClientKPIs {
  total: number;
  converted: number;
  convertedPercentage: number;
  negotiating: number;
  inactive: number;
}

export interface CreateInteractionInput {
  customerId: string;
  type: InteractionType;
  result?: InteractionResult;
  description: string;
  scheduledFollowUp?: Date;
}

export interface ClientInteraction {
  id: string;
  customerId: string;
  sellerId: string;
  type: InteractionType;
  result: InteractionResult | null;
  description: string;
  scheduledFollowUp: Date | null;
  createdAt: Date;
  authorName?: string;
}
```

## Validation Schemas

### lib/validations/clients.ts

```typescript
import { z } from "zod";

export const createInteractionSchema = z.object({
  customerId: z.string().uuid("ID de cliente invalido"),
  type: z.enum([
    'CALL_MADE', 'CALL_RECEIVED',
    'WHATSAPP_SENT', 'WHATSAPP_RECEIVED',
    'EMAIL_SENT', 'EMAIL_RECEIVED',
    'MEETING', 'NOTE'
  ], { required_error: "Selecione o tipo de interacao" }),
  result: z.enum([
    'POSITIVE', 'NEUTRAL', 'NEGATIVE', 'NO_CONTACT'
  ]).optional(),
  description: z
    .string()
    .min(1, "Descricao obrigatoria")
    .max(2000, "Descricao muito longa"),
  scheduledFollowUp: z.date().optional(),
});

export const clientFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.array(z.enum([
    'CONVERTED', 'NEGOTIATING', 'INACTIVE', 'LOST', 'NEW'
  ])).optional(),
  city: z.string().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  sellerId: z.string().uuid().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
  orderBy: z.enum([
    'name', 'createdAt', 'quotationCount', 'lastInteractionAt', 'monthlyValue'
  ]).default('name'),
  orderDir: z.enum(['asc', 'desc']).default('asc'),
});

export type CreateInteractionInput = z.infer<typeof createInteractionSchema>;
export type ClientFiltersInput = z.infer<typeof clientFiltersSchema>;
```

## Error Handling

```typescript
// Erros padrao
class ClientNotFoundError extends Error {
  constructor(clientId: string) {
    super(`Cliente ${clientId} nao encontrado`);
    this.name = 'ClientNotFoundError';
  }
}

class ClientAccessDeniedError extends Error {
  constructor() {
    super('Acesso negado a este cliente');
    this.name = 'ClientAccessDeniedError';
  }
}
```
