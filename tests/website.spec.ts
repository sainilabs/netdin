import { test, expect, type Page } from '@playwright/test'

async function fillBrief(page: Page) {
  await page.getByRole('button', { name: "Let's talk", exact: true }).click()
  await page.getByRole('textbox', { name: 'Your name' }).fill('Alex Taylor')
  await page.getByRole('textbox', { name: 'Email address' }).fill('alex@example.com')
  await page.getByRole('textbox', { name: 'Company' }).fill('Example Studio')
  await page.getByRole('combobox', { name: 'Where are you with budget?' }).selectOption("Let's discuss and scope it properly")
  await page.getByRole('combobox', { name: 'Ideal timeline' }).selectOption('1 - 3 months')
  await page.getByRole('textbox', { name: 'A little about your project' }).fill('We need a new website and a considered digital identity for our business.')
  await page.getByRole('checkbox', { name: /I agree/ }).check()
}

for (const width of [320, 390, 768, 900, 1440, 1920]) {
  test(`homepage renders without overflow at ${width}px`, async ({ page }, testInfo) => {
    test.setTimeout(60_000)
    await page.setViewportSize({ width, height: width < 600 ? 844 : 1000 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    // This test measures layout in pixels, so it has to wait for a settled page.
    // Under the default 'load' condition the hero still shifts ~18px afterwards, which
    // made the clearance assertion below fail against a layout no visitor ever sees.
    // Measured: clearance is -7px at 'load' and +11px once the network is idle, in both
    // the dev server and a production preview.
    await page.goto('/', { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Made by Netdin')
    await expect(page.locator('.hero-image')).toHaveAttribute('src', '/images/product-hero.png')
    await expect(page.locator('.hero-image')).toHaveAttribute('alt', /software dashboard.*concept/)
    await expect(page.locator('.project-artwork img')).toHaveCount(2)
    expect(await page.locator('.hero-image').evaluate((image) => (image as HTMLImageElement).currentSrc)).toContain(width <= 1100 ? 'product-hero-mobile.png' : 'product-hero.png')
    await expect(page.locator('.brand-square')).toHaveCount(0)
    await expect(page.locator('.header .wordmark')).toHaveText('netdin')
    await expect(page.locator('.footer .wordmark')).toHaveText('netdin')
    if (width <= 1100) {
      // Retried rather than measured once: the settled clearance is 11px against a
      // required 8px, so a single reading taken while the page is still settling can
      // fail on a loaded machine even though the layout is correct.
      await expect(async () => {
        const actions = await page.locator('.hero-actions').boundingBox()
        const image = await page.locator('.hero-image').boundingBox()
        expect(actions!.y + actions!.height + 8).toBeLessThanOrEqual(image!.y)
      }).toPass({ timeout: 10_000 })
    }
    for (const selector of ['.hero-content > p', '.intro p', '.section-top > p', '.process-step p', '.faq-item summary', '.contact-band-bottom p']) {
      for (const element of await page.locator(selector).all()) {
        expect(await element.evaluate((node) => parseFloat(getComputedStyle(node).fontSize)), selector).toBeGreaterThanOrEqual(16)
      }
    }
    for (const selector of ['.button', '.text-link', '.project-info p', '.footer-top > p', '.footer-bottom', '.footer-bottom button']) {
      for (const element of await page.locator(selector).all()) {
        expect(await element.evaluate((node) => parseFloat(getComputedStyle(node).fontSize)), selector).toBeGreaterThanOrEqual(14)
      }
    }
    if (width > 800) await expect(page.locator('.navigation a').first()).toHaveCSS('font-size', '16px')
    for (const element of await page.locator('.eyebrow, .section-kicker, .visual-label').all()) {
      expect(await element.evaluate((node) => parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(12)
    }
    const services = page.locator('.services-section')
    await expect(services.locator('.services-intro > p')).toHaveCSS('font-size', '16px')
    await expect(services.locator('.eyebrow')).toHaveCSS('font-size', '12px')
    for (const toggle of await services.locator('.service-toggle').all()) {
      if (await toggle.getAttribute('aria-expanded') !== 'true') await toggle.click()
      const panel = services.locator('.service-panel:visible')
      await expect(panel.locator('p')).toHaveCSS('font-size', '16px')
      await expect(panel.locator('ul')).toHaveCSS('font-size', '14px')
      await expect(panel.locator('.text-link')).toHaveCSS('font-size', '14px')
      expect(await panel.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    }
    await services.locator('.service-toggle').first().click()
    await services.screenshot({ path: testInfo.outputPath(`services-${width}.png`), animations: 'disabled' })
    for (const artwork of await page.locator('.project-artwork img').all()) {
      await artwork.scrollIntoViewIfNeeded()
      const distinctColours = await artwork.evaluate(async (element) => {
        const image = element as HTMLImageElement
        await image.decode()
        const canvas = document.createElement('canvas')
        canvas.width = 32
        canvas.height = 24
        const context = canvas.getContext('2d')!
        context.drawImage(image, 0, 0, 32, 24)
        const pixels = context.getImageData(0, 0, 32, 24).data
        const colours = new Set<string>()
        for (let offset = 0; offset < pixels.length; offset += 4) colours.add(`${pixels[offset]},${pixels[offset + 1]},${pixels[offset + 2]}`)
        return colours.size
      })
      expect(distinctColours).toBeGreaterThan(20)
    }
    await page.locator('.project-grid').screenshot({ path: testInfo.outputPath(`work-${width}.png`), animations: 'disabled' })
    await expect(page.locator('img[src="/images/forma.webp"], img[src="/images/studio.webp"], img[src="/images/hero.webp"]')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Explore Supply concept' })).toBeVisible()
    await expect(page.locator('.studio-copy > p').first()).toHaveCSS('font-size', '16px')
    await page.locator('.studio-workflow').scrollIntoViewIfNeeded()
    expect(await page.locator('.studio-workflow').evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
    await page.locator('.studio-section').screenshot({ path: testInfo.outputPath(`studio-${width}.png`), animations: 'disabled' })
    await expect.poll(() => page.locator('main img').evaluateAll((images) => images.every((image) => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    for (const preview of await page.locator('main .project-visual').all()) {
      const mockup = await preview.locator(':scope > div').boundingBox()
      const caption = await preview.locator('.visual-label').boundingBox()
      expect(mockup).not.toBeNull()
      expect(caption).not.toBeNull()
      expect(mockup!.y + mockup!.height + 8).toBeLessThanOrEqual(caption!.y)
    }
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.locator('.hero').screenshot({ path: testInfo.outputPath(`hero-${width}.png`), animations: 'disabled' })
    await page.locator('.header').screenshot({ path: testInfo.outputPath(`navigation-${width}.png`), animations: 'disabled' })
    await page.locator('.contact-band').screenshot({ path: testInfo.outputPath(`contact-${width}.png`), animations: 'disabled' })
    await page.locator('.footer').screenshot({ path: testInfo.outputPath(`footer-${width}.png`), animations: 'disabled' })
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.screenshot({ path: testInfo.outputPath(`netdin-${width}.png`), fullPage: true, animations: 'disabled' })
    expect(errors).toEqual([])
  })
}

test('mobile navigation and service enquiry selection work', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Open menu' }).click()
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible()
  await page.getByRole('link', { name: 'What we do' }).click()
  await expect(page.getByRole('button', { name: 'Open menu' })).toHaveAttribute('aria-expanded', 'false')
  await page.getByRole('button', { name: 'Custom software' }).click()
  await expect(page.locator('#service-panel-1')).toBeVisible()
  await page.getByRole('button', { name: "Let's talk custom software" }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.locator('.contact-aside .wordmark')).toHaveText('netdin')
  await expect(page.locator('.contact-aside .wordmark').locator('span')).toHaveCount(0)
  await expect(page.getByRole('checkbox', { name: 'Custom software', exact: true })).toBeChecked()
  await expect(page.getByRole('textbox', { name: 'Your name' })).toHaveCSS('font-size', '16px')
  await expect(page.locator('.service-option').first()).toHaveCSS('font-size', '14px')
  await expect(page.locator('.consent')).toHaveCSS('font-size', '14px')
  expect(await page.getByRole('dialog').evaluate((dialog) => dialog.scrollWidth <= dialog.clientWidth)).toBe(true)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('project details, focus restoration, FAQs and privacy work', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  for (const name of ['Supply', 'Orbit']) {
    const trigger = page.getByRole('button', { name: `Explore ${name} concept` })
    await trigger.click()
    await expect(page.getByRole('dialog')).toContainText('SELF-INITIATED / CONCEPT EXPLORATION')
    await expect(page.locator('.project-detail > p')).toHaveCSS('font-size', '16px')
    if (name === 'Supply') {
      await expect(page.getByRole('dialog')).toContainText('not a live shop or client project')
      await expect(page.getByRole('dialog').locator('.commerce-site')).toBeVisible()
    }
    expect(await page.getByRole('dialog').evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
    await page.keyboard.press('Escape')
    await expect(trigger).toBeFocused()
  }
  await page.getByText('How much does a project cost?', { exact: true }).click()
  await expect(page.getByText('Every project is scoped around', { exact: false })).toBeVisible()
  await expect(page.locator('.faq-item[open] > p')).toHaveCSS('font-size', '16px')
  await page.getByRole('button', { name: 'Privacy notice', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Privacy notice' })).toBeVisible()
  await expect(page.locator('.privacy-document p').first()).toHaveCSS('font-size', '16px')
  await page.getByRole('button', { name: 'Close dialog' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('brief is sent to Appwrite with consent and no public row permissions', async ({ page }) => {
  let payload: Record<string, unknown> | undefined
  await page.route('https://appwrite.test/v1/**', async (route) => {
    payload = route.request().postDataJSON()
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ $id: 'test-row', ...payload }) })
  })
  await page.goto('/')
  await fillBrief(page)
  await page.getByRole('checkbox', { name: 'Website development', exact: true }).check()
  await page.getByRole('button', { name: 'Send project brief' }).click()
  await expect(page.getByRole('status')).toContainText('BRIEF RECEIVED')
  expect(payload).toMatchObject({ permissions: [], data: { email: 'alex@example.com', services: ['Website development'], consent: true, source: 'netdin.com' } })
})

test('failed submissions keep the brief and allow a successful retry', async ({ page }) => {
  let attempts = 0
  await page.route('https://appwrite.test/v1/**', async (route) => {
    attempts += 1
    await route.fulfill({ status: attempts === 1 ? 400 : 201, contentType: 'application/json', body: attempts === 1 ? JSON.stringify({ message: 'Test failure', code: 400 }) : JSON.stringify({ $id: 'retry-row' }) })
  })
  await page.goto('/')
  await fillBrief(page)
  await page.getByRole('checkbox', { name: 'Automation', exact: true }).check()
  await page.getByRole('button', { name: 'Send project brief' }).click()
  await expect(page.getByRole('alert')).toContainText('could not be sent')
  await expect(page.getByRole('textbox', { name: 'Your name' })).toHaveValue('Alex Taylor')
  await page.getByRole('button', { name: 'Send project brief' }).click()
  await expect(page.getByRole('status')).toContainText('BRIEF RECEIVED')
  expect(attempts).toBe(2)
})

test('service selection and native required fields prevent invalid submissions', async ({ page }) => {
  let requests = 0
  await page.route('https://appwrite.test/v1/**', (route) => { requests += 1; return route.abort() })
  await page.goto('/')
  await page.getByRole('button', { name: "Let's talk", exact: true }).click()
  await page.getByRole('button', { name: 'Send project brief' }).click()
  await expect(page.getByRole('textbox', { name: 'Your name' })).toBeFocused()
  await page.keyboard.press('Escape')
  await fillBrief(page)
  await page.getByRole('button', { name: 'Send project brief' }).click()
  await expect(page.getByRole('alert')).toContainText('select at least one service')
  expect(requests).toBe(0)
})

test('unconfigured backend gives an honest email fallback instead of success', async ({ page }) => {
  await page.goto('http://127.0.0.1:5175')
  await fillBrief(page)
  await page.getByRole('checkbox', { name: 'Brand identity', exact: true }).check()
  await page.getByRole('button', { name: 'Send project brief' }).click()
  await expect(page.getByRole('alert')).toContainText('Online enquiries are not connected yet')
  await expect(page.getByRole('status')).toHaveCount(0)
  await expect(page.getByRole('link', { name: /Prefer email/ })).toHaveAttribute('href', /alex%40example.com/)
})