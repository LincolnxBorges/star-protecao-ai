/**
 * Notifications Context
 * WhatsApp messaging via Evolution API
 * @module lib/notifications
 */

// ===========================================
// Types
// ===========================================

export interface QuotationNotificationData {
  id: string;
  mensalidade: number;
  adesaoDesconto: number;
  cotaParticipacao: number | null;
  customer: {
    name: string;
    phone: string;
  };
  vehicle: {
    marca: string;
    modelo: string;
    ano: string;
    placa: string;
  };
  seller?: {
    name: string;
    phone: string | null;
  } | null;
}

interface EvolutionApiResponse {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  message: {
    extendedTextMessage?: {
      text: string;
    };
  };
  messageTimestamp: string;
  status: string;
}

// ===========================================
// Configuration
// ===========================================

function getEvolutionConfig(): {
  url: string;
  apiKey: string;
  instance: string;
} {
  const url = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;
  const instance = process.env.EVOLUTION_INSTANCE;

  if (!url || !apiKey || !instance) {
    throw new Error(
      "Evolution API configuration missing. Check EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE"
    );
  }

  return { url, apiKey, instance };
}

// ===========================================
// Phone Formatting
// ===========================================

/**
 * Format phone number for display
 */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

/**
 * Normalize phone number for WhatsApp (add Brazil country code)
 */
export function normalizePhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  // Add Brazil country code if not present
  if (digits.length === 11) {
    return `55${digits}`;
  }
  if (digits.length === 13 && digits.startsWith("55")) {
    return digits;
  }
  return `55${digits}`;
}

// ===========================================
// Message Formatting
// ===========================================

/**
 * Format customer notification message
 */
export function formatCustomerMessage(
  quotation: QuotationNotificationData
): string {
  const lines = [
    `Ola ${quotation.customer.name}!`,
    "",
    "Sua cotacao de protecao veicular foi realizada com sucesso!",
    "",
    `Veiculo: ${quotation.vehicle.marca} ${quotation.vehicle.modelo} ${quotation.vehicle.ano}`,
    `Placa: ${quotation.vehicle.placa}`,
    "",
    "Valores:",
    `- Mensalidade: R$ ${quotation.mensalidade.toFixed(2).replace(".", ",")}`,
    `- Adesao (com desconto): R$ ${quotation.adesaoDesconto.toFixed(2).replace(".", ",")}`,
  ];

  if (quotation.cotaParticipacao) {
    lines.push(
      `- Cota de participacao: R$ ${quotation.cotaParticipacao.toFixed(2).replace(".", ",")}`
    );
  }

  lines.push("");
  lines.push(
    quotation.seller
      ? `Em breve ${quotation.seller.name} entrara em contato para finalizar sua adesao.`
      : "Em breve um de nossos consultores entrara em contato."
  );
  lines.push("");
  lines.push(`Codigo da cotacao: ${quotation.id.slice(0, 8).toUpperCase()}`);

  return lines.join("\n");
}

/**
 * Format seller notification message
 */
export function formatSellerMessage(
  quotation: QuotationNotificationData
): string {
  const lines = [
    "Nova cotacao recebida!",
    "",
    `Cliente: ${quotation.customer.name}`,
    `WhatsApp: ${formatPhone(quotation.customer.phone)}`,
    "",
    `Veiculo: ${quotation.vehicle.marca} ${quotation.vehicle.modelo} ${quotation.vehicle.ano}`,
    `Placa: ${quotation.vehicle.placa}`,
    "",
    "Valores:",
    `- Mensalidade: R$ ${quotation.mensalidade.toFixed(2).replace(".", ",")}`,
    `- Adesao (com desconto): R$ ${quotation.adesaoDesconto.toFixed(2).replace(".", ",")}`,
  ];

  if (quotation.cotaParticipacao) {
    lines.push(
      `- Cota de participacao: R$ ${quotation.cotaParticipacao.toFixed(2).replace(".", ",")}`
    );
  }

  lines.push("");
  lines.push(`Codigo: ${quotation.id.slice(0, 8).toUpperCase()}`);

  return lines.join("\n");
}

// ===========================================
// WhatsApp Messaging
// ===========================================

/**
 * Send WhatsApp message via Evolution API
 */
export async function sendWhatsAppMessage(
  phone: string,
  text: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const config = getEvolutionConfig();
    const normalizedPhone = normalizePhoneForWhatsApp(phone);

    const response = await fetch(
      `${config.url}/message/sendText/${config.instance}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: config.apiKey,
        },
        body: JSON.stringify({
          number: normalizedPhone,
          text: text,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Evolution API error:", response.status, errorText);
      return {
        success: false,
        error: `Evolution API error: ${response.status}`,
      };
    }

    const data = (await response.json()) as EvolutionApiResponse;

    return {
      success: true,
      messageId: data.key?.id,
    };
  } catch (error) {
    console.error("WhatsApp message send error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ===========================================
// Notification Functions
// ===========================================

/**
 * Send notification to customer about their quotation
 */
export async function notifyCustomerQuotation(
  quotation: QuotationNotificationData
): Promise<{ success: boolean; error?: string }> {
  const message = formatCustomerMessage(quotation);

  const result = await sendWhatsAppMessage(quotation.customer.phone, message);

  if (!result.success) {
    console.error(
      `Failed to notify customer for quotation ${quotation.id}:`,
      result.error
    );
  }

  return result;
}

/**
 * Send notification to seller about a new lead
 */
export async function notifySellerNewLead(
  quotation: QuotationNotificationData
): Promise<{ success: boolean; error?: string }> {
  if (!quotation.seller?.phone) {
    console.warn(
      `Cannot notify seller for quotation ${quotation.id}: no seller phone`
    );
    return { success: false, error: "Seller has no phone number" };
  }

  const message = formatSellerMessage(quotation);

  const result = await sendWhatsAppMessage(quotation.seller.phone, message);

  if (!result.success) {
    console.error(
      `Failed to notify seller for quotation ${quotation.id}:`,
      result.error
    );
  }

  return result;
}

/**
 * Send notifications for a completed quotation (customer + seller)
 * Returns results for both notifications
 */
export async function notifyQuotationCreated(
  quotation: QuotationNotificationData
): Promise<{
  customerNotified: boolean;
  sellerNotified: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  // Notify customer
  const customerResult = await notifyCustomerQuotation(quotation);
  if (!customerResult.success && customerResult.error) {
    errors.push(`Customer: ${customerResult.error}`);
  }

  // Notify seller (if assigned and has phone)
  let sellerNotified = false;
  if (quotation.seller?.phone) {
    const sellerResult = await notifySellerNewLead(quotation);
    sellerNotified = sellerResult.success;
    if (!sellerResult.success && sellerResult.error) {
      errors.push(`Seller: ${sellerResult.error}`);
    }
  }

  return {
    customerNotified: customerResult.success,
    sellerNotified,
    errors,
  };
}
