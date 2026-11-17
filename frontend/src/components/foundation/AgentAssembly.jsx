import React from 'react';

// Original schematic artwork for the five specialist roles. This is a visual
// metaphor, not a live execution trace or the later F05 physical renderer.
const positions = [110, 310, 510, 710, 910];
const names = ['Branding', 'PR & Policy', 'Social', 'Product Marketing', 'Events'];

function Mechanism({ index }) {
  if (index === 0) return <g><path d="M-28 5h56M-22-10h44M-16-25h32" /><path d="m-36 22 36 18 36-18" /></g>;
  if (index === 1) return <g><path d="M-30 33v-58h60v58M-30-5h60M0-5v38" /><circle cx="0" cy="-5" r="7" fill="var(--yellow)" /></g>;
  if (index === 2) return <g><circle r="7" /><path d="M-19-20a28 28 0 0 0 0 40M19-20a28 28 0 0 1 0 40M-31-32a45 45 0 0 0 0 64M31-32a45 45 0 0 1 0 64" /></g>;
  if (index === 3) return <g><path d="M-28-28v56h56M-12 13V-9M5 13v-31M22 13v-43" /><path d="m-20 37 20 9 35-20" /></g>;
  return <g><path d="m0-34 36 62h-72zM0-34v62M-12 28 0 7l12 21" /><circle cy="-34" r="5" fill="var(--paper)" /></g>;
}

export default function AgentAssembly({ pose = 0, focused = false }) {
  return <svg className={`f03-assembly ${focused ? 'is-focused' : ''}`} viewBox={focused ? '245 20 240 350' : '0 0 1120 390'} fill="none" aria-hidden="true" data-pose={pose}>
    <defs><filter id="assembly-shadow" x="-50%" y="-100%" width="200%" height="300%"><feGaussianBlur stdDeviation="10" /></filter></defs>
    <ellipse cx="560" cy="310" rx="463" ry="22" fill="var(--ink)" opacity=".1" filter="url(#assembly-shadow)" />
    <path d="M65 243 1004 243 1060 276 120 276z" fill="var(--ink)" />
    <path d="M120 276h940v15H120z" fill="var(--brown)" />
    <path d="M94 255h935M174 282h816" stroke="var(--paper)" strokeOpacity=".45" />
    {positions.map((x, i) => <g key={names[i]} className={`f03-machine machine-${i}`} style={{ '--module-x': `${x}px` }} transform={`translate(${x + 55} ${i === 1 ? 158 : 182})`}>
      <g className="f03-machine-form">
        <path d="m-61-84 72-28 56 31-73 28z" fill={i === 1 ? 'var(--yellow)' : 'var(--paper)'} stroke="var(--ink)" />
        <path d="m-61-84 55 31v127l-55-32z" fill="var(--paper)" stroke="var(--ink)" />
        <path d="m-6-53 73-28v127l-73 28z" fill={i === 1 ? 'var(--yellow)' : 'var(--paper)'} stroke="var(--ink)" />
        <path d="m-49-59 30 17M-49-48l30 17M-49 19l30 17" stroke="var(--brown)" strokeWidth="2" />
        <g transform="translate(30 1) skewY(-21) scale(.66 .8)" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><Mechanism index={i} /></g>
        <path d="m-6 59 73-28" stroke="var(--ink)" />
        <circle cx="4" cy="64" r="2" fill="var(--ink)" /><circle cx="57" cy="43" r="2" fill="var(--ink)" />
      </g>
      <text x="6" y={i === 1 ? 168 : 144} textAnchor="middle" fill="var(--ink)" fontSize="14" fontFamily="inherit">{names[i]}</text>
    </g>)}
  </svg>;
}
