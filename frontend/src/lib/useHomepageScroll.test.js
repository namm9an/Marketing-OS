import { act, renderHook, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import Lenis from 'lenis';
import { useHomepageScroll } from './useHomepageScroll';

vi.mock('lenis', () => ({
  default: vi.fn(function () {
    this.isStopped = false;
    this.isScrolling = false;
    this.raf = vi.fn();
    this.unsubscribe = vi.fn();
    this.on = vi.fn(() => this.unsubscribe);
    this.stop = vi.fn(() => {
      this.isStopped = true;
      this.isScrolling = false;
    });
    this.start = vi.fn(() => { this.isStopped = false; });
    this.destroy = vi.fn();
  }),
}));

function setDesktopMotion(matches) {
  const media = new EventTarget();
  media.matches = matches;
  vi.stubGlobal('matchMedia', vi.fn(() => media));
  return media;
}

it('enables only for the desktop motion query and tears down on preference change or unmount', () => {
  const media = setDesktopMotion(false);
  const { unmount } = renderHook(useHomepageScroll);
  expect(Lenis).not.toHaveBeenCalled();
  expect(matchMedia).toHaveBeenCalledWith(
    expect.stringMatching(/min-width: 861px.*pointer: fine.*prefers-reduced-motion: no-preference/),
  );

  act(() => {
    media.matches = true;
    media.dispatchEvent(new Event('change'));
  });
  expect(Lenis).toHaveBeenCalledWith(expect.objectContaining({ anchors: false, syncTouch: false }));
  const first = Lenis.mock.instances.at(-1);

  act(() => {
    media.matches = false;
    media.dispatchEvent(new Event('change'));
  });
  expect(first.destroy).toHaveBeenCalledOnce();
  expect(first.unsubscribe).toHaveBeenCalledOnce();

  act(() => {
    media.matches = true;
    media.dispatchEvent(new Event('change'));
  });
  const second = Lenis.mock.instances.at(-1);
  expect(second).not.toBe(first);
  unmount();
  expect(second.destroy).toHaveBeenCalledOnce();
});

it('pauses the document and leaves nested scroll native until the open dialog closes or is removed', async () => {
  setDesktopMotion(true);
  renderHook(useHomepageScroll);
  const instance = Lenis.mock.instances.at(-1);
  const { prevent } = Lenis.mock.calls.at(-1)[0];
  const modal = document.createElement('dialog');
  document.body.append(modal);

  try {
    modal.setAttribute('open', '');
    await waitFor(() => expect(instance.isStopped).toBe(true));
    expect(prevent(modal)).toBe(true);
    modal.removeAttribute('open');
    await waitFor(() => expect(instance.isStopped).toBe(false));
    expect(prevent(modal)).toBe(false);

    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    await waitFor(() => expect(instance.isStopped).toBe(true));
    expect(prevent(modal)).toBe(true);
  } finally {
    modal.remove();
  }
  await waitFor(() => expect(instance.isStopped).toBe(false));
});

it('wakes only for wheel motion and cancels a running frame on native history navigation', () => {
  setDesktopMotion(true);
  const requestFrame = vi.fn(() => 44);
  const cancelFrame = vi.fn();
  vi.stubGlobal('requestAnimationFrame', requestFrame);
  vi.stubGlobal('cancelAnimationFrame', cancelFrame);

  renderHook(useHomepageScroll);
  const instance = Lenis.mock.instances.at(-1);
  const receiveWheel = instance.on.mock.calls.find(([name]) => name === 'virtual-scroll')[1];
  expect(requestFrame).not.toHaveBeenCalled();
  receiveWheel({ event: { type: 'touchmove' } });
  receiveWheel({ event: { type: 'wheel', ctrlKey: true } });
  expect(requestFrame).not.toHaveBeenCalled();

  receiveWheel({ event: { type: 'wheel' } });
  expect(requestFrame).toHaveBeenCalledOnce();
  instance.isScrolling = 'smooth';
  window.dispatchEvent(new PopStateEvent('popstate'));
  expect(cancelFrame).toHaveBeenCalledWith(44);
  expect(instance.stop).toHaveBeenCalledOnce();
  expect(instance.isStopped).toBe(false);
});
