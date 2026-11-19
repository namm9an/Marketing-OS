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

const dossierFor = (page, agent) => page.getByRole('dialog', { name: agents[agent], exact: true });
const selectAgent = (page, agent) => page.getByRole('group', { name: 'Choose a specialist', exact: true })
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
  await expect(page.locator('#results').getByText('Controlled branding recording contract.', { exact: true })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await selectAgent(page, 'pr');
  const dossier = dossierFor(page, 'pr');
  await expect(dossier.getByText('Controlled pr recording contract.', { exact: true })).toBeVisible();
  await dossier.getByText('Sources and rationale', { exact: true }).click();
  await expect(dossier.getByText('B200 from Rs671/hr; H100 from Rs334/hr.', { exact: true })).toBeVisible();
  const accessibility = await new AxeBuilder({ page }).include('dialog[open]')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(accessibility.violations).toEqual([]);
  for (const width of [360, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await expect(dossier.getByRole('article', { name: 'PR & Policy example', exact: true })).toBeVisible();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await dossier.screenshot({ path: testInfo.outputPath('recorded-example-mobile-controlled.png') });
  expect(apiRequests).toEqual([]);
  expect(errors).toEqual([]);
});

test('an empty public manifest shows a readable failure without a pretend recommendation', async ({ page }) => {
  await page.route(`**${catalogPath}/manifest.json`, route => route.fulfill({ json: {
    schema_version: 1, status: 'awaiting-live-capture', mode: 'live-recordings', examples: [],
  } }));
  await page.goto('/');
  await selectAgent(page, 'pr');
  const dossier = dossierFor(page, 'pr');
  await expect(dossier.getByRole('alert')).toHaveText(/This example couldn’t load/);
  await expect(dossier.getByRole('heading', { name: 'A communication recommendation' })).toHaveCount(0);
});

test('retrying a temporarily unavailable saved example restores the existing recommendation', async ({ page }) => {
  let failExample = true;
  await page.route(`**${catalogPath}/pr.json`, route => failExample
    ? route.fulfill({ status: 503, body: 'Temporarily unavailable' })
    : route.continue());
  await page.goto('/');
  await selectAgent(page, 'pr');
  const dossier = dossierFor(page, 'pr');
  await expect(dossier.getByRole('alert')).toHaveText(/This example couldn’t load/);
  failExample = false;
  await dossier.getByRole('button', { name: 'Try again' }).click();
  await expect(dossier.getByRole('alert')).toHaveCount(0);
  await expect(dossier.getByRole('heading', { name: 'A communication recommendation' })).toBeVisible();
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
  for (const entry of manifest.examples) {
    const bundle = await (await page.request.get(`${catalogPath}/${entry.path}`)).json();
    expect(bundle.recording.kind).toBe('live-recording');
    expect(bundle.response.metrics.source).toBe('live');
    expect(bundle.response.positioning.statement).not.toMatch(/immediate access|without waitlists|H100-bound|H100-only/i);
    await selectAgent(page, entry.agent);
    const dossier = dossierFor(page, entry.agent);
    await expect(dossier.getByText(bundle.response.positioning.statement, { exact: true })).toBeVisible();
    await expect(dossier.locator('time')).toHaveCount(0);
    expect(await dossier.innerText()).not.toMatch(/Captured \d|Execution:|provider quota|capture-http|diagnostic/i);
    await dossier.getByRole('button', { name: 'Close dossier' }).click();
  }
  await expect(page.getByRole('heading', { name: 'How it’s built', exact: true })).toBeVisible();
  expect(apiRequests).toEqual([]);
});

test('a late saved response cannot overwrite the next opened dossier', async ({ page }) => {
  let releasePR;
  const pending = new Promise(resolve => { releasePR = resolve; });
  await page.route(`**${catalogPath}/pr.json`, async route => {
    await pending;
    await route.continue();
  });
  try {
    await page.goto('/');
    await selectAgent(page, 'pr');
    const pr = dossierFor(page, 'pr');
    await expect(pr.getByRole('status')).toHaveText('Loading example…');
    await pr.getByRole('button', { name: 'Close dossier' }).click();
    await selectAgent(page, 'events');
    const events = dossierFor(page, 'events');
    await expect(events.getByRole('heading', { name: 'An event recommendation' })).toBeVisible();
    const prResponse = page.waitForResponse(response => response.url().endsWith(`${catalogPath}/pr.json`));
    releasePR();
    await (await prResponse).finished();
    await expect(page.getByRole('dialog')).toHaveCount(1);
    await expect(events.getByRole('heading', { name: 'An event recommendation' })).toBeVisible();
    await expect(events.getByRole('heading', { name: 'A communication recommendation' })).toHaveCount(0);
    expect(new URL(page.url()).searchParams.get('agent')).toBe('events');
  } finally {
    releasePR();
  }
});
