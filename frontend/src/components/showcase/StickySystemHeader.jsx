import React from 'react';
import { ArrowUpRight, Lock } from 'lucide-react';
import { useNavScroll } from '../../context/LenisContext';

export default function StickySystemHeader({ onOpenConsole }) {
  const { scrollToSection, activeSection } = useNavScroll();

  const navItems = [
    { label: '01. Architecture', href: '#section-hero', id: 'section-hero' },
    { label: '02. Workflows', href: '#section-workflows', id: 'section-workflows' },
    { label: '03. Specialists & Memory', href: '#section-specialists', id: 'section-specialists' },
    { label: '04. Search Benchmarks', href: '#section-benchmarks', id: 'section-benchmarks' },
  ];

  const handleNavClick = (e, href) => {
    e.preventDefault();
    scrollToSection(href);
  };

  const handleLogoClick = (e) => {
    e.preventDefault();
    scrollToSection(0);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#F6F5F1]/95 backdrop-blur-md border-b border-[#D4D1C7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-14 flex items-center justify-between gap-4">
        {/* Brand & Product Showcase Label */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="#section-hero"
            onClick={handleLogoClick}
            className="flex items-center gap-2 group cursor-pointer"
          >
            <span className="font-display font-bold text-base sm:text-lg tracking-tight text-[#111315] group-hover:text-[#2563EB] transition-colors">
              MARKETING OS
            </span>
            <span className="text-[11px] font-mono tracking-wider text-[#6E7685] uppercase border-l border-[#D4D1C7] pl-3 hidden sm:inline-block">
              Product Showcase
            </span>
          </a>
        </div>

        {/* Section Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className={`relative text-xs font-mono px-3 py-1.5 transition-all duration-150 whitespace-nowrap active:scale-[0.98] border-b-2 ${
                  isActive
                    ? 'text-[#2563EB] font-semibold border-[#2563EB] bg-[#EFF6FF]'
                    : 'text-[#4A505C] hover:text-[#111315] hover:bg-[#ECEAE3] border-transparent'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Header Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="https://github.com/namm9an/Marketing-OS"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-[#4A505C] hover:text-[#111315] border border-[#D4D1C7] bg-[#FFFFFF] hover:bg-[#ECEAE3] px-3 py-1.5 transition-all duration-150 active:scale-[0.98]"
          >
            <span>GitHub</span>
            <ArrowUpRight size={13} strokeWidth={2} />
          </a>

          <button
            onClick={onOpenConsole}
            className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-[#FFFFFF] bg-[#111315] hover:bg-[#2563EB] px-3.5 py-1.5 transition-all duration-200 shadow-xs cursor-pointer active:scale-[0.98]"
            title="Launch operational product console"
          >
            <Lock size={12} strokeWidth={2} />
            <span>Launch Console</span>
          </button>
        </div>
      </div>
    </header>
  );
}
