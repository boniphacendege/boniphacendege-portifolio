/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  X,
  Shield,
  FileText,
  Lock,
  Cookie,
  Briefcase,
  Search,
  Printer,
  ExternalLink,
  Mail,
  CheckCircle2,
  Calendar,
  Building2,
  ChevronRight,
  ArrowUp,
  Download,
  AlertCircle
} from 'lucide-react';
import { LEGAL_DOCUMENTS, LegalDocument } from '../data/legalPolicies';

export type LegalTab = 'privacy' | 'terms' | 'cookies' | 'services';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: LegalTab;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'privacy'
}) => {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const contentScrollRef = useRef<HTMLDivElement>(null);

  // Sync tab if initialTab changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setSearchQuery('');
    }
  }, [isOpen, initialTab]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const doc: LegalDocument = LEGAL_DOCUMENTS[activeTab];

  // Filter sections by search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return doc.sections;
    const q = searchQuery.toLowerCase();
    return doc.sections.filter((s) => {
      return (
        s.title.toLowerCase().includes(q) ||
        s.summary.toLowerCase().includes(q) ||
        s.content.some((c) => c.toLowerCase().includes(q)) ||
        (s.subsections &&
          s.subsections.some(
            (sub) =>
              sub.title.toLowerCase().includes(q) ||
              sub.paragraphs.some((p) => p.toLowerCase().includes(q))
          ))
      );
    });
  }, [doc, searchQuery]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(`legal-sec-${sectionId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const tabItems: { id: LegalTab; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: 'privacy', label: 'Privacy Policy', icon: Shield, badge: 'PDPA & GDPR' },
    { id: 'terms', label: 'Terms of Service', icon: FileText, badge: 'Standard' },
    { id: 'cookies', label: 'Cookies', icon: Cookie, badge: 'Standard' },
    { id: 'services', label: 'Client Agreement', icon: Briefcase, badge: 'Commercial' }
  ];

  return (
    <div
      id="legal-modal-root"
      data-unauth-exempt="true"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in"
    >
      <div className="w-full max-w-5xl h-[94vh] sm:h-[90vh] bg-[#010904] card-neon-shallow rounded-2xl sm:rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden relative">
        
        {/* Top Header Bar */}
        <div className="px-4 sm:px-6 py-4 bg-[#02130a] border-b border-[rgba(240,185,46,0.22)] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0a351e] border border-[#3dff8f]/30 flex items-center justify-center text-[#3dff8f] shadow-[0_0_12px_rgba(61,255,143,0.25)]">
              {activeTab === 'privacy' && <Shield className="w-5 h-5" />}
              {activeTab === 'terms' && <FileText className="w-5 h-5" />}
              {activeTab === 'cookies' && <Cookie className="w-5 h-5" />}
              {activeTab === 'services' && <Briefcase className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="legal-modal-title" className="text-base sm:text-lg font-bold font-serif-heading text-[#fff1b8]">
                  Legal, Privacy & Terms of Service
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#0a351e] text-[#3dff8f] border border-[#3dff8f]/25 hidden sm:inline-block">
                  Verified Legal
                </span>
              </div>
              <p className="text-xs text-[#9fbfae] hidden sm:block">
                Ev Dr. Boniphace J. Ndege · Official Studio Compliance Documentation
              </p>
            </div>
          </div>

          {/* Action buttons: Print & Close */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-[#f0b92e] border border-[#f0b92e]/30 hover:bg-[#f0b92e]/10 transition-colors cursor-pointer"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              type="button"
              className="w-9 h-9 rounded-xl bg-black/40 hover:bg-[#0a351e] border border-white/10 hover:border-[#3dff8f]/40 flex items-center justify-center text-[#9fbfae] hover:text-white transition-all cursor-pointer"
              aria-label="Close legal modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation & Search Bar */}
        <div className="px-4 sm:px-6 py-3 bg-[#010c06] border-b border-[rgba(240,185,46,0.15)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {tabItems.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSearchQuery('');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-[#3dff8f]/15 text-[#3dff8f] border border-[#3dff8f] font-semibold shadow-[0_0_12px_rgba(61,255,143,0.3)]'
                      : 'text-[#9fbfae] border border-transparent hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full hidden md:inline-block ${
                        isActive
                          ? 'bg-[#3dff8f]/25 text-[#3dff8f]'
                          : 'bg-white/5 text-[#9fbfae]'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Search Input */}
          <div className="relative min-w-[200px] sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#9fbfae]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in policy..."
              className="w-full pl-8 pr-7 py-1.5 bg-[#011409] border border-white/10 rounded-xl text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#3dff8f] transition-all font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9fbfae] hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Modal Main Body with Sidebar + Content */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Table of Contents Sidebar (Desktop) */}
          <aside className="w-64 border-r border-[rgba(240,185,46,0.12)] bg-[#010703] p-4 overflow-y-auto hidden lg:flex flex-col justify-between shrink-0">
            <div>
              <div className="text-[11px] font-mono text-[#f0b92e] uppercase font-bold tracking-wider mb-3">
                Table of Contents
              </div>
              <nav className="space-y-1">
                {doc.sections.map((sec, idx) => (
                  <button
                    key={sec.id}
                    onClick={() => scrollToSection(sec.id)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-[#9fbfae] hover:text-white hover:bg-[#02180d] transition-all line-clamp-1 flex items-center justify-between group cursor-pointer"
                  >
                    <span className="truncate">{sec.title}</span>
                    <ChevronRight className="w-3 h-3 text-[#9fbfae]/40 group-hover:text-[#3dff8f] shrink-0" />
                  </button>
                ))}
              </nav>
            </div>

            {/* Quick Contact Box in Sidebar */}
            <div className="p-3.5 rounded-xl bg-[#02150b] border border-[rgba(240,185,46,0.2)] mt-6 text-xs text-[#9fbfae] space-y-2">
              <div className="text-[#fff1b8] font-bold font-serif-heading text-xs flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#3dff8f]" />
                <span>Data Controller</span>
              </div>
              <p className="text-[11px] text-[#9fbfae] leading-snug">
                {doc.controller.name}<br />
                {doc.controller.location}
              </p>
              <a
                href={`mailto:${doc.controller.email}`}
                className="inline-flex items-center gap-1.5 text-[11px] text-[#3dff8f] font-mono hover:underline break-all"
              >
                <Mail className="w-3 h-3 shrink-0" />
                <span>{doc.controller.email}</span>
              </a>
            </div>
          </aside>

          {/* Right Main Scrollable Document Content */}
          <div ref={contentScrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
            
            {/* Document Header Banner */}
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#0f7a43]/20 via-[#03170d] to-[#010a05] border border-[rgba(240,185,46,0.25)] shadow-lg space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 text-xs font-mono text-[#3dff8f]">
                  <Calendar className="w-3.5 h-3.5 text-[#f0b92e]" />
                  <span>Last Updated: {doc.lastUpdated}</span>
                  <span className="text-[#f0b92e]/60">•</span>
                  <span>Effective: {doc.effectiveDate}</span>
                </div>
                {doc.controller.jurisdiction ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#0a351e] text-[#f0b92e] border border-[#f0b92e]/30">
                    Jurisdiction: {doc.controller.jurisdiction}
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#0a351e] text-[#3dff8f] border border-[#3dff8f]/30">
                    Standard Compliance
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold font-serif-heading text-[#fff1b8]">
                {doc.title}
              </h1>
              <p className="text-xs sm:text-sm text-[#3dff8f] font-mono">
                {doc.subtitle}
              </p>
              <p className="text-xs sm:text-sm text-[#f4fff8]/90 leading-relaxed pt-2 border-t border-[rgba(240,185,46,0.15)]">
                {doc.intro}
              </p>
            </div>

            {/* If Search Active & No Results */}
            {filteredSections.length === 0 && (
              <div className="p-8 text-center rounded-2xl bg-[#02130a] border border-white/10 space-y-2">
                <AlertCircle className="w-8 h-8 text-[#f0b92e] mx-auto" />
                <p className="text-sm text-white font-semibold">No clauses found matching "{searchQuery}"</p>
                <p className="text-xs text-[#9fbfae]">Try searching for keywords like "account", "data", "cookies", "ip", or "payment".</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-xs text-[#3dff8f] font-mono hover:underline cursor-pointer"
                >
                  Clear search query
                </button>
              </div>
            )}

            {/* Document Sections */}
            <div className="space-y-6">
              {filteredSections.map((section) => (
                <section
                  key={section.id}
                  id={`legal-sec-${section.id}`}
                  className="p-5 sm:p-6 rounded-2xl bg-[#010d06] border border-[rgba(240,185,46,0.18)] hover:border-[#3dff8f]/40 transition-colors space-y-4"
                >
                  {/* Section Title & Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[rgba(240,185,46,0.12)]">
                    <h3 className="text-base sm:text-lg font-bold font-serif-heading text-[#fff1b8] flex items-center gap-2">
                      <span>{section.title}</span>
                    </h3>
                    {section.badge && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#0a351e] text-[#3dff8f] border border-[#3dff8f]/30">
                        {section.badge}
                      </span>
                    )}
                  </div>

                  {/* Plain Language Summary Box */}
                  <div className="p-3 rounded-xl bg-[#02150b] border-l-2 border-[#f0b92e] text-xs text-[#fff1b8] font-sans flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#f0b92e] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-[#3dff8f] font-mono uppercase text-[10px] tracking-wide block">
                        Plain English Summary:
                      </strong>
                      <span className="text-white/90 text-xs">{section.summary}</span>
                    </div>
                  </div>

                  {/* Main Paragraphs */}
                  <div className="space-y-2.5 text-xs sm:text-sm text-[#9fbfae] leading-relaxed">
                    {section.content.map((paragraph, pIdx) => (
                      <p key={pIdx}>{paragraph}</p>
                    ))}
                  </div>

                  {/* Subsections if present */}
                  {section.subsections && section.subsections.length > 0 && (
                    <div className="space-y-4 pt-2">
                      {section.subsections.map((sub, sIdx) => (
                        <div key={sIdx} className="p-4 rounded-xl bg-[#010904] border border-white/5 space-y-2">
                          <h4 className="text-xs sm:text-sm font-bold font-serif-heading text-[#fff1b8]">
                            {sub.title}
                          </h4>
                          <div className="space-y-1.5 text-xs text-[#9fbfae] leading-relaxed">
                            {sub.paragraphs.map((subP, subPIdx) => (
                              <p key={subPIdx}>{subP}</p>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              ))}
            </div>

            {/* Bottom Footer Notice */}
            <div className="p-5 rounded-2xl bg-[#02130a] border border-[rgba(240,185,46,0.2)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#9fbfae]">
              <div>
                <div className="text-white font-bold font-serif-heading">Have a specific legal or data privacy question?</div>
                <p className="text-[11px] text-[#9fbfae]">
                  Contact Ev Dr. Boniphace J. Ndege directly. All inquiries are treated with strict confidentiality.
                </p>
              </div>
              <a
                href={`mailto:${doc.controller.email}?subject=Legal%20%26%20Privacy%20Inquiry%20-%20Boniphace%20Ndege`}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-[#011408] bg-gradient-to-r from-[#3dff8f] via-[#5effa3] to-[#2ecc71] hover:brightness-110 transition-all flex items-center gap-1.5 shrink-0"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Send Legal Inquiry</span>
              </a>
            </div>

          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-4 sm:px-6 py-3 bg-[#010804] border-t border-[rgba(240,185,46,0.2)] flex items-center justify-between text-xs text-[#9fbfae] shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3dff8f] animate-pulse" />
            <span className="font-mono text-[11px]">Official Legal Documentation · Dodoma, Tanzania</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium text-white bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
