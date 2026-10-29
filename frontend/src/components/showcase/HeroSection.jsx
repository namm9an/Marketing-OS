import React from 'react';
import { ArrowDown, Lock, ShieldCheck, Database, GitMerge, CheckCircle2 } from 'lucide-react';

export default function HeroSection({ onOpenConsole }) {
  const scrollToCascade = (e) => {
    e.preventDefault();
    const target = document.getElementById('section-dossier-cascade');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="section-hero" className="border border-[#D4D1C7] bg-[#FFFFFF] overflow-hidden shadow-xs">
      {/* 12-Column Split: Editorial Value Proposition (7 cols) & Architectural Digest (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#D4D1C7]">
        
        {/* Left Column: Value Proposition & Showcase CTAs (7 cols) */}
        <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-8 bg-[#FFFFFF]">
          <div className="space-y-6">
            
            {/* Clean Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 text-xs font-mono text-[#6E7685] uppercase tracking-wider">
              <span>Section 01</span>
              <span className="text-[#D4D1C7]">/</span>
              <span className="text-[#111315] font-semibold">Autonomous Multi-Agent Intelligence</span>
            </div>

            {/* Main Value Proposition Headline */}
            <h1 className="font-display font-bold text-3xl sm:text-4xl lg:text-[40px] text-[#111315] tracking-tight leading-[1.12]">
              Defensible Competitive Strategy Over Source-Backed Evidence.
            </h1>

            {/* Clear Product Showcase Copy */}
            <p className="text-sm sm:text-[15px] text-[#4A505C] leading-relaxed max-w-2xl">
              Marketing OS coordinates 5 private domain specialists across branding, PR, social sentiment, product tiering, and field events—grounding strategic positioning in verified competitor facts and deterministic multi-turn governance.
            </p>

            {/* Product Callout Card */}
            <div className="p-4 border border-[#D4D1C7] bg-[#F6F5F1] space-y-1.5 max-w-xl">
              <div className="text-xs font-sans font-bold text-[#111315] flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-[#2563EB]" />
                <span>Grounded Intelligence & Executive Decisions</span>
              </div>
              <p className="text-xs font-sans text-[#4A505C] leading-relaxed">
                Synthesizes fact-checked competitor data across 5 private AI specialists into confident executive strategy.
              </p>
            </div>

            {/* Showcase Action Controls */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <a
                href="#section-dossier-cascade"
                onClick={scrollToCascade}
                className="inline-flex items-center gap-2 text-xs font-mono font-medium bg-[#111315] text-[#FFFFFF] px-4 py-2.5 hover:bg-[#2563EB] active:scale-[0.98] transition-all duration-200 cursor-pointer shadow-xs"
              >
                <span>Explore Specialist Dossiers</span>
                <ArrowDown size={13} />
              </a>

              <button
                onClick={onOpenConsole}
                className="inline-flex items-center gap-2 text-xs font-mono font-medium border border-[#D4D1C7] bg-[#FFFFFF] hover:bg-[#F6F5F1] text-[#111315] px-4 py-2.5 active:scale-[0.98] transition-all duration-200 cursor-pointer shadow-2xs"
              >
                <Lock size={13} strokeWidth={2} />
                <span>Launch Console</span>
              </button>
            </div>

          </div>

          {/* Clean Human Context Line */}
          <div className="pt-4 border-t border-[#D4D1C7] text-xs font-sans text-[#6E7685] flex flex-wrap items-center justify-between gap-2">
            <span>Live tracking across 12 AI & GPU cloud competitors</span>
            <span className="font-mono text-[10.5px] text-[#2563EB] font-medium">Scroll down to cascade dossiers ↓</span>
          </div>
        </div>

        {/* Right Column: Architectural Digest & Governance Pillars (5 cols) */}
        <div className="lg:col-span-5 bg-[#F6F5F1] p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-[#6E7685]">
                System Topology
              </span>
              <span className="text-xs font-sans text-[#2563EB] font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse"></span>
                <span>Governed Flow</span>
              </span>
            </div>

            <h3 className="font-display font-bold text-lg text-[#111315] tracking-tight">
              Three Physical Separation Layers
            </h3>

            {/* 3 Physical Isolation Blocks */}
            <div className="space-y-3">
              <div className="p-3.5 bg-[#FFFFFF] border border-[#D4D1C7] shadow-2xs space-y-1">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#111315]">
                  <Database size={13} className="text-[#2563EB]" />
                  <span>01 / Grounded Competitor Base</span>
                </div>
                <p className="text-[11.5px] text-[#4A505C] leading-relaxed">
                  Curated primary sources on 12 neo-cloud competitors. Read-only at runtime in SQLite WAL mode.
                </p>
              </div>

              <div className="p-3.5 bg-[#FFFFFF] border border-[#D4D1C7] shadow-2xs space-y-1">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#111315]">
                  <GitMerge size={13} className="text-[#15803D]" />
                  <span>02 / 5 Isolated Domain Specialists</span>
                </div>
                <p className="text-[11.5px] text-[#4A505C] leading-relaxed">
                  Dedicated reasoning lenses for Branding, PR, Social Sentiment, SKUs, and Field Events.
                </p>
              </div>

              <div className="p-3.5 bg-[#FFFFFF] border border-[#D4D1C7] shadow-2xs space-y-1">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#111315]">
                  <ShieldCheck size={13} className="text-[#D97706]" />
                  <span>03 / Strategic Memory Gate</span>
                </div>
                <p className="text-[11.5px] text-[#4A505C] leading-relaxed">
                  Blocks unverified AI prose from polluting permanent memory. Only ratified directives promoted.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#D4D1C7] flex items-center justify-between text-[11px] font-mono text-[#6E7685]">
            <span>Deterministic Attribution</span>
            <span className="text-[#15803D] flex items-center gap-1 font-semibold">
              <CheckCircle2 size={12} />
              <span>Zero Hallucination</span>
            </span>
          </div>
        </div>

      </div>
    </section>
  );
}
