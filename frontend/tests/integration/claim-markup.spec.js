import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const stageFor = page => page.getByRole('region', { name: 'PR & Policy: How it works' });
const resultOpener = page => page.locator('#results').getByRole('button', { name: 'How it works for PR & Policy' });
const recordPath = '/examples/pr.json';

for (const entry of ['comparison', 'dossier']) {
  test(`PR claim markup uses the saved example and returns to its ${entry} opener`, async ({ page }) => {
    const api = [];
    page.on('request', req => {
      if (new URL(req.url()).pathname.startsWith('/api/')) api.push(req.url());
    });
    const saved = await (await page.request.get(recordPath)).json();
    if (entry === 'dossier') {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/?agent=pr&tile=pr-2#agents');
    } else {
      await page.goto('/#results');
    }
    const opener = entry === 'dossier'
      ? page.getByRole('dialog', { name: 'PR & Policy' }).getByRole('button', { name: 'How it works' })
      : resultOpener(page);
    await opener.focus();
    await opener.press('Enter');
    const stage = stageFor(page);
    await expect(stage.getByRole('heading', { name: 'Proposed claim' })).toBeVisible();
    await expect(stage.locator('blockquote mark')).toHaveText('zero-waste');
    await expect(stage.getByRole('heading', { name: 'Evidence checkpoint' })).toBeVisible();
    await expect(stage.getByRole('link', { name: saved.sources[0].title })).toHaveAttribute('href', saved.sources[0].url);
    await expect(stage.getByRole('heading', { name: 'Recommendation' })).toBeVisible();
    await expect(stage).toContainText(saved.result);
    await expect(stage.getByText('Human review required', { exact: true })).toBeVisible();
    await expect(stage).toContainText(/no.{0,32}decision.{0,32}recorded|no.{0,32}recorded.{0,32}decision/i);
    const accessible = await new AxeBuilder({ page }).include('.connected-explanation')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(accessible.violations).toEqual([]);
    if (entry === 'dossier') {
      expect(await stage.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
      await page.keyboard.press('Escape');
      await expect(page).toHaveURL(/tile=pr-2/);
    } else {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goBack();
      await expect(page.locator('#results').getByRole('combobox', { name: 'Second specialist' })).toHaveValue('pr');
    }
    await expect(opener).toBeFocused();
    await expect(opener).toBeInViewport();
    await expect(stage).toHaveCount(0);
    expect(api).toEqual([]);
  });
}

test('a failed PR example keeps role guidance and recovers from inside the explanation', async ({ page }) => {
  let failing = true;
  await page.route('**/examples/pr.json', route => failing ? route.fulfill({ status: 503 }) : route.continue());
  await page.goto('/#results');
  await resultOpener(page).click();
  const stage = stageFor(page);
  await expect(stage.getByRole('alert')).toBeVisible();
  await expect(stage.getByText('Isolate the claim and its supporting evidence.')).toBeVisible();
  await expect(stage.getByRole('heading', { name: 'Recommendation' })).toHaveCount(0);
  failing = false;
  await stage.getByRole('button', { name: 'Try again' }).click();
  await expect(stage.getByRole('heading', { name: 'Evidence checkpoint' })).toBeVisible();
  await expect(stage.getByRole('alert')).toHaveCount(0);
});

test('closing or switching a pending PR explanation never replaces the visitor’s latest stage', async ({ page }) => {
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  await page.route('**/examples/pr.json', async route => { await pending; await route.continue(); });
  try {
    await page.goto('/#results', { waitUntil: 'domcontentloaded' });
    const opener = resultOpener(page), stage = stageFor(page);
    await opener.click();
    await expect(stage.getByRole('status')).toContainText(/Loading example/);
    await stage.getByRole('button', { name: 'Close explanation' }).click();
    await expect(opener).toBeFocused();
    await opener.click();
    await expect(stage.getByRole('status')).toBeVisible();
    await page.locator('#results').getByRole('button', { name: 'How it works for Branding' }).click();
    const branding = page.getByRole('region', { name: 'Branding: How it works' });
    await expect(branding).toBeVisible();
    const response = page.waitForResponse('**/examples/pr.json');
    release();
    await (await response).finished();
    await expect(page.locator('#results').getByText('Flagged for human review', { exact: true })).toBeVisible();
    await expect(branding).toBeVisible();
    await expect(stage).toHaveCount(0);
    await opener.click();
    await expect(stage.getByRole('heading', { name: 'Evidence checkpoint' })).toBeVisible();
  } finally { release(); }
});
