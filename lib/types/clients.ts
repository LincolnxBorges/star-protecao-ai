// ===========================================
// Client Types - Gestao de Clientes
// ===========================================

export type ClientStatus =
  | "CONVERTED" // Cliente com cotacao aceita
  | "NEGOTIATING" // Em negociacao (cotacao pendente/contatada)
  | "INACTIVE" // Sem cotacao nos ultimos 30 dias
  | "LOST" // Todas cotacoes expiradas/canceladas
  | "NEW"; // Cadastrado nos ultimos 7 dias

export type InteractionType =
  | "CALL_MADE"
  | "CALL_RECEIVED"
  | "WHATSAPP_SENT"
  | "WHATSAPP_RECEIVED"
  | "EMAIL_SENT"
  | "EMAIL_RECEIVED"
  | "MEETING"
  | "NOTE";

export type InteractionResult =
  | "POSITIVE"
  | "NEUTRAL"
  | "NEGATIVE"
  | "NO_CONTACT";

export interface ClientFilters {
  search?: string;
  status?: ClientStatus[];
  city?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sellerId?: string;
  page?: number;
  limit?: number;
  orderBy?:
    | "name"
    | "createdAt"
    | "quotationCount"
    | "lastInteractionAt"
    | "monthlyValue";
  orderDir?: "asc" | "desc";
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

export interface ListClientsResult {
  items: ClientWithMetrics[];
  total: number;
}

export interface ClientProfile {
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
  quotations: ClientQuotationSummary[];
  vehicles: ClientVehicle[];
  interactions: ClientInteraction[];
  seller: ClientSeller | null;
}

export interface ClientQuotationSummary {
  id: string;
  vehicleMarca: string;
  vehicleModelo: string;
  vehiclePlaca: string;
  mensalidade: number;
  status: string;
  createdAt: Date;
  acceptedAt: Date | null;
}

export interface ClientVehicle {
  marca: string;
  modelo: string;
  ano: string;
  placa: string;
  isProtected: boolean;
  hasPendingQuotation: boolean;
}

export interface ClientSeller {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

export interface ClientQuotationDetail {
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
  status: string;
  createdAt: Date;
  expiresAt: Date | null;
  acceptedAt: Date | null;
  seller: {
    id: string;
    name: string;
  } | null;
}

export interface ClientQuotationsSummary {
  total: number;
  accepted: number;
  activeMonthlyValue: number;
  quotations: ClientQuotationDetail[];
}
