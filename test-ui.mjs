import { chromium } from 'playwright-core'
import { existsSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { preview } from 'vite'

const OUT = process.env.SHOTS_DIR ?? join(tmpdir(), 'mesa-shots')
mkdirSync(OUT, { recursive: true })

const CHROME_PATH =
  process.env.CHROME_PATH ??
  (process.platform === 'darwin'
    ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    : undefined)

const launchOptions = CHROME_PATH && existsSync(CHROME_PATH)
  ? { executablePath: CHROME_PATH, headless: true }
  : { channel: 'chrome', headless: true }

const errors = []

let server
let browser

try {
  if (!process.env.BASE_URL) {
    server = await preview({ preview: { port: 4173, strictPort: false } })
  }
  const base = (process.env.BASE_URL ?? server.resolvedUrls.local[0]).replace(/\/+$/, '')

  browser = await chromium.launch(launchOptions)

  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`)
  })
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))

  await page.goto(`${base}/`, { waitUntil: 'networkidle' })
  await page.screenshot({ path: `${OUT}/01-home-desktop.png`, fullPage: true })
  console.log('home ok')

  await page.locator('.mode-card--teams').click()
  await page.waitForTimeout(400)

  const players = ['Leo', 'Ana', 'Juan', 'Sol', 'Mateo', 'Vero', 'Nico']
  for (const player of players) {
    const input = page.getByPlaceholder('Nombre del jugador')
    await input.fill(player)
    await input.press('Enter')
    await page.waitForTimeout(60)
  }
  await page.getByRole('button', { name: 'Agregar un equipo' }).click()
  await page.waitForTimeout(200)
  const sizes = await page.locator('.distribution__row').allInnerTexts()
  console.log('distribution:', sizes)
  await page.screenshot({ path: `${OUT}/02-teams-setup.png`, fullPage: true })

  await page.getByRole('button', { name: /Comenzar sorteo/ }).click()
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${OUT}/03-draft.png`, fullPage: true })

  for (let spin = 1; spin <= 4; spin += 1) {
    const spinButton = page.getByRole('button', { name: /Girar la ruleta/ })
    await spinButton.click()
    await page.waitForTimeout(5600)
    const finished = await page.locator('.result').isVisible().catch(() => false)
    console.log(`spin ${spin} finished=${finished}`)
    if (finished) break
  }

  await page.waitForTimeout(900)
  await page.screenshot({ path: `${OUT}/04-teams-result.png`, fullPage: true })
  const teamCards = await page.locator('.result-team').allInnerTexts()
  console.log('teams:', JSON.stringify(teamCards))

  await page.getByRole('button', { name: 'Sortear jugador' }).click()
  await page.waitForTimeout(3000)
  await page.screenshot({ path: `${OUT}/05-starter.png`, fullPage: true })
  console.log('starter:', await page.locator('.starter-panel__copy h3').innerText())

  await page.goto(`${base}/#/anotador`)
  await page.waitForTimeout(500)
  await page.getByLabel('Nombre del equipo 1').fill('Los Lobos')
  await page.getByLabel('Nombre del equipo 2').fill('Las Águilas')
  await page.getByLabel('Puntaje para ganar').fill('20')
  await page.screenshot({ path: `${OUT}/06-score-setup.png`, fullPage: true })
  await page.getByRole('button', { name: /Empezar partida/ }).click()
  await page.waitForTimeout(500)

  const wolves = page.locator('.score-card').filter({ hasText: 'Los Lobos' })
  await wolves.getByLabel('Puntos para Los Lobos').fill('10')
  await wolves.getByRole('button', { name: 'Sumar' }).click()
  await page.waitForTimeout(300)
  await page.getByRole('button', { name: 'Cerrar ronda' }).click()
  await page.waitForTimeout(300)
  await wolves.getByLabel('Puntos para Los Lobos').fill('10')
  await wolves.getByRole('button', { name: 'Sumar' }).click()
  await page.waitForTimeout(700)
  await page.screenshot({ path: `${OUT}/07-winner.png`, fullPage: true })
  console.log('winner:', await page.locator('#winner-title').innerText())
  await page.getByRole('button', { name: 'Seguir jugando' }).click()
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${OUT}/08-scoreboard.png`, fullPage: true })

  const total = await page.locator('.score-card').filter({ hasText: 'Los Lobos' }).locator('.score-card__total').innerText()
  const rounds = await page.locator('.score-card').filter({ hasText: 'Los Lobos' }).locator('.history-round__head').allInnerTexts()
  console.log('total:', total, 'rounds:', JSON.stringify(rounds))

  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  const persistedTotal = await page.locator('.score-card').filter({ hasText: 'Los Lobos' }).locator('.score-card__total').innerText()
  console.log('persisted total:', persistedTotal)
  await page.screenshot({ path: `${OUT}/09-score-persisted.png`, fullPage: true })

  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  })
  const mobilePage = await mobile.newPage()
  await mobilePage.goto(`${base}/`, { waitUntil: 'networkidle' })
  await mobilePage.screenshot({ path: `${OUT}/10-home-mobile.png`, fullPage: true })
  await mobilePage.locator('.mode-card--anotador, .mode-card--score').click()
  await mobilePage.waitForTimeout(500)
  await mobilePage.screenshot({ path: `${OUT}/11-score-mobile.png`, fullPage: true })

  await mobile.close()
  await context.close()

  console.log('screenshots:', OUT)
  console.log('errors:', errors.length ? errors : 'none')
} finally {
  await browser?.close()
  await server?.close()
}
