import { test, expect } from "@playwright/test";

// ===========================================
// E2E Tests: Fluxo de Cotacao Publica
// ===========================================

test.describe("Cotacao - Fluxo Publico", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/cotacao");
  });

  test("deve exibir formulario de consulta de veiculo", async ({ page }) => {
    // Verificar elementos do formulario
    await expect(page.locator("text=Consulta de Veiculo")).toBeVisible();
    await expect(page.locator('input[name="placa"]')).toBeVisible();
    await expect(page.locator("text=Categoria do Veiculo")).toBeVisible();
    await expect(page.locator("text=Tipo de Uso")).toBeVisible();
    await expect(page.locator('button:has-text("Consultar")')).toBeVisible();
  });

  test("deve validar placa invalida", async ({ page }) => {
    // Preencher placa invalida
    await page.locator('input[name="placa"]').fill("ABC");
    await page.locator('button:has-text("Consultar")').click();

    // Verificar mensagem de erro
    await expect(page.locator("text=Placa invalida")).toBeVisible();
  });

  test("deve normalizar placa para uppercase", async ({ page }) => {
    const placaInput = page.locator('input[name="placa"]');
    await placaInput.fill("abc1234");

    // Verificar que foi convertido para uppercase
    await expect(placaInput).toHaveValue("ABC1234");
  });

  test("deve mostrar loading durante consulta", async ({ page }) => {
    // Preencher formulario
    await page.locator('input[name="placa"]').fill("ABC1234");

    // Interceptar requisicao para simular delay
    await page.route("**/api/vehicles/lookup", async (route) => {
      await new Promise((r) => setTimeout(r, 500));
      await route.continue();
    });

    // Submeter
    await page.locator('button:has-text("Consultar")').click();

    // Verificar loading state
    await expect(page.locator("text=Consultando")).toBeVisible();
  });

  // Este teste requer mock das APIs externas
  test.skip("deve exibir resultado da consulta com sucesso", async ({
    page,
  }) => {
    // Mock da resposta da API
    await page.route("**/api/vehicles/lookup", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            placa: "ABC1234",
            marca: "FIAT",
            modelo: "UNO",
            ano: "2020",
            valorFipe: 35000,
            codigoFipe: "001234-5",
            combustivel: "FLEX",
            cor: "BRANCO",
            categoria: "NORMAL",
            tipoUso: "PARTICULAR",
            pricing: {
              mensalidade: 168.29,
              adesao: 336.58,
              adesaoDesconto: 269.26,
              cotaParticipacao: null,
            },
          },
        }),
      });
    });

    // Preencher e submeter
    await page.locator('input[name="placa"]').fill("ABC1234");
    await page.locator('button:has-text("Consultar")').click();

    // Verificar resultado
    await expect(page.locator("text=FIAT UNO")).toBeVisible();
    await expect(page.locator("text=R$ 168,29")).toBeVisible();
  });

  // Este teste requer mock das APIs externas
  test.skip("deve exibir mensagem de recusa para veiculo blacklistado", async ({
    page,
  }) => {
    // Mock da resposta da API
    await page.route("**/api/vehicles/lookup", async (route) => {
      await route.fulfill({
        status: 422,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: {
            code: "BLACKLISTED",
            message: "Nao trabalhamos com esta marca",
          },
          saveAsLead: true,
        }),
      });
    });

    // Preencher e submeter
    await page.locator('input[name="placa"]').fill("BMW1234");
    await page.locator('button:has-text("Consultar")').click();

    // Verificar mensagem de recusa
    await expect(page.locator("text=Nao trabalhamos")).toBeVisible();
  });
});

test.describe("Cotacao - Formulario do Cliente", () => {
  test.skip("deve exibir formulario apos consulta bem-sucedida", async () => {
    // Este teste requer setup completo com mock das APIs
    // Pular por enquanto
  });

  test.skip("deve validar CPF", async () => {
    // Este teste requer setup completo com mock das APIs
    // Pular por enquanto
  });

  test.skip("deve buscar endereco automaticamente pelo CEP", async () => {
    // Este teste requer setup completo com mock das APIs
    // Pular por enquanto
  });
});
