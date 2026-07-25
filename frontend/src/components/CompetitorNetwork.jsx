import React, { useState, useMemo } from 'react';
import { ExternalLink, Circle } from 'lucide-react';

/**
 * Interactive competitor link-network (Milestone 5).
 *
 * Hub-and-spoke SVG: E2E at the centre, one node per rival, radius and edge weight
 * driven by how many *grounded* facts we hold. Clicking a node reveals that rival's
 * citations (rate cards, docs, positioning) with their source URLs.
 *
 * ponytail: hand-rolled radial layout in plain SVG — a force-graph library (d3 /
 * cytoscape / react-force-graph) is ~100KB+ for 13 nodes that never move. Swap one in
 * only if rival<->rival edges land and the layout genuinely needs physics.
 */

const W = 760;
const H = 520;
const CX = W / 2;
const CY = H / 2;
const RING = 190;

export default function CompetitorNetwork({ network, onSelect }) {
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);

  const competitors = useMemo(
    () => (network?.nodes || []).filter((n) => n.group === 'competitor'),
    [network]
  );

  const positioned = useMemo(() => {
    const max = Math.max(1, ...competitors.map((c) => c.fact_count));
    return competitors.map((node, i) => {
      const angle = (i / competitors.length) * 2 * Math.PI - Math.PI / 2;
      return {
        ...node,
        x: CX + RING * Math.cos(angle),
        y: CY + RING * Math.sin(angle),
        r: 13 + (node.fact_count / max) * 13,
      };
    });
  }, [competitors]);

  if (!competitors.length) {
    return (
      <div className="p-8 text-center bg-white/80 rounded-2xl border border-[#E7E2D8] text-xs text-[#78716C]">
        No grounded competitor facts in the knowledge base yet.
      </div>
    );
  }

  const active = selected && competitors.find((c) => c.id === selected);

  const pick = (id) => {
    const next = id === selected ? null : id;
    setSelected(next);
    onSelect?.(next);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white/80 border border-[#E7E2D8] p-2 overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[560px]" role="img"
             aria-label="Competitor link network">
          {positioned.map((n) => {
            const on = hovered === n.id || selected === n.id;
            return (
              <line
                key={`e-${n.id}`}
                x1={CX} y1={CY} x2={n.x} y2={n.y}
                stroke={on ? '#D97757' : '#E0DACE'}
                strokeWidth={on ? 2 : 1 + n.fact_count / 12}
                opacity={selected && !on ? 0.25 : 1}
              />
            );
          })}

          {/* Hub */}
          <circle cx={CX} cy={CY} r={34} fill="#1C1917" />
          <text x={CX} y={CY - 2} textAnchor="middle" fill="#FBF9F5"
                fontSize="11" fontWeight="700">E2E</text>
          <text x={CX} y={CY + 11} textAnchor="middle" fill="#A8A29E" fontSize="8">NETWORKS</text>

          {positioned.map((n) => {
            const on = hovered === n.id || selected === n.id;
            return (
              <g key={n.id} onClick={() => pick(n.id)}
                 onMouseEnter={() => setHovered(n.id)} onMouseLeave={() => setHovered(null)}
                 style={{ cursor: 'pointer' }}>
                <circle
                  cx={n.x} cy={n.y} r={n.r}
                  fill={on ? '#D97757' : '#F7F5F0'}
                  stroke={on ? '#D97757' : '#E0DACE'}
                  strokeWidth={2}
                  opacity={selected && !on ? 0.4 : 1}
                />
                <text x={n.x} y={n.y + 3} textAnchor="middle"
                      fontSize="10" fontWeight="700"
                      fill={on ? '#FFFFFF' : '#44403C'}>{n.fact_count}</text>
                <text x={n.x} y={n.y + n.r + 13} textAnchor="middle"
                      fontSize="10" fontWeight={on ? 700 : 500}
                      fill={on ? '#1C1917' : '#78716C'}
                      opacity={selected && !on ? 0.4 : 1}>
                  {n.id.length > 18 ? `${n.id.slice(0, 17)}…` : n.id}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <p className="text-[11px] text-[#78716C] flex items-center gap-1.5">
        <Circle className="w-3 h-3" />
        Node size and edge weight = grounded facts held on that rival. Click a node to inspect its citations.
      </p>

      {active && (
        <div className="rounded-2xl bg-white/80 border border-[#E7E2D8] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-[#1C1917]">{active.id}</h4>
            <span className="text-[10px] font-mono text-[#78716C] border border-[#E0DACE] bg-[#F7F5F0] px-2 py-0.5 rounded-md">
              {active.fact_count} grounded facts
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(active.classes || []).map((c) => (
              <span key={c} className="text-[10px] font-mono uppercase text-[#78716C] border border-[#E0DACE] bg-[#F7F5F0] px-2 py-0.5 rounded-md">
                {c}
              </span>
            ))}
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {active.citations.map((c, i) => (
              <div key={i} className="p-3 rounded-xl bg-[#F7F5F0]/90 border border-[#E0DACE] space-y-1.5">
                <p className="text-xs text-[#44403C] leading-relaxed">{c.content}</p>
                <a href={c.source_url} target="_blank" rel="noopener noreferrer"
                   className="inline-flex items-center gap-1 text-[10px] font-mono text-[#D97757] hover:underline break-all">
                  <ExternalLink className="w-3 h-3 shrink-0" />
                  {c.source_url}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
