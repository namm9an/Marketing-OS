import { memo, useLayoutEffect, useRef } from 'react';
import './pokemon-card.css';

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function resetTiltStyles(element) {
  if (!element) return;
  element.dataset.interacting = 'false';
  element.style.setProperty('--rotate-x', '0deg');
  element.style.setProperty('--rotate-y', '0deg');
}

/**
 * Tactile 3D tilt card with crisp hard ink offset shadow (no holo foil, rainbow
 * sheen, or gradient layers). Depth-driven frontMost toggles --yellow vs muted artwork.
 */
const PokemonHoloCard = memo(function PokemonHoloCard({
  src,
  rearSrc = '',
  label = '',
  variant = 'tile',
  interactive = true,
  frontMost = true,
  imgProps = {},
}) {
  const cardRef = useRef(null);

  useLayoutEffect(() => {
    resetTiltStyles(cardRef.current);
  }, [interactive, src]);

  function handlePointerMove(event) {
    if (!interactive || event.pointerType !== 'mouse' || event.buttons) return;
    const node = cardRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const px = clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100);
    const py = clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100);
    const cx = px - 50;
    const cy = py - 50;
    const maxTilt = variant === 'dossier' ? 12 : 16;
    const rotateX = (-(cy / 50) * maxTilt).toFixed(2);
    const rotateY = ((cx / 50) * maxTilt).toFixed(2);

    node.dataset.interacting = 'true';
    node.style.setProperty('--rotate-x', `${rotateX}deg`);
    node.style.setProperty('--rotate-y', `${rotateY}deg`);
  }

  function handlePointerLeave() {
    resetTiltStyles(cardRef.current);
  }

  return (
    <span
      ref={cardRef}
      className={`poke-card poke-card--${variant}`}
      data-pokemon-card="true"
      data-front-most={String(Boolean(frontMost))}
      onPointerMove={interactive ? handlePointerMove : undefined}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerLeave}
    >
      <span className="poke-rotator">
        <span className="poke-frame">
          <span className="poke-artwork">
            <img key={src} src={src} alt="" aria-label={label || undefined} {...imgProps} />
            {rearSrc && (
              <img
                key={rearSrc}
                className="poke-artwork-rear"
                src={rearSrc}
                alt=""
                aria-hidden="true"
                draggable={false}
                loading={imgProps?.loading}
                decoding={imgProps?.decoding ?? 'async'}
                onLoad={imgProps?.onLoad}
                onError={imgProps?.onError}
                style={{ opacity: frontMost ? 0 : 1 }}
              />
            )}
          </span>
        </span>
      </span>
    </span>
  );
});

export default PokemonHoloCard;
