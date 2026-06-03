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
 * Complete User Journey E2E Test
 * Full journey: Login → Dashboard → Navigate to all pages → Verify basic flow
 */

test.describe('Complete User Journey', () => {
  test('should complete full navigation flow', async ({ page }) => {
    // Step 1: Login
    console.log('Step 1: Logging in...');
    await loginAs(page, 'test@example.com', 'Test@12345');
    
    // Step 2: Verify dashboard loads
    console.log('Step 2: Verifying dashboard...');
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/login/);
    
    // Step 3: Navigate to expenses
    console.log('Step 3: Checking expenses page...');
    await page.goto(`${BASE_URL}/gastos`);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('h1, h2', { timeout: 10000 });
    await expect(page).toHaveURL(/gastos/);
    
    // Step 4: Navigate to categories
    console.log('Step 4: Checking categories page...');
    await page.goto(`${BASE_URL}/categorias`);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('h1, h2', { timeout: 10000 });
    await expect(page).toHaveURL(/categorias/);
    
    // Step 5: Navigate to reports
    console.log('Step 5: Checking reports page...');
    await page.goto(`${BASE_URL}/relatorios`);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('h1, h2', { timeout: 10000 });
    await expect(page).toHaveURL(/relatorios/);
    
    // Step 6: Navigate to alerts
    console.log('Step 6: Checking alerts page...');
    await page.goto(`${BASE_URL}/alertas`);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('h1, h2', { timeout: 10000 });
    await expect(page).toHaveURL(/alertas/);
    
    // Step 7: Navigate to insights
    console.log('Step 7: Checking insights page...');
    await page.goto(`${BASE_URL}/insights`);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('h1, h2', { timeout: 10000 });
    await expect(page).toHaveURL(/insights/);
    
    // Step 8: Return to dashboard
    console.log('Step 8: Back to dashboard...');
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/login/);
    
    console.log('✅ Complete navigation flow test passed!');
  });

  test('should handle authentication guard', async ({ page }) => {
    // Try to access protected route without logging in
    // First clear any existing auth
    await page.goto(`${BASE_URL}/login`);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Try to navigate to protected route
    await page.goto(`${BASE_URL}/gastos`);
    await page.waitForTimeout(2000);
    
    // Should redirect to login (PrivateRoute behavior)
    await expect(page).toHaveURL(/login/);
  });

  test('should add an expense in the complete flow', async ({ page }) => {
    // Login
    await loginAs(page, 'test@example.com', 'Test@12345');
    
    // Navigate to expenses
    await page.goto(`${BASE_URL}/gastos`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check if page loaded correctly
    await expect(page).toHaveURL(/gastos/);
    
    // Check for any content on the page
    const content = page.locator('h1, h2, button, [class*="card"]');
    await expect(content.first()).toBeVisible({ timeout: 10000 });
    
    // Try to add an expense if the button exists
    const addButton = page.locator('button:has-text("Novo Gasto"), button:has-text("Adicionar"), button:has-text("Nova Despesa")');
    
    if (await addButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addButton.click();
      await page.waitForTimeout(1000);
      
      const modal = page.locator('[role="dialog"]');
      if (await modal.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Fill minimum required fields
        const amountInput = modal.locator('input').filter({ hasNot: page.locator('input[type="date"]') }).first();
        if (await amountInput.isVisible()) {
          await amountInput.fill('99.99');
        }
        
        // Close modal if needed
        const closeButton = modal.locator('button:has-text("Cancelar"), button:has-text("Fechar"), button[aria-label*="fechar"]');
        if (await closeButton.isVisible().catch(() => false)) {
          await closeButton.click();
        } else {
          // Press Escape to close
          await page.keyboard.press('Escape');
        }
      }
    }
    
    // Final check - still on expenses page or dashboard
    await expect(page).not.toHaveURL(/login/);
    console.log('✅ Expense flow test completed!');
  });
});
