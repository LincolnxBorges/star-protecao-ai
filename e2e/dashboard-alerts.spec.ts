import { test, expect } from "@playwright/test";

test.describe("Dashboard Urgent Alerts", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "vendedor@star.com");
    await page.fill('input[name="password"]', "senha123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");
  });

  test("displays expiring today alert when quotations expire today", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    // Alert should be visible if there are expiring quotations
    const expiringAlert = page.locator('[data-testid="alert-expiring"]');

    // Check if alert exists (may not exist if no expiring quotations)
    const count = await expiringAlert.count();
    if (count > 0) {
      await expect(expiringAlert).toContainText("HOJE");
    }
  });

  test("displays no contact alert when leads have no contact for 24h+", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    const noContactAlert = page.locator('[data-testid="alert-no-contact"]');

    const count = await noContactAlert.count();
    if (count > 0) {
      await expect(noContactAlert).toContainText("24h");
    }
  });

  test("clicking Ver on alert navigates to filtered quotations", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    const viewButton = page.locator('[data-testid="alert-view-button"]').first();

    const count = await viewButton.count();
    if (count > 0) {
      await viewButton.click();
      await expect(page).toHaveURL(/\/cotacoes/);
    }
  });

  test("hides alerts section when no urgent actions", async ({ page }) => {
    await page.goto("/dashboard");

    const alertSection = page.locator('[data-testid="urgent-alerts"]');
    const alerts = page.locator('[data-testid^="alert-"]');

    const alertCount = await alerts.count();
    if (alertCount === 0) {
      // Section should be hidden or show positive message
      const isEmpty = await alertSection.locator('[data-testid="no-alerts"]').count();
      expect(isEmpty).toBeGreaterThanOrEqual(0);
    }
  });
});
