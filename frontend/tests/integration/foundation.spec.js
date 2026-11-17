import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.use({ reducedMotion: 'reduce' });
const names = { branding: 'Branding', pr: 'PR & Policy', social: 'Social Community',
  product_marketing: 'Product Marketing', events: 'Field Events' };

test('the page foundation presents all reviewed responses without operational notes or API requests', async ({ page }) => {
  const errors = [], api = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (new URL(request.url()).pathname.startsWith('/api/')) api.push(request.url()); });
  const manifest = await (await page.request.get('/examples/f03-reviewed/manifest.json')).json();
  expect(manifest.status).toBe('ready');
  await page.goto('/preview/f03');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('One briefFive marketing specialists');
  for (const entry of manifest.examples) {
    const bundle = await (await page.request.get(`/examples/f03-reviewed/${entry.path}`)).json();
    await page.getByRole('group', { name: 'Choose a specialist' }).getByRole('button', { name: new RegExp(`^${names[entry.agent]}`) }).click();
    await expect(page.getByText(bundle.response.positioning.statement, { exact: true })).toBeVisible();
    await expect(page.locator('time')).toHaveCount(0);
    const text = await page.locator('main').innerText();
    expect(text).not.toMatch(/Captured \d|Execution:|provider quota|unverified|capture-http|diagnostic/i);
    expect(bundle.response.positioning.statement).not.toMatch(/immediate access|without waitlists|H100-bound|H100-only/i);
  }
  await expect(page.getByRole('heading', { name: 'How it’s built', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
  expect(api).toEqual([]);
});

test('the foundation has readable keyboard/mobile layouts and a scoped accessibility pass', async ({ page }, testInfo) => {
  await page.goto('/preview/f03');
  await expect(page.getByRole('heading', { name: 'A communication recommendation' })).toBeVisible();
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(result.violations).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath('foundation-desktop.png'), fullPage: true });
  await page.getByRole('button', { name: 'Subtle grain on' }).click();
  await page.screenshot({ path: testInfo.outputPath('foundation-desktop-plain.png'), fullPage: true });
  for (const width of [360, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.getByRole('heading', { name: 'PR & Policy', exact: true }).scrollIntoViewIfNeeded();
    await expect(page.getByRole('heading', { name: 'A communication recommendation' })).toBeVisible();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({ path: testInfo.outputPath('foundation-mobile.png'), fullPage: true });
  const social = page.getByRole('group', { name: 'Choose a specialist' }).getByRole('button', { name: /^Social Community/ });
  await social.focus();
  await page.keyboard.press('Enter');
  await expect(social).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('heading', { name: 'A community-content recommendation' })).toBeVisible();
});

test('the preview console entry authenticates and runs the real Flask workflow', async ({ page }) => {
  await page.goto('/preview/f03');
  await page.getByRole('button', { name: 'Open console', exact: true }).first().click();
  await expect(page).toHaveURL(/\/console$/);
  await page.getByPlaceholder('admin', { exact: true }).fill('e2e-operator');
  await page.locator('input[type=password]').fill('e2e-local-test-password');
  await page.getByRole('button', { name: 'Authenticate Operator' }).click();
  await page.getByLabel('Business Goal', { exact: true }).fill('Recommend a B200 launch position using the available evidence');
  const response = page.waitForResponse(r => r.url().endsWith('/api/run') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Run Agent', exact: true }).click();
  const result = await response;
  expect(result.status()).toBe(200);
  const body = await result.json();
  expect(body.metrics.source).toBe('mock');
  await expect(page.getByText(body.positioning.statement, { exact: true })).toBeVisible();
});

test('the isolated motion study holds direct scroll positions and reverses without API calls', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const api = [];
  page.on('request', r => { if (new URL(r.url()).pathname.startsWith('/api/')) api.push(r.url()); });
  await page.goto('/preview/f03/motion');
  const track = page.locator('.f03-study-track');
  const scrollTo = async progress => {
    await track.evaluate((element, fraction) => window.scrollTo({
      top: element.offsetTop + fraction * (element.offsetHeight - window.innerHeight), behavior: 'instant',
    }), progress);
  };
  await scrollTo(.12);
  await expect(track).toHaveAttribute('data-phase', '1');
  await scrollTo(.7);
  await expect(track).toHaveAttribute('data-phase', '3');
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const transform = await page.locator('.f03-study-paper').evaluate(el => getComputedStyle(el).transform);
  await page.waitForTimeout(120);
  expect(await page.locator('.f03-study-paper').evaluate(el => getComputedStyle(el).transform)).toBe(transform);
  await page.screenshot({ path: testInfo.outputPath('motion-study-open.png'), fullPage: false });
  await scrollTo(.02);
  await expect(track).toHaveAttribute('data-phase', '0');
  await page.screenshot({ path: testInfo.outputPath('motion-study-opening.png'), fullPage: false });
  expect(api).toEqual([]);
});

test('reduced motion and mobile use readable native-flow motion-study content', async ({ page }) => {
  await page.goto('/preview/f03/motion');
  await expect(page.locator('.f03-study-track')).toHaveAttribute('data-phase', 'static');
  for (const width of [1366, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.getByRole('heading', { name: 'A communication recommendation' }).scrollIntoViewIfNeeded();
    await expect(page.getByRole('heading', { name: 'A communication recommendation' })).toBeVisible();
  }
  await expect(page.locator('canvas')).toHaveCount(0);
});
