import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PokemonHoloCard from './PokemonHoloCard';

function dispatchPointer(target, type, init = {}) {
  const event = new Event(type, { bubbles: true });
  Object.defineProperties(event, {
    pointerType: { value: init.pointerType ?? 'mouse' },
    clientX: { value: init.clientX ?? 0 },
    clientY: { value: init.clientY ?? 0 },
    buttons: { value: init.buttons ?? 0 },
  });
  fireEvent(target, event);
}

describe('PokemonHoloCard', () => {
  it('applies 3D tilt without holo foil layers, binds slide aria-label, and tracks sphere-depth yellow', () => {
    const { container, rerender } = render(
      <PokemonHoloCard
        src="/assets/agent-gallery/branding-1.webp"
        rearSrc="/assets/agent-gallery/branding-1-rear.webp"
        label="Repair vs. replace brief"
        variant="dossier"
        frontMost
        interactive
      />,
    );

    const card = container.querySelector('[data-pokemon-card="true"]');
    expect(card).not.toBeNull();
    expect(card.dataset.interacting).toBe('false');
    expect(card.dataset.frontMost).toBe('true');

    // Zero holo foil / gradient layers
    expect(container.querySelector('.poke-shine')).toBeNull();
    expect(container.querySelector('.poke-glare')).toBeNull();

    const frontImg = container.querySelector('img[aria-label="Repair vs. replace brief"]');
    const rearImg = container.querySelector('.poke-artwork-rear');
    expect(frontImg).not.toBeNull();
    expect(rearImg).not.toBeNull();
    expect(rearImg.getAttribute('aria-hidden')).toBe('true');
    expect(rearImg.style.opacity).toBe('0');

    Object.defineProperty(card, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ left: 100, top: 50, width: 200, height: 150 }),
    });

    dispatchPointer(card, 'pointermove', { pointerType: 'touch', clientX: 250, clientY: 162.5 });
    expect(card.dataset.interacting).toBe('false');

    dispatchPointer(card, 'pointermove', { pointerType: 'mouse', buttons: 1, clientX: 250, clientY: 162.5 });
    expect(card.dataset.interacting).toBe('false');

    dispatchPointer(card, 'pointermove', { pointerType: 'mouse', clientX: 250, clientY: 162.5 });
    expect(card.dataset.interacting).toBe('true');
    expect(card.style.getPropertyValue('--rotate-y')).not.toBe('0deg');

    // Rear cards behind front-most toggle ink/brown/paper strictly via frontMost depth prop (works on touch/static)
    rerender(
      <PokemonHoloCard
        src="/assets/agent-gallery/branding-1.webp"
        rearSrc="/assets/agent-gallery/branding-1-rear.webp"
        label="Repair vs. replace brief"
        variant="tile"
        frontMost={false}
        interactive
      />,
    );
    expect(card.dataset.frontMost).toBe('false');
    expect(container.querySelector('.poke-artwork-rear').style.opacity).toBe('1');
    expect(card.dataset.interacting).toBe('true');

    fireEvent.pointerLeave(card);
    expect(card.dataset.interacting).toBe('false');
    expect(card.style.getPropertyValue('--rotate-x')).toBe('0deg');
    expect(card.style.getPropertyValue('--rotate-y')).toBe('0deg');

    dispatchPointer(card, 'pointermove', { pointerType: 'mouse', clientX: 120, clientY: 80 });
    expect(card.dataset.interacting).toBe('true');
    fireEvent.pointerCancel(card);
    expect(card.dataset.interacting).toBe('false');
  });

  it('resets active tilt when interactive becomes false or src changes', () => {
    const { container, rerender } = render(
      <PokemonHoloCard src="/assets/agent-gallery/branding-2.webp" label="Positioning angle" variant="tile" interactive />,
    );
    const card = container.querySelector('[data-pokemon-card="true"]');
    Object.defineProperty(card, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ left: 0, top: 0, width: 100, height: 100 }),
    });

    dispatchPointer(card, 'pointermove', { pointerType: 'mouse', clientX: 90, clientY: 10 });
    expect(card.dataset.interacting).toBe('true');

    rerender(
      <PokemonHoloCard src="/assets/agent-gallery/branding-2.webp?retry=1" label="Positioning angle" variant="tile" interactive />,
    );
    expect(card.dataset.interacting).toBe('false');
    expect(card.style.getPropertyValue('--rotate-x')).toBe('0deg');
    expect(card.style.getPropertyValue('--rotate-y')).toBe('0deg');

    dispatchPointer(card, 'pointermove', { pointerType: 'mouse', clientX: 90, clientY: 10 });
    expect(card.dataset.interacting).toBe('true');

    rerender(
      <PokemonHoloCard src="/assets/agent-gallery/branding-2.webp?retry=1" label="Positioning angle" variant="tile" interactive={false} />,
    );
    expect(container.querySelector('.poke-artwork-rear')).toBeNull();
    expect(card.dataset.interacting).toBe('false');
    expect(card.style.getPropertyValue('--rotate-x')).toBe('0deg');
    expect(card.style.getPropertyValue('--rotate-y')).toBe('0deg');

    dispatchPointer(card, 'pointermove', { pointerType: 'mouse', clientX: 90, clientY: 10 });
    expect(card.dataset.interacting).toBe('false');
  });

  it('forwards error handler to rear artwork when provided', () => {
    let erroredTarget = null;
    const { container } = render(
      <PokemonHoloCard
        src="/assets/agent-gallery/branding-3.webp"
        rearSrc="/assets/agent-gallery/branding-3-rear.webp"
        label="Audience segments"
        variant="tile"
        frontMost={false}
        imgProps={{ onError: event => { erroredTarget = event.currentTarget; } }}
      />,
    );
    const rearImg = container.querySelector('.poke-artwork-rear');
    fireEvent.error(rearImg);
    expect(erroredTarget).toBe(rearImg);
  });
});
