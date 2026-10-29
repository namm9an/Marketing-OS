import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  MessageSquare,
  GitMerge,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Database,
  ArrowRight
} from 'lucide-react';
import {
  runWorkflowFixture,
  chatWorkflowFixture,
  triageWorkflowFixture,
  digestAndNetworkFixture
} from '../../fixtures/caseStudyFixtures';

export default function WorkflowReplaysSection() {
  const [activeTab, setActiveTab] = useState('run'); // 'run' | 'chat' | 'triage' | 'digest'

  const tabs = [
    { id: 'run', label: '1. Autonomous Run', endpoint: '/api/run', icon: FileText, desc: 'Single-Turn Strategy Formulation' },
    { id: 'chat', label: '2. Specialist Chat', endpoint: '/api/chat', icon: MessageSquare, desc: 'Grounded Dialogue & Attribution' },
    { id: 'triage', label: '3. Dialectic Triage', endpoint: '/api/triage', icon: GitMerge, desc: 'Multi-Agent Tension Resolution' },
    { id: 'digest', label: '4. Executive Digest', endpoint: '/api/digest', icon: Layers, desc: 'Cross-Competitor Synthesis' },
  ];

  return (
    <section id="section-workflows" className="border border-[#D4D1C7] bg-[#FFFFFF] shadow-xs overflow-hidden">
      {/* Section Header */}
      <div className="p-6 sm:p-8 lg:p-10 border-b border-[#D4D1C7] bg-[#FFFFFF] flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-[#6E7685] uppercase tracking-wider">
            <span>Section 02</span>
            <span className="text-[#D4D1C7]">/</span>
            <span className="text-[#111315] font-semibold">Workflow Replays</span>
          </div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#111315] tracking-tight">
            Provenance-Verified Endpoint Payloads.
          </h2>
          <p className="text-sm text-[#4A505C] leading-relaxed">
            Every payload below is an unedited production record verified against our SQLite WAL database and multi-turn test suite. Experience how autonomous agents reason, cite facts, resolve tensions, and protect memory.
          </p>
        </div>
      </div>

      {/* Tab Selector Bar: Apple-grade segmented bar, zero vertical scrollbar */}
      <div className="bg-[#ECEAE3]/80 border-b border-[#D4D1C7] px-4 sm:px-6 py-2 flex items-center gap-1.5 sm:gap-2 overflow-x-auto overflow-y-hidden scrollbar-none [&::-webkit-scrollbar]:hidden select-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-3.5 py-2 text-xs font-mono font-medium transition-colors duration-150 cursor-pointer whitespace-nowrap ${
                isActive ? 'text-[#111315] font-semibold' : 'text-[#6E7685] hover:text-[#111315]'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="workflowActiveTab"
                  className="absolute inset-0 bg-[#FFFFFF] border border-[#D4D1C7] shadow-xs"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Icon size={13} className={isActive ? 'text-[#2563EB]' : 'text-[#6E7685]'} />
                <span>{tab.label}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Tab Content Panel */}
      <div className="p-6 sm:p-8 lg:p-10 bg-[#FFFFFF]">
        {/* ==================================================================== */}
        {/* TAB 1: /api/run                                                      */}
        {/* ==================================================================== */}
        {activeTab === 'run' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#D4D1C7]/70 text-xs font-mono text-[#6E7685]">
              <div className="flex items-center gap-2">
                <span className="text-[#111315] font-semibold">Specialist Domain:</span>
                <span className="bg-[#ECEAE3] px-2 py-0.5 text-[#111315]">Branding Specialist</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#15803D]">
                <ShieldCheck size={14} />
                <span>Verified Strategic Formulation</span>
              </div>
            </div>

            {/* Strategic Goal Input */}
            <div className="p-4 bg-[#F6F5F1] border border-[#D4D1C7] space-y-1.5">
              <span className="text-[11px] font-mono uppercase text-[#6E7685] tracking-wider">Strategic Directive</span>
              <p className="text-sm font-medium text-[#111315]">{runWorkflowFixture.goal}</p>
            </div>

            {/* Core Positioning Statement */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-[#6E7685]">
                  Formulated Value Proposition (Why Customers Choose Us)
                </span>
              </div>
              <blockquote className="p-5 border-l-2 border-[#111315] bg-[#F6F5F1] text-sm sm:text-[15px] font-serif text-[#111315] leading-relaxed italic">
                "{runWorkflowFixture.positioning_statement}"
              </blockquote>
            </div>

            {/* Rationale & Risks 2-Column Split */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="p-5 border border-[#D4D1C7] bg-[#FFFFFF] space-y-2">
                <h4 className="text-xs font-mono uppercase tracking-wider text-[#111315] font-bold">
                  Evidence-Grounded Rationale
                </h4>
                <p className="text-xs text-[#4A505C] leading-relaxed">
                  {runWorkflowFixture.rationale}
                </p>
              </div>

              <div className="p-5 border border-[#D4D1C7] bg-[#FFFFFF] space-y-2">
                <h4 className="text-xs font-mono uppercase tracking-wider text-[#B91C1C] font-bold flex items-center gap-1.5">
                  <AlertTriangle size={13} />
                  <span>Identified Risks & Counter-Measures</span>
                </h4>
                <p className="text-xs text-[#4A505C] leading-relaxed">
                  {runWorkflowFixture.risks}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 2: Specialist Chat                                               */}
        {/* ==================================================================== */}
        {activeTab === 'chat' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#D4D1C7]/70 text-xs font-mono text-[#6E7685]">
              <div className="flex items-center gap-2">
                <span className="text-[#111315] font-semibold">Interactive Mode:</span>
                <span className="bg-[#ECEAE3] px-2 py-0.5 text-[#111315]">Direct Specialist Inquiry</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#15803D]">
                <CheckCircle2 size={14} />
                <span>Attributed Source Grounding</span>
              </div>
            </div>

            {/* Operator Prompt */}
            <div className="p-4 bg-[#F6F5F1] border border-[#D4D1C7] space-y-1">
              <span className="text-[11px] font-mono uppercase text-[#6E7685] tracking-wider">Executive Operator Query</span>
              <p className="text-sm font-sans font-medium text-[#111315]">"{chatWorkflowFixture.operator_message}"</p>
            </div>

            {/* Attributed Specialist Response */}
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase tracking-wider text-[#6E7685]">Specialist Response</span>
              <div className="p-5 border border-[#D4D1C7] bg-[#FFFFFF] text-sm text-[#111315] leading-relaxed space-y-3">
                <p>{chatWorkflowFixture.reply}</p>
              </div>
            </div>

            {/* Recalled Database Facts with Active Source Links */}
            <div className="space-y-3">
              <span className="text-xs font-mono uppercase tracking-wider text-[#6E7685]">
                Attributed Primary Source Facts (Retrieved from SQLite)
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {chatWorkflowFixture.recalled_facts.map((fact, idx) => (
                  <div key={idx} className="p-4 border border-[#D4D1C7] bg-[#F6F5F1] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#111315]">{fact.organization}</span>
                      <a
                        href={fact.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#2563EB] hover:underline flex items-center gap-1 font-mono text-[11px]"
                      >
                        <span>{new URL(fact.source_url).hostname}</span>
                        <ExternalLink size={11} />
                      </a>
                    </div>
                    <p className="text-xs text-[#4A505C] leading-relaxed">{fact.content}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Promotion Gate Callout: Critical Multi-Turn Guarantee */}
            <div className="p-4 border border-[#F59E0B]/40 bg-[#FEF3C7]/30 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-[#92400E] flex items-center gap-1.5">
                  <ShieldAlert size={14} className="text-[#D97706]" />
                  <span>Promotion Gate Verdict: {chatWorkflowFixture.memory_verdict.status}</span>
                </span>
                <span className="text-[11px] text-[#B45309]">Admissible: User Decisions & Directives Only</span>
              </div>
              <p className="text-xs text-[#78350F] leading-relaxed">
                {chatWorkflowFixture.memory_verdict.rule}
              </p>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 3: /api/triage                                                   */}
        {/* ==================================================================== */}
        {activeTab === 'triage' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#D4D1C7]/70 text-xs font-mono text-[#6E7685]">
              <div className="flex items-center gap-2">
                <span className="text-[#111315] font-semibold">Specialist Pair:</span>
                <span className="bg-[#ECEAE3] px-2 py-0.5 text-[#111315]">Branding ↔ PR & Policy</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#B45309]">
                <AlertTriangle size={14} />
                <span>{triageWorkflowFixture.governance.status}</span>
              </div>
            </div>

            {/* Operator Query */}
            <div className="p-4 bg-[#F6F5F1] border border-[#D4D1C7] space-y-1">
              <span className="text-[11px] font-mono uppercase text-[#6E7685] tracking-wider">Contested Strategic Question</span>
              <p className="text-sm font-sans font-medium text-[#111315]">"{triageWorkflowFixture.operator_message}"</p>
            </div>

            {/* 2-Specialist Divergent Views Split (Kinetic Opposition) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="p-5 border border-[#D4D1C7] bg-[#FFFFFF] space-y-2 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#111315]">{triageWorkflowFixture.agent_a.name}</span>
                  <span className="text-[10.5px] font-mono text-[#6E7685]">Growth & SLA Anchor</span>
                </div>
                <p className="text-xs text-[#4A505C] leading-relaxed">
                  {triageWorkflowFixture.agent_a.view}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="p-5 border border-[#D4D1C7] bg-[#FFFFFF] space-y-2 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#111315]">{triageWorkflowFixture.agent_b.name}</span>
                  <span className="text-[10.5px] font-mono text-[#6E7685]">Regulatory & Defensive Shield</span>
                </div>
                <p className="text-xs text-[#4A505C] leading-relaxed">
                  {triageWorkflowFixture.agent_b.view}
                </p>
              </motion.div>
            </div>

            {/* Unresolved Tensions Callout */}
            <div className="p-4 border border-[#B91C1C]/30 bg-[#FEF2F2] space-y-1.5">
              <span className="text-[11px] font-mono uppercase text-[#991B1B] font-bold tracking-wider">
                Preserved Tension (Never Averaged into Mush)
              </span>
              <p className="text-xs text-[#7F1D1D] leading-relaxed">
                {triageWorkflowFixture.tensions[0]}
              </p>
            </div>

            {/* Synthesized Compromise & Recommended Action */}
            <div className="p-5 border border-[#111315] bg-[#F6F5F1] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-[#111315] font-bold">
                  Synthesized Strategic Resolution
                </span>
                <span className="text-xs font-mono text-[#2563EB]">CMO Ratification Required</span>
              </div>
              <p className="text-sm text-[#111315] leading-relaxed">
                {triageWorkflowFixture.merged_answer}
              </p>
              <div className="pt-2 border-t border-[#D4D1C7] text-xs font-sans text-[#4A505C]">
                <strong>Action: </strong>{triageWorkflowFixture.recommended_action}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 4: /api/digest                                                   */}
        {/* ==================================================================== */}
        {activeTab === 'digest' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#D4D1C7]/70 text-xs font-mono text-[#6E7685]">
              <div className="flex items-center gap-2">
                <span className="text-[#111315] font-semibold">Intelligence Scope:</span>
                <span className="bg-[#ECEAE3] px-2 py-0.5 text-[#111315]">Cross-Specialist Consensus</span>
              </div>
              <div className="text-[11px] font-mono text-[#6E7685]">
                Coverage: 12 Tracked Cloud Competitors
              </div>
            </div>

            {/* Headline and Summary */}
            <div className="space-y-2">
              <h3 className="font-display font-bold text-lg sm:text-xl text-[#111315]">
                {digestAndNetworkFixture.headline}
              </h3>
              <p className="text-sm text-[#4A505C] leading-relaxed">
                {digestAndNetworkFixture.summary}
              </p>
            </div>

            {/* Competitor Movements Grid */}
            <div className="space-y-3">
              <span className="text-xs font-mono uppercase tracking-wider text-[#6E7685]">
                Detected Competitor Shifts
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {digestAndNetworkFixture.competitor_movements.map((movement, idx) => {
                  const [org, details] = movement.split(': ');
                  return (
                    <div key={idx} className="p-4 border border-[#D4D1C7] bg-[#F6F5F1] space-y-1">
                      <span className="text-xs font-mono font-bold text-[#111315]">{org}</span>
                      <p className="text-xs text-[#4A505C] leading-relaxed">{details}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Recommendations */}
            <div className="p-5 border border-[#D4D1C7] bg-[#FFFFFF] space-y-3">
              <span className="text-xs font-mono uppercase tracking-wider text-[#111315] font-bold">
                Recommended Executive Counter-Moves
              </span>
              <ul className="space-y-2 text-xs text-[#4A505C]">
                {digestAndNetworkFixture.recommended_actions.map((act, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="font-mono text-[#2563EB] font-bold shrink-0">{idx + 1}.</span>
                    <span className="leading-relaxed">{act}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
