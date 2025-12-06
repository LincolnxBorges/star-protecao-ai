import { test, expect } from "@playwright/test";

// ===========================================
// E2E Tests: Painel Administrativo
// ===========================================

test.describe("Admin - Autenticacao", () => {
  test("deve redirecionar para login se nao autenticado", async ({ page }) => {
    await page.goto("/cotacoes");

    // Deve redirecionar para login
    await expect(page).toHaveURL(/.*login/);
  });

  test("deve exibir formulario de login", async ({ page }) => {
    await page.goto("/login");

    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});

test.describe("Admin - Lista de Cotacoes", () => {
  // Testes que requerem autenticacao - pular por enquanto
  test.skip("deve exibir lista de cotacoes apos login", async () => {
    // Requer setup de autenticacao
  });

  test.skip("deve filtrar cotacoes por status", async () => {
    // Requer setup de autenticacao
  });

  test.skip("deve navegar para detalhes da cotacao", async () => {
    // Requer setup de autenticacao
  });
});

test.describe("Admin - Detalhes da Cotacao", () => {
  test.skip("deve exibir informacoes do cliente", async () => {
    // Requer setup de autenticacao
  });

  test.skip("deve exibir informacoes do veiculo", async () => {
    // Requer setup de autenticacao
  });

  test.skip("deve permitir atualizar status da cotacao", async () => {
    // Requer setup de autenticacao
  });
});

test.describe("Admin - Gestao de Precos", () => {
  test.skip("deve redirecionar vendedores para cotacoes", async () => {
    // Requer setup de autenticacao como SELLER
  });

  test.skip("deve exibir tabela de precos para admin", async () => {
    // Requer setup de autenticacao como ADMIN
  });

  test.skip("deve permitir criar nova regra de preco", async () => {
    // Requer setup de autenticacao como ADMIN
  });

  test.skip("deve permitir editar regra de preco", async () => {
    // Requer setup de autenticacao como ADMIN
  });
});

test.describe("Admin - Gestao de Blacklist", () => {
  test.skip("deve exibir lista de blacklist para admin", async () => {
    // Requer setup de autenticacao como ADMIN
  });

  test.skip("deve permitir adicionar marca a blacklist", async () => {
    // Requer setup de autenticacao como ADMIN
  });

  test.skip("deve permitir adicionar modelo a blacklist", async () => {
    // Requer setup de autenticacao como ADMIN
  });

  test.skip("deve permitir remover item da blacklist", async () => {
    // Requer setup de autenticacao como ADMIN
  });
});

// ===========================================
// Helpers para Autenticacao (futuro)
// ===========================================

// Para rodar testes com autenticacao, criar helper:
// async function loginAsAdmin(page) {
//   await page.goto('/login');
//   await page.locator('input[type="email"]').fill('admin@empresa.com');
//   await page.locator('input[type="password"]').fill('senha123');
//   await page.locator('button[type="submit"]').click();
//   await page.waitForURL('/cotacoes');
// }

// async function loginAsSeller(page) {
//   await page.goto('/login');
//   await page.locator('input[type="email"]').fill('vendedor@empresa.com');
//   await page.locator('input[type="password"]').fill('senha123');
//   await page.locator('button[type="submit"]').click();
//   await page.waitForURL('/cotacoes');
// }
