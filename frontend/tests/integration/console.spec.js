import { expect, test } from '@playwright/test';

async function login(page) {
  await page.goto('/console');
  await page.getByPlaceholder('admin', { exact: true }).fill('e2e-operator');
  await page.locator('input[type=password]').fill('e2e-local-test-password');
  await page.getByRole('button', { name: 'Authenticate Operator' }).click();
  await expect(page.getByRole('button', { name: 'Run Agent', exact: true })).toBeVisible();
}

test('history restores the original result through Vite and Flask after a reload', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await login(page);
  const response = await page.request.post('/api/run', { data: { goal: 'Position B200 against Nebius', agent_type: 'branding' } });
  expect(response.status()).toBe(200);
  const run = await response.json();
  await page.reload();
  await page.getByRole('button', { name: new RegExp(run.decision.selected_option) }).first().click();
  await expect(page.getByText(run.positioning.statement, { exact: true })).toBeVisible();
  await expect(page.getByText(run.knowledge_units[0].content, { exact: true })).toBeVisible();
  const saved = await (await page.request.get(`/api/decisions/${run.decision.id}`)).json();
  expect(saved.decision.result).toEqual(run);
  const download = page.waitForEvent('download');
  await page.getByTitle('Download Markdown Report').click();
  expect((await download).suggestedFilename()).toContain(run.decision.id);
  expect(errors).toEqual([]);
});

test('operator approval persists after reload and does not transfer to the next decision', async ({ page }) => {
  await login(page);
  const run = async (goal) => {
    await page.getByPlaceholder('Describe your business goal to trigger positioning development...').fill(goal);
    const response = page.waitForResponse((r) => r.url().endsWith('/api/run') && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Run Agent', exact: true }).click();
    const result = await response;
    expect(result.status()).toBe(200);
    return result.json();
  };
  const first = await run('Position B200 while avoiding a price war');
  await expect(page.getByText('Review status: pending', { exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: 'Review reason (optional)' }).fill('Reviewed the sources and risks');
  await page.getByRole('button', { name: 'Approve decision', exact: true }).click();
  await expect(page.getByText('Review status: approved', { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: new RegExp(`decision ${first.decision.id}$`) }).click();
  await expect(page.getByText('Review status: approved', { exact: true })).toBeVisible();
  const second = await run('Position B200 against Nebius using reliability');
  await expect(page.getByText('Review status: unreviewed', { exact: true })).toBeVisible();
  const savedFirst = (await (await page.request.get(`/api/decisions/${first.decision.id}`)).json()).decision;
  const savedSecond = (await (await page.request.get(`/api/decisions/${second.decision.id}`)).json()).decision;
  expect(savedFirst.reviewed_by).toBe('e2e-operator');
  expect(savedFirst.reviews).toHaveLength(1);
  expect(savedFirst.escalated).toBeTruthy();
  expect(savedSecond.review_status).toBe('unreviewed');
  expect(savedSecond.reviews).toEqual([]);
});

export { login };

test('switching agents during a delayed chat never reuses the old response or thread', async ({ page }) => {
  await login(page);
  await page.getByRole('button', { name: 'Agent Chat', exact: true }).click();
  let release;
  let ready;
  const held = new Promise((resolve) => { release = resolve; });
  const oldReady = new Promise((resolve) => { ready = resolve; });
  const submitted = [];
  await page.route('**/api/chat', async (route) => {
    const body = route.request().postDataJSON();
    submitted.push(body);
    const response = await route.fetch();
    if (body.agent === 'branding') {
      ready();
      await held;
    }
    await route.fulfill({ response });
  });
  const send = async (text) => {
    await page.getByRole('textbox', { name: 'Message to agent or triage command' }).fill(text);
    await page.getByRole('button', { name: 'Send message' }).click();
  };
  await send('Always lead branding with reliability');
  await oldReady;
  await page.getByRole('button', { name: 'PR', exact: true }).click();
  const firstResponse = page.waitForResponse((r) => r.url().endsWith('/api/chat') && r.request().postDataJSON().agent === 'pr');
  await send('What should our PR response be about B200?');
  const first = await (await firstResponse).json();
  await expect(page.getByText(first.reply, { exact: true })).toBeVisible();
  release();
  const nextResponse = page.waitForResponse((r) => r.url().endsWith('/api/chat') && r.request().postDataJSON().message === 'Continue this PR conversation');
  await send('Continue this PR conversation');
  expect((await nextResponse).status()).toBe(200);
  expect(submitted[1]).toMatchObject({ agent: 'pr', thread_id: null });
  expect(submitted[2]).toMatchObject({ agent: 'pr', thread_id: first.thread_id });
  await expect(page.getByText('Always lead branding with reliability', { exact: true })).toHaveCount(0);
});
