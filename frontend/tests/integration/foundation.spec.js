import { expect, test } from '@playwright/test';

test.use({ reducedMotion: 'reduce' });

test('old review bookmarks open the single homepage and preserve agent and treatment', async ({ page }) => {
  for (const preview of ['/preview/f03', '/preview/f03/', '/preview/f03/motion', '/preview/f03/connected']) {
    await page.goto(`${preview}?agent=branding&treatment=plain#f03-full-result`);
    await expect(page).toHaveURL(/\/\?agent=branding&treatment=plain#f03-full-result$/);
    await expect(page.locator('.connected-page')).toHaveAttribute('data-treatment', 'plain');
    await expect(page.locator('#f03-full-result').getByRole('article', { name: 'Branding example', exact: true })).toBeInViewport();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Marketing OS');
  }
});

test('direct homepage agent links select the agent in the scroll gallery', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/?agent=branding');
  await expect(page.locator('.connected-track')).toHaveAttribute('data-agent', 'branding');
  await expect(page.getByRole('group', { name: 'Choose a specialist' })
    .getByRole('button', { name: 'Branding', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page).toHaveURL(/\/\?agent=branding#f03-agents$/);
});

test('the homepage console entry authenticates and runs the real Flask workflow', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open console', exact: true }).click();
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
  await expect(page.getByRole('heading', { name: 'Marketing OS', exact: true })).toBeVisible();
});
