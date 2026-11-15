import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { login, runAgent } from './helpers';
import AxeBuilder from '@axe-core/playwright';

test.use({ reducedMotion: 'reduce' });

test('all five specialists, chat memory, triage, digest, saved reviews, export and logout work together', async ({ page }, testInfo) => {
  test.setTimeout(150_000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await login(page);
  const runs = [];
  for (const [agent, name] of [
    ['branding', 'Branding Agent'], ['pr', 'PR Agent'], ['social', 'Social Agent'],
    ['product_marketing', 'Product Marketing Agent'], ['events', 'Field Events Agent'],
  ]) {
    await page.getByRole('button', { name, exact: true }).click();
    const result = await runAgent(page, `Position B200 against Nebius using reliability evidence for ${agent}`);
    expect(result.decision.reasoning_source).toContain(agent);
    expect(result.metrics.source).toBe('mock');
    await expect(page.getByText(result.positioning.statement, { exact: true })).toBeVisible();
    await expect(page.getByText('Execution: Mock response', { exact: true })).toBeVisible();
    runs.push(result);
  }
  await page.getByRole('button', { name: 'Approve decision', exact: true }).click();
  await expect(page.getByText('Review status: approved', { exact: true })).toBeVisible();
  const resultAudit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  await testInfo.attach('result-accessibility', { body: JSON.stringify(resultAudit.violations, null, 2), contentType: 'application/json' });
  expect(resultAudit.violations).toEqual([]);
  const downloading = page.waitForEvent('download');
  await page.getByTitle('Download Markdown Report').click();
  const download = await downloading;
  expect(await readFile(await download.path(), 'utf8')).toContain(runs[4].positioning.statement);

  await page.getByRole('button', { name: 'Agent Chat', exact: true }).click();
  const send = async (message, endpoint = '/api/chat') => {
    await page.getByRole('textbox', { name: 'Message to agent or triage command' }).fill(message);
    const pending = page.waitForResponse((r) => r.url().endsWith(endpoint) && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Send message' }).click();
    const response = await pending;
    expect(response.status()).toBe(200);
    return response.json();
  };
  const first = await send('Always lead B200 messaging with reliability');
  expect(first.memory.admitted).toBe(true);
  await expect(page.getByText(first.reply, { exact: true })).toBeVisible();
  const second = await send('What B200 messaging should we use for reliability?');
  expect(second.thread_id).toBe(first.thread_id);
  expect(second.recall.memories.some((m) => m.content.includes('Always lead B200 messaging with reliability'))).toBe(true);
  const thread = await (await page.request.get(`/api/chat/thread/${first.thread_id}`)).json();
  expect(thread.turns).toHaveLength(4);
  await page.getByRole('button', { name: /built from/ }).last().click();
  await expect(page.getByText(second.recall.facts[0].content, { exact: true }).first()).toBeVisible();
  const triage = await send('/triage branding pr Compare B200 positioning with Nebius', '/api/triage');
  expect(triage.namespace).toBe('triage:branding+pr');
  expect(triage.views.map((v) => v.agent).sort()).toEqual(['branding', 'pr']);
  await expect(page.getByText(triage.answer, { exact: true })).toBeVisible();

  const pendingNetwork = page.waitForResponse((r) => r.url().endsWith('/api/digest/network'));
  await page.getByRole('button', { name: 'On-demand Digest', exact: true }).click();
  const network = await (await pendingNetwork).json();
  const pendingDigest = page.waitForResponse((r) => r.url().endsWith('/api/digest') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Generate Digest', exact: true }).click();
  const digestResponse = await pendingDigest;
  expect(digestResponse.status()).toBe(200);
  const digest = await digestResponse.json();
  expect(digest.agent_briefs).toHaveLength(5);
  expect(digest.metrics.calls).toHaveLength(6);
  for (const brief of digest.agent_briefs) await expect(page.getByText(brief.finding, { exact: true }).first()).toBeVisible();
  expect(digest.citations.length).toBeGreaterThan(0);
  const competitor = network.nodes.find((node) => node.group === 'competitor');
  const node = page.getByRole('button', { name: `Inspect ${competitor.id} source facts`, exact: true });
  await node.focus();
  await page.keyboard.press('Enter');
  await expect(node).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText(competitor.citations[0].content, { exact: true }).first()).toBeVisible();

  await page.reload();
  await page.getByRole('button', { name: new RegExp(`decision ${runs[4].decision.id}$`) }).click();
  await expect(page.getByText('Review status: approved', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: new RegExp(`decision ${runs[0].decision.id}$`) }).click();
  await expect(page.getByText(runs[0].positioning.statement, { exact: true })).toBeVisible();
  await expect(page.getByText('Review status: unreviewed', { exact: true })).toBeVisible();
  const history = (await (await page.request.get('/api/history')).json()).history;
  for (const id of [first.decision_id, triage.decision_id]) expect(history.some((r) => r.id === id && r.result_available)).toBe(true);
  await page.getByTitle('Sign out').click();
  await expect(page.getByRole('button', { name: 'Authenticate Operator' })).toBeVisible();
  expect((await page.request.get('/api/history')).status()).toBe(401);
  expect(errors).toEqual([]);
});

test('a rejected generation shows API guidance and never displays a successful result', async ({ page }) => {
  await login(page);
  await page.route('**/api/run', (route) => route.fulfill({ status: 429, json: {
    error: 'quota_exceeded', message: 'Request quota reached. Try again later.',
  } }));
  await page.getByRole('button', { name: 'Run Agent', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Request quota reached. Try again later.');
  await expect(page.getByRole('button', { name: 'Run Agent', exact: true })).toBeEnabled();
  await expect(page.getByRole('region', { name: 'Decision review' })).toHaveCount(0);
});
