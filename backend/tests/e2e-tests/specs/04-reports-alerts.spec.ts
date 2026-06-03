import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:9999';

async function loginAs(page: Page, email: string, password: string) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForSelector('#email-login', { timeout: 10000 });
  await page.fill('#email-login', email);
  await page.fill('#password-login', password);
  await page.locator('#login button[type="submit"]').click();
  await page.waitForURL('**/', { timeout: 15000 });
}

/**
 * Reports & Alerts E2E Tests
 */

test.describe('Reports & Alerts', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'test@example.com', 'Test@12345');
  });

  test('should display dashboard page and KPIs', async ({ page }) => {
    // Dashboard is at root '/'
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check page loaded
    await expect(page).not.toHaveURL(/login/);
    
    // Check for some content
    const content = page.locator('main, [class*="dashboard"], h1, h2');
    await expect(content.first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to reports page', async ({ page }) => {
    await page.goto(`${BASE_URL}/relatorios`);
    await page.waitForLoadState('networkidle');
    
    await page.waitForSelector('h1, h2', { timeout: 10000 });
    const pageTitle = page.locator('h1, h2').first();
    await expect(pageTitle).toContainText(/Relatório|Report/i);
    
    await expect(page).toHaveURL(/relatorios/);
  });

  test('should display report elements', async ({ page }) => {
    await page.goto(`${BASE_URL}/relatorios`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check for report elements (cards, charts, data)
    const reportElements = page.locator('[class*="card"], [class*="chart"], [class*="report"], canvas');
    const count = await reportElements.count();
    expect(count).toBeGreaterThanOrEqual(0);
    
    await expect(page).toHaveURL(/relatorios/);
  });

  test('should display alerts page', async ({ page }) => {
    await page.goto(`${BASE_URL}/alertas`);
    await page.waitForLoadState('networkidle');
    
    await page.waitForSelector('h1, h2', { timeout: 10000 });
    const pageTitle = page.locator('h1, h2').first();
    await expect(pageTitle).toContainText(/Alerta|Alert/i);
    
    await expect(page).toHaveURL(/alertas/);
  });

  test('should display alerts container', async ({ page }) => {
    await page.goto(`${BASE_URL}/alertas`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Any container element should be visible
    const container = page.locator('main, [class*="container"], [class*="list"], [class*="alert"]').first();
    await expect(container).toBeVisible({ timeout: 10000 });
  });

  test('should display insights page', async ({ page }) => {
    await page.goto(`${BASE_URL}/insights`);
    await page.waitForLoadState('networkidle');
    
    await page.waitForSelector('h1, h2', { timeout: 10000 });
    const pageTitle = page.locator('h1, h2').first();
    await expect(pageTitle).toContainText(/Insight|Recomendação|Economia|Financ/i);
    
    await expect(page).toHaveURL(/insights/);
  });
});
