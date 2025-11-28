import { z } from "zod";

// ===========================================
// Settings Category Types
// ===========================================

export type SettingsCategory =
  | "company"
  | "quotation"
  | "whatsapp"
  | "notification"
  | "system";

export const SETTINGS_CATEGORIES: SettingsCategory[] = [
  "company",
  "quotation",
  "whatsapp",
  "notification",
  "system",
];

// ===========================================
// Company Settings Schema
// ===========================================

export const companySettingsSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  nomeFantasia: z.string().optional(),
  cnpj: z
    .string()
    .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, "CNPJ invalido")
    .optional()
    .or(z.literal("")),
  inscricaoEstadual: z.string().optional(),
  telefonePrincipal: z.string().min(10, "Telefone invalido").optional().or(z.literal("")),
  telefoneSecundario: z.string().optional(),
  whatsappComercial: z.string().optional(),
  email: z.string().email("Email invalido").optional().or(z.literal("")),
  website: z.string().url("URL invalida").optional().or(z.literal("")),
  logo: z.string().optional(),
  endereco: z.object({
    cep: z
      .string()
      .regex(/^\d{5}-\d{3}$/, "CEP invalido")
      .optional()
      .or(z.literal("")),
    logradouro: z.string().optional(),
    numero: z.string().optional(),
    complemento: z.string().optional(),
    bairro: z.string().optional(),
    cidade: z.string().optional(),
    estado: z.string().length(2, "Estado deve ter 2 caracteres").optional().or(z.literal("")),
  }),
});

export type CompanySettings = z.infer<typeof companySettingsSchema>;

// ===========================================
// Quotation Settings Schema
// ===========================================

export const quotationSettingsSchema = z.object({
  diasValidade: z.number().int().min(1).max(30),
  taxaAdesao: z.number().min(0).max(10),
  desconto: z.number().min(0).max(100),
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
});

export type QuotationSettings = z.infer<typeof quotationSettingsSchema>;

// ===========================================
// WhatsApp Settings Schema
// ===========================================

export const whatsappSettingsSchema = z.object({
  provider: z.enum(["evolution", "zapi", "baileys", "outro"]),
  apiUrl: z.string().url("URL invalida").optional().or(z.literal("")),
  apiKey: z.string().optional(),
  instanceName: z.string().optional(),
  status: z.enum(["connected", "disconnected", "error"]).optional(),
  lastSync: z.string().datetime().optional(),
});

export type WhatsAppSettings = z.infer<typeof whatsappSettingsSchema>;

// ===========================================
// Notification Settings Schema
// ===========================================

export const notificationSettingsSchema = z.object({
  smtp: z.object({
    server: z.string().optional(),
    port: z.number().int().min(1).max(65535).optional(),
    user: z.string().optional(),
    password: z.string().optional(),
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
});

export type NotificationSettings = z.infer<typeof notificationSettingsSchema>;

// ===========================================
// System Settings Schema
// ===========================================

export const systemSettingsSchema = z.object({
  regional: z.object({
    fusoHorario: z.string(),
    formatoData: z.enum(["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"]),
    formatoMoeda: z.enum(["BRL", "USD", "EUR"]),
    idioma: z.enum(["pt-BR", "en-US", "es-ES"]),
  }),
  apis: z.object({
    wdapi2: z.object({
      url: z.string().url().optional().or(z.literal("")),
      apiKey: z.string().optional(),
    }),
    fipe: z.object({
      url: z.string().url().optional().or(z.literal("")),
    }),
    viacep: z.object({
      url: z.string().url().optional().or(z.literal("")),
    }),
  }),
  backup: z.object({
    automaticoHabilitado: z.boolean(),
    horario: z.string(),
    retencaoDias: z.number().int().min(1).max(365),
  }),
  logs: z.object({
    nivel: z.enum(["debug", "info", "warning", "error"]),
    retencaoDias: z.number().int().min(1).max(365),
  }),
});

export type SystemSettings = z.infer<typeof systemSettingsSchema>;

// ===========================================
// Schema Map
// ===========================================

export const settingsSchemaMap = {
  company: companySettingsSchema,
  quotation: quotationSettingsSchema,
  whatsapp: whatsappSettingsSchema,
  notification: notificationSettingsSchema,
  system: systemSettingsSchema,
} as const;

export function getSettingsSchema(category: SettingsCategory) {
  return settingsSchemaMap[category];
}

// ===========================================
// Default Values
// ===========================================

export const defaultCompanySettings: CompanySettings = {
  nome: "",
  nomeFantasia: "",
  cnpj: "",
  inscricaoEstadual: "",
  telefonePrincipal: "",
  telefoneSecundario: "",
  whatsappComercial: "",
  email: "",
  website: "",
  logo: "",
  endereco: {
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
  },
};

export const defaultQuotationSettings: QuotationSettings = {
  diasValidade: 7,
  taxaAdesao: 0.8,
  desconto: 20,
  cotasParticipacao: {
    normal: 2400,
    especial: 3200,
    utilitario: 4000,
    moto: 1500,
  },
  alertaExpiracao: {
    habilitado: true,
    diasAntecedencia: 2,
  },
  permitirReativar: {
    habilitado: true,
    diasMaximo: 30,
  },
};

export const defaultWhatsappSettings: WhatsAppSettings = {
  provider: "evolution",
  apiUrl: "",
  apiKey: "",
  instanceName: "",
  status: "disconnected",
};

export const defaultNotificationSettings: NotificationSettings = {
  smtp: {
    server: "",
    port: 587,
    user: "",
    password: "",
    useTls: true,
  },
  emailEvents: {
    novaCotacaoCriada: true,
    cotacaoAceita: true,
    cotacaoExpirando: true,
    cotacaoExpirada: false,
    resumoDiario: true,
    resumoSemanal: false,
  },
  whatsappVendedor: {
    novoLead: true,
    cotacaoAceita: true,
    cotacaoExpirando: true,
    resumoDiario: false,
  },
  sistema: {
    tempoReal: true,
    tocarSom: true,
    mostrarBadge: true,
    diasAutoLida: 7,
  },
};

export const defaultSystemSettings: SystemSettings = {
  regional: {
    fusoHorario: "America/Sao_Paulo",
    formatoData: "DD/MM/YYYY",
    formatoMoeda: "BRL",
    idioma: "pt-BR",
  },
  apis: {
    wdapi2: {
      url: "https://api.wdapi2.com.br",
      apiKey: "",
    },
    fipe: {
      url: "https://parallelum.com.br/fipe/api/v2",
    },
    viacep: {
      url: "https://viacep.com.br/ws",
    },
  },
  backup: {
    automaticoHabilitado: true,
    horario: "03:00",
    retencaoDias: 30,
  },
  logs: {
    nivel: "warning",
    retencaoDias: 90,
  },
};

export const defaultSettingsMap = {
  company: defaultCompanySettings,
  quotation: defaultQuotationSettings,
  whatsapp: defaultWhatsappSettings,
  notification: defaultNotificationSettings,
  system: defaultSystemSettings,
} as const;

export function getDefaultSettings(category: SettingsCategory) {
  return defaultSettingsMap[category];
}

// ===========================================
// Sensitive Fields (for audit logging)
// ===========================================

export const sensitiveFieldsMap: Record<SettingsCategory, string[]> = {
  company: [],
  quotation: ["taxaAdesao", "desconto", "cotasParticipacao"],
  whatsapp: ["apiKey"],
  notification: ["smtp.password"],
  system: ["apis.wdapi2.apiKey"],
};

export function getSensitiveFields(category: SettingsCategory): string[] {
  return sensitiveFieldsMap[category] || [];
}
