/**
 * WhatsApp Integration Module
 * Supports multiple providers: Evolution API, Z-API, Baileys
 */

import type { WhatsAppSettings } from "@/lib/settings-schemas";

// ===========================================
// Types and Interfaces
// ===========================================

export interface WhatsAppConnectionResult {
  connected: boolean;
  status: "connected" | "disconnected" | "error";
  error?: string;
  instanceInfo?: {
    name: string;
    number?: string;
    status: string;
  };
}

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface WhatsAppProvider {
  /**
   * Test connection to the WhatsApp API
   */
  testConnection(): Promise<WhatsAppConnectionResult>;

  /**
   * Send a text message
   */
  sendMessage(phone: string, message: string): Promise<WhatsAppSendResult>;

  /**
   * Get current connection status
   */
  getStatus(): Promise<WhatsAppConnectionResult>;
}

// ===========================================
// Evolution API Adapter
// ===========================================

export class EvolutionAdapter implements WhatsAppProvider {
  private apiUrl: string;
  private apiKey: string;
  private instanceName: string;

  constructor(settings: WhatsAppSettings) {
    this.apiUrl = settings.apiUrl || "";
    this.apiKey = settings.apiKey || "";
    this.instanceName = settings.instanceName || "";
  }

  async testConnection(): Promise<WhatsAppConnectionResult> {
    if (!this.apiUrl || !this.apiKey || !this.instanceName) {
      return {
        connected: false,
        status: "error",
        error: "Configuracoes incompletas. Preencha URL, API Key e Instance Name.",
      };
    }

    try {
      const response = await fetch(
        `${this.apiUrl}/instance/connectionState/${this.instanceName}`,
        {
          method: "GET",
          headers: {
            apikey: this.apiKey,
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(5000),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          connected: false,
          status: "error",
          error: errorData.message || `Erro HTTP ${response.status}`,
        };
      }

      const data = await response.json();
      const isConnected = data.state === "open" || data.instance?.state === "open";

      return {
        connected: isConnected,
        status: isConnected ? "connected" : "disconnected",
        instanceInfo: {
          name: this.instanceName,
          number: data.instance?.owner || data.number,
          status: data.state || data.instance?.state || "unknown",
        },
      };
    } catch (error) {
      return {
        connected: false,
        status: "error",
        error:
          error instanceof Error
            ? error.name === "TimeoutError"
              ? "Timeout: Servidor nao respondeu em 5 segundos"
              : error.message
            : "Erro desconhecido",
      };
    }
  }

  async sendMessage(phone: string, message: string): Promise<WhatsAppSendResult> {
    if (!this.apiUrl || !this.apiKey || !this.instanceName) {
      return {
        success: false,
        error: "Configuracoes incompletas",
      };
    }

    try {
      const cleanPhone = phone.replace(/\D/g, "");
      const response = await fetch(
        `${this.apiUrl}/message/sendText/${this.instanceName}`,
        {
          method: "POST",
          headers: {
            apikey: this.apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            number: cleanPhone,
            text: message,
          }),
          signal: AbortSignal.timeout(10000),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || `Erro HTTP ${response.status}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        messageId: data.key?.id || data.messageId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao enviar mensagem",
      };
    }
  }

  async getStatus(): Promise<WhatsAppConnectionResult> {
    return this.testConnection();
  }
}

// ===========================================
// Z-API Adapter
// ===========================================

export class ZApiAdapter implements WhatsAppProvider {
  private apiUrl: string;
  private apiKey: string;
  private instanceName: string;

  constructor(settings: WhatsAppSettings) {
    this.apiUrl = settings.apiUrl || "";
    this.apiKey = settings.apiKey || "";
    this.instanceName = settings.instanceName || "";
  }

  async testConnection(): Promise<WhatsAppConnectionResult> {
    if (!this.apiUrl || !this.apiKey || !this.instanceName) {
      return {
        connected: false,
        status: "error",
        error: "Configuracoes incompletas. Preencha URL, API Key e Instance ID.",
      };
    }

    try {
      // Z-API uses instance ID in the URL and Client-Token header
      const response = await fetch(`${this.apiUrl}/status`, {
        method: "GET",
        headers: {
          "Client-Token": this.apiKey,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          connected: false,
          status: "error",
          error: errorData.message || `Erro HTTP ${response.status}`,
        };
      }

      const data = await response.json();
      const isConnected = data.connected === true || data.status === "connected";

      return {
        connected: isConnected,
        status: isConnected ? "connected" : "disconnected",
        instanceInfo: {
          name: this.instanceName,
          number: data.phone || data.number,
          status: data.status || (isConnected ? "connected" : "disconnected"),
        },
      };
    } catch (error) {
      return {
        connected: false,
        status: "error",
        error:
          error instanceof Error
            ? error.name === "TimeoutError"
              ? "Timeout: Servidor nao respondeu em 5 segundos"
              : error.message
            : "Erro desconhecido",
      };
    }
  }

  async sendMessage(phone: string, message: string): Promise<WhatsAppSendResult> {
    if (!this.apiUrl || !this.apiKey) {
      return {
        success: false,
        error: "Configuracoes incompletas",
      };
    }

    try {
      const cleanPhone = phone.replace(/\D/g, "");
      const response = await fetch(`${this.apiUrl}/send-text`, {
        method: "POST",
        headers: {
          "Client-Token": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: cleanPhone,
          message: message,
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || `Erro HTTP ${response.status}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        messageId: data.zapiMessageId || data.messageId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao enviar mensagem",
      };
    }
  }

  async getStatus(): Promise<WhatsAppConnectionResult> {
    return this.testConnection();
  }
}

// ===========================================
// Baileys Adapter (Placeholder)
// ===========================================

export class BaileysAdapter implements WhatsAppProvider {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_settings: WhatsAppSettings) {
    // Baileys requires local server setup
  }

  async testConnection(): Promise<WhatsAppConnectionResult> {
    return {
      connected: false,
      status: "error",
      error: "Baileys nao esta disponivel. Use Evolution API ou Z-API.",
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async sendMessage(_phone: string, _message: string): Promise<WhatsAppSendResult> {
    return {
      success: false,
      error: "Baileys nao esta disponivel",
    };
  }

  async getStatus(): Promise<WhatsAppConnectionResult> {
    return this.testConnection();
  }
}

// ===========================================
// Factory Function
// ===========================================

/**
 * Creates a WhatsApp provider based on settings
 */
export function createWhatsAppProvider(settings: WhatsAppSettings): WhatsAppProvider {
  switch (settings.provider) {
    case "evolution":
      return new EvolutionAdapter(settings);
    case "zapi":
      return new ZApiAdapter(settings);
    case "baileys":
      return new BaileysAdapter(settings);
    default:
      throw new Error(`Provider nao suportado: ${settings.provider}`);
  }
}

/**
 * Test WhatsApp connection with current settings
 */
export async function testWhatsAppConnection(
  settings: WhatsAppSettings
): Promise<WhatsAppConnectionResult> {
  try {
    const provider = createWhatsAppProvider(settings);
    return await provider.testConnection();
  } catch (error) {
    return {
      connected: false,
      status: "error",
      error: error instanceof Error ? error.message : "Erro ao criar provider",
    };
  }
}
