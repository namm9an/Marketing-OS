import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { ArrowRight, Lock, Database, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function PinnedDossierCascade({ onLaunchConsole }) {
  const containerRef = useRef(null);

  // Track scroll progress through the 500vh container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Smooth scroll spring physics
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 180,
    damping: 26,
    restDelta: 0.001,
  });

  // 5 Specialist Dossier Case Files
  const dossiers = [
    {
      num: '01',
      tag: '01 / BRANDING',
      name: 'Branding Specialist',
      domain: 'Positioning & Cluster SLAs',
      telemetry: '1,240ms · 812 TOKENS · 26 SOURCES · GEMINI-3.8-FLASH',
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
      telemetry: '1,180ms · 764 TOKENS · 22 SOURCES · GEMINI-3.8-FLASH',
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
      telemetry: '980ms · 640 TOKENS · 18 SOURCES · GEMINI-3.8-FLASH',
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
      telemetry: '1,520ms · 910 TOKENS · 36 SOURCES · GEMINI-3.8-FLASH',
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
      telemetry: '1,060ms · 580 TOKENS · 14 SOURCES · GEMINI-3.8-FLASH',
      signal: 'Four tracked cloud competitors sponsoring multi-million dollar keynote tracks at major AI conferences.',
      valueProp:
        'Direct commercial field capital away from low-yield booth swag into private, invite-only CTO roundtables on sovereign AI economics backed by live telemetry.',
      evidence:
        'C-suite infrastructure buyers make vendor decisions through intimate peer roundtables and deterministic TCO workshops rather than public trade show floors.',
    },
  ];

  // ===========================================================================
  // PHASE 1: 0.0 -> 0.20 (The Central Node -> 5 Tabs Morph)
  // ===========================================================================
  const centralNodeOpacity = useTransform(smoothProgress, [0.0, 0.08, 0.14], [1, 1, 0]);
  const centralNodeScale = useTransform(smoothProgress, [0.0, 0.08, 0.14], [1, 1.05, 0.9]);
  const centralNodeY = useTransform(smoothProgress, [0.0, 0.08, 0.14], ['0px', '-10px', '-30px']);

  const splitTabsOpacity = useTransform(smoothProgress, [0.07, 0.11, 0.17, 0.21], [0, 1, 1, 0]);
  const splitTabsY = useTransform(smoothProgress, [0.07, 0.14, 0.21], ['20px', '0px', '-20px']);
  const splitTabsScale = useTransform(smoothProgress, [0.07, 0.14, 0.21], [0.95, 1, 0.98]);

  // Deck container visibility (fades in as morph completes)
  const deckOpacity = useTransform(smoothProgress, [0.15, 0.20], [0, 1]);

  // ===========================================================================
  // PHASE 2: Stacking Deck Cascade (0.20 -> 0.85) + 15% Hold (0.85 -> 1.00)
  // Step 1: 0.18 -> 0.33 (Card 1 Active)
  // Step 2: 0.33 -> 0.48 (Card 2 Glides in)
  // Step 3: 0.48 -> 0.63 (Card 3 Glides in)
  // Step 4: 0.63 -> 0.78 (Card 4 Glides in)
  // Step 5: 0.78 -> 0.85 (Card 5 Glides in)
  // Hold 5: 0.85 -> 1.00 (Card 5 Stays locked & active for 15% scroll before unpinning)
  // ===========================================================================

  // Card 1: Enters at 0.18, active until 0.33. Exits at 0.80 -> 0.85 when Card 5 arrives!
  const c1Y = useTransform(smoothProgress, [0.18, 0.33, 0.48, 0.63, 0.80, 0.85], ['0px', '-28px', '-56px', '-84px', '-84px', '-160px']);
  const c1Scale = useTransform(smoothProgress, [0.18, 0.33, 0.48, 0.63, 0.80, 0.85], [1, 0.98, 0.96, 0.94, 0.94, 0.90]);
  const c1TintOpacity = useTransform(smoothProgress, [0.18, 0.33, 0.48, 0.63, 0.80, 0.85], [0, 0.25, 0.45, 0.60, 0.60, 1]);
  const c1Opacity = useTransform(smoothProgress, [0.18, 0.22, 0.80, 0.85], [0, 1, 1, 0]);

  // Card 2: Glides up at 0.33 -> 0.38, active until 0.48, steps back, stays until 1.0
  const c2Y = useTransform(smoothProgress, [0.28, 0.38, 0.48, 0.63, 0.83], ['120px', '0px', '-28px', '-56px', '-84px']);
  const c2Scale = useTransform(smoothProgress, [0.28, 0.38, 0.48, 0.63, 0.83], [0.96, 1, 0.98, 0.96, 0.94]);
  const c2TintOpacity = useTransform(smoothProgress, [0.35, 0.40, 0.48, 0.63, 0.83], [0, 0, 0.25, 0.45, 0.60]);
  const c2Opacity = useTransform(smoothProgress, [0.28, 0.35], [0, 1]);

  // Card 3: Glides up at 0.48 -> 0.53, active until 0.63, steps back, stays until 1.0
  const c3Y = useTransform(smoothProgress, [0.43, 0.53, 0.63, 0.78, 0.83], ['120px', '0px', '-28px', '-56px', '-56px']);
  const c3Scale = useTransform(smoothProgress, [0.43, 0.53, 0.63, 0.78, 0.83], [0.96, 1, 0.98, 0.96, 0.96]);
  const c3TintOpacity = useTransform(smoothProgress, [0.50, 0.55, 0.63, 0.78], [0, 0, 0.25, 0.45]);
  const c3Opacity = useTransform(smoothProgress, [0.43, 0.50], [0, 1]);

  // Card 4: Glides up at 0.63 -> 0.68, active until 0.78, steps back to -28px, stays until 1.0
  const c4Y = useTransform(smoothProgress, [0.58, 0.68, 0.78, 0.83], ['120px', '0px', '-28px', '-28px']);
  const c4Scale = useTransform(smoothProgress, [0.58, 0.68, 0.78, 0.83], [0.96, 1, 0.98, 0.98]);
  const c4TintOpacity = useTransform(smoothProgress, [0.65, 0.70, 0.78], [0, 0, 0.25]);
  const c4Opacity = useTransform(smoothProgress, [0.58, 0.65], [0, 1]);

  // Card 5: Glides up at 0.78 -> 0.83, active throughout 0.83 -> 1.00 (15% Hold!)
  const c5Y = useTransform(smoothProgress, [0.73, 0.83, 1.00], ['120px', '0px', '0px']);
  const c5Scale = useTransform(smoothProgress, [0.73, 0.83, 1.00], [0.96, 1, 1]);
  const c5Opacity = useTransform(smoothProgress, [0.73, 0.80], [0, 1]);

  const cardTransforms = [
    { y: c1Y, scale: c1Scale, tint: c1TintOpacity, opacity: c1Opacity, z: 10 },
    { y: c2Y, scale: c2Scale, tint: c2TintOpacity, opacity: c2Opacity, z: 20 },
    { y: c3Y, scale: c3Y, tint: c3TintOpacity, opacity: c3Opacity, z: 30 },
    { y: c4Y, scale: c4Y, tint: c4TintOpacity, opacity: c4Opacity, z: 40 },
    { y: c5Y, scale: c5Y, tint: 0, opacity: c5Opacity, z: 50 },
  ];

  return (
    <section ref={containerRef} className="relative h-[500vh] w-full bg-[#F6F5F1]">
      {/* Sticky Viewport Stage: Pinned below navbar */}
      <div className="sticky top-14 h-[calc(100vh-3.5rem)] w-full flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 overflow-hidden select-none">
        
        {/* =================================================================== */}
        {/* PHASE 1 (0.0 -> 0.20): Morphing Central Node & 5-Tab Fan-out       */}
        {/* =================================================================== */}
        <motion.div
          style={{ opacity: centralNodeOpacity, scale: centralNodeScale, y: centralNodeY }}
          className="absolute z-30 max-w-xl w-full text-center"
        >
          <div className="bg-[#FFFFFF] border border-[#111315] p-8 shadow-xs">
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
          </div>
        </motion.div>

        {/* 5 Small Tabs splitting horizontally during 0.08 -> 0.18 */}
        <motion.div
          style={{ opacity: splitTabsOpacity, y: splitTabsY, scale: splitTabsScale }}
          className="absolute z-20 max-w-4xl w-full flex items-center justify-center gap-2 sm:gap-3 pointer-events-none"
        >
          {dossiers.map((d) => (
            <div
              key={d.num}
              className="px-3 sm:px-4 py-2 bg-[#FFFFFF] border border-[#111315] shadow-xs flex items-center gap-1.5 font-mono text-[11px] sm:text-xs font-semibold text-[#111315]"
            >
              <span className="text-[#2563EB]">{d.num}</span>
              <span className="hidden sm:inline">/ {d.name.split(' ')[0]}</span>
            </div>
          ))}
        </motion.div>

        {/* =================================================================== */}
        {/* PHASE 2 (0.20 -> 1.00): Stacking Dossier Deck (Opaque Paper Sheets) */}
        {/* =================================================================== */}
        <motion.div
          style={{ opacity: deckOpacity }}
          className="relative w-full max-w-4xl flex items-center justify-center"
        >
          {dossiers.map((dossier, idx) => {
            const transform = cardTransforms[idx];

            return (
              <motion.div
                key={dossier.num}
                style={{
                  y: transform.y,
                  scale: transform.scale,
                  opacity: transform.opacity,
                  zIndex: transform.z,
                }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl"
              >
                {/* 
                  The Physical Card: 
                  - Solid 100% OPAQUE #FFFFFF paper (no card shows through another)
                  - 1px hairline border #111315
                  - Fits in viewport height without clipping
                */}
                <div className="relative bg-[#FFFFFF] border border-[#111315] shadow-md flex flex-col max-h-[calc(100vh-8.5rem)] overflow-hidden">
                  
                  {/* Dark Ink Overlay for Dimming Previous Cards (Change 4: Opaque tint, not CSS opacity!) */}
                  {transform.tint !== 0 && (
                    <motion.div
                      style={{ opacity: transform.tint }}
                      className="absolute inset-0 bg-[#ECEAE3] pointer-events-none z-40 transition-opacity"
                    />
                  )}

                  {/* Top Header Strip with Protruding Tab & Real Monochromatic Telemetry */}
                  <div className="flex items-center justify-between border-b border-[#111315] bg-[#ECEAE3]/70 px-4 sm:px-6 py-2.5">
                    
                    {/* Tab Protruding on Left */}
                    <div className="flex items-center gap-2">
                      <div className="bg-[#111315] text-[#FFFFFF] font-mono text-xs font-semibold px-3 py-1 tracking-wider uppercase">
                        {dossier.tag}
                      </div>
                      <span className="font-sans text-xs font-semibold text-[#111315] hidden sm:inline">
                        {dossier.domain}
                      </span>
                    </div>

                    {/* Monochromatic Telemetry (Real Recorded Data from Test Corpus) */}
                    <div className="font-mono text-[10.5px] text-[#4A505C] tracking-tight">
                      {dossier.telemetry}
                    </div>
                  </div>

                  {/* Card Content Body: Compact & High Density to Fit Viewport */}
                  <div className="p-5 sm:p-6 lg:p-7 space-y-4 overflow-y-auto">
                    
                    {/* Market Signal Intake */}
                    <div className="p-3 bg-[#F6F5F1] border-l-2 border-[#111315] space-y-1">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[#6E7685]">
                        Detected Market Signal
                      </span>
                      <p className="font-sans text-xs sm:text-[13px] text-[#111315] font-medium leading-relaxed">
                        {dossier.signal}
                      </p>
                    </div>

                    {/* Core Selling Statement (Value Proposition) */}
                    <div className="space-y-1.5">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[#2563EB] font-semibold">
                        Formulated Value Proposition (Why Customers Choose Us)
                      </span>
                      <blockquote className="p-4 bg-[#F6F5F1] border border-[#D4D1C7] text-xs sm:text-sm font-serif italic text-[#111315] leading-relaxed">
                        "{dossier.valueProp}"
                      </blockquote>
                    </div>

                    {/* Grounded Evidence & Strategic Rationale */}
                    <div className="space-y-1">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[#111315] font-semibold">
                        Grounded Competitor Evidence & Rationale
                      </span>
                      <p className="font-sans text-xs text-[#4A505C] leading-relaxed">
                        {dossier.evidence}
                      </p>
                    </div>

                    {/* Footer Action Strip */}
                    <div className="pt-3 border-t border-[#D4D1C7] flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-mono text-[#15803D]">
                        <ShieldCheck size={13} />
                        <span>Verified Primary Citation Grounding</span>
                      </div>

                      <button
                        type="button"
                        onClick={onLaunchConsole}
                        className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-[#FFFFFF] bg-[#111315] hover:bg-[#2563EB] px-3.5 py-1.5 transition-colors cursor-pointer active:scale-[0.98]"
                      >
                        <Lock size={11} strokeWidth={2} />
                        <span>Launch Console</span>
                        <ArrowRight size={11} />
                      </button>
                    </div>

                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom Scroll Progress Tick (Monochrome) */}
        <div className="absolute bottom-4 right-6 font-mono text-[10.5px] text-[#6E7685]">
          <span>Cascading 5 Specialist Dossiers · Scroll to advance</span>
        </div>
      </div>
    </section>
  );
}
