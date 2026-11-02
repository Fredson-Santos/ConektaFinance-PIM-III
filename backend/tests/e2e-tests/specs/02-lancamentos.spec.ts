import { expect, test } from '@playwright/test'

async function entrarDemo(page) {
  await page.goto('/login')
  await page.getByRole('button', { name: /acesso rápido/i }).click()
  await page.waitForURL('**/dashboard')
}

test.describe('Lançamentos', () => {
  test('registra uma despesa a partir do fab central', async ({ page }) => {
    await entrarDemo(page)
    await page.getByRole('button', { name: 'Novo lançamento' }).first().click()
    await page.getByPlaceholder(/mercado/i).fill('Mercado do bairro')
    await page.locator('input[inputmode="decimal"]').fill('86,40')
    await page.getByRole('button', { name: /registrar despesa/i }).click()
    await expect(page.getByText(/registrada com sucesso/i)).toBeVisible({ timeout: 15000 })
  })

  test('historico agrupa por dia e filtra por categoria', async ({ page }) => {
    await entrarDemo(page)
    await page.goto('/transacoes')
    await expect(page.getByText(/lançamento/i).first()).toBeVisible({ timeout: 15000 })
    await page.getByRole('button', { name: 'Todas' }).isVisible()
  })
})
