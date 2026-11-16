import { createHash } from 'node:crypto';
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { recordingContractFixture } from '../../src/test/recordingFixtures';

test.use({ reducedMotion: 'reduce' });

test('controlled recording contracts can be inspected and switched without any generation or memory request', async ({ page }, testInfo) => {
  // Browser contract fixtures only: this does not establish live provider availability.
  const agents = ['branding', 'pr', 'social', 'product_marketing', 'events'];
  const manifest = { schema_version: 1, status: 'ready', mode: 'live-recordings', fictional_client: 'Vanguard Cloud', examples: [] };
  const bodies = {};
  for (const agent of agents) {
    const { bundle } = recordingContractFixture(agent);
    bundle.response.positioning.statement = `Controlled ${agent} recording contract.`;
    const body = JSON.stringify(bundle);
    bodies[`/examples/${agent}.json`] = body;
    manifest.examples.push({ agent, path: `${agent}.json`, sha256: createHash('sha256').update(body).digest('hex') });
  }
  const apiRequests = [];
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => { if (new URL(request.url()).pathname.startsWith('/api/')) apiRequests.push(request.url()); });
  await page.route('**/examples/**', (route) => {
    const path = new URL(route.request().url()).pathname;
    return route.fulfill({ contentType: 'application/json', body: path.endsWith('manifest.json') ? JSON.stringify(manifest) : bodies[path] });
  });
  await page.goto('/');
  const opener = page.getByText('Inspect a recorded agent example', { exact: true });
  await opener.focus();
  await opener.press('Enter');
  await expect(page.getByText('Controlled branding recording contract.', { exact: true })).toBeVisible();
  await expect(page.getByText(/Competitor hardware-limit claims in these recordings are unverified/)).toBeVisible();
  await page.getByLabel('Recorded specialist', { exact: true }).selectOption('pr');
  await expect(page.getByText('Controlled pr recording contract.', { exact: true })).toBeVisible();
  await page.getByText(/Sources captured during this request/).click();
  await expect(page.getByText('B200 from Rs671/hr; H100 from Rs334/hr.', { exact: true })).toBeVisible();
  const accessibility = await new AxeBuilder({ page }).include('details:has(#recorded-specialist)')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(accessibility.violations).toEqual([]);
  for (const width of [360, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await expect(page.getByLabel('Recorded specialist', { exact: true })).toBeVisible();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('details').filter({ has: page.locator('#recorded-specialist') })
    .screenshot({ path: testInfo.outputPath('recorded-example-mobile-controlled.png') });
  expect(apiRequests).toEqual([]);
  expect(errors).toEqual([]);
});

test('an empty public manifest keeps illustrative examples honest and exposes no pretend recording', async ({ page }) => {
  await page.route('**/examples/manifest.json', (route) => route.fulfill({ json: {
    schema_version: 1, status: 'awaiting-live-capture', mode: 'live-recordings', examples: [],
  } }));
  await page.goto('/');
  await expect(page.getByText(/These hand-written examples/)).toBeVisible();
  await expect(page.getByText('Inspect a recorded agent example', { exact: true })).toHaveCount(0);
});

test('the five saved public recordings display their original responses with no generation on selection', async ({ page }) => {
  const response = await page.request.get('/examples/manifest.json');
  expect(response.status()).toBe(200);
  const manifest = await response.json();
  expect(manifest.status).toBe('ready');
  expect(manifest.examples).toHaveLength(5);
  const apiRequests = [];
  page.on('request', (request) => { if (new URL(request.url()).pathname.startsWith('/api/')) apiRequests.push(request.url()); });
  await page.goto('/');
  await page.getByText('Inspect a recorded agent example', { exact: true }).click();
  for (const entry of manifest.examples) {
    const bundle = await (await page.request.get(`/examples/${entry.path}`)).json();
    expect(bundle.recording.kind).toBe('live-recording');
    expect(bundle.response.metrics.source).toBe('live');
    await page.getByLabel('Recorded specialist', { exact: true }).selectOption(entry.agent);
    await expect(page.getByText(bundle.response.positioning.statement, { exact: true })).toBeVisible();
    await expect(page.getByText(/Competitor hardware-limit claims in these recordings are unverified/)).toBeVisible();
  }
  expect(apiRequests).toEqual([]);
});
