import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValueEvent } from 'framer-motion';
import { ArrowRight, Lock, Database, ShieldCheck } from 'lucide-react';
import { useLenis, useNavScroll } from '../../context/LenisContext';
import { useMediaQuery } from '../../lib/useMediaQuery';
import {
  CONTAINER_HEIGHT,
  MORPH_KNOWLEDGE_START,
  MORPH_KNOWLEDGE_END,
  MORPH_TABS_START,
  MORPH_TABS_END,
  CARD_1_EXPAND_START,
  CARD_1_EXPAND_END,
  MORPH_END,
  CARD_ARRIVAL_POINTS,
  TRANSITION_LENGTH,
  PER_LEVEL_OFFSET_PX,
  PER_LEVEL_SCALE_STEP,
  MAX_VISIBLE_BEHIND,
  SCROLL_TRANSITION_DURATION,
  getCardTimelineConfig,
} from '../../lib/deckTimeline';

export default function PinnedDossierCascade({ onLaunchConsole }) {
  const containerRef = useRef(null);
  const shouldReduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const narrowViewport = useMediaQuery('(max-width: 1023px)');
  const staticLayout = Boolean(shouldReduceMotion) || narrowViewport;
  const lenis = useLenis();
  const { isNavCrossing } = useNavScroll();
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  // Track scroll progress through the container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Smooth scroll spring physics (bypass spring if reduced motion requested)
  const springProgress = useSpring(scrollYProgress, {
    stiffness: 180,
    damping: 26,
    restDelta: 0.001,
  });

  const smoothProgress = shouldReduceMotion ? scrollYProgress : springProgress;

  // Track active card index based on CARD_ARRIVAL_POINTS
  useMotionValueEvent(smoothProgress, 'change', (v) => {
    let active = 0;
    for (let j = CARD_ARRIVAL_POINTS.length - 1; j >= 0; j--) {
      if (v >= CARD_ARRIVAL_POINTS[j] - 0.02) {
        active = j;
        break;
      }
    }
    setActiveCardIndex(active);
  });

  // Tab click smooth scroll navigation using Lenis
  const handleTabClick = (cardIndex) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const containerTop = rect.top + window.scrollY;
    const containerHeight = containerRef.current.offsetHeight;
    const viewportHeight = window.innerHeight;
    const targetArrival = CARD_ARRIVAL_POINTS[cardIndex];

    const targetScrollY = containerTop + targetArrival * (containerHeight - viewportHeight);

    if (lenis) {
      lenis.scrollTo(targetScrollY, {
        duration: shouldReduceMotion ? 0 : SCROLL_TRANSITION_DURATION,
        immediate: shouldReduceMotion,
      });
    } else {
      window.scrollTo({
        top: targetScrollY,
        behavior: shouldReduceMotion ? 'auto' : 'smooth',
      });
    }
  };

  // 5 Specialist Dossier Case Files
  const dossiers = [
    {
      num: '01',
      tag: '01 / BRANDING',
      name: 'Branding Specialist',
      domain: 'Positioning & Cluster SLAs',
      telemetry: 'Illustrative scenario · execution metrics unavailable',
      signal: 'Competitor spot and reserved H100 discounting detected across CoreWeave and RunPod.',
      valueProp:
        'For enterprise AI teams deploying 100B+ parameter models who risk millions on silent hardware failure and spot reclamation, Vanguard Cloud guarantees dedicated 99.99% cluster SLA uptime on certified B200 and H200 pods, unlike spot-instance providers.',
      evidence:
        'Nebius cut unreserved H100 rates by 18%; CoreWeave enforces multi-year take-or-pay commitments. Vanguard Cloud captures high-value foundation labs by leading with deterministic InfiniBand fabric SLAs and zero-jitter completion guarantees.',
    },
    {
      num: '02',
      tag: '02 / PR & POLICY',
      name: 'PR & Policy Specialist',
      domain: 'Narrative & Sovereign Governance',
      telemetry: 'Illustrative scenario · execution metrics unavailable',
      signal: 'Draft launch proposals suggest public aggressive disparagement of competitor cluster downtime.',
      valueProp:
        'Pivots from aggressive competitor attack campaigns toward verified European data sovereignty, ISO 27001 auditing, and clean geothermal energy compliance proofs.',
      evidence:
        'Blocks unverified comparative claims that invite counter-benchmarks and regulatory scrutiny. Establishes verifiable GDPR Article 28 data residency guarantees for enterprise compliance officers.',
    },
    {
      num: '03',
      tag: '03 / SOCIAL COMMUNITY',
      name: 'Social Community Specialist',
      domain: 'Developer Ecosystem & Sentiment',
      telemetry: 'Illustrative scenario · execution metrics unavailable',
      signal: 'ML engineers on technical forums report frustration with orchestrator cold-starts and egress fees.',
      valueProp:
        'Win technical advocates organically by releasing open-source NCCL all-reduce benchmark scripts, sub-second bare-metal SSH provisioning, and zero-egress transparency.',
      evidence:
        'Developer mindshare rejects corporate buzzwords; engagement signals peak around transparent network telemetry, Slurm scripts, and reproducible multi-node training benchmarks.',
    },
    {
      num: '04',
      tag: '04 / PRODUCT MARKETING',
      name: 'Product Marketing Specialist',
      domain: 'SKUs & TCO Battlecards',
      telemetry: 'Illustrative scenario · execution metrics unavailable',
      signal: 'Enterprise procurement RFPs comparing H100, H200, and B200 cluster pricing across 12 rivals.',
      valueProp:
        'Equip sales engineering with head-to-head InfiniBand vs RoCEv2 fabric battlecards, factoring in training restart overhead caused by competitor packet drop rates.',
      evidence:
        'Identifies canonical SKU overlaps across CoreWeave, Nebius, and Lambda Labs on H100/H200. B200 upgrade protection bundled with storage fabric anchors multi-year enterprise renewals.',
    },
    {
      num: '05',
      tag: '05 / FIELD EVENTS',
      name: 'Field Events Specialist',
      domain: 'Executive Summits & Keynotes',
      telemetry: 'Illustrative scenario · execution metrics unavailable',
      signal: 'Four tracked cloud competitors sponsoring multi-million dollar keynote tracks at major AI conferences.',
      valueProp:
        'Direct commercial field capital away from low-yield booth swag into private, invite-only CTO roundtables on sovereign AI economics backed by live telemetry.',
      evidence:
        'C-suite infrastructure buyers make vendor decisions through intimate peer roundtables and deterministic TCO workshops rather than public trade show floors.',
    },
  ];

  // ===========================================================================
  // PHASE 2b: Strict Non-Overlapping Opening Morph (0.00 -> 0.15)
  //
  // p 0.00 to 0.06: ONLY knowledge-base card visible. Text fades, box shrinks to tab height.
  // p 0.06 to 0.13: ONLY five tabs visible, spreading and moving to stack position.
  // p 0.13 to 0.15: Card 1 body expands from tab height (clip-path, NOT opacity).
  //
  // Every element outside its range is strictly visibility: hidden, pointer-events: none.
  // ===========================================================================

  // 1. Knowledge-base Card (0.00 -> 0.06)
  const centralNodeTextOpacity = useTransform(smoothProgress, [0.00, 0.035, MORPH_KNOWLEDGE_END], [1, 0.3, 0]);
  const centralNodeMaxHeight = useTransform(smoothProgress, [0.00, MORPH_KNOWLEDGE_END], ['240px', '44px']);
  const centralNodeScale = useTransform(smoothProgress, [0.00, MORPH_KNOWLEDGE_END], [1, 0.94]);
  const centralNodeY = useTransform(smoothProgress, [0.00, MORPH_KNOWLEDGE_END], ['0px', '-8px']);
  const centralNodeVisibility = useTransform(smoothProgress, (v) => (v < MORPH_KNOWLEDGE_END ? 'visible' : 'hidden'));

  // 2. 5 Tabs Row (0.06 -> 0.13)
  const splitTabsVisibility = useTransform(
    smoothProgress,
    (v) => (v >= MORPH_TABS_START && v < MORPH_TABS_END ? 'visible' : 'hidden')
  );
  const splitTabsY = useTransform(
    smoothProgress,
    [MORPH_TABS_START, 0.085, 0.11, MORPH_TABS_END],
    ['0px', '0px', '-14px', '-28px']
  );
  const splitTabsScale = useTransform(
    smoothProgress,
    [MORPH_TABS_START, 0.085, 0.11, MORPH_TABS_END],
    [0.94, 1.0, 0.99, 0.97]
  );

  // 3. Stacking Deck Cascade from deckTimeline
  const cardConfigs = dossiers.map((_, i) => getCardTimelineConfig(i));

  // Card 1 Body Expansion (0.13 -> 0.15) via clip-path and maxHeight (NO opacity animation)
  const c0Vis = useTransform(
    smoothProgress,
    (v) => (v >= CARD_1_EXPAND_START && v < CARD_ARRIVAL_POINTS[4] ? 'visible' : 'hidden')
  );
  const c0MaxHeight = useTransform(
    smoothProgress,
    [CARD_1_EXPAND_START, CARD_1_EXPAND_END],
    ['44px', '650px']
  );
  const c0BodyClip = useTransform(
    smoothProgress,
    [CARD_1_EXPAND_START, CARD_1_EXPAND_END],
    ['inset(0% 0% 100% 0%)', 'inset(0% 0% 0% 0%)']
  );

  // Transform hooks per card
  const c0Y = useTransform(smoothProgress, cardConfigs[0].inputProgressY, cardConfigs[0].outputY);
  const c0Scale = useTransform(smoothProgress, cardConfigs[0].inputProgressScale, cardConfigs[0].outputScale);
  const c0Tint = useTransform(smoothProgress, cardConfigs[0].inputProgressTint, cardConfigs[0].outputTint);

  const c1Y = useTransform(smoothProgress, cardConfigs[1].inputProgressY, cardConfigs[1].outputY);
  const c1Scale = useTransform(smoothProgress, cardConfigs[1].inputProgressScale, cardConfigs[1].outputScale);
  const c1Tint = useTransform(smoothProgress, cardConfigs[1].inputProgressTint, cardConfigs[1].outputTint);
  const c1Vis = useTransform(smoothProgress, (v) => (v >= cardConfigs[1].enterStart ? 'visible' : 'hidden'));

  const c2Y = useTransform(smoothProgress, cardConfigs[2].inputProgressY, cardConfigs[2].outputY);
  const c2Scale = useTransform(smoothProgress, cardConfigs[2].inputProgressScale, cardConfigs[2].outputScale);
  const c2Tint = useTransform(smoothProgress, cardConfigs[2].inputProgressTint, cardConfigs[2].outputTint);
  const c2Vis = useTransform(smoothProgress, (v) => (v >= cardConfigs[2].enterStart ? 'visible' : 'hidden'));

  const c3Y = useTransform(smoothProgress, cardConfigs[3].inputProgressY, cardConfigs[3].outputY);
  const c3Scale = useTransform(smoothProgress, cardConfigs[3].inputProgressScale, cardConfigs[3].outputScale);
  const c3Tint = useTransform(smoothProgress, cardConfigs[3].inputProgressTint, cardConfigs[3].outputTint);
  const c3Vis = useTransform(smoothProgress, (v) => (v >= cardConfigs[3].enterStart ? 'visible' : 'hidden'));

  const c4Y = useTransform(smoothProgress, cardConfigs[4].inputProgressY, cardConfigs[4].outputY);
  const c4Scale = useTransform(smoothProgress, cardConfigs[4].inputProgressScale, cardConfigs[4].outputScale);
  const c4Tint = useTransform(smoothProgress, cardConfigs[4].inputProgressTint, cardConfigs[4].outputTint);
  const c4Vis = useTransform(smoothProgress, (v) => (v >= cardConfigs[4].enterStart ? 'visible' : 'hidden'));

  const cardTransforms = [
    { y: c0Y, scale: c0Scale, tint: c0Tint, visibility: c0Vis, z: 10 },
    { y: c1Y, scale: c1Scale, tint: c1Tint, visibility: c1Vis, z: 20 },
    { y: c2Y, scale: c2Scale, tint: c2Tint, visibility: c2Vis, z: 30 },
    { y: c3Y, scale: c3Scale, tint: c3Tint, visibility: c3Vis, z: 40 },
    { y: c4Y, scale: c4Scale, tint: c4Tint, visibility: c4Vis, z: 50 },
  ];

  return (
    <section
      ref={containerRef}
      style={{ height: staticLayout ? 'auto' : CONTAINER_HEIGHT }}
      className="relative w-full bg-[#F6F5F1] overflow-x-clip"
    >
      {/* Sticky Viewport Stage: Pinned below navbar */}
      <div
        style={{ visibility: !staticLayout && isNavCrossing ? 'hidden' : 'visible' }}
        className={staticLayout ? 'w-full' : 'sticky top-14 h-[calc(100vh-3.5rem)] w-full grid place-items-center px-4 sm:px-6 lg:px-8 overflow-x-clip select-none'}
      >
        
        {/* =================================================================== */}
        {/* PHASE 2b: Morphing Central Node (0.00 -> 0.06 ONLY)                 */}
        {/* =================================================================== */}
        <motion.div
          style={{
            y: centralNodeY,
            scale: centralNodeScale,
            visibility: centralNodeVisibility,
          }}
          className={`col-start-1 row-start-1 z-20 max-w-xl w-full text-center pointer-events-none ${staticLayout ? 'hidden' : ''}`}
        >
          <motion.div
            style={{
              maxHeight: centralNodeMaxHeight,
            }}
            className="bg-[#FFFFFF] border border-[#111315] p-8 shadow-xs overflow-hidden flex flex-col justify-center items-center"
          >
            <motion.div style={{ opacity: centralNodeTextOpacity }} className="w-full">
              <div className="inline-flex items-center gap-2 text-xs font-mono text-[#2563EB] uppercase tracking-wider mb-2">
                <Database size={13} />
                <span>Grounded Knowledge Base</span>
              </div>
              <h3 className="font-display font-bold text-2xl text-[#111315] tracking-tight">
                12 Cloud Competitors Ingested
              </h3>
              <p className="font-sans text-xs text-[#4A505C] mt-2 leading-relaxed">
                Curated primary sources on B200, H200, and H100 GPU cluster pricing, network latency, and SLAs.
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 font-mono text-[11px] text-[#6E7685]">
                <span>↓ Scroll to cascade specialist dossiers</span>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* =================================================================== */}
        {/* PHASE 2b: 5 Small Tabs (0.06 -> 0.13 ONLY)                         */}
        {/* =================================================================== */}
        <motion.div
          style={{
            y: splitTabsY,
            scale: splitTabsScale,
            visibility: splitTabsVisibility,
            width: 'clamp(900px, 70vw, 1100px)',
            maxWidth: '100%',
          }}
          className={`col-start-1 row-start-1 z-30 flex items-center justify-center gap-2 sm:gap-3 pointer-events-auto ${staticLayout ? 'hidden' : ''}`}
        >
          {dossiers.map((d, i) => (
            <button
              key={d.num}
              type="button"
              onClick={() => handleTabClick(i)}
              className="group px-3 sm:px-4 py-2 bg-[#FFFFFF] border border-[#111315] shadow-xs flex items-center gap-1.5 font-mono text-[11px] sm:text-xs font-semibold text-[#111315] cursor-pointer hover:border-[#2563EB] transition-colors"
            >
              <span className="text-[#2563EB]">{d.num}</span>
              <span className="hidden sm:inline group-hover:underline decoration-[#111315] decoration-2 underline-offset-4">
                / {d.name.split(' ')[0]}
              </span>
            </button>
          ))}
        </motion.div>

        {/* =================================================================== */}
        {/* PHASE 3: Stacking Dossier Deck (Two-Panel Layout)                   */}
        {/* =================================================================== */}
        <div
          style={{ width: staticLayout ? '100%' : 'clamp(900px, 70vw, 1100px)', maxWidth: '100%' }}
          className={staticLayout ? 'space-y-4' : 'col-start-1 row-start-1 grid place-items-center'}
        >
          {dossiers.map((dossier, idx) => {
            const transform = cardTransforms[idx];
            const isActive = idx === activeCardIndex;
            const isCard1 = idx === 0;
            const HeaderTag = staticLayout ? 'h3' : 'button';

            return (
              <motion.div
                key={dossier.num}
                style={staticLayout ? { width: '100%' } : {
                  y: transform.y,
                  scale: transform.scale,
                  zIndex: transform.z,
                  visibility: transform.visibility,
                  width: 'clamp(900px, 70vw, 1100px)',
                  maxWidth: '100%',
                  ...(isCard1 ? { maxHeight: c0MaxHeight } : {}),
                }}
                className="col-start-1 row-start-1"
              >
                {/* 
                  The Physical Card: 
                  - Solid 100% OPAQUE #FFFFFF paper (no card shows through another)
                  - 1px hairline border #111315
                  - Fits inside 100vh - 56px navbar at 1366x768
                */}
                <div className={`relative bg-[#FFFFFF] border border-[#111315] shadow-md flex flex-col ${staticLayout ? '' : 'max-h-[calc(100vh-4rem)] overflow-hidden'}`}>
                  
                  {/* Ink Overlay for Dimming Previous Cards */}
                  {!staticLayout && transform.tint !== 0 && (
                    <motion.div
                      style={{ opacity: transform.tint }}
                      className="absolute inset-0 bg-[#111315] pointer-events-none z-40 transition-opacity"
                    />
                  )}

                  {/* Top Header Strip with Protruding Tab & Real Monochromatic Telemetry */}
                  <div className={`relative ${staticLayout ? 'z-20' : 'z-50'} flex flex-wrap items-center justify-between gap-2 border-b border-[#111315] bg-[#ECEAE3] px-4 sm:px-6 py-2.5`}>
                    
                    {/* Tab Protruding on Left - Clickable with Hover Ink Underline & Blue Active State */}
                    <HeaderTag
                      type={staticLayout ? undefined : 'button'}
                      onClick={staticLayout ? undefined : () => handleTabClick(idx)}
                      className="group flex items-center gap-2 text-left cursor-pointer focus:outline-none"
                      aria-label={staticLayout ? dossier.name : `Scroll to ${dossier.name}`}
                    >
                      <div
                        className={`font-mono text-xs font-semibold px-3 py-1 tracking-wider uppercase transition-colors ${
                          isActive
                            ? 'bg-[#2563EB] text-[#FFFFFF]'
                            : 'bg-[#111315] text-[#FFFFFF] group-hover:bg-[#2563EB]'
                        }`}
                      >
                        <span className="group-hover:underline decoration-[#FFFFFF] underline-offset-2">
                          {dossier.tag}
                        </span>
                      </div>
                      <span className="font-sans text-xs font-semibold text-[#111315] hidden sm:inline group-hover:underline decoration-[#111315] decoration-2 underline-offset-4">
                        {dossier.domain}
                      </span>
                    </HeaderTag>

                    {/* Illustrative examples; genuine provider captures are a later phase */}
                    <div className="font-mono text-[10.5px] text-[#4A505C] tracking-tight">
                      {dossier.telemetry}
                    </div>
                  </div>

                  {/* Card Content Body: Expands from tab height via clip-path on Card 1 (0.13 -> 0.15) */}
                  <motion.div
                    style={{
                      ...(isCard1 && !staticLayout ? { clipPath: c0BodyClip } : {}),
                      padding: 'clamp(0.85rem, 1.4vw, 1.25rem)',
                    }}
                    className="overflow-hidden"
                  >
                    {/* Two-Panel Layout: 55% Left (Content) / 45% Right (Scene Stage) */}
                    <div className="grid grid-cols-1 md:grid-cols-[11fr_9fr] gap-4 lg:gap-5 items-stretch w-full">
                      
                      {/* Left Panel (~55%): Strategy Formulation & Attribution */}
                      <div className="flex flex-col justify-between space-y-3 min-w-0">
                        <div className="space-y-2.5">
                          {/* Market Signal Intake */}
                          <div className="p-2.5 sm:p-3 bg-[#F6F5F1] border-l-2 border-[#111315] space-y-1">
                            <span className="font-mono text-[9.5px] sm:text-[10px] uppercase tracking-wider text-[#6E7685] font-semibold block">
                              Simulated Market Signal
                            </span>
                            <p className="font-sans text-[11.5px] sm:text-[12.5px] text-[#111315] font-medium leading-relaxed">
                              {dossier.signal}
                            </p>
                          </div>

                          {/* Core Selling Statement (Value Proposition) */}
                          <div className="space-y-1">
                            <span className="font-mono text-[9.5px] sm:text-[10px] uppercase tracking-wider text-[#2563EB] font-semibold block">
                              Illustrative Positioning Example
                            </span>
                            <blockquote className="p-2.5 sm:p-3 bg-[#F6F5F1] border border-[#D4D1C7] text-[11.5px] sm:text-[12.5px] font-serif italic text-[#111315] leading-relaxed">
                              "{dossier.valueProp}"
                            </blockquote>
                          </div>

                          {/* Grounded Evidence & Strategic Rationale */}
                          <div className="space-y-0.5">
                            <span className="font-mono text-[9.5px] sm:text-[10px] uppercase tracking-wider text-[#111315] font-semibold block">
                              Illustrative Context & Rationale
                            </span>
                            <p className="font-sans text-[11px] sm:text-[11.5px] text-[#4A505C] leading-relaxed">
                              {dossier.evidence}
                            </p>
                          </div>
                        </div>

                        {/* Footer Action Strip */}
                        <div className="pt-2 border-t border-[#D4D1C7] flex items-center justify-between gap-3">
                          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-mono text-[#15803D]">
                            <ShieldCheck size={13} className="shrink-0" />
                            <span>Fictional Vanguard Cloud example</span>
                          </div>

                          {/* Launch Console Button: ONLY on Card 5 (idx === 4) */}
                          {idx === 4 && (
                            <button
                              type="button"
                              onClick={onLaunchConsole}
                              className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-[#FFFFFF] bg-[#111315] hover:bg-[#2563EB] px-3.5 py-1.5 transition-colors cursor-pointer active:scale-[0.98] shrink-0"
                            >
                              <Lock size={11} strokeWidth={2} />
                              <span>Launch Console</span>
                              <ArrowRight size={11} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Right Panel (~45%): Empty Scene Stage */}
                      {!staticLayout ? <div
                        style={{ minHeight: 'clamp(270px, 35vh, 320px)' }}
                        className="relative border border-[#D4D1C7] bg-[#FBF9F5] p-3 sm:p-3.5 flex flex-col justify-between overflow-hidden"
                      >
                        {/* Mono label in top-left corner */}
                        <div className="font-mono text-[10px] sm:text-[10.5px] uppercase tracking-wider text-[#6E7685] font-semibold">
                          WHAT THIS AGENT DOES
                        </div>

                        {/* Empty scene stage (reserved for future visualizer / animations) */}
                        <div className="flex-1 flex items-center justify-center">
                          {/* Empty scene stage */}
                        </div>
                      </div> : <p className="text-xs text-[#4A505C]">Physical agent scenes are planned. This card is an illustrative example.</p>}

                    </div>
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom Scroll Progress Tick (Monochrome) */}
        <div
          style={{ width: 'clamp(900px, 70vw, 1100px)', maxWidth: '100%' }}
          className={`col-start-1 row-start-1 flex justify-end items-end h-full pb-4 pr-2 font-mono text-[10.5px] text-[#6E7685] pointer-events-none ${staticLayout ? 'hidden' : ''}`}
        >
          <span>Cascading 5 Specialist Dossiers · Scroll to advance</span>
        </div>
      </div>
    </section>
  );
}
