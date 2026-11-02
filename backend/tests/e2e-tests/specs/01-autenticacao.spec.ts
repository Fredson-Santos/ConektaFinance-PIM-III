import { expect, test } from '@playwright/test'

test.describe('Autenticação', () => {
  test('acesso demo leva ao dashboard autenticado', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: /acesso rápido/i }).click()
    await page.waitForURL('**/dashboard')
    await expect(page.getByText('Saldo em conta')).toBeVisible()
  })

  test('sem sessao o usuario e redirecionado ao login', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForURL('**/login')
    await expect(page.getByText('Acesse sua conta')).toBeVisible()
  })
})
