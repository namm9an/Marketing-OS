import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SpecialText from './SpecialText';

describe('SpecialText', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('settles immediately when reduced motion is preferred', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })));
    render(<SpecialText>Community brief</SpecialText>);
    expect(screen.getByText('Community brief')).toBeInTheDocument();
  });

  it('starts scrambled, decodes smoothly to target text within durationMs, and cancels rAF on unmount', () => {
    vi.useFakeTimers();
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');
    vi.stubGlobal('matchMedia', vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })));
    const { container, unmount } = render(<SpecialText durationMs={160}>Claim review</SpecialText>);
    const initial = container.textContent;
    expect(initial).not.toBe('Claim review');
    expect(initial).toHaveLength('Claim review'.length);

    act(() => vi.advanceTimersByTime(60));
    expect(container.textContent).not.toBe(initial);

    act(() => vi.advanceTimersByTime(200));
    expect(container.textContent).toBe('Claim review');

    const { unmount: unmountEarly } = render(<SpecialText durationMs={NaN}>Positioning</SpecialText>);
    act(() => vi.advanceTimersByTime(32));
    unmountEarly();
    expect(cancelSpy).toHaveBeenCalled();
    unmount();
  });
});
