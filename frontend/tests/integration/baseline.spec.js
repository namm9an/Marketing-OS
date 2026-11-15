import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { login } from './helpers';

test.use({ reducedMotion: 'reduce' });

test('mobile console preserves usable goal, chat and navigation without horizontal overflow', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  const goal = page.getByLabel('Business Goal', { exact: true });
  await expect.poll(async () => (await goal.boundingBox()).width).toBeGreaterThan(250);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await expect(page.locator('canvas')).toHaveCount(0);
  await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Close navigation', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Open navigation', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
  await page.getByRole('button', { name: 'Agent Chat', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Message to agent or triage command' })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.getByRole('textbox', { name: 'Message to agent or triage command' }).fill('/triage branding pr Compare B200 reliability');
  await expect(page.getByRole('button', { name: 'Send message' })).toBeInViewport();
  await page.screenshot({ path: testInfo.outputPath('console-mobile.png'), fullPage: true });
  for (const width of [360, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await expect(page.getByRole('button', { name: 'Send message' })).toBeInViewport();
  }
});

test('reduced motion uses native scrolling and leaves every dossier readable', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.locator('html')).not.toHaveClass(/lenis/);
  for (const name of ['Branding Specialist', 'PR & Policy Specialist', 'Social Community Specialist', 'Product Marketing Specialist', 'Field Events Specialist']) {
    const heading = page.locator('#section-dossier-cascade').getByRole('heading', { name, exact: true });
    await heading.scrollIntoViewIfNeeded();
    await expect(heading).toBeInViewport();
  }
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1366);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({ path: testInfo.outputPath('showcase-reduced-motion.png'), fullPage: true });
});

test('mobile showcase keeps all dossiers reachable with native document flow', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  for (const name of ['Branding Specialist', 'PR & Policy Specialist', 'Social Community Specialist', 'Product Marketing Specialist', 'Field Events Specialist']) {
    const heading = page.locator('#section-dossier-cascade').getByRole('heading', { name, exact: true });
    await heading.scrollIntoViewIfNeeded();
    await expect(heading).toBeInViewport();
  }
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({ path: testInfo.outputPath('showcase-mobile.png'), fullPage: true });
  for (const width of [360, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
});

test('desktop navigation still works and a changed motion preference switches to native scrolling', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveClass(/lenis/);
  await page.getByRole('link', { name: '02. Workflows', exact: true }).click();
  await expect(page).toHaveURL(/#section-workflows$/);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1366);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('html')).not.toHaveClass(/lenis/);
  const heading = page.locator('#section-dossier-cascade').getByRole('heading', { name: 'PR & Policy Specialist', exact: true });
  await heading.scrollIntoViewIfNeeded();
  await expect(heading).toBeInViewport();
});

test('login and working console expose labelled, readable controls to assistive technology', async ({ page }, testInfo) => {
  await page.goto('/console');
  const loginResults = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  await testInfo.attach('login-accessibility', { body: JSON.stringify(loginResults.violations, null, 2), contentType: 'application/json' });
  expect(loginResults.violations).toEqual([]);
  await login(page);
  const consoleResults = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  await testInfo.attach('console-accessibility', { body: JSON.stringify(consoleResults.violations, null, 2), contentType: 'application/json' });
  expect(consoleResults.violations).toEqual([]);
  await page.getByRole('button', { name: 'Agent Chat', exact: true }).click();
  const chatResults = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  await testInfo.attach('chat-accessibility', { body: JSON.stringify(chatResults.violations, null, 2), contentType: 'application/json' });
  expect(chatResults.violations).toEqual([]);
});
