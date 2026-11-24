import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const names = ['Branding', 'PR & Policy', 'Social Community', 'Product Marketing', 'Field Events'];
const specialistPicker = page => page.getByRole('group', { name: 'Choose a specialist', exact: true });
const orbitShell = page => page.locator('.connected-orbit-shell');

async function wheelPositions(page, delta) {
  await page.evaluate(() => {
    const positions = [window.scrollY];
    window.showcaseWheelPositions = null;
    let settled = 0;
    let moved = false;
    function sample() {
      const y = window.scrollY;
      moved ||= y !== positions[0];
      settled = moved && y === positions.at(-1) ? settled + 1 : 0;
      positions.push(y);
      if (settled >= 10 || positions.length >= 150) window.showcaseWheelPositions = positions;
      else requestAnimationFrame(sample);
    }
    requestAnimationFrame(sample);
  });
  await page.mouse.wheel(0, delta);
  await page.waitForFunction(() => window.showcaseWheelPositions !== null);
  return page.evaluate(() => window.showcaseWheelPositions);
}

test('the type-led opening keeps all three landmarks reachable in normal page flow', async ({ page }) => {
  await page.goto('/');
  const navigation = page.getByRole('navigation', { name: 'Showcase' });
  await expect(navigation.getByRole('link')).toHaveText(['Agents', 'Results', 'How it’s built']);
  await expect(page.locator('.connected-hero').getByRole('link', { name: 'Open console', exact: true })).toBeInViewport();
  await expect(page.getByRole('heading', { name: 'Follow the recommendation back to the evidence' })).not.toBeInViewport();
  await expect(orbitShell(page)).not.toBeInViewport();

  await expect(page.getByRole('heading', { name: 'Marketing Helper', exact: true })).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'reduce' });

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

test('desktop Lenis glides down and reverses before settling, with a native reduced-motion fallback', async ({ page }, testInfo) => {
  await page.goto('/');
  const root = page.locator('html');
  await expect(root).toHaveClass(/\blenis\b/);
  await page.mouse.move(22, 560);
  const down = await wheelPositions(page, 540);
  const up = await wheelPositions(page, -330);
  await testInfo.attach('scroll-positions.json', {
    body: JSON.stringify({ down, up }, null, 2), contentType: 'application/json',
  });
  expect(down.at(-1)).toBeGreaterThan(down[0] + 450);
  expect(up.at(-1)).toBeLessThan(up[0] - 280);
  for (const positions of [down, up]) {
    expect(new Set(positions).size).toBeGreaterThan(3);
    expect(new Set(positions.slice(-8)).size).toBe(1);
  }
  await expect(root).not.toHaveClass(/\blenis-scrolling\b/);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(root).not.toHaveClass(/\blenis\b/);
  const nativeStart = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 240);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(nativeStart + 180);
});

test('the introduction precedes a sphere that turns with unpressed mouse movement', async ({ page }) => {
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
  const tile = shell.locator('.connected-sphere-tile').first();
  const transformBefore = await tile.evaluate(element => element.style.transform);
  await page.mouse.move(x - 105, y + 30);
  await page.mouse.move(x + 96, y - 52, { steps: 6 });
  await expect(shell).not.toHaveAttribute('data-yaw', yawBefore);
  await expect.poll(() => tile.evaluate(element => element.style.transform)).not.toBe(transformBefore);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore);

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
    return {
      id: button.dataset.tileId, agent: button.dataset.agent, stackOrder: Number(button.style.zIndex),
      x, y, hit: button.contains(document.elementFromPoint(x, y)),
    };
  }).find(button => button.hit));
  expect(target).toBeDefined();
  await page.mouse.click(target.x, target.y);
  await expect(shell).toHaveAttribute('data-selected', target.id);
  const selectedTile = shell.locator('.connected-sphere-tile.is-selected');
  await expect(selectedTile).toHaveCount(1);
  expect(await selectedTile.evaluate(button => Number(button.style.zIndex))).toBeGreaterThan(target.stackOrder);
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(new URL(page.url()).searchParams.get('agent')).toBe(target.agent);
  await expect(page).toHaveURL(/#dossier$/);
  await page.getByRole('button', { name: 'Close dossier' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(shell).toHaveAttribute('data-selected', '');
  await expect(page).toHaveURL(/#agents$/);
});

test('a gallery arrow key brings the next image forward for keyboard activation and focus return', async ({ page }) => {
  await page.goto('/#agents');
  const shell = orbitShell(page);
  const current = shell.locator('.connected-sphere-tile[tabindex="0"]');
  await expect(current).toHaveCount(1);
  const previousId = await current.getAttribute('data-tile-id');
  await current.focus();
  await page.keyboard.press('ArrowRight');
  await expect(current).not.toHaveAttribute('data-tile-id', previousId);
  await expect(current).toHaveAttribute('data-front', 'true');
  await expect(current).toBeFocused();
  await page.evaluate(() => window.scrollBy(0, 100));
  const originY = await page.evaluate(() => window.scrollY);
  const nextId = await current.getAttribute('data-tile-id');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(new URL(page.url()).searchParams.get('tile')).toBe(nextId);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(originY);
  await expect(current).toHaveAttribute('data-tile-id', nextId);
  await expect(current).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(specialistPicker(page).getByRole('button', { name: 'Branding', exact: true })).toBeFocused();
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
  await page.route('**/assets/agent-gallery/branding-1.webp*', async route => {
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
  const original = '/?agent=pr#dossier';
  await page.goto(original);
  const dossier = page.getByRole('dialog', { name: 'PR & Policy', exact: true });
  await expect(dossier).toBeVisible();
  const root = page.locator('html');
  await expect(root).toHaveClass(/\blenis-stopped\b/);
  await expect(dossier.getByText('How it works', { exact: true })).toBeVisible();
  const scrollBefore = await page.evaluate(() => window.scrollY);
  const panel = await dossier.boundingBox();
  expect(panel).not.toBeNull();
  await page.mouse.move(panel.x + panel.width * .6, panel.y + panel.height * .55);
  await page.mouse.wheel(0, 420);
  await expect.poll(() => dossier.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore);
  await page.getByRole('button', { name: 'Close dossier' }).click();
  await expect(dossier).toHaveCount(0);
  await expect(root).toHaveClass(/\blenis\b/);
  await expect(root).not.toHaveClass(/\blenis-stopped\b/);
  await page.getByRole('banner').getByRole('link', { name: 'Open console', exact: true }).click();
  await expect(page).toHaveURL(/\/console$/);
  await expect(page.getByRole('button', { name: 'Authenticate Operator' })).toBeVisible();
  await expect(root).not.toHaveClass(/\blenis\b/);
  await page.getByRole('button', { name: /Showcase/ }).click();
  await expect(page).toHaveURL(/#agents$/);
  await expect(root).toHaveClass(/\blenis\b/);
  await expect(specialistPicker(page).getByRole('button', { name: 'PR & Policy', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Marketing Helper', exact: true })).toBeVisible();
});

test.describe('touch fallback', () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });

  test('a touch tap opens the chosen specialist without enabling desktop Lenis', async ({ page }) => {
    await page.goto('/#agents');
    await expect(page.locator('html')).not.toHaveClass(/\blenis\b/);
    await expect(orbitShell(page)).toHaveCount(0);
    const choice = specialistPicker(page).getByRole('button', { name: 'Field Events', exact: true });
    await choice.tap();
    const dossier = page.getByRole('dialog', { name: 'Field Events', exact: true });
    await expect(dossier).toBeVisible();
    await dossier.getByRole('button', { name: 'Close dossier' }).tap();
    await expect(dossier).toHaveCount(0);
    await expect(choice).toBeInViewport();
  });
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
