import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const names = ['Branding', 'PR & Policy', 'Social Community', 'Product Marketing', 'Field Events'];
const specialistPicker = page => page.getByRole('group', { name: 'Choose a specialist', exact: true });
const orbitShell = page => page.locator('.connected-orbit-shell');

test('the type-led opening keeps the wordmark local and all three landmarks reachable', async ({ page }) => {
  await page.goto('/');
  const navigation = page.getByRole('navigation', { name: 'Showcase' });
  await expect(navigation.getByRole('link')).toHaveText(['Agents', 'Results', 'How it’s built']);
  await expect(page.locator('.connected-hero').getByRole('link', { name: 'Open console', exact: true })).toBeInViewport();
  await expect(page.getByRole('heading', { name: 'Follow the recommendation back to the evidence' })).not.toBeInViewport();
  await expect(orbitShell(page)).not.toBeInViewport();

  const wordmark = page.getByRole('heading', { name: 'Marketing Helper', exact: true });
  const letter = wordmark.locator('[data-letter]').nth(4);
  await letter.hover();
  await expect(letter).toHaveAttribute('data-guide', /^\d+ \/ \d+$/);
  expect(await wordmark.locator('[data-guide]').count()).toBeLessThan(4);
  await navigation.getByRole('link', { name: 'Agents', exact: true }).hover();
  await expect(wordmark.locator('[data-guide]')).toHaveCount(0);

  await letter.hover();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(wordmark.locator('[data-guide]')).toHaveCount(0);
  await letter.hover();
  await expect(wordmark.locator('[data-guide]')).toHaveCount(0);

  await navigation.getByRole('link', { name: 'Agents', exact: true }).click();
  await expect(specialistPicker(page)).toBeInViewport();
  await expect(page).toHaveURL(/#agents$/);
  await navigation.getByRole('link', { name: 'Results', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'See what each specialist recommends' })).toBeInViewport();
  await expect(page).toHaveURL(/#results$/);
  await navigation.getByRole('link', { name: 'How it’s built', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'How it’s built', exact: true })).toBeInViewport();
  await expect(page).toHaveURL(/#how-its-built$/);
});

test('the introduction precedes a native-scroll sphere with independent pointer rotation', async ({ page }) => {
  const errors = [];
  const apiRequests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (new URL(request.url()).pathname.startsWith('/api/')) apiRequests.push(request.url()); });
  await page.goto('/');
  const introduction = page.locator('#introduction');
  await introduction.getByRole('heading', { name: 'Follow the recommendation back to the evidence' }).scrollIntoViewIfNeeded();
  await expect(introduction.getByRole('heading')).toBeInViewport();
  await expect(orbitShell(page)).not.toBeInViewport();
  await page.getByRole('link', { name: 'Explore the agents', exact: true }).click();
  await expect(page).toHaveURL(/#agents$/);
  const shell = orbitShell(page);
  const viewport = shell.locator('.connected-orbit-viewport');
  await expect(viewport).toBeInViewport();
  const box = await viewport.boundingBox();
  expect(box).not.toBeNull();
  const x = box.x + box.width * .5;
  const y = box.y + box.height * .5;
  const yawBefore = await shell.getAttribute('data-yaw');
  const scrollBefore = await page.evaluate(() => window.scrollY);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 96, y - 52, { steps: 6 });
  await page.mouse.up();
  await expect(shell).not.toHaveAttribute('data-yaw', yawBefore);
  await expect(shell).toHaveAttribute('data-dragging', 'false');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const rotatedYaw = await shell.getAttribute('data-yaw');
  expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore);

  await page.mouse.wheel(0, 300);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(scrollBefore);
  const scrollAfter = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, -300);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(scrollAfter);
  await expect(shell).toHaveAttribute('data-yaw', rotatedYaw);
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await page.getByRole('heading', { name: 'See what each specialist recommends' }).scrollIntoViewIfNeeded();
  await expect(page.getByRole('heading', { name: 'See what each specialist recommends' })).toBeInViewport();
  expect(apiRequests).toEqual([]);
  expect(errors).toEqual([]);
});

test('clicking a foreground image selects its tile and opens exactly one agent dossier', async ({ page }) => {
  await page.goto('/#agents');
  const shell = orbitShell(page);
  const tiles = shell.locator('.connected-sphere-tile[data-front="true"]');
  await expect(tiles.first()).toBeVisible();
  const target = await tiles.evaluateAll(buttons => buttons.map(button => {
    const box = button.getBoundingClientRect();
    const x = box.x + box.width / 2, y = box.y + box.height / 2;
    return { id: button.dataset.tileId, agent: button.dataset.agent, x, y, hit: button.contains(document.elementFromPoint(x, y)) };
  }).find(button => button.hit));
  expect(target).toBeDefined();
  await page.mouse.click(target.x, target.y);
  await expect(shell).toHaveAttribute('data-selected', target.id);
  await expect(shell.locator('.connected-sphere-tile.is-selected')).toHaveCount(1);
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(new URL(page.url()).searchParams.get('agent')).toBe(target.agent);
  await expect(page).toHaveURL(/#dossier$/);
  await page.getByRole('button', { name: 'Close dossier' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(shell).toHaveAttribute('data-selected', '');
  await expect(page).toHaveURL(/#agents$/);
});

test('all five keyboard choices restore focus on close and isolate How it works by role', async ({ page }) => {
  await page.goto('/#agents');
  const picker = specialistPicker(page);
  await expect(picker.getByRole('button')).toHaveText(names);
  const choices = {
    Branding: 'A positioning recommendation',
    'PR & Policy': 'A communication recommendation',
    'Social Community': 'A community-content recommendation',
    'Product Marketing': 'A product-messaging recommendation',
    'Field Events': 'An event recommendation',
  };
  const outlines = [];
  for (const name of names) {
    const choice = picker.getByRole('button', { name, exact: true });
    await choice.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name, exact: true });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: choices[name], exact: true })).toBeVisible();
    const summary = dialog.getByText('How it works', { exact: true });
    const outline = dialog.locator('details').filter({ hasText: 'How it works' });
    await expect(outline).not.toHaveAttribute('open', '');
    await summary.click();
    await expect(outline).toHaveAttribute('open', '');
    outlines.push(await outline.innerText());
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(choice).toBeFocused();
    await expect(page).toHaveURL(/#agents$/);
  }
  expect(new Set(outlines).size).toBe(names.length);
});

test('slow artwork keeps navigation usable and recovers through the local retry', async ({ page }) => {
  let releaseArt;
  const artworkResponse = new Promise(resolve => { releaseArt = resolve; });
  let remainingInitialFailures = 1;
  await page.route('**/showcase/phase-3/orbit/branding-1.webp*', async route => {
    if (remainingInitialFailures === 0) return route.continue();
    remainingInitialFailures -= 1;
    await artworkResponse;
    await route.abort();
  });
  try {
    await page.goto('/#agents', { waitUntil: 'domcontentloaded' });
    const gallery = page.locator('#agents');
    await expect(gallery.getByText('Loading agent artwork…', { exact: true })).toBeVisible();
    await expect(specialistPicker(page).getByRole('button')).toHaveCount(5);
    await expect(page.getByRole('banner').getByRole('link', { name: 'Open console', exact: true })).toBeEnabled();
    releaseArt();
    await expect(gallery.getByText('Artwork unavailable.', { exact: true })).toBeVisible();
    await gallery.getByRole('button', { name: 'Retry artwork' }).click();
    await expect(gallery.getByText('Artwork unavailable.', { exact: true })).toHaveCount(0);
    await expect(gallery.getByText('Loading agent artwork…', { exact: true })).toHaveCount(0);
    const image = gallery.locator('img[src*="branding-1.webp"]').first();
    await expect.poll(() => image.evaluate(element => element.complete && element.naturalWidth > 0)).toBe(true);
  } finally {
    releaseArt();
  }
});

test('console entry and return preserve a direct agent link and its dossier', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const original = '/?agent=pr#dossier';
  await page.goto(original);
  const dossier = page.getByRole('dialog', { name: 'PR & Policy', exact: true });
  await expect(dossier).toBeVisible();
  await page.getByRole('button', { name: 'Close dossier' }).click();
  await expect(dossier).toHaveCount(0);
  await page.getByRole('banner').getByRole('link', { name: 'Open console', exact: true }).click();
  await expect(page).toHaveURL(/\/console$/);
  await expect(page.getByRole('button', { name: 'Authenticate Operator' })).toBeVisible();
  await page.getByRole('button', { name: /Showcase/ }).click();
  await expect(page).toHaveURL(/#agents$/);
  await expect(specialistPicker(page).getByRole('button', { name: 'PR & Policy', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Marketing Helper', exact: true })).toBeVisible();
});

test('a failed showcase module leaves usable reload and console routes', async ({ page }) => {
  const moduleUrl = /\/ConnectedFoundation(?:-[\w-]+)?\.jsx?(?:\?|$)/;
  await page.route(moduleUrl, route => route.abort());
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'The showcase couldn’t open' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open the console' })).toHaveAttribute('href', '/console');
  await page.unroute(moduleUrl);
  await page.getByRole('button', { name: 'Reload showcase' }).click();
  await expect(page.getByRole('heading', { name: 'Marketing Helper', exact: true })).toBeVisible();
});

test('a narrow reduced-motion dossier and the named landing page remain accessible', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const axe = () => new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect((await axe()).violations).toEqual([]);
  await specialistPicker(page).getByRole('button', { name: 'Social Community', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Social Community', exact: true });
  await expect(dialog.getByRole('heading', { name: 'A community-content recommendation', exact: true })).toBeVisible();
  expect((await axe()).violations).toEqual([]);
  await page.keyboard.press('Escape');
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
