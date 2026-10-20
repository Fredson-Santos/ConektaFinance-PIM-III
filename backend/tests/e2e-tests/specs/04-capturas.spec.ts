import { expect, test } from '@playwright/test'

test.describe('Evidências visuais para o relatório', () => {
  test('captura telas do app autenticado com a conta demo', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: /acesso rápido/i }).click()
    await page.waitForURL('**/dashboard')
    await page.waitForTimeout(2500)

    await page.screenshot({ path: 'evidencias/01-login-autenticado-dashboard.png', fullPage: false })

    await page.goto('/transacoes')
    await page.waitForTimeout(1500)
    await page.screenshot({ path: 'evidencias/02-transacoes.png' })

    await page.goto('/categorias')
    await page.waitForTimeout(1500)
    await page.screenshot({ path: 'evidencias/03-categorias.png' })

    await page.goto('/relatorios')
    await page.waitForTimeout(1500)
    await page.screenshot({ path: 'evidencias/04-relatorios.png', fullPage: true })

    await page.goto('/configuracoes')
    await page.waitForTimeout(1000)
    await page.screenshot({ path: 'evidencias/05-configuracoes.png' })

    await page.getByRole('button', { name: /abrir assistente de ia/i }).click()
    await page.waitForTimeout(1000)
    await page.screenshot({ path: 'evidencias/06-assistente-ia.png' })
  })
})
