import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export const AGENT_STORIES = {
  synthesis: {
    id: 'synthesis',
    label: 'Executive Synthesis Engine',
    badge: 'Cross-Specialist Consensus Engine',
    signalTitle: '5 Simultaneous Domain Briefs Ingested',
    signalDetail:
      'Aggregates independent findings across Branding, PR & Policy, Social Community, Product Marketing, and Field Events over 12 AI cloud competitors.',
    lensAction: 'Reconciles Strategic Tensions & Verifies Citations',
    activePills: ['Cross-Domain Consensus', 'Preserved Tensions', '12 Cloud Rivals', 'Verified Citations'],
    metrics: [
      { label: 'CoreWeave & Nebius SLA Gap', value: 'Verified', tone: 'blue' },
      { label: 'EU Sovereign Compliance', value: 'Cleared', tone: 'green' },
    ],
    outputSummary:
      'Produces one unified Weekly Executive Intelligence Brief with attributable specialist viewpoints and zero unbacked claims.',
  },
  branding: {
    id: 'branding',
    label: 'Branding Specialist',
    badge: 'Positioning & SLAs',
    signalTitle: 'Competitor Spot & Reserved H100 Discounting',
    signalDetail:
      'CoreWeave and RunPod lower headline hourly GPU rates; executive team asks whether to match discounts or reframe the category.',
    lensAction: 'Strikes Commodity Claims -> Forges Category Frame',
    struckClaim: '"Lowest per-hour H100 rental rates"',
    activePills: ['AI Foundry Positioning', 'Deterministic InfiniBand SLA', 'Zero-Jitter Training'],
    metrics: [
      { label: 'Category Frame', value: 'Enterprise AI Foundry', tone: 'blue' },
      { label: 'Primary Proof', value: 'Guaranteed Run Completion', tone: 'green' },
    ],
    outputSummary:
      'Lead with deterministic cluster completion SLAs and InfiniBand fabric stability—positioning raw hourly discounting as unbundled commodity compute.',
  },
  pr: {
    id: 'pr',
    label: 'PR & Policy Specialist',
    badge: 'Narrative & Policy',
    signalTitle: 'Aggressive Competitor Attack Campaign Proposed',
    signalDetail:
      'Draft launch messaging proposes calling out Nebius and Lambda Labs on multi-node cluster reliability in European markets.',
    lensAction: 'Scans Regulatory & Counter-Benchmark Exposure',
    struckClaim: '"Direct attack ads on rival cluster downtime"',
    activePills: ['EU GDPR Sovereignty', 'Counter-Benchmark Shield', 'Clean Energy Audit'],
    metrics: [
      { label: 'Risk Escalation', value: 'CMO Policy Review', tone: 'amber' },
      { label: 'Safe Pivot', value: 'Sovereign Residency', tone: 'green' },
    ],
    outputSummary:
      'Blocks unverified disparagement that invites counter-benchmarks; pivots public narrative to audited European data residency and GDPR compliance.',
  },
  social: {
    id: 'social',
    label: 'Social Community Specialist',
    badge: 'Sentiment & Community',
    signalTitle: 'Developer Chatter on Orchestrator Lock-In & Cold Starts',
    signalDetail:
      'ML engineers across technical channels debate bare-metal SSH access versus managed Kubernetes overhead on H100/H200 clusters.',
    lensAction: 'Filters Hype -> Isolates Developer Advocacy Signals',
    activePills: ['Bare-Metal SSH Speed', 'Sub-Second Spin-Up', 'Transparent Egress', 'Reproducible Benchmarks'],
    metrics: [
      { label: 'Dev Resonance', value: 'High (Bare-Metal + Slurm)', tone: 'blue' },
      { label: 'Avoid', value: 'Vague Enterprise Slogans', tone: 'amber' },
    ],
    outputSummary:
      'Publish open-source NCCL all-reduce benchmark scripts and bare-metal provisioning times to win technical advocates organically.',
  },
  pmm: {
    id: 'pmm',
    label: 'Product Marketing Specialist',
    badge: 'SKUs & Battlecards',
    signalTitle: 'Enterprise RFP Comparing B200, H200 & H100 Fleets',
    signalDetail:
      'Procurement team evaluates shared GPU SKUs across CoreWeave, Nebius, Lambda Labs, Together AI, and Crusoe.',
    lensAction: 'Maps Shared-SKU Overlap & Total Cost of Ownership',
    activePills: ['B200', 'H200', 'H100', 'A100', 'L40S', 'HGX'],
    metrics: [
      { label: 'Shared-SKU Rivals', value: 'CoreWeave · Nebius · Lambda', tone: 'blue' },
      { label: 'GTM Wedge', value: 'Bundled Fabric + B200 Path', tone: 'green' },
    ],
    outputSummary:
      'Equip sales with a TCO battlecard exposing hidden competitor charges for InfiniBand networking and storage egress.',
  },
  events: {
    id: 'events',
    label: 'Field Events Specialist',
    badge: 'Executive Summits',
    signalTitle: 'Upcoming European AI Infrastructure Summit',
    signalDetail:
      'Four tracked GPU cloud competitors are sponsoring booth and keynote slots targeting enterprise AI leaders.',
    lensAction: 'Aligns Regional Competitor Moves to Keynote Tracks',
    activePills: ['CTO Sovereign AI Roundtable', 'Live B200 Cluster Demo', 'Executive TCO Briefing'],
    metrics: [
      { label: 'Primary Format', value: 'Invite-Only CTO Summit', tone: 'blue' },
      { label: 'Keynote Hook', value: 'Deterministic Training Economics', tone: 'green' },
    ],
    outputSummary:
      'Capture C-suite pipeline via an executive roundtable on sovereign AI economics rather than competing for generic booth traffic.',
  },
};

export default function AgentStoryStage({ selectedKey = 'synthesis', onSelectKey, onLaunchConsole }) {
  const keys = ['synthesis', 'branding', 'pr', 'social', 'pmm', 'events'];
  const current = AGENT_STORIES[selectedKey] || AGENT_STORIES.synthesis;
  const nextKey = keys[(keys.indexOf(current.id) + 1) % keys.length];

  return (
    <div className="border-t border-[#D4D1C7] bg-[#F6F5F1] p-5 lg:p-6 transition-colors duration-200">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#D4D1C7]">
        <div className="flex items-center gap-2.5">
          <span className="inline-block w-2 h-2 rounded-full bg-[#2563EB] animate-pulse" />
          <span className="font-mono text-[11px] uppercase tracking-wider text-[#4A505C]">
            Interactive Story Stage:
          </span>
          <span className="font-display text-sm font-bold text-[#111315]">
            {current.label}
          </span>
          <span className="font-mono text-[11px] px-2 py-0.5 bg-white border border-[#D4D1C7] text-[#4A505C]">
            {current.badge}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onSelectKey && onSelectKey(nextKey)}
          className="font-mono text-xs text-[#2563EB] hover:underline active:scale-[0.98] transition-transform cursor-pointer"
        >
          Play Next Specialist Story →
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ type: 'spring', stiffness: 340, damping: 30 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4"
        >
          {/* Step 1: Signal Intake */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.04, type: 'spring', stiffness: 300, damping: 28 }}
            className="bg-white border border-[#D4D1C7] p-4 flex flex-col justify-between shadow-2xs"
          >
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-[#6E7685]">
                Step 01 // Market Signal Intake
              </div>
              <div className="font-sans text-sm font-semibold text-[#111315] mt-1.5">
                {current.signalTitle}
              </div>
              <p className="font-sans text-xs text-[#4A505C] mt-1.5 leading-relaxed">
                {current.signalDetail}
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-[#ECEAE3] font-mono text-[10px] text-[#15803D]">
              ✓ Grounded in 12-Competitor Knowledge Base
            </div>
          </motion.div>

          {/* Step 2: Animated Specialist Lens */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, type: 'spring', stiffness: 300, damping: 28 }}
            className="bg-white border-2 border-[#2563EB] p-4 flex flex-col justify-between shadow-xs"
          >
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-[#2563EB] font-bold">
                Step 02 // Active Domain Reasoning
              </div>
              <div className="font-sans text-sm font-semibold text-[#111315] mt-1.5">
                {current.lensAction}
              </div>
              {current.struckClaim && (
                <div className="mt-2 px-2 py-1 bg-[#FEF2F2] border border-[#FECACA] font-mono text-[10px] text-[#B91C1C] line-through">
                  {current.struckClaim}
                </div>
              )}
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {current.activePills.map((pill, idx) => (
                  <motion.span
                    key={pill}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.18 + idx * 0.05 }}
                    className="font-mono text-[10px] px-2 py-0.5 bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]"
                  >
                    {pill}
                  </motion.span>
                ))}
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-[#ECEAE3] space-y-1">
              {current.metrics.map((m) => (
                <div key={m.label} className="flex items-center justify-between font-mono text-[10px]">
                  <span className="text-[#6E7685]">{m.label}:</span>
                  <span className={`font-semibold ${m.tone === 'green' ? 'text-[#15803D]' : m.tone === 'amber' ? 'text-[#B45309]' : 'text-[#2563EB]'}`}>
                    {m.value}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Step 3: Concrete Executive Output */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 28 }}
            className="bg-[#111315] text-white p-4 flex flex-col justify-between shadow-xs"
          >
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-[#60A5FA]">
                Step 03 // Formulated Strategy Output
              </div>
              <p className="font-sans text-xs text-white/95 mt-2 leading-relaxed">
                {current.outputSummary}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between">
              <span className="font-mono text-[10px] text-white/60">
                Scoped Memory Protected
              </span>
              <button
                type="button"
                onClick={onLaunchConsole}
                className="font-mono text-[11px] font-medium text-[#60A5FA] hover:text-white active:scale-[0.98] transition-all cursor-pointer"
              >
                Launch Console ↗
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
