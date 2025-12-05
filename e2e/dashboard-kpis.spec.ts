import { test, expect } from "@playwright/test";

test.describe("Dashboard KPIs", () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto("/login");
    await page.fill('input[name="email"]', "vendedor@star.com");
    await page.fill('input[name="password"]', "senha123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");
  });

  test("displays 4 KPI cards", async ({ page }) => {
    await page.goto("/dashboard");

    // Check for 4 KPI cards
    const kpiCards = page.locator('[data-testid="kpi-card"]');
    await expect(kpiCards).toHaveCount(4);
  });

  test("displays Pendentes KPI with correct data", async ({ page }) => {
    await page.goto("/dashboard");

    const pendentesCard = page.locator('[data-testid="kpi-pending"]');
    await expect(pendentesCard).toBeVisible();
    await expect(pendentesCard.locator("h3")).toContainText("Pendentes");
  });

  test("displays Aceitas KPI with correct data", async ({ page }) => {
    await page.goto("/dashboard");

    const aceitasCard = page.locator('[data-testid="kpi-accepted"]');
    await expect(aceitasCard).toBeVisible();
    await expect(aceitasCard.locator("h3")).toContainText("Aceitas");
  });

  test("displays Potencial Mensal KPI formatted as currency", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    const potencialCard = page.locator('[data-testid="kpi-potential"]');
    await expect(potencialCard).toBeVisible();
    await expect(potencialCard.locator("h3")).toContainText("Potencial");
    // Check for R$ format
    await expect(potencialCard.locator('[data-testid="kpi-value"]')).toContainText("R$");
  });

  test("displays Conversão KPI as percentage", async ({ page }) => {
    await page.goto("/dashboard");

    const conversaoCard = page.locator('[data-testid="kpi-conversion"]');
    await expect(conversaoCard).toBeVisible();
    await expect(conversaoCard.locator("h3")).toContainText("Conversão");
    // Check for % format
    await expect(conversaoCard.locator('[data-testid="kpi-value"]')).toContainText("%");
  });

  test("shows change indicator on KPI cards", async ({ page }) => {
    await page.goto("/dashboard");

    // Each KPI card should have a change indicator
    const changeIndicators = page.locator('[data-testid="kpi-change"]');
    await expect(changeIndicators).toHaveCount(4);
  });
});
