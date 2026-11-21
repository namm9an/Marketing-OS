import { createHash } from 'node:crypto';
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { exampleFixture } from '../../src/test/exampleFixtures';

test.use({ reducedMotion: 'reduce' });
const catalogPath = '/examples';
const agents = {
  branding: 'Branding', pr: 'PR & Policy', social: 'Social Community',
  product_marketing: 'Product Marketing', events: 'Field Events',
};

const dossierFor = (page, agent) => page.getByRole('dialog', { name: agents[agent], exact: true });
const selectAgent = (page, agent) => page.getByRole('group', { name: 'Choose a specialist', exact: true })
  .getByRole('button', { name: agents[agent], exact: true }).click();

test('controlled demo views can be inspected and switched without any generation or memory request', async ({ page }, testInfo) => {
  const manifest = { schema_version: 2, status: 'ready', mode: 'reviewed-demo', examples: [] };
  const bodies = {};
  for (const agent of Object.keys(agents)) {
    const example = exampleFixture(agent);
    const body = JSON.stringify(example), path = `${agent.replaceAll('_', '-')}.json`;
    bodies[`${catalogPath}/${path}`] = body;
    manifest.examples.push({ agent, path, sha256: createHash('sha256').update(body).digest('hex') });
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
  await expect(page.locator('#results').getByText('Controlled branding recommendation.', { exact: true })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await selectAgent(page, 'pr');
  const dossier = dossierFor(page, 'pr');
  await expect(dossier.getByText('Controlled pr recommendation.', { exact: true })).toBeVisible();
  await dossier.getByText('Sources and rationale', { exact: true }).click();
  await expect(dossier.getByText('Environmental claims should be specific and qualified.', { exact: true })).toBeVisible();
  const accessibility = await new AxeBuilder({ page }).include('dialog[open]')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(accessibility.violations).toEqual([]);
  for (const width of [360, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await expect(dossier.getByRole('article', { name: 'PR & Policy example', exact: true })).toBeVisible();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await dossier.screenshot({ path: testInfo.outputPath('demo-example-mobile-controlled.png') });
  expect(apiRequests).toEqual([]);
  expect(errors).toEqual([]);
});

test('an empty public manifest shows a readable failure without a pretend recommendation', async ({ page }) => {
  await page.route(`**${catalogPath}/manifest.json`, route => route.fulfill({ json: {
    schema_version: 2, status: 'unavailable', mode: 'reviewed-demo', examples: [],
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

test('the five concise public demo views show honest labels and titled primary sources without API writes', async ({ page }) => {
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
    expect(bundle.kind).toBe('illustrative-demo');
    expect(Object.keys(bundle)).toEqual(['schema_version', 'kind', 'agent', 'brief', 'result', 'rationale', 'considerations', 'review_required', 'sources']);
    expect(bundle.sources.length).toBeGreaterThan(0);
    await selectAgent(page, entry.agent);
    const dossier = dossierFor(page, entry.agent);
    await expect(dossier.getByText(bundle.result, { exact: true })).toBeVisible();
    await expect(dossier.getByText(/Illustrative demo/)).toBeVisible();
    await dossier.getByText('Sources and rationale', { exact: true }).click();
    for (const source of bundle.sources) await expect(dossier.getByRole('link', { name: source.title })).toHaveAttribute('href', source.url);
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

test('retired capture URLs expose no raw public data', async ({ page, baseURL }) => {
  for (const path of ['/examples/f03-reviewed/manifest.json', '/examples/f03-reviewed/branding.json', '/examples/product_marketing.json']) {
    const response = await page.request.get(path);
    expect(response.headers()['content-type'] || '').not.toMatch(/application\/json/i);
    expect(await response.text()).not.toMatch(/"recording"|"request"|"response"|"retrievals"|Vanguard|E2E Networks|B200/);
    if (new URL(baseURL).port === '5120') expect(response.status()).toBe(404);
  }
});
