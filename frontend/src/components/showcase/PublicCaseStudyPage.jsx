import React from 'react';
import HeroSection from './HeroSection';
import PinnedDossierCascade from './PinnedDossierCascade';
import WorkflowReplaysSection from './WorkflowReplaysSection';
import SpecialistRolesMemorySection from './SpecialistRolesMemorySection';
import BenchmarksEvidenceSection from './BenchmarksEvidenceSection';
import { ArrowUpRight, Lock } from 'lucide-react';

export default function PublicCaseStudyPage({ onOpenConsole }) {
  return (
    <div className="min-h-screen bg-[#F6F5F1] text-[#111315] font-sans antialiased selection:bg-[#111315] selection:text-[#FFFFFF]">
      {/* 
        Macro Layout Container:
        Max width 1280px (max-w-7xl), 12-column grid rhythm, hairline borders (#D4D1C7)
      */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-14 space-y-12 lg:space-y-16">
        
        {/* Section 01: Hero Architecture (5-Agent Specialist Pipeline + Value Proposition) */}
        <HeroSection onOpenConsole={onOpenConsole} />

        {/* Interactive Pinned Dossier Cascade: 5 Specialists Living Story */}
        <div id="section-dossier-cascade">
          <PinnedDossierCascade onLaunchConsole={onOpenConsole} />
        </div>

        {/* Section 02: Workflow Replays (/api/run, /api/chat, /api/triage, /api/digest) */}
        <WorkflowReplaysSection />

        {/* Section 03: Specialist Roles & Memory (5 Specialist Lenses + L0-L2 Memory Hierarchy + Promotion Gate) */}
        <SpecialistRolesMemorySection />

        {/* Section 04: Evidence & Search Benchmarks (BM25 + Taxonomy Expansion Scorecard + Cryptographic Attribution) */}
        <BenchmarksEvidenceSection onOpenConsole={onOpenConsole} />

        {/* Product Showcase Footer */}
        <footer className="border-t border-[#D4D1C7] pt-8 pb-14 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#6E7685]">
          <div className="flex items-center gap-3">
            <span className="font-bold text-[#111315]">MARKETING OS</span>
            <span>·</span>
            <span>Autonomous Intelligence & Governed Multi-Agent System</span>
          </div>

          <div className="flex items-center gap-5">
            <a
              href="https://github.com/namm9an/Marketing-OS"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#111315] flex items-center gap-1 transition-colors"
            >
              <span>GitHub Repository</span>
              <ArrowUpRight size={12} />
            </a>
            <button
              onClick={onOpenConsole}
              className="hover:text-[#111315] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Lock size={11} />
              <span>Launch Operational Console</span>
            </button>
          </div>
        </footer>

      </div>
    </div>
  );
}
