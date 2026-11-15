import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import Lenis from 'lenis';
import { LenisProvider, useNavScroll } from './LenisContext';

vi.mock('lenis', () => ({ default: vi.fn(function () {
  this.on = vi.fn(); this.off = vi.fn(); this.raf = vi.fn(); this.destroy = vi.fn();
}) }));

function Probe() {
  const { lenis } = useNavScroll();
  return <p>{lenis ? 'Smooth controller enabled' : 'Native scrolling'}</p>;
}

function mediaQuery(matches) {
  const media = new EventTarget();
  media.matches = matches;
  vi.stubGlobal('matchMedia', vi.fn(() => media));
  return media;
}

it('does not initialize a smooth-scrolling controller under reduced motion', () => {
  mediaQuery(true);
  render(<LenisProvider><Probe /></LenisProvider>);
  expect(Lenis).not.toHaveBeenCalled();
  expect(screen.getByText('Native scrolling')).toBeVisible();
});

it('destroys the active controller when the motion preference changes', async () => {
  const media = mediaQuery(false);
  render(<LenisProvider><Probe /></LenisProvider>);
  const instance = Lenis.mock.instances.at(-1);
  expect(screen.getByText('Smooth controller enabled')).toBeVisible();
  await act(async () => { media.matches = true; media.dispatchEvent(new Event('change')); });
  expect(instance.destroy).toHaveBeenCalledOnce();
  expect(screen.getByText('Native scrolling')).toBeVisible();
});
