import React from 'react';
import { ShaderGradientCanvas, ShaderGradient } from '@shadergradient/react';

/** Ambient gradient tinted for the active specialist or comparison pair. */

// Keyed to the app's warm palette (#FBF9F5 / #D97757). c1 is the wash, c3 the accent.
const AGENT_GRADIENTS = {
  default:           { c1: '#FBF9F5', c2: '#EADAC8', c3: '#D97757' },
  branding:          { c1: '#FBF9F5', c2: '#EDD9C4', c3: '#D97757' },  // terracotta
  pr:                { c1: '#F7F8FB', c2: '#D9DFEE', c3: '#6D82C4' },  // slate blue
  // Parked (see ACTIVE_AGENTS in app/agents/base.py) — unreachable until the roster is
  // specified, kept so the palette doesn't have to be re-derived when they come back.
  social:            { c1: '#FBF7FA', c2: '#EBD8E6', c3: '#B0679E' },  // magenta
  product_marketing: { c1: '#F6FAF8', c2: '#D2E6DC', c3: '#4F9C7C' },  // green
  events:            { c1: '#FCF9F4', c2: '#F0E2C0', c3: '#C9A227' },  // amber
};

/** Midpoint of two hex colours — the triage blend is literally between the pair. */
function mixHex(a, b) {
  const channel = (i) =>
    Math.round((parseInt(a.slice(1 + i * 2, 3 + i * 2), 16) +
                parseInt(b.slice(1 + i * 2, 3 + i * 2), 16)) / 2)
      .toString(16).padStart(2, '0');
  return `#${channel(0)}${channel(1)}${channel(2)}`;
}

export function gradientFor(agents) {
  const picked = (agents || []).map((a) => AGENT_GRADIENTS[a]).filter(Boolean);
  if (picked.length === 0) return AGENT_GRADIENTS.default;
  if (picked.length === 1) return picked[0];
  return {
    c1: mixHex(picked[0].c1, picked[1].c1),
    c2: mixHex(picked[0].c2, picked[1].c2),
    c3: mixHex(picked[0].c3, picked[1].c3),
  };
}

export default function ShaderCanvas({ agents = [] }) {
  const { c1, c2, c3 } = gradientFor(agents);

  return (
    <ShaderGradientCanvas
      className="fixed inset-0 pointer-events-none z-0 no-print"
      style={{ position: 'fixed', inset: 0, opacity: 0.55 }}
      // The canvas sits behind every screen and is never interacted with, so it is capped
      // rather than left to render at full retina density on a 5K display.
      pixelDensity={1}
      fov={40}
    >
      <ShaderGradient
        control="props"
        type="waterPlane"
        color1={c1}
        color2={c2}
        color3={c3}
        animate="on"
        uSpeed={0.1}
        uStrength={1.4}
        uDensity={1.1}
        uFrequency={5.5}
        cDistance={2.8}
        cAzimuthAngle={180}
        cPolarAngle={80}
        positionX={-0.5}
        rotationX={0}
        brightness={1.2}
        grain="on"
        lightType="3d"
        reflection={0.1}
      />
    </ShaderGradientCanvas>
  );
}
