/**
 * Tests for notifications context - WhatsApp via Evolution API
 * @module tests/unit/notifications.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Types for testing
interface QuotationData {
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

// Pure functions to test message formatting
function formatCustomerMessage(quotation: QuotationData): string {
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

function formatSellerMessage(quotation: QuotationData): string {
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

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

function normalizePhoneForWhatsApp(phone: string): string {
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

function validateEvolutionApiConfig(config: {
  url?: string;
  apiKey?: string;
  instance?: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.url) {
    errors.push("EVOLUTION_API_URL is required");
  }
  if (!config.apiKey) {
    errors.push("EVOLUTION_API_KEY is required");
  }
  if (!config.instance) {
    errors.push("EVOLUTION_INSTANCE is required");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

describe("Notifications Context", () => {
  describe("formatCustomerMessage", () => {
    it("formats customer notification with all fields", () => {
      const quotation: QuotationData = {
        id: "abc12345-6789-0123-4567-890123456789",
        mensalidade: 325.95,
        adesaoDesconto: 521.52,
        cotaParticipacao: 5000,
        customer: {
          name: "Joao Silva",
          phone: "11999887766",
        },
        vehicle: {
          marca: "VOLKSWAGEN",
          modelo: "GOL",
          ano: "2020/2021",
          placa: "ABC1D23",
        },
        seller: {
          name: "Maria Vendedora",
          phone: "11988776655",
        },
      };

      const message = formatCustomerMessage(quotation);

      expect(message).toContain("Ola Joao Silva!");
      expect(message).toContain("VOLKSWAGEN GOL 2020/2021");
      expect(message).toContain("ABC1D23");
      expect(message).toContain("R$ 325,95");
      expect(message).toContain("R$ 521,52");
      expect(message).toContain("R$ 5000,00");
      expect(message).toContain("Maria Vendedora");
      expect(message).toContain("ABC12345");
    });

    it("formats message without cota participacao when null", () => {
      const quotation: QuotationData = {
        id: "abc12345-6789",
        mensalidade: 200.0,
        adesaoDesconto: 320.0,
        cotaParticipacao: null,
        customer: {
          name: "Pedro",
          phone: "11999887766",
        },
        vehicle: {
          marca: "FIAT",
          modelo: "UNO",
          ano: "2018/2018",
          placa: "XYZ5678",
        },
        seller: null,
      };

      const message = formatCustomerMessage(quotation);

      expect(message).not.toContain("Cota de participacao");
      expect(message).toContain("um de nossos consultores");
    });

    it("uses generic seller text when no seller assigned", () => {
      const quotation: QuotationData = {
        id: "abc12345",
        mensalidade: 200.0,
        adesaoDesconto: 320.0,
        cotaParticipacao: null,
        customer: {
          name: "Cliente",
          phone: "11999887766",
        },
        vehicle: {
          marca: "FIAT",
          modelo: "UNO",
          ano: "2018/2018",
          placa: "XYZ5678",
        },
        seller: null,
      };

      const message = formatCustomerMessage(quotation);

      expect(message).toContain("um de nossos consultores entrara em contato");
      expect(message).not.toContain("undefined");
    });
  });

  describe("formatSellerMessage", () => {
    it("formats seller notification with all fields", () => {
      const quotation: QuotationData = {
        id: "abc12345-6789-0123-4567-890123456789",
        mensalidade: 325.95,
        adesaoDesconto: 521.52,
        cotaParticipacao: 5000,
        customer: {
          name: "Joao Silva",
          phone: "11999887766",
        },
        vehicle: {
          marca: "VOLKSWAGEN",
          modelo: "GOL",
          ano: "2020/2021",
          placa: "ABC1D23",
        },
      };

      const message = formatSellerMessage(quotation);

      expect(message).toContain("Nova cotacao recebida!");
      expect(message).toContain("Cliente: Joao Silva");
      expect(message).toContain("(11) 99988-7766");
      expect(message).toContain("VOLKSWAGEN GOL 2020/2021");
      expect(message).toContain("ABC1D23");
      expect(message).toContain("R$ 325,95");
      expect(message).toContain("R$ 521,52");
      expect(message).toContain("R$ 5000,00");
      expect(message).toContain("ABC12345");
    });

    it("excludes cota participacao when null", () => {
      const quotation: QuotationData = {
        id: "abc12345",
        mensalidade: 200.0,
        adesaoDesconto: 320.0,
        cotaParticipacao: null,
        customer: {
          name: "Cliente",
          phone: "11999887766",
        },
        vehicle: {
          marca: "FIAT",
          modelo: "UNO",
          ano: "2018/2018",
          placa: "XYZ5678",
        },
      };

      const message = formatSellerMessage(quotation);

      expect(message).not.toContain("Cota de participacao");
    });
  });

  describe("formatPhone", () => {
    it("formats 11-digit phone with area code", () => {
      expect(formatPhone("11999887766")).toBe("(11) 99988-7766");
    });

    it("formats 10-digit phone with area code", () => {
      expect(formatPhone("1133224455")).toBe("(11) 3322-4455");
    });

    it("handles phone with non-numeric characters", () => {
      expect(formatPhone("(11) 99988-7766")).toBe("(11) 99988-7766");
    });

    it("returns original for invalid lengths", () => {
      expect(formatPhone("123")).toBe("123");
    });
  });

  describe("normalizePhoneForWhatsApp", () => {
    it("adds country code to 11-digit phone", () => {
      expect(normalizePhoneForWhatsApp("11999887766")).toBe("5511999887766");
    });

    it("keeps phone with country code intact", () => {
      expect(normalizePhoneForWhatsApp("5511999887766")).toBe("5511999887766");
    });

    it("removes non-numeric characters before normalizing", () => {
      expect(normalizePhoneForWhatsApp("(11) 99988-7766")).toBe("5511999887766");
    });
  });

  describe("validateEvolutionApiConfig", () => {
    it("validates complete config", () => {
      const result = validateEvolutionApiConfig({
        url: "https://api.evolution.com",
        apiKey: "api-key-123",
        instance: "star-protecao",
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("returns errors for missing url", () => {
      const result = validateEvolutionApiConfig({
        apiKey: "api-key-123",
        instance: "star-protecao",
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("EVOLUTION_API_URL is required");
    });

    it("returns errors for missing apiKey", () => {
      const result = validateEvolutionApiConfig({
        url: "https://api.evolution.com",
        instance: "star-protecao",
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("EVOLUTION_API_KEY is required");
    });

    it("returns errors for missing instance", () => {
      const result = validateEvolutionApiConfig({
        url: "https://api.evolution.com",
        apiKey: "api-key-123",
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("EVOLUTION_INSTANCE is required");
    });

    it("returns all errors when all fields missing", () => {
      const result = validateEvolutionApiConfig({});

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(3);
    });
  });
});
