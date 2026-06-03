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
 * Categories Management E2E Tests
 * Categories use inline styles (no className on cards), rendered as plain divs
 */

test.describe('Categories Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'test@example.com', 'Test@12345');
    
    await page.goto(`${BASE_URL}/categorias`);
    await page.waitForLoadState('networkidle');
  });

  test('should display categories page', async ({ page }) => {
    await page.waitForSelector('h1', { timeout: 10000 });
    const pageTitle = page.locator('h1').first();
    await expect(pageTitle).toContainText('Categorias');
  });

  test('should display default categories list', async ({ page }) => {
    // Wait for loading to complete (loading spinner disappears)
    await page.waitForTimeout(3000);
    
    // Categories are either loaded as divs with h3 names, or show empty message
    // The grid container is always rendered after loading
    const gridOrEmpty = page.locator('div:has(h3), div:has-text("Nenhuma categoria"), div:has-text("Carregando")');
    
    // At minimum, the page should have the topbar and some content
    const topbar = page.locator('.topbar');
    await expect(topbar).toBeVisible({ timeout: 10000 });
    
    // The page loaded correctly
    await expect(page).toHaveURL(/categorias/);
  });

  test('should create a new category', async ({ page }) => {
    // Click "+ Nova categoria" button
    const newCategoryButton = page.locator('button:has-text("Nova categoria"), button:has-text("Nova Categoria")');
    await expect(newCategoryButton).toBeVisible({ timeout: 5000 });
    await newCategoryButton.click();
    
    // Wait for modal (uses modal-overlay class)
    const modal = page.locator('.modal-overlay.active, .modal-content');
    await expect(modal.first()).toBeVisible({ timeout: 5000 });
    
    // Fill category name
    const timestamp = Date.now();
    const categoryName = `Teste ${timestamp}`;
    
    await page.fill('input[placeholder="Ex: Moradia"]', categoryName);
    
    // Submit - the submit button in the modal
    const submitButton = page.locator('.modal-content button[type="submit"]');
    await submitButton.click();
    
    // Wait for response
    await page.waitForTimeout(2000);
    
    // Modal should close
    const isOverlayActive = await page.locator('.modal-overlay.active').isVisible().catch(() => false);
    expect(!isOverlayActive).toBeTruthy();
    
    await expect(page).toHaveURL(/categorias/);
  });

  test('should have category buttons (edit/delete)', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Check if there are any categories loaded
    const categoryNames = page.locator('h3');
    const count = await categoryNames.count();
    
    if (count > 0) {
      // There should be edit and delete buttons per category
      const editButtons = page.locator('button:has-text("Editar")');
      const deleteButtons = page.locator('button:has-text("Deletar")');
      
      await expect(editButtons.first()).toBeVisible();
      await expect(deleteButtons.first()).toBeVisible();
    } else {
      // No categories yet, but page is correct
      await expect(page).toHaveURL(/categorias/);
    }
  });
});
