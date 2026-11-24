import { existsSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const headingOn = page => page.getByRole('heading', { name: 'Marketing Helper', exact: true });
const glyphOn = heading => heading.locator('[data-letter]').nth(4);

test.use({
  launchOptions: {
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined),
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  },
});

test.describe('supplied Vector Wordmark', () => {
  test('the first heading paints real local shader marks on pointer movement and resets on leave', async ({ page }, testInfo) => {
    await page.addInitScript(() => {
      const drawArrays = WebGLRenderingContext.prototype.drawArrays;
      WebGLRenderingContext.prototype.drawArrays = function (...args) {
        drawArrays.apply(this, args);
        if (!this.canvas.matches('.vector-wordmark-canvas')) return;
        const { drawingBufferWidth: width, drawingBufferHeight: height } = this;
        const rgba = new Uint8Array(width * height * 4);
        this.readPixels(0, 0, width, height, this.RGBA, this.UNSIGNED_BYTE, rgba);
        let painted = 0;
        for (let index = 3; index < rgba.length; index += 4) {
          if (rgba[index] > 8) painted += 1;
        }
        window.wordmarkFrame = { painted, total: width * height, error: this.getError() };
      };
    });
    await page.goto('/');
    const heading = headingOn(page);
    const canvas = heading.locator('canvas[data-renderer="webgl"]');
    const labels = heading.locator('.vector-wordmark-label');
    await expect(heading).toBeInViewport();
    await expect(heading).toHaveAttribute('data-wordmark-state', 'static');
    await expect(canvas).toHaveCSS('opacity', '0');
    const resting = await heading.screenshot({ path: testInfo.outputPath('wordmark-rest.png') });

    await glyphOn(heading).hover();
    await expect(heading).toHaveAttribute('data-wordmark-state', 'active');
    await expect(canvas).toHaveCSS('opacity', '1');
    await expect.poll(() => page.evaluate(() => window.wordmarkFrame?.painted)).toBeGreaterThan(0);
    const frame = await page.evaluate(() => window.wordmarkFrame);
    expect(frame.error).toBe(0);
    expect(frame.painted).toBeLessThan(frame.total);
    const active = await heading.screenshot({ path: testInfo.outputPath('wordmark-active.png') });
    expect(active.equals(resting)).toBe(false);
    await expect(labels).toHaveCount(3);
    for (const label of await labels.all()) await expect(label).toHaveText(/^\d+, \d+$/);
    const labelPositions = () => labels.evaluateAll(nodes => nodes.map(node => node.style.transform));
    const positionsBefore = await labelPositions();
    await heading.locator('[data-letter]').last().hover();
    await expect.poll(labelPositions).not.toEqual(positionsBefore);

    await page.getByRole('navigation', { name: 'Showcase' }).getByRole('link', { name: 'Agents', exact: true }).hover();
    await expect(heading).toHaveAttribute('data-wordmark-state', 'static');
    await expect(canvas).toHaveCSS('opacity', '0');
    await heading.screenshot({ path: testInfo.outputPath('wordmark-after-leave.png') });
    await glyphOn(heading).hover();
    await expect(heading).toHaveAttribute('data-wordmark-state', 'active');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(heading).toHaveAttribute('data-wordmark-state', 'static');
    await glyphOn(heading).hover();
    await expect(heading).toHaveAttribute('data-wordmark-state', 'static');
    await expect(canvas).toHaveCSS('opacity', '0');
  });
});

test('a browser without WebGL keeps the heading readable and the gallery action usable', async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
      if (kind.includes('webgl')) return null;
      return getContext.call(this, kind, ...args);
    };
  });
  await page.goto('/');
  const heading = headingOn(page);
  await glyphOn(heading).hover();
  await expect(heading).toHaveAttribute('data-wordmark-state', 'unavailable');
  await expect(heading).toHaveText('Marketing Helper');
  await expect(heading.locator('.connected-word').first()).toBeVisible();
  await expect(heading.locator('.vector-wordmark-canvas')).toHaveCSS('opacity', '0');
  await heading.screenshot({ path: testInfo.outputPath('wordmark-no-webgl.png') });
  await page.getByRole('link', { name: 'Explore the agents', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Agent gallery', exact: true })).toBeInViewport();
});
