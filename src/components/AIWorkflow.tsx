import React from 'react';
import { AIWorkflowStage } from '../data/portfolioStorage';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  UserCheck,
  Eye,
  GitBranch
} from 'lucide-react';

interface AIWorkflowProps {
  stages: AIWorkflowStage[];
  onOpenChat?: () => void;
}

export const AIWorkflow: React.FC<AIWorkflowProps> = ({ stages, onOpenChat }) => {
  const sortedStages = [...stages].sort((a, b) => a.order - b.order);

  return (
    <section id="workflow" className="py-20 relative bg-[#010904]/60">
      <div className="w-full max-w-[1740px] 2xl:max-w-[1860px] mx-auto px-2.5 sm:px-4 md:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-12 stagger-child">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold text-[#3dff8f] bg-[#3dff8f]/10 border border-[#3dff8f]/25 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#3dff8f]" />
            <span>PRACTICAL DIGITAL METHODOLOGY</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-serif-heading mb-4 gold-text">
            My AI-assisted creative workflow
          </h2>
          <p className="text-base sm:text-lg text-[#9fbfae] leading-relaxed">
            How I integrate modern artificial intelligence as a practical multiplier in my creative process—pairing rapid computational exploration with strict human review and artisanal design refinement.
          </p>
        </div>

        {/* CENTERED CARD: Boniphace Creative Assistant */}
        <div className="max-w-2xl sm:max-w-3xl mx-auto mb-14 rounded-[26px] bg-[#02100a] card-neon-shallow overflow-hidden animate-in fade-in stagger-child">
          {/* Card Header */}
          <div
            className="px-5 py-4 flex items-center justify-between text-white border-b border-[rgba(240,185,46,0.3)]"
            style={{
              background: 'linear-gradient(135deg, #0b5a32, #17a05a 45%, #0b5a32 70%, #12874c)'
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-black/30 flex items-center justify-center text-[#f0b92e] border border-[#f0b92e]/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif-heading font-extrabold text-base text-[#fff1b8]">
                  Boniphace Creative Assistant
                </h3>
                <span className="text-[11px] text-[#3dff8f] font-mono flex items-center gap-1.5 font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#3dff8f] animate-pulse" />
                  Ready to assist
                </span>
              </div>
            </div>
            <div className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/40 text-[#fff1b8] border border-[#f0b92e]/30">
              Interactive Guide
            </div>
          </div>

          {/* Card Content (Centered) */}
          <div className="p-6 sm:p-7 text-center space-y-5 bg-[#010904]">
            <p className="text-sm sm:text-base text-[#f4fff8] leading-relaxed max-w-lg mx-auto">
              Hello! I am Boniphace's AI Creative Assistant. Ask me about his graphic design services, website development projects, AI-assisted workflows, or how to collaborate on your next project!
            </p>

            {/* Quick Suggestion Buttons Centered */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              {[
                'Services?',
                'Design Tools?',
                'AI Workflow?',
                'Location?',
                'Hire Boniphace?'
              ].map((pill) => (
                <button
                  key={pill}
                  onClick={() => onOpenChat && onOpenChat()}
                  className="px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold text-[#3dff8f] bg-[#0a351e]/80 border border-[#3dff8f]/40 hover:bg-[#3dff8f]/20 hover:border-[#3dff8f] active:scale-95 transition-all cursor-pointer shadow-sm"
                >
                  {pill}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Workflow Philosophy Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0f7a43]/25 via-[#02180d] to-[#010a05] card-neon-shallow mb-10 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0a351e] border border-[#3dff8f]/40 flex items-center justify-center shrink-0 text-[#3dff8f]">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-[#fff1b8]">
                Human Craftsmanship + AI Acceleration
              </h4>
              <p className="text-xs text-[#9fbfae] mt-0.5 max-w-2xl">
                AI aids ideation and prototyping; my creative decisions, technical review, custom styling, and final delivery ensure authenticity and precision.
              </p>
            </div>
          </div>
          <div className="text-xs font-mono text-[#3dff8f] px-3 py-1.5 rounded-full bg-[#010904] border border-[#3dff8f]/30 shrink-0">
            Human-in-the-Loop Process
          </div>
        </div>

        {/* Stages Timeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedStages.map((stage) => (
            <div
              key={stage.id}
              className="p-6 sm:p-7 rounded-[22px] bg-gradient-to-br from-[#0f7a43]/18 via-[#03170d]/85 to-[#010703] card-neon-shallow transition-all flex flex-col justify-between group shadow-xl stagger-child"
            >
              <div>
                {/* Stage number badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className="w-8 h-8 rounded-xl bg-[#0a351e] border border-[rgba(240,185,46,0.3)] text-[#f0b92e] font-mono font-bold text-xs flex items-center justify-center group-hover:scale-110 transition-transform">
                    {stage.stageNumber}
                  </span>
                  <span className="text-[11px] font-mono text-[#9fbfae] uppercase">
                    Stage {stage.stageNumber} of {sortedStages.length}
                  </span>
                </div>

                {/* Title & Subtitle */}
                <h3 className="text-xl font-bold font-serif-heading text-[#fff1b8] group-hover:text-[#3dff8f] transition-colors mb-1.5">
                  {stage.title}
                </h3>
                <div className="text-xs font-mono text-[#3dff8f] mb-3">
                  {stage.subtitle}
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-[#9fbfae] leading-relaxed mb-5">
                  {stage.description}
                </p>
              </div>

              <div className="space-y-3 pt-3 border-t border-[rgba(240,185,46,0.15)] text-xs">
                {/* Human Role */}
                <div className="p-2.5 rounded-lg bg-[#010a05] border border-white/5">
                  <div className="text-[10px] font-mono font-bold text-[#f0b92e] uppercase flex items-center gap-1 mb-1">
                    <UserCheck className="w-3 h-3 text-[#f0b92e]" />
                    <span>My Role (Human)</span>
                  </div>
                  <p className="text-[11px] text-[#f4fff8]/90 leading-tight">
                    {stage.humanRole}
                  </p>
                </div>

                {/* AI Role */}
                <div className="p-2.5 rounded-lg bg-[#010a05] border border-white/5">
                  <div className="text-[10px] font-mono font-bold text-[#3dff8f] uppercase flex items-center gap-1 mb-1">
                    <Cpu className="w-3 h-3 text-[#3dff8f]" />
                    <span>AI Assistant Role</span>
                  </div>
                  <p className="text-[11px] text-[#9fbfae] leading-tight">
                    {stage.aiRole}
                  </p>
                </div>

                {/* Tools Chips */}
                {stage.toolsUsed && stage.toolsUsed.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {stage.toolsUsed.map((tool) => (
                      <span
                        key={tool}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#021308] text-[#3dff8f] border border-[#3dff8f]/20"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
