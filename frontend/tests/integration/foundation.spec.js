import { expect, test } from '@playwright/test';

test.use({ reducedMotion: 'reduce' });

test('retired previews and unknown addresses show a readable page with a route home', async ({ page }, testInfo) => {
  for (const path of ['/preview/f03', '/preview/f03/motion', '/absent-page']) {
    const response = await page.goto(path);
    if (testInfo.config.configFile?.endsWith('playwright.built.config.js')) {
      expect(response.status()).toBe(404);
    }
    await expect(page.getByRole('heading', { name: /page not found/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Marketing Helper', exact: true })).toHaveCount(0);
    await page.getByRole('link', { name: 'Visit the homepage', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Marketing Helper', exact: true })).toBeVisible();
  }
});

test('direct agent links open the matching dossier and Back returns to the gallery', async ({ page }) => {
  await page.goto('/?agent=branding#dossier');
  const branding = page.getByRole('dialog', { name: 'Branding', exact: true });
  await expect(branding.getByRole('heading', { name: 'A positioning recommendation', exact: true })).toBeVisible();
  await branding.getByRole('button', { name: 'Close dossier' }).click();
  await expect(page).toHaveURL(/#agents$/);
  const picker = page.getByRole('group', { name: 'Choose a specialist', exact: true });
  const pr = picker.getByRole('button', { name: 'PR & Policy', exact: true });
  await pr.click();
  await expect(page.getByRole('dialog', { name: 'PR & Policy', exact: true })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page).toHaveURL(/#agents$/);
  await expect(pr).toBeFocused();
});

test('the homepage console entry authenticates and runs the real Flask workflow', async ({ page }) => {
  await page.goto('/');
  await page.locator('.connected-hero').getByRole('link', { name: 'Open console', exact: true }).click();
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

test('a direct console visit can return to the homepage', async ({ page }) => {
  await page.goto('/console');
  await page.getByRole('button', { name: /Showcase/ }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: 'Marketing Helper', exact: true })).toBeVisible();
});
