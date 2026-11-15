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

export { login };
