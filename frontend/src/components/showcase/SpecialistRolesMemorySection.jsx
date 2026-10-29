import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Lock,
  Database,
  Layers,
  Sparkles,
  AlertOctagon,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Cpu
} from 'lucide-react';
import { digestAndNetworkFixture } from '../../fixtures/caseStudyFixtures';

export default function SpecialistRolesMemorySection() {
  const [selectedSpecialist, setSelectedSpecialist] = useState(0);
  const [activeSignal, setActiveSignal] = useState(0); // 0 | 1 | 2

  const memoryGateSignals = [
    {
      id: 'signal_a',
      type: 'Defamatory Comparative Claim',
      input: '"Claim Vanguard B200 pods are 40% cheaper and faster than Nebius across all fine-tuning workloads."',
      status: 'BLOCKED',
      reason: 'Rule 1 Violation: Unverified comparative marketing claim without audited benchmark runbooks. Blocks legal disparagement exposure.',
      action: 'Rejected · Dropped from pipeline memory'
    },
    {
      id: 'signal_b',
      type: 'Explicit Enterprise Constraint',
      input: '"Enterprise Contract Requirement: Dedicated 99.99% InfiniBand SLA and European sovereign data residency."',
      status: 'PROMOTED',
      reason: 'Rule 2 Passed: Verified operator directive & commercial constraint. Admitted to L1 namespace with cryptographic audit log.',
      action: 'Promoted · Written to L1 SQLite Memory'
    },
    {
      id: 'signal_c',
      type: 'Synthetic Model Rumor',
      input: '"LLM speculation: Unconfirmed rumors suggest CoreWeave will discontinue H100 reservations next month."',
      status: 'BLOCKED',
      reason: 'Rule 3 Violation: Synthetic AI conjecture / ungrounded forum speculation. Excluded from L0 knowledge base to eliminate hallucination loops.',
      action: 'Rejected · Isolated from grounding layer'
    }
  ];

  const specialists = [
    {
      id: 'branding',
      name: 'Branding',
      title: 'Branding Specialist',
      focus: 'Positioning & SLAs',
      mandate: 'Enterprise Market Positioning',
      description:
        'Analyzes competitor marketing campaigns, hardware availability announcements, and pricing pages to position Vanguard Cloud on deterministic infrastructure SLAs rather than joining spot price wars.',
      coreStrengths: [
        'Formulates defensible value propositions based on cluster stability and uptime guarantees.',
        'Anchors on total-cost-of-downtime rather than per-GPU hourly discounts.',
        'Tracks enterprise AI team migration friction and spot instance reclamation risks.',
      ],
      memoryScope: 'Private namespace (agent:branding) · Zero cross-specialist leakage',
    },
    {
      id: 'pr',
      name: 'PR & Policy',
      title: 'PR & Policy Specialist',
      focus: 'Narrative & Policy',
      mandate: 'Corporate Communications & Governance',
      description:
        'Protects enterprise brand reputation by enforcing regulatory compliance, avoiding defamatory comparative claims, and positioning through green energy certifications and European sovereign cloud sovereignty.',
      coreStrengths: [
        'Evaluates defamation and commercial disparagement exposure before public release.',
        'Pivots aggressive market challenges toward GDPR, ISO 27001, and carbon-neutral proofs.',
        'Crafts high-trust executive thought leadership dossiers and crisis communication frameworks.',
      ],
      memoryScope: 'Private namespace (agent:pr) · Enforces escalation gates on high-risk lexicon',
    },
    {
      id: 'social',
      name: 'Social Community',
      title: 'Social Community Specialist',
      focus: 'Sentiment & Community',
      mandate: 'Developer Ecosystem & Sentiment',
      description:
        'Gathers unstructured field signals from developer discussion forums, Discord servers, and GitHub communities to detect developer sentiment shifts before they reflect in quarterly earnings.',
      coreStrengths: [
        'Identifies developer frustration with competitor minimum commitment contracts.',
        'Tracks open-source model fine-tuning toolchain trends across Blackwell and Hopper nodes.',
        'Advises on developer documentation, quick-start templates, and community hackathons.',
      ],
      memoryScope: 'Private namespace (agent:social) · Unstructured signal distillation',
    },
    {
      id: 'product_marketing',
      name: 'Product Marketing',
      title: 'Product Marketing Specialist',
      focus: 'SKUs & Battlecards',
      mandate: 'Competitive Intelligence & Battlecards',
      description:
        'Maintains high-density SKU-level feature and network fabric matrices (InfiniBand vs RoCEv2, NVLink throughput, HBM3e bandwidth) to arm enterprise sales teams with verifiable battlecards.',
      coreStrengths: [
        'Direct head-to-head comparison matrices against Nebius, CoreWeave, and RunPod.',
        'Calculates true TCO taking network packet loss and training job restart overhead into account.',
        'Produces sales engineering objection handling playbooks grounded in verified hardware specs.',
      ],
      memoryScope: 'Private namespace (agent:product_marketing) · SKU telemetry grounding',
    },
    {
      id: 'events',
      name: 'Field Events',
      title: 'Field Events Specialist',
      focus: 'Executive Summits',
      mandate: 'Field Presence & High-Touch Briefings',
      description:
        'Plans targeted presence at premier industry gatherings (NVIDIA GTC, Supercomputing, AI Summit), directing investment into high-conversion executive VIP dinners rather than low-yield booth swag.',
      coreStrengths: [
        'Maps attendee seniority and competitor sponsorship footprint at key tech conferences.',
        'Designs bespoke executive briefing roundtables for enterprise VPs of Engineering.',
        'Aligns product launch announcements with key industry conference news cycles.',
      ],
      memoryScope: 'Private namespace (agent:events) · VIP roundtable engagement tracking',
    },
  ];

  const currentSpecialist = specialists[selectedSpecialist];

  return (
    <section id="section-specialists" className="border border-[#D4D1C7] bg-[#FFFFFF] shadow-xs overflow-hidden">
      {/* Section Header */}
      <div className="p-6 sm:p-8 lg:p-10 border-b border-[#D4D1C7] bg-[#FFFFFF] flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-[#6E7685] uppercase tracking-wider">
            <span>Section 03</span>
            <span className="text-[#D4D1C7]">/</span>
            <span className="text-[#111315] font-semibold">Specialist Roles & Memory</span>
          </div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#111315] tracking-tight">
            Isolated Domain Specialists with Governed Memory Boundaries.
          </h2>
          <p className="text-sm text-[#4A505C] leading-relaxed">
            Autonomous intelligence breaks down when agents share unstructured memory or self-contaminate with model prose. Marketing OS enforces strict physical namespace isolation across 5 specialized roles and a deterministic memory promotion gate.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2 px-3 py-1.5 bg-[#F6F5F1] border border-[#D4D1C7] text-xs font-mono text-[#4A505C]">
          <Lock size={13} className="text-[#2563EB]" />
          <span>Zero Cross-Agent Memory Leakage</span>
        </div>
      </div>

      {/* Part A: 5 Specialist Selector Bar */}
      <div className="border-b border-[#D4D1C7] bg-[#ECEAE3]/50 p-4 sm:p-6">
        <span className="text-xs font-mono uppercase tracking-wider text-[#6E7685] block mb-3">
          Select an Autonomous Specialist Role
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {specialists.map((s, idx) => {
            const isSelected = selectedSpecialist === idx;
            return (
              <button
                key={s.id}
                onClick={() => setSelectedSpecialist(idx)}
                className={`p-3 border text-left transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                  isSelected
                    ? 'bg-[#FFFFFF] border-[#2563EB] shadow-xs ring-1 ring-[#2563EB]'
                    : 'bg-[#FFFFFF] border-[#D4D1C7] hover:border-[#111315]'
                }`}
              >
                <div className="text-xs font-bold text-[#111315] truncate">{s.name}</div>
                <div className="text-[10px] font-mono text-[#6E7685] truncate mt-0.5">{s.focus}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Specialist Detail Card */}
      <div className="p-6 sm:p-8 lg:p-10 border-b border-[#D4D1C7] bg-[#FFFFFF] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#D4D1C7]/70">
          <div>
            <h3 className="font-display font-bold text-xl text-[#111315]">
              {currentSpecialist.title}
            </h3>
            <p className="text-xs font-sans text-[#2563EB] mt-0.5 font-medium">
              Domain Mandate: {currentSpecialist.mandate}
            </p>
          </div>
        </div>

        <p className="text-sm text-[#4A505C] leading-relaxed">
          {currentSpecialist.description}
        </p>

        <div className="space-y-2">
          <span className="text-xs font-mono uppercase tracking-wider text-[#111315] font-bold">
            Core Strategic Responsibilities
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {currentSpecialist.coreStrengths.map((str, i) => (
              <div key={i} className="p-4 border border-[#D4D1C7] bg-[#F6F5F1] text-xs text-[#4A505C] leading-relaxed flex items-start gap-2">
                <CheckCircle2 size={14} className="text-[#16A34A] shrink-0 mt-0.5" />
                <span>{str}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Part B: Memory Hierarchy & Promotion Gate (3 Columns) */}
      <div className="p-6 sm:p-8 lg:p-10 bg-[#F6F5F1] space-y-6">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-[#6E7685]">
            Architectural Guarantees
          </span>
          <h3 className="font-display font-bold text-xl text-[#111315] mt-1">
            The 3-Tier Isolated Memory Architecture & The Promotion Gate
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* L0 Layer */}
          <div className="p-6 border border-[#D4D1C7] bg-[#FFFFFF] space-y-3 shadow-2xs">
            <div className="w-8 h-8 rounded-none bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB]">
              <Database size={16} />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase text-[#2563EB] font-bold">L0 Grounding Layer</span>
              <h4 className="font-sans font-bold text-sm text-[#111315]">Immutable FTS5 Database</h4>
            </div>
            <p className="text-xs text-[#4A505C] leading-relaxed">
              Curated primary-source competitor data stored in SQLite WAL mode. Fully accessible to all specialists via BM25 retrieval, but read-only at runtime to preserve grounding.
            </p>
          </div>

          {/* L1 Layer */}
          <div className="p-6 border border-[#D4D1C7] bg-[#FFFFFF] space-y-3 shadow-2xs">
            <div className="w-8 h-8 rounded-none bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center text-[#059669]">
              <Lock size={16} />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase text-[#059669] font-bold">L1 Specialist Layer</span>
              <h4 className="font-sans font-bold text-sm text-[#111315]">Namespaced Private Memory</h4>
            </div>
            <p className="text-xs text-[#4A505C] leading-relaxed">
              Isolated per specialist (<code className="font-mono text-[#111315]">agent:&lt;id&gt;</code>). Memory queries use physical SQL constraints preventing any agent from reading another specialist's private state.
            </p>
          </div>

          {/* L2 Layer */}
          <div className="p-6 border border-[#D4D1C7] bg-[#FFFFFF] space-y-3 shadow-2xs">
            <div className="w-8 h-8 rounded-none bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center text-[#D97706]">
              <Layers size={16} />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase text-[#D97706] font-bold">L2 Triage Layer</span>
              <h4 className="font-sans font-bold text-sm text-[#111315]">Pairwise Deliberation Space</h4>
            </div>
            <p className="text-xs text-[#4A505C] leading-relaxed">
              Ephemeral joint namespace (<code className="font-mono text-[#111315]">triage:&lt;a&gt;+&lt;b&gt;</code>) created only during two-agent dialectic triage. Stores reconciled agreements without leaking back into private stores.
            </p>
          </div>
        </div>

        {/* Interactive Strategic Memory Gate Simulator */}
        <div className="border border-[#111315] bg-[#FFFFFF] shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[#D4D1C7] bg-[#ECEAE3]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-[#111315] text-[#FFFFFF] text-[10.5px] font-mono font-bold uppercase tracking-wider">
                STRATEGIC MEMORY GATE SIMULATOR
              </span>
              <span className="text-xs font-sans font-bold text-[#111315]">Interactive Signal Evaluation</span>
            </div>
            <div className="text-xs font-mono text-[#6E7685]">
              Click a test signal to run promotion gate check
            </div>
          </div>

          {/* Signal Selector Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#D4D1C7] border-b border-[#D4D1C7] bg-[#F6F5F1]">
            {memoryGateSignals.map((sig, idx) => {
              const isSelected = activeSignal === idx;
              return (
                <button
                  key={sig.id}
                  onClick={() => setActiveSignal(idx)}
                  className={`p-3.5 text-left transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-[#FFFFFF] text-[#111315] border-b-2 border-b-[#111315]'
                      : 'hover:bg-[#ECEAE3] text-[#4A505C]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">
                      Test Signal 0{idx + 1}
                    </span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 font-bold ${
                      sig.status === 'PROMOTED' ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-[#FEE2E2] text-[#B91C1C]'
                    }`}>
                      {sig.status}
                    </span>
                  </div>
                  <div className="font-sans text-xs font-medium truncate">{sig.type}</div>
                </button>
              );
            })}
          </div>

          {/* Active Gate Evaluation Panel */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSignal}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="p-5 sm:p-6 space-y-4"
            >
              <div className="p-3.5 bg-[#F6F5F1] border-l-2 border-[#111315] space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#6E7685]">
                  Candidate Memory Payload
                </span>
                <p className="font-sans text-xs sm:text-[13px] text-[#111315] font-medium leading-relaxed">
                  {memoryGateSignals[activeSignal].input}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                <div className="sm:col-span-8 space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#111315] font-semibold">
                    Gate Verification Rationale
                  </span>
                  <p className="font-sans text-xs text-[#4A505C] leading-relaxed">
                    {memoryGateSignals[activeSignal].reason}
                  </p>
                </div>

                <div className="sm:col-span-4 flex sm:justify-end">
                  <div className={`p-3 border flex items-center gap-2 text-xs font-mono font-bold w-full sm:w-auto ${
                    memoryGateSignals[activeSignal].status === 'PROMOTED'
                      ? 'border-[#15803D] bg-[#DCFCE7]/40 text-[#15803D]'
                      : 'border-[#B91C1C] bg-[#FEE2E2]/40 text-[#B91C1C]'
                  }`}>
                    {memoryGateSignals[activeSignal].status === 'PROMOTED' ? (
                      <CheckCircle2 size={15} />
                    ) : (
                      <XCircle size={15} />
                    )}
                    <span>{memoryGateSignals[activeSignal].action}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
