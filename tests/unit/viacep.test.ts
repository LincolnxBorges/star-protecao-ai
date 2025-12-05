import { describe, it, expect, vi, beforeEach } from "vitest";
import { lookupCep } from "@/lib/customers";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("ViaCEP Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("lookupCep", () => {
    it("should return address data for valid CEP", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            logradouro: "Avenida Paulista",
            bairro: "Bela Vista",
            localidade: "Sao Paulo",
            uf: "SP",
          }),
      });

      const result = await lookupCep("01310100");

      expect(result).toEqual({
        street: "Avenida Paulista",
        neighborhood: "Bela Vista",
        city: "Sao Paulo",
        state: "SP",
      });
    });

    it("should handle CEP with hyphen", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            logradouro: "Rua Augusta",
            bairro: "Consolacao",
            localidade: "Sao Paulo",
            uf: "SP",
          }),
      });

      const result = await lookupCep("01304-000");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://viacep.com.br/ws/01304000/json/"
      );
      expect(result).not.toBeNull();
    });

    it("should return null for CEP not found", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            erro: true,
          }),
      });

      const result = await lookupCep("00000000");

      expect(result).toBeNull();
    });

    it("should return null on API error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await lookupCep("01310100");

      expect(result).toBeNull();
    });

    it("should return null on network error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await lookupCep("01310100");

      expect(result).toBeNull();
    });
  });
});
