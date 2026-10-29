import React, { useState } from 'react';
import AgentStoryStage from './AgentStoryStage';

export default function HeroArchitectureSvg({ onLaunchConsole }) {
  // Active story key: 'synthesis' | 'branding' | 'pr' | 'social' | 'pmm' | 'events'
  const [activeStoryKey, setActiveStoryKey] = useState('synthesis');

  const agentMeta = [
    {
      id: 'branding',
      storyKey: 'branding',
      name: 'Branding',
      focus: 'Positioning & SLAs',
      domain: 'Strategic Positioning & Differentiation',
    },
    {
      id: 'pr',
      storyKey: 'pr',
      name: 'PR & Policy',
      focus: 'Narrative & Policy',
      domain: 'Corporate Communications & Governance',
    },
    {
      id: 'social',
      storyKey: 'social',
      name: 'Social Community',
      focus: 'Sentiment & Community',
      domain: 'Developer Ecosystem & Sentiment',
    },
    {
      id: 'product_marketing',
      storyKey: 'pmm',
      name: 'Product Marketing',
      focus: 'SKUs & Battlecards',
      domain: 'Competitive Intelligence & Battlecards',
    },
    {
      id: 'events',
      storyKey: 'events',
      name: 'Field Events',
      focus: 'Executive Summits',
      domain: 'Field Presence & Executive Briefings',
    },
  ];

  const handleSelectStory = (key) => {
    setActiveStoryKey(key);
  };

  return (
    <div className="w-full bg-[#FFFFFF] border border-[#D4D1C7] flex flex-col shadow-xs overflow-hidden">
      {/* Header Bar */}
      <div className="border-b border-[#D4D1C7] px-4 py-2.5 bg-[#ECEAE3]/50 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse"></span>
          <span className="text-[11px] font-mono font-medium text-[#111315] uppercase tracking-wider">
            Kinetic 5-Agent Pipeline
          </span>
        </div>
        <div className="text-[11px] font-sans text-[#4A505C] hidden sm:block">
          Click any specialist to expand its visual story stage
        </div>
      </div>

      {/* Main SVG Viewport with Continuous Data-Packet Flow */}
      <div className="relative w-full aspect-[760/400] min-h-[350px] bg-[#FFFFFF] overflow-hidden flex items-center justify-center p-2">
        <svg
          viewBox="0 0 760 400"
          className="w-full h-full select-none"
          aria-label="5-Agent Autonomous Intelligence Architecture"
        >
          <defs>
            <style>{`
              @keyframes dataPulse {
                from { stroke-dashoffset: 40; }
                to { stroke-dashoffset: 0; }
              }
              .pulse-stream {
                stroke-dasharray: 6 18;
                animation: dataPulse 1.5s linear infinite;
              }
              .pulse-stream-active {
                stroke-dasharray: 8 14;
                animation: dataPulse 1s linear infinite;
              }
            `}</style>

            {/* Glowing filter for active connectors and active halo */}
            <filter id="connector-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#2563EB" floodOpacity="0.8" />
            </filter>

            <filter id="halo-glow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#2563EB" floodOpacity="0.4" />
            </filter>

            {/* Standard and active arrow markers */}
            <marker
              id="arrow-neutral"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="4.5"
              markerHeight="4.5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#D4D1C7" />
            </marker>

            <marker
              id="arrow-active"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="4.5"
              markerHeight="4.5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#2563EB" />
            </marker>
          </defs>

          {/* ==================================================================== */}
          {/* BUS 1: Knowledge Base to 5 Specialists (Base Lines + Luminous Pulses)*/}
          {/* ==================================================================== */}
          {agentMeta.map((agent, i) => {
            const xPositions = [95, 237, 380, 523, 665];
            const targetX = xPositions[i];
            const isAgentActive = activeStoryKey === agent.storyKey;
            const pathD = i === 2
              ? `M 380 66 L 380 118`
              : `M 380 66 L 380 90 L ${targetX} 90 L ${targetX} 118`;

            return (
              <g key={`bus-in-${agent.id}`}>
                {/* Neutral Base Wire */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={isAgentActive ? '#2563EB' : '#D4D1C7'}
                  strokeWidth={isAgentActive ? '2' : '1.25'}
                  filter={isAgentActive ? 'url(#connector-glow)' : undefined}
                  markerEnd={isAgentActive ? 'url(#arrow-active)' : 'url(#arrow-neutral)'}
                  className="transition-colors duration-200"
                />
                {/* Continuous Flowing Data Pulse Layer */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth={isAgentActive ? '2.5' : '1.5'}
                  className={`pointer-events-none opacity-80 ${isAgentActive ? 'pulse-stream-active' : 'pulse-stream'}`}
                />
              </g>
            );
          })}

          {/* ==================================================================== */}
          {/* BUS 2: 5 Specialists to Executive Synthesis Engine                  */}
          {/* ==================================================================== */}
          {agentMeta.map((agent, i) => {
            const xPositions = [95, 237, 380, 523, 665];
            const sourceX = xPositions[i];
            const isAgentActive = activeStoryKey === agent.storyKey;
            const isSynthesisActive = activeStoryKey === 'synthesis';
            const isActive = isAgentActive || isSynthesisActive;
            const pathD = i === 2
              ? `M 380 194 L 380 252`
              : `M ${sourceX} 194 L ${sourceX} 222 L 380 222 L 380 252`;

            return (
              <g key={`bus-out-${agent.id}`}>
                {/* Neutral Base Wire */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={isActive ? '#2563EB' : '#D4D1C7'}
                  strokeWidth={isActive ? '2' : '1.25'}
                  filter={isActive ? 'url(#connector-glow)' : undefined}
                  markerEnd={isActive ? 'url(#arrow-active)' : 'url(#arrow-neutral)'}
                  className="transition-colors duration-200"
                />
                {/* Continuous Flowing Data Pulse Layer */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth={isActive ? '2.5' : '1.5'}
                  className={`pointer-events-none opacity-80 ${isActive ? 'pulse-stream-active' : 'pulse-stream'}`}
                />
              </g>
            );
          })}

          {/* ==================================================================== */}
          {/* BUS 3: Executive Synthesis Engine to Final Brief Output             */}
          {/* ==================================================================== */}
          <g>
            <path
              d="M 380 308 L 380 338"
              fill="none"
              stroke="#2563EB"
              strokeWidth="2"
              filter="url(#connector-glow)"
              markerEnd="url(#arrow-active)"
              className="transition-colors duration-200"
            />
            <path
              d="M 380 308 L 380 338"
              fill="none"
              stroke="#2563EB"
              strokeWidth="2.5"
              className="pointer-events-none pulse-stream-active"
            />
          </g>

          {/* ==================================================================== */}
          {/* TOP NODE: Grounded Knowledge Base                                    */}
          {/* ==================================================================== */}
          <g
            transform="translate(190, 18)"
            className="cursor-pointer group"
            onClick={() => handleSelectStory('synthesis')}
          >
            <rect
              width="380"
              height="48"
              rx="2"
              fill={activeStoryKey === 'synthesis' ? '#EFF6FF' : '#FFFFFF'}
              stroke={activeStoryKey === 'synthesis' ? '#2563EB' : '#111315'}
              strokeWidth={activeStoryKey === 'synthesis' ? '2' : '1.25'}
              className="transition-colors duration-150 group-hover:stroke-[#2563EB]"
            />
            <text x="190" y="21" textAnchor="middle" fill="#111315" fontSize="12" fontFamily="var(--font-sans)" fontWeight="700">
              Grounded Competitor Knowledge Base
            </text>
            <text x="190" y="38" textAnchor="middle" fill="#6E7685" fontSize="10.5" fontFamily="var(--font-sans)">
              Primary Source Grounding · 12 Cloud Competitors
            </text>
          </g>

          {/* ==================================================================== */}
          {/* 5 PARALLEL SPECIALIST NODES                                          */}
          {/* ==================================================================== */}
          {agentMeta.map((agent, i) => {
            const xPositions = [35, 177, 320, 463, 605];
            const x = xPositions[i];
            const isSelected = activeStoryKey === agent.storyKey;

            return (
              <g
                key={agent.id}
                transform={`translate(${x}, 120)`}
                className="cursor-pointer group"
                filter={isSelected ? 'url(#halo-glow)' : undefined}
                onClick={() => handleSelectStory(agent.storyKey)}
              >
                {/* Agent Card Box: Fixed Width 120, Height 74 */}
                <rect
                  width="120"
                  height="74"
                  rx="2"
                  fill={isSelected ? '#EFF6FF' : '#FFFFFF'}
                  stroke={isSelected ? '#2563EB' : '#D4D1C7'}
                  strokeWidth={isSelected ? '2' : '1.25'}
                  className="transition-colors duration-150 group-hover:stroke-[#111315]"
                />
                
                {/* Clean Top Accent Pill */}
                <rect
                  x="12"
                  y="10"
                  width="96"
                  height="3"
                  rx="1.5"
                  fill={isSelected ? '#2563EB' : '#111315'}
                  className="transition-colors duration-200"
                />

                {/* Clean Agent Label - Fixed width, guaranteed no line wrap */}
                <text
                  x="60"
                  y="34"
                  textAnchor="middle"
                  fill="#111315"
                  fontSize="11"
                  fontFamily="var(--font-sans)"
                  fontWeight="700"
                  className="tracking-tight"
                >
                  {agent.name}
                </text>

                {/* Focus Area Pill */}
                <rect
                  x="10"
                  y="46"
                  width="100"
                  height="18"
                  rx="1"
                  fill={isSelected ? '#DBEAFE' : '#ECEAE3'}
                  className="transition-colors duration-200"
                />
                <text
                  x="60"
                  y="58.5"
                  textAnchor="middle"
                  fill={isSelected ? '#1D4ED8' : '#4A505C'}
                  fontSize="9"
                  fontFamily="var(--font-sans)"
                  fontWeight="500"
                >
                  {agent.focus}
                </text>
              </g>
            );
          })}

          {/* ==================================================================== */}
          {/* SYNTHESIS ENGINE (Center of Gravity Convergence)                     */}
          {/* ==================================================================== */}
          <g
            transform="translate(170, 254)"
            className="cursor-pointer group"
            filter={activeStoryKey === 'synthesis' ? 'url(#halo-glow)' : undefined}
            onClick={() => handleSelectStory('synthesis')}
          >
            <rect
              width="420"
              height="54"
              rx="2"
              fill={activeStoryKey === 'synthesis' ? '#EFF6FF' : '#FFFFFF'}
              stroke={activeStoryKey === 'synthesis' ? '#2563EB' : '#111315'}
              strokeWidth={activeStoryKey === 'synthesis' ? '2' : '1.5'}
              className="transition-colors duration-150 group-hover:stroke-[#2563EB]"
            />
            <text x="210" y="24" textAnchor="middle" fill="#111315" fontSize="13" fontFamily="var(--font-sans)" fontWeight="700">
              Executive Synthesis Engine
            </text>
            <text x="210" y="42" textAnchor="middle" fill="#4A505C" fontSize="10.5" fontFamily="var(--font-sans)">
              Cross-Domain Dialectic · Provenance Verification & Consensus
            </text>
          </g>

          {/* ==================================================================== */}
          {/* FINAL ARTIFACT: Weekly Executive Intelligence Brief                  */}
          {/* ==================================================================== */}
          <g
            transform="translate(180, 340)"
            className="cursor-pointer group"
            onClick={() => handleSelectStory('synthesis')}
          >
            <rect
              width="400"
              height="36"
              rx="2"
              fill={activeStoryKey === 'synthesis' ? '#1E293B' : '#111315'}
              stroke={activeStoryKey === 'synthesis' ? '#2563EB' : '#111315'}
              strokeWidth={activeStoryKey === 'synthesis' ? '2' : '1'}
              className="transition-colors duration-150 group-hover:fill-[#1E293B]"
            />
            <text x="200" y="22" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontFamily="var(--font-sans)" fontWeight="600" letterSpacing="0.02em">
              Weekly Executive Intelligence Brief
            </text>
          </g>
        </svg>
      </div>

      {/* CLICK-TO-DIVE AGENT STORY STAGE (The 3-Step Interactive Story Panel) */}
      <AgentStoryStage
        selectedKey={activeStoryKey}
        onSelectKey={handleSelectStory}
        onLaunchConsole={onLaunchConsole}
      />
    </div>
  );
}
