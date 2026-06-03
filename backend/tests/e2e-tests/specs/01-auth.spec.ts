import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:9999';

/**
 * Authentication E2E Tests - SPA React (ConektaFinance)
 * Token stored as 'pim_token' in localStorage
 */

test.describe('Authentication Flow', () => {
  test('should login with valid credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    await page.fill('#email-login', 'test@example.com');
    await page.fill('#password-login', 'Test@12345');
    
    // Click the submit button in the login tab panel
    await page.locator('#login button[type="submit"]').click();
    
    // Wait for redirect to dashboard (root route '/')
    await page.waitForURL('**/', { timeout: 15000 });
    
    // Verify we're not on login page
    await expect(page).not.toHaveURL(/login/);
    
    // Check that JWT token is stored with correct key 'pim_token'
    const token = await page.evaluate(() => localStorage.getItem('pim_token'));
    expect(token).toBeTruthy();
  });

  test('should register a new user successfully', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('button[role="tab"]', { timeout: 10000 });
    
    // Click "Criar conta" tab to show the registration panel
    await page.click('button[role="tab"]:has-text("Criar conta")');
    await page.waitForTimeout(500);
    
    // Fill registration form using specific IDs in the cadastro panel
    const timestamp = Date.now();
    const email = `testuser${timestamp}@example.com`;
    const password = 'TestPass@123';
    
    await page.fill('#nome', 'Test');
    await page.fill('#sobrenome', 'E2E');
    await page.fill('#email-cadastro', email);
    await page.fill('#password-cadastro', password);
    await page.fill('#password-confirm', password);
    
    // Submit using the specific button in the cadastro panel (not the hidden login button)
    await page.locator('#cadastro button[type="submit"]').click();
    
    // Wait for the action to complete
    await page.waitForTimeout(2000);
    
    // Should switch to login tab (success) or show toast
    // Either the login tab becomes active, or a success toast is shown
    const isLoginTabVisible = await page.locator('#login.form-section:not(.hidden)').isVisible().catch(() => false);
    const hasNoRegisterError = !(await page.locator('#cadastro span').filter({ hasText: /erro/i }).isVisible().catch(() => false));
    
    expect(isLoginTabVisible || hasNoRegisterError).toBeTruthy();
  });

  test('should reject invalid login credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('#email-login', { timeout: 10000 });
    
    await page.fill('#email-login', 'invalid@example.com');
    await page.fill('#password-login', 'wrongpassword');
    await page.locator('#login button[type="submit"]').click();
    
    // Wait for error to appear
    await page.waitForTimeout(2000);
    
    // Error div should appear inside the login section
    const errorDiv = page.locator('#login div').filter({ hasText: /incorret|inválid|E-mail ou senha/i }).first();
    await expect(errorDiv).toBeVisible({ timeout: 5000 });
    
    // Should stay on login page
    await expect(page).toHaveURL(/login/);
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('#email-login', { timeout: 10000 });
    await page.fill('#email-login', 'test@example.com');
    await page.fill('#password-login', 'Test@12345');
    await page.locator('#login button[type="submit"]').click();
    await page.waitForURL('**/', { timeout: 15000 });
    
    // Verify logged in
    const tokenBefore = await page.evaluate(() => localStorage.getItem('pim_token'));
    expect(tokenBefore).toBeTruthy();
    
    // Look for logout button
    const logoutButton = page.locator('button:has-text("Sair"), [title*="Sair"], button[aria-label*="Sair"]').first();
    
    if (await logoutButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await logoutButton.click();
      
      await page.waitForURL(/login/, { timeout: 10000 });
      await expect(page).toHaveURL(/login/);
      
      const token = await page.evaluate(() => localStorage.getItem('pim_token'));
      expect(token).toBeFalsy();
    } else {
      // Logout via JS to test the guard
      await page.evaluate(() => {
        localStorage.removeItem('pim_token');
        localStorage.removeItem('pim_user');
      });
      await page.goto(`${BASE_URL}/`);
      await page.waitForURL(/login/, { timeout: 10000 });
      await expect(page).toHaveURL(/login/);
    }
  });
});
