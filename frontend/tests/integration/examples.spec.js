import { createHash } from 'node:crypto';
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { recordingContractFixture } from '../../src/test/recordingFixtures';

test.use({ reducedMotion: 'reduce' });
const catalogPath = '/examples/f03-reviewed';
const agents = {
  branding: 'Branding', pr: 'PR & Policy', social: 'Social Community',
  product_marketing: 'Product Marketing', events: 'Field Events',
};

const resultOn = page => page.locator('#f03-full-result');
const selectAgent = (page, agent) => page.getByRole('group', { name: 'Choose a specialist' })
  .getByRole('button', { name: agents[agent], exact: true }).click();

test('controlled recording contracts can be inspected and switched without any generation or memory request', async ({ page }, testInfo) => {
  const manifest = { schema_version: 1, status: 'ready', mode: 'live-recordings', fictional_client: 'Vanguard Cloud', examples: [] };
  const bodies = {};
  for (const agent of Object.keys(agents)) {
    const { bundle } = recordingContractFixture(agent);
    bundle.response.positioning.statement = `Controlled ${agent} recording contract.`;
    const body = JSON.stringify(bundle);
    bodies[`${catalogPath}/${agent}.json`] = body;
    manifest.examples.push({ agent, path: `${agent}.json`, sha256: createHash('sha256').update(body).digest('hex') });
  }
  const apiRequests = [];
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (new URL(request.url()).pathname.startsWith('/api/')) apiRequests.push(request.url()); });
  await page.route(`**${catalogPath}/**`, route => {
    const path = new URL(route.request().url()).pathname;
    return route.fulfill({ contentType: 'application/json', body: path.endsWith('manifest.json') ? JSON.stringify(manifest) : bodies[path] });
  });
  await page.goto('/');
  const fullResult = resultOn(page);
  await expect(fullResult.getByText('Controlled branding recording contract.', { exact: true })).toBeVisible();
  await selectAgent(page, 'pr');
  await expect(fullResult.getByText('Controlled pr recording contract.', { exact: true })).toBeVisible();
  await fullResult.getByText('Sources and rationale', { exact: true }).click();
  await expect(fullResult.getByText('B200 from Rs671/hr; H100 from Rs334/hr.', { exact: true })).toBeVisible();
  const accessibility = await new AxeBuilder({ page }).include('#f03-full-result')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(accessibility.violations).toEqual([]);
  for (const width of [360, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await expect(fullResult.getByRole('article', { name: 'PR & Policy example', exact: true })).toBeVisible();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await fullResult.screenshot({ path: testInfo.outputPath('recorded-example-mobile-controlled.png') });
  expect(apiRequests).toEqual([]);
  expect(errors).toEqual([]);
});

test('an empty public manifest exposes a readable failure and no pretend recommendation', async ({ page }) => {
  await page.route(`**${catalogPath}/manifest.json`, route => route.fulfill({ json: {
    schema_version: 1, status: 'awaiting-live-capture', mode: 'live-recordings', examples: [],
  } }));
  await page.goto('/');
  const fullResult = resultOn(page);
  await expect(fullResult.getByRole('alert')).toHaveText(/This example couldn’t load/);
  await expect(fullResult.getByRole('button', { name: 'Try again' })).toBeEnabled();
  await expect(fullResult.locator('.f03-result')).toHaveCount(0);
});

test('the five reviewed public recordings display their original responses with no generation on selection', async ({ page }) => {
  const response = await page.request.get(`${catalogPath}/manifest.json`);
  expect(response.status()).toBe(200);
  const manifest = await response.json();
  expect(manifest.status).toBe('ready');
  expect(manifest.examples).toHaveLength(5);
  const apiRequests = [];
  page.on('request', request => { if (new URL(request.url()).pathname.startsWith('/api/')) apiRequests.push(request.url()); });
  await page.goto('/');
  const fullResult = resultOn(page);
  for (const entry of manifest.examples) {
    const bundle = await (await page.request.get(`${catalogPath}/${entry.path}`)).json();
    expect(bundle.recording.kind).toBe('live-recording');
    expect(bundle.response.metrics.source).toBe('live');
    expect(bundle.response.positioning.statement).not.toMatch(/immediate access|without waitlists|H100-bound|H100-only/i);
    await selectAgent(page, entry.agent);
    await expect(fullResult.getByText(bundle.response.positioning.statement, { exact: true })).toBeVisible();
    await expect(fullResult.locator('time')).toHaveCount(0);
    expect(await fullResult.innerText()).not.toMatch(/Captured \d|Execution:|provider quota|capture-http|diagnostic/i);
  }
  await expect(page.getByRole('heading', { name: 'How it’s built', exact: true })).toBeVisible();
  expect(apiRequests).toEqual([]);
});
