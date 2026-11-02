import { expect, test } from '@playwright/test'

async function entrarDemo(page) {
  await page.goto('/login')
  await page.getByRole('button', { name: /acesso rápido/i }).click()
  await page.waitForURL('**/dashboard')
}

test.describe('Jornada completa', () => {
  test('dashboard, categorias, relatorios e assistente de ia', async ({ page }) => {
    await entrarDemo(page)

    await page.goto('/categorias')
    await expect(page.getByText('Categorias & Orçamentos')).toBeVisible()

    await page.goto('/relatorios')
    await expect(page.getByText('Relatórios')).toBeVisible()

    await page.goto('/configuracoes')
    await expect(page.getByText('Dados pessoais')).toBeVisible()

    await page.getByRole('button', { name: /abrir assistente de ia/i }).click()
    await expect(page.getByText('Assistente de IA')).toBeVisible()
    await page.getByPlaceholder(/pergunte algo/i).fill('Resumo do mês')
    await page.getByRole('button', { name: 'Enviar' }).click()
    await expect(page.locator('.ai-msg.assistant').last()).toBeVisible({ timeout: 20000 })
  })
})
