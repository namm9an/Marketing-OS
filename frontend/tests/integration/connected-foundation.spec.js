import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const path = '/preview/f03/connected';
const names = ['Branding', 'PR & Policy', 'Social Community', 'Product Marketing', 'Field Events'];

test('scroll holds and reverses while direct choices keep the artwork and saved result in sync', async ({ page }) => {
  const requests = [], errors = [];
  page.on('request', request => { if (new URL(request.url()).pathname.startsWith('/api/')) requests.push(request.url()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(path);
  const track = page.locator('.connected-track');
  await expect(page.getByRole('heading', { name: 'Marketing OS', exact: true })).toBeVisible();
  const move = fraction => track.evaluate((section, progress) => window.scrollTo({
    top: window.scrollY + section.getBoundingClientRect().top + progress * (section.offsetHeight - section.firstElementChild.offsetHeight),
    behavior: 'instant',
  }), fraction);
  await move(.36);
  await expect.poll(async () => Number(await track.getAttribute('data-progress'))).toBeCloseTo(.36, 1);
  const card = page.locator('.connected-card').first();
  const transform = await card.evaluate(element => getComputedStyle(element).transform);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  expect(await card.evaluate(element => getComputedStyle(element).transform)).toBe(transform);
  await move(.13);
  await expect.poll(async () => Number(await track.getAttribute('data-progress'))).toBeCloseTo(.13, 1);
  expect(await card.evaluate(element => getComputedStyle(element).transform)).not.toBe(transform);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByRole('link', { name: 'Explore the agents', exact: true }).click();
  const picker = page.locator('.connected-picker');
  await expect(picker).toBeVisible();
  for (const name of names) {
    const button = picker.getByRole('button', { name, exact: true });
    await button.focus();
    await page.keyboard.press('Enter');
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.connected-result').getByRole('article', { name: `${name} example` })).toBeVisible();
    await expect(page.locator('.connected-result').getByRole('link', { name: 'Read full recommendation' })).toBeVisible();
  }
  const branding = picker.getByRole('button', { name: 'Branding', exact: true });
  await branding.click();
  await page.locator('.connected-result').getByRole('link', { name: 'Read full recommendation' }).click();
  await expect(page.locator('#f03-full-result').getByRole('article', { name: 'Branding example' })).toBeInViewport();
  await expect(branding).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('link', { name: 'Back to top', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Marketing OS', exact: true })).toBeInViewport();
  await expect(page).toHaveURL(/#f03-top$/);
  await move(.58);
  await expect.poll(async () => Number(await track.getAttribute('data-progress'))).toBeCloseTo(.58, 1);
  await expect(page.locator('.connected-surface')).toHaveCSS('opacity', '0');
  const selectedBeforePreferenceChange = await track.getAttribute('data-agent');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(track).toHaveClass(/connected-static/);
  await expect(page.locator('.connected-surface')).toHaveCSS('opacity', '1');
  await expect(track).toHaveAttribute('data-agent', selectedBeforePreferenceChange);
  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
});

test('genuine loading is local to the artwork and the page recovers to a readable static view', async ({ page }) => {
  let releaseArt;
  const artworkResponse = new Promise(resolve => { releaseArt = resolve; });
  await page.route('**/showcase/phase-3/instrument-dither.webp', async route => {
    await artworkResponse;
    await route.abort();
  });
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  const artStatus = page.locator('.connected-art-status');
  await expect(artStatus).toHaveText('Loading artwork…');
  await expect(page.getByRole('link', { name: 'Explore the agents', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open console', exact: true })).toBeEnabled();
  releaseArt();
  await expect(page.locator('.connected-surface')).toHaveAttribute('data-art-state', 'unavailable');
  await expect(artStatus.getByRole('status')).toHaveText('Artwork unavailable.');
  await artStatus.getByRole('button', { name: 'Retry artwork' }).click();
  await expect(page.locator('.connected-surface')).toHaveAttribute('data-art-state', 'ready');
  await expect(artStatus).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.connected-track')).toHaveClass(/connected-static/);
  const picker = page.locator('.connected-picker');
  await expect(picker.getByRole('button')).toHaveCount(5);
  await picker.getByRole('button', { name: 'Social Community', exact: true }).click();
  await expect(page.locator('#f03-full-result').getByRole('heading', { name: 'A community-content recommendation' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
});

test('console entry and browser back restore the connected preview', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(path);
  await page.getByRole('button', { name: 'Open console', exact: true }).click();
  await expect(page).toHaveURL(/\/console$/);
  await expect(page.getByRole('button', { name: 'Authenticate Operator' })).toBeVisible();
  await page.getByRole('button', { name: /Showcase/ }).click();
  await expect(page).toHaveURL(/\/preview\/f03\/connected$/);
  await expect(page.getByRole('heading', { name: 'Marketing OS', exact: true })).toBeVisible();
});

test('a failed preview module leaves usable reload and showcase routes', async ({ page }) => {
  const moduleUrl = /\/ConnectedFoundation(?:-[\w-]+)?\.jsx?(?:\?|$)/;
  await page.route(moduleUrl, route => route.abort());
  await page.goto(path);
  await expect(page.getByRole('heading', { name: 'The preview couldn’t open' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open the showcase' })).toHaveAttribute('href', '/');
  await page.unroute(moduleUrl);
  await page.getByRole('button', { name: 'Reload preview' }).click();
  await expect(page.getByRole('heading', { name: 'Marketing OS', exact: true })).toBeVisible();
});
