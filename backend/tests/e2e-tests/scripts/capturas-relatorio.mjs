// Gera as capturas de tela usadas no relatório ABNT (docs/01-relatorio-abnt/figuras).
//
// Pré-requisitos: backend em http://127.0.0.1:5041 e frontend (Vite) em http://localhost:5173,
// de preferência contra um banco recém-criado, para o seed da conta demo cobrir o mês atual.
// Uso (na pasta backend/tests/e2e-tests):  node scripts/capturas-relatorio.mjs
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const APP = process.env.APP_URL ?? 'http://localhost:5173'
const API = process.env.API_URL ?? 'http://127.0.0.1:5041'
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../docs/01-relatorio-abnt/figuras')
mkdirSync(OUT, { recursive: true })

const problemas = []
const pausa = (page, ms = 1200) => page.waitForTimeout(ms)

// Espera as requisições terminarem (o Vite em modo dev leva alguns segundos na primeira carga).
async function estabilizar(page, ms = 800) {
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(ms)
}

async function salvar(page, nome, opcoes = {}) {
  await estabilizar(page)
  await page.screenshot({ path: `${OUT}/${nome}.png`, ...opcoes })
  const largura = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  if (largura > 1) problemas.push(`${nome}: rolagem horizontal de ${largura}px`)
  console.log(`✓ ${nome}.png`)
}

async function entrarDemo(page) {
  await page.goto(`${APP}/login`)
  await pausa(page, 800)
  await page.getByRole('button', { name: /demonstração/i }).click()
  await page.waitForURL('**/dashboard')
  await pausa(page, 2500)
}

async function perguntarAoAssistente(page, pergunta) {
  await page.getByRole('button', { name: /abrir assistente de ia/i }).click()
  await pausa(page, 800)
  // Começa de uma conversa limpa: o histórico fica no servidor e sobrevive entre execuções.
  await page.getByRole('button', { name: /limpar histórico/i }).click()
  await pausa(page, 1000)
  await page.getByRole('textbox', { name: /mensagem para o assistente/i }).fill(pergunta)
  await page.keyboard.press('Enter')
  await page.getByLabel('Digitando').waitFor({ state: 'detached', timeout: 30000 }).catch(() => {})
  await pausa(page, 1500)
}

const browser = await chromium.launch()

// ---------- Desktop (capítulo 5: solução Web) ----------
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5, locale: 'pt-BR', timezoneId: 'America/Sao_Paulo' })
  const page = await context.newPage()
  page.on('response', (r) => { if (r.status() >= 400) problemas.push(`HTTP ${r.status()} ${new URL(r.url()).pathname}`) })
  page.on('console', (m) => { if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) problemas.push(`console (desktop): ${m.text().slice(0, 160)}`) })

  await page.goto(`${APP}/login`)
  await pausa(page, 1500)
  await salvar(page, '05-web-login')

  await entrarDemo(page)
  await salvar(page, '05-web-dashboard')

  for (const [rota, nome, fullPage] of [
    ['/transacoes', '05-web-gastos', false],
    ['/categorias', '05-web-categorias', false],
    ['/relatorios', '05-web-relatorios', true],
    ['/configuracoes', '05-web-configuracoes', false],
    ['/admin', '05-web-admin', false],
  ]) {
    await page.goto(`${APP}${rota}`)
    await pausa(page, 2000)
    await salvar(page, nome, { fullPage })
  }

  await page.goto(`${APP}/dashboard`)
  await pausa(page, 2000)
  await page.getByRole('button', { name: /novo lançamento/i }).first().click()
  await pausa(page, 1000)
  await salvar(page, '05-web-novo-lancamento')
  await page.keyboard.press('Escape')
  await pausa(page, 600)

  await page.keyboard.press('Control+k')
  await pausa(page, 800)
  await salvar(page, '05-web-command-palette')
  await page.keyboard.press('Escape')
  await pausa(page, 600)

  await perguntarAoAssistente(page, 'Me dá um resumo do mês')
  await salvar(page, '05-web-assistente-ia')

  // Tema claro (acessibilidade e contraste)
  await page.evaluate(() => { localStorage.setItem('conekta_theme', 'light') })
  await page.goto(`${APP}/dashboard`)
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'))
  await pausa(page, 2000)
  await salvar(page, '05-web-dashboard-tema-claro')

  await page.goto(`${API}/swagger/index.html`)
  await page.waitForSelector('.opblock', { timeout: 20000 })
  await pausa(page, 1000)
  await salvar(page, '05-swagger')
  await context.close()
}

// As telas do PWA (capítulo 6) foram capturadas em um celular real: figuras/06-PWA-*.png.

await browser.close()

if (problemas.length) {
  console.log('\nProblemas encontrados:')
  for (const p of problemas) console.log(`- ${p}`)
} else {
  console.log('\nNenhum erro de console nem rolagem horizontal.')
}
