import { expect } from '@playwright/test';

export async function login(page) {
  await page.goto('/console');
  await page.getByLabel('Operator Username', { exact: true }).fill('e2e-operator');
  await page.getByLabel('Access Password', { exact: true }).fill('e2e-local-test-password');
  await page.getByRole('button', { name: 'Authenticate Operator', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Run Agent', exact: true })).toBeVisible();
}

export async function runAgent(page, goal) {
  await page.getByLabel('Business Goal', { exact: true }).fill(goal);
  const response = page.waitForResponse((r) => r.url().endsWith('/api/run') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Run Agent', exact: true }).click();
  const result = await response;
  expect(result.status()).toBe(200);
  return result.json();
}
