import { createHash } from 'node:crypto';
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { exampleFixture } from '../../src/test/exampleFixtures';

test.use({ reducedMotion: 'reduce' });
const names = {
  branding: 'Branding', pr: 'PR & Policy', social: 'Social Community',
  product_marketing: 'Product Marketing', events: 'Field Events',
};
const ids = Object.keys(names);
const position = (page, number) => page.locator('#results').getByRole('group', { name: `${number} comparison position` });
const choice = (page, number) => position(page, number).getByRole('combobox');

test('all ten distinct pairs retain the correct briefs and recommendations, including after clearing both positions', async ({ page }) => {
  const api = [];
  page.on('request', req => { if (new URL(req.url()).pathname.startsWith('/api/')) api.push(req.url()); });
  const bundles = await Promise.all(ids.map(async id =>
    (await page.request.get(`/examples/${id.replaceAll('_', '-')}.json`)).json()));
  await page.goto('/#results');
  const first = choice(page, 'First'), second = choice(page, 'Second');
  await expect(first).toHaveValue('branding');
  await expect(second).toHaveValue('pr');
  await expect(first.getByRole('option', { name: 'PR & Policy' })).toBeDisabled();
  await expect(second.getByRole('option', { name: 'Branding' })).toBeDisabled();
  for (const [index, id] of ids.entries()) {
    if (index === ids.length - 1) break;
    if (await second.inputValue() === id) await second.selectOption('');
    await first.selectOption(id);
    for (let other = index + 1; other < ids.length; other++) {
      await second.selectOption(ids[other]);
      for (const [slot, bundle] of [['First', bundles[index]], ['Second', bundles[other]]]) {
        await expect(position(page, slot).getByText(bundle.brief, { exact: true })).toBeVisible();
        await expect(position(page, slot).getByText(bundle.result, { exact: true })).toBeVisible();
      }
    }
  }
  await position(page, 'First').getByRole('button', { name: 'Remove Product Marketing' }).click();
  await expect(first).toHaveValue('');
  await expect(second).toHaveValue('events');
  await position(page, 'Second').getByRole('button', { name: 'Remove Field Events' }).click();
  await expect(page.locator('#results').getByRole('article')).toHaveCount(0);
  await expect(first).toBeEnabled();
  await expect(second).toBeEnabled();
  await first.selectOption('social');
  await expect(position(page, 'First').getByText(bundles[2].result, { exact: true })).toBeVisible();
  expect(api).toEqual([]);
});

test('keyboard opens the comparison explanation and Back returns focus to the same pair', async ({ page }) => {
  await page.goto('/#results');
  await choice(page, 'First').selectOption('events');
  const opener = position(page, 'First').getByRole('button', { name: 'How it works for Field Events' });
  await opener.scrollIntoViewIfNeeded();
  await opener.focus();
  const y = await page.evaluate(() => window.scrollY);
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Field Events: How it works' })).toBeVisible();
  await page.goBack();
  await expect(opener).toBeFocused();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(y);
  await expect(choice(page, 'First')).toHaveValue('events');
  await expect(choice(page, 'Second')).toHaveValue('pr');
  await expect(page.getByRole('button', { name: 'Close explanation' })).toHaveCount(0);
  const accessibility = await new AxeBuilder({ page }).include('#results')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(accessibility.violations).toEqual([]);
});

test('a failed example can retry independently and a late response cannot overwrite a new choice', async ({ page }) => {
  let releaseEvents;
  const held = new Promise(resolve => { releaseEvents = resolve; });
  await page.route('**/examples/events.json', async route => { await held; await route.continue(); });
  let fail = true;
  await page.route('**/examples/pr.json', route => fail ? route.fulfill({ status: 503 }) : route.continue());
  try {
    await page.goto('/#results', { waitUntil: 'domcontentloaded' });
    const left = position(page, 'First'), right = position(page, 'Second');
    await expect(right.getByRole('alert')).toBeVisible();
    await expect(left.getByRole('heading', { name: 'A positioning recommendation' })).toBeVisible();
    fail = false;
    await right.getByRole('button', { name: 'Try again' }).click();
    await expect(right.getByRole('heading', { name: 'A communication recommendation' })).toBeVisible();
    await choice(page, 'First').selectOption('events');
    await expect(left.getByRole('status')).toContainText('Loading');
    await choice(page, 'First').selectOption('social');
    await expect(left.getByRole('heading', { name: 'A community-content recommendation' })).toBeVisible();
    const pending = page.waitForResponse('**/examples/events.json');
    releaseEvents();
    await (await pending).finished();
    await expect(left.getByRole('heading', { name: 'A community-content recommendation' })).toBeVisible();
    await expect(right.getByRole('heading', { name: 'A communication recommendation' })).toBeVisible();
  } finally { releaseEvents(); }
});

test('long public text wraps at a narrow width and an invalid record is marked unavailable', async ({ page }) => {
  const longResult = 'Confirmed service conditions. '.repeat(100) + 'Final qualification.';
  const bodies = new Map();
  const examples = ids.map(agent => {
    const fixture = exampleFixture(agent);
    if (agent === 'branding') fixture.result = longResult;
    if (agent === 'pr') delete fixture.sources;
    const path = agent.replaceAll('_', '-') + '.json';
    const body = JSON.stringify(fixture);
    bodies.set(path, body);
    return { agent, path, sha256: createHash('sha256').update(body).digest('hex') };
  });
  await page.route('**/examples/*.json', route => {
    const name = new URL(route.request().url()).pathname.split('/').pop();
    return name === 'manifest.json'
      ? route.fulfill({ json: { schema_version: 2, status: 'ready', mode: 'reviewed-demo', examples } })
      : route.fulfill({ contentType: 'application/json', body: bodies.get(name) });
  });
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/#results');
  await expect(position(page, 'First').getByText(longResult, { exact: true })).toBeVisible();
  await expect(position(page, 'Second').getByRole('alert')).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});

test('gallery and evidence disclosure leave the comparison pair intact', async ({ page }) => {
  await page.goto('/#results');
  await choice(page, 'First').selectOption('events');
  const events = position(page, 'First');
  const support = events.getByText('Sources and rationale', { exact: true });
  await support.click();
  const record = await (await page.request.get('/examples/events.json')).json();
  for (const source of record.sources) {
    await expect(events.getByRole('link', { name: source.title })).toHaveAttribute('href', source.url);
  }
  await page.locator('#results').getByRole('link', { name: 'Back to agents' }).click();
  await page.getByRole('group', { name: 'Choose a specialist' }).getByRole('button', { name: 'Social Community' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Close dossier' }).click();
  await page.getByRole('navigation', { name: 'Showcase' }).getByRole('link', { name: 'Results' }).click();
  await expect(choice(page, 'First')).toHaveValue('events');
  await expect(choice(page, 'Second')).toHaveValue('pr');
  await expect(events.getByRole('link', { name: record.sources[0].title })).toBeVisible();
});

test('the latest explanation owns Back and a replaced specialist cannot return via Forward', async ({ page }) => {
  await page.goto('/#results');
  const first = position(page, 'First').getByRole('button', { name: 'How it works for Branding' });
  const second = position(page, 'Second').getByRole('button', { name: 'How it works for PR & Policy' });
  await first.click();
  await second.click();
  await expect(page.getByRole('heading', { name: 'PR & Policy: How it works' })).toBeFocused();
  await expect(page.getByRole('button', { name: 'Close explanation' })).toHaveCount(1);
  await page.goBack();
  await expect(second).toBeFocused();
  await second.click();
  await choice(page, 'Second').selectOption('social');
  await expect(page.getByRole('button', { name: 'Close explanation' })).toHaveCount(0);
  await page.goForward();
  await expect(page.getByRole('heading', { name: 'PR & Policy: How it works' })).toHaveCount(0);
  await expect(choice(page, 'Second')).toHaveValue('social');
});
