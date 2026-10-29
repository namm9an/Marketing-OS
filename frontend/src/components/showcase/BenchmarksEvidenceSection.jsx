import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  ExternalLink,
  ShieldCheck,
  Database,
  Cpu,
  Binary,
  CheckCircle2,
  Lock,
  ArrowRight,
  Search,
  Sparkles
} from 'lucide-react';
import { retrievalBenchmarkFixture, digestAndNetworkFixture } from '../../fixtures/caseStudyFixtures';

export default function BenchmarksEvidenceSection({ onOpenConsole }) {
  const { metrics, architecture_notes } = retrievalBenchmarkFixture;
  const { citations } = digestAndNetworkFixture;

  const [activeQueryIdx, setActiveQueryIdx] = useState(0);

  const queryExpansions = [
    {
      query: 'b200 cluster jitter',
      expandedTokens: ['B200', 'Blackwell', 'NVLink-5', 'Quantum-X800', 'InfiniBand', 'silent hardware failure', 'packet drop rate'],
      groundedHit: 'Vanguard Cloud certified B200 pods provide deterministic InfiniBand telemetry and zero-jitter completion guarantees.'
    },
    {
      query: 'h100 spot reclaim',
      expandedTokens: ['H100', 'spot instance', 'preemption', 'reclamation', 'reserved capacity', 'unreserved pricing', 'take-or-pay'],
      groundedHit: 'CoreWeave enforces multi-year take-or-pay commitments while Nebius spot discounts risk unannounced preemption during distributed runs.'
    },
    {
      query: 'eu sovereign gdpr',
      expandedTokens: ['GDPR Article 28', 'EU sovereignty', 'geothermal power', 'ISO 27001', 'data residency', 'regional sovereignty'],
      groundedHit: 'Vanguard Cloud enforces verified European data sovereignty and clean geothermal energy compliance proofs for enterprise risk committees.'
    }
  ];

  return (
    <section id="section-benchmarks" className="border border-[#D4D1C7] bg-[#FFFFFF] shadow-xs overflow-hidden">
      {/* Section Header */}
      <div className="p-6 sm:p-8 lg:p-10 border-b border-[#D4D1C7] bg-[#FFFFFF] flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-[#6E7685] uppercase tracking-wider">
            <span>Section 04</span>
            <span className="text-[#D4D1C7]">/</span>
            <span className="text-[#111315] font-semibold">Evidence & Search Benchmarks</span>
          </div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#111315] tracking-tight">
            Measured Retrieval Lift & Cryptographic Attribution.
          </h2>
          <p className="text-sm text-[#4A505C] leading-relaxed">
            AI positioning is only as credible as the evidence that grounds it. We evaluated our SQLite FTS5 engine against 12 neo-cloud competitors, lifting paraphrase recall from 28.3% to 90.0% through deterministic taxonomy expansion.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2 px-3 py-1.5 bg-[#F6F5F1] border border-[#D4D1C7] text-xs font-mono text-[#16A34A]">
          <TrendingUp size={13} />
          <span>+61.7% Paraphrase Recall Lift</span>
        </div>
      </div>

      {/* Part A: Animated Dual-Track Spring Comparison Bars */}
      <div className="p-6 sm:p-8 lg:p-10 border-b border-[#D4D1C7] bg-[#F6F5F1]">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-[#6E7685]">
            Empirical Paraphrase Recall Benchmark (5-Slot Retrieval)
          </span>
          <span className="text-[11px] font-mono text-[#15803D] font-bold">
            +61.7% Measured Lift
          </span>
        </div>

        <div className="space-y-5 bg-[#FFFFFF] border border-[#D4D1C7] p-5 sm:p-6 shadow-2xs">
          {/* Baseline Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#6E7685]">Standard BM25 Keyword Search</span>
              <span className="font-bold text-[#4A505C]">28.3% Recall</span>
            </div>
            <div className="h-4 w-full bg-[#ECEAE3] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: '28.3%' }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-[#94A3B8]"
              />
            </div>
          </div>

          {/* Marketing OS Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#111315] font-bold">Marketing OS (BM25 + Deterministic Taxonomy Expansion)</span>
              <span className="font-bold text-[#2563EB]">90.0% Recall (+61.7%)</span>
            </div>
            <div className="h-4 w-full bg-[#ECEAE3] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: '90.0%' }}
                viewport={{ once: true }}
                transition={{ duration: 1.1, ease: 'easeOut', delay: 0.2 }}
                className="h-full bg-[#111315]"
              />
            </div>
          </div>

          <div className="pt-2 text-[11px] font-sans text-[#6E7685] flex items-center justify-between border-t border-[#D4D1C7]/60">
            <span>Evaluated against 12 neo-cloud pricing, network latency, and SLA documents</span>
            <span className="font-mono text-[10.5px]">5 FTS5 candidate slots</span>
          </div>
        </div>
      </div>

      {/* Part B: Interactive Query Expansion Lens */}
      <div className="p-6 sm:p-8 lg:p-10 border-b border-[#D4D1C7] bg-[#FFFFFF] space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-[#6E7685]">
            Interactive Taxonomy Expansion Lens
          </span>
          <span className="text-[11px] font-mono text-[#6E7685]">
            Select a test query to inspect deterministic synonym expansion
          </span>
        </div>

        {/* Query Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {queryExpansions.map((item, idx) => (
            <button
              key={idx}
              onClick={() => setActiveQueryIdx(idx)}
              className={`px-3.5 py-1.5 text-xs font-mono transition-all duration-150 cursor-pointer ${
                activeQueryIdx === idx
                  ? 'bg-[#111315] text-[#FFFFFF] shadow-2xs'
                  : 'bg-[#F6F5F1] text-[#4A505C] border border-[#D4D1C7] hover:bg-[#ECEAE3]'
              }`}
            >
              <span>"{item.query}"</span>
            </button>
          ))}
        </div>

        {/* Active Expansion Inspection Box */}
        <div className="p-4 bg-[#F6F5F1] border border-[#D4D1C7] space-y-3">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#6E7685] block mb-1.5">
              Canonical Taxonomy Synonyms Injected
            </span>
            <div className="flex flex-wrap gap-1.5">
              {queryExpansions[activeQueryIdx].expandedTokens.map((token, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-[#FFFFFF] border border-[#D4D1C7] text-xs font-mono text-[#111315]"
                >
                  {token}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-[#D4D1C7]/60">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#2563EB] font-semibold block mb-1">
              Top Ranked Retrieved Fact (L0 FTS5 SQLite Hit)
            </span>
            <p className="text-xs text-[#111315] font-sans leading-relaxed">
              "{queryExpansions[activeQueryIdx].groundedHit}"
            </p>
          </div>
        </div>
      </div>

      {/* Part C: Benchmark Scorecard Table */}
      <div className="p-6 sm:p-8 lg:p-10 border-b border-[#D4D1C7] bg-[#FFFFFF]">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-[#6E7685]">
            Empirical Retrieval Evaluation Scorecard (5-Slot Retrieval)
          </span>
          <span className="text-[11px] font-mono text-[#6E7685]">
            Baseline: Standard BM25 · Improved: BM25 + Canonical Taxonomy Expansion
          </span>
        </div>

        <div className="overflow-x-auto border border-[#D4D1C7]">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#ECEAE3]/70 border-b border-[#D4D1C7] font-mono text-[#111315] uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 font-bold">Metric</th>
                <th className="py-3 px-4 font-bold text-center">Baseline</th>
                <th className="py-3 px-4 font-bold text-center">Marketing OS</th>
                <th className="py-3 px-4 font-bold text-center">Measured Delta</th>
                <th className="py-3 px-4 font-bold hidden md:table-cell">Significance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D4D1C7] bg-[#FFFFFF]">
              {metrics.map((m, i) => {
                const isPositive = m.delta.startsWith('+') || m.delta === '-5';
                return (
                  <tr key={i} className="hover:bg-[#F6F5F1]/70 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-[#111315]">
                      <div className="font-bold text-sm">{m.name}</div>
                      <div className="text-[11px] text-[#6E7685] md:hidden mt-0.5">{m.description}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-[#4A505C]">
                      {typeof m.baseline === 'number' && m.baseline < 1 ? (m.baseline * 100).toFixed(1) + '%' : m.baseline}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-[#111315] bg-[#F6F5F1]/40">
                      {typeof m.improved === 'number' && m.improved < 1 ? (m.improved * 100).toFixed(1) + '%' : m.improved}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono">
                      <span className={`inline-block px-2 py-0.5 font-bold ${
                        isPositive ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-[#ECEAE3] text-[#4A505C]'
                      }`}>
                        {m.delta.startsWith('+') ? m.delta : m.delta}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#4A505C] text-xs leading-relaxed hidden md:table-cell">
                      {m.description}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Part D: Citations & Attribution Primitives 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#D4D1C7] bg-[#F6F5F1]">
        
        {/* Left: Grounded Citations (6 cols) */}
        <div className="lg:col-span-6 p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-[#6E7685]">
              Primary Source Citations
            </span>
            <span className="text-[11px] font-mono text-[#2563EB]">100% Attributable URLs</span>
          </div>

          <div className="space-y-3">
            {citations.map((c, idx) => (
              <div key={idx} className="p-4 border border-[#D4D1C7] bg-[#FFFFFF] space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#111315]">{c.organization}</span>
                  <a
                    href={c.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#2563EB] hover:underline flex items-center gap-1 font-mono text-[11px]"
                  >
                    <span>{new URL(c.source_url).hostname}</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
                <p className="text-xs text-[#4A505C] leading-relaxed">
                  "{c.fact}"
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Cryptographic Primitives & Storage Guarantees (6 cols) */}
        <div className="lg:col-span-6 p-6 sm:p-8 space-y-4">
          <span className="text-xs font-mono uppercase tracking-wider text-[#6E7685]">
            Cryptographic Integrity & Attribution
          </span>

          <div className="space-y-3">
            <div className="p-4 border border-[#D4D1C7] bg-[#FFFFFF] space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#111315]">
                <Binary size={14} className="text-[#2563EB]" />
                <span>Deterministic Fact Hash Primitives</span>
              </div>
              <p className="text-xs text-[#4A505C] leading-relaxed">
                Every factual unit in the L0 corpus is uniquely identified by a deterministic SHA-256 digest:
              </p>
              <div className="p-2 bg-[#F6F5F1] border border-[#D4D1C7] font-mono text-[11px] text-[#111315] overflow-x-auto">
                sha256(f"{`{org}|{k_class}|{url}|{content}`}")
              </div>
            </div>

            <div className="p-4 border border-[#D4D1C7] bg-[#FFFFFF] space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#111315]">
                <Cpu size={14} className="text-[#16A34A]" />
                <span>Immutable Decision Audit Log</span>
              </div>
              <p className="text-xs text-[#4A505C] leading-relaxed">
                Strategic decisions are recorded with physical 128-bit UUIDs, linking the formulating specialist, rationale, identified risks, and CMO ratification timestamp in SQLite WAL mode.
              </p>
            </div>

            <div className="p-4 border border-[#D4D1C7] bg-[#FFFFFF] space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#111315]">
                <ShieldCheck size={14} className="text-[#2563EB]" />
                <span>Zero Live Model Costs on Showcase</span>
              </div>
              <p className="text-xs text-[#4A505C] leading-relaxed">
                All showcase states on this page execute locally without external API latency or token cost, backed by verified repository test outputs.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Part E: Grand Finale Closing Banner */}
      <div className="bg-[#111315] text-[#FFFFFF] p-8 sm:p-12 lg:p-14 flex flex-col md:flex-row md:items-center justify-between gap-8 border-t border-[#111315]">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-[#D4D1C7] uppercase tracking-wider">
            <span>Operational Console</span>
            <span>·</span>
            <span>Live Interactive Workbench</span>
          </div>
          <h3 className="font-display font-bold text-2xl sm:text-3xl text-[#FFFFFF] tracking-tight">
            Ready to inspect the live multi-agent system?
          </h3>
          <p className="text-xs sm:text-sm text-[#A0A6B2] leading-relaxed">
            Execute real-time autonomous runs, converse with isolated specialist agents, review dialectic tension resolutions, and inspect the weekly synthesized intelligence brief.
          </p>
        </div>

        <div className="shrink-0 flex items-center">
          <button
            onClick={onOpenConsole}
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#FFFFFF] hover:bg-[#ECEAE3] text-[#111315] font-mono text-xs font-semibold transition-all duration-200 cursor-pointer shadow-md active:scale-[0.98]"
          >
            <Lock size={13} strokeWidth={2} />
            <span>Launch Operational Console</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </section>
  );
}
