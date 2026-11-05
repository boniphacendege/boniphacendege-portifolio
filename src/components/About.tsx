import React from 'react';
import { ProfileData } from '../data/portfolioStorage';
import { LOGO_DATA_URI } from '../assets/logo';
import {
  Palette,
  Lightbulb,
  Sparkles,
  Target,
  Compass,
  CheckCircle,
  Briefcase,
  Layers,
  ArrowRight
} from 'lucide-react';

interface AboutProps {
  profile: ProfileData;
  onHireMeClick: () => void;
  onOpenResume: () => void;
}

export const About: React.FC<AboutProps> = ({ profile, onHireMeClick, onOpenResume }) => {
  return (
    <section id="about" className="py-20 relative bg-[#010804]/50">
      <div className="w-full max-w-[1740px] 2xl:max-w-[1860px] mx-auto px-2.5 sm:px-4 md:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-12 stagger-child">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold text-[#f0b92e] bg-[#f0b92e]/10 border border-[#f0b92e]/25 mb-3">
            <Compass className="w-3.5 h-3.5 text-[#f0b92e]" />
            <span>ABOUT ME</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-serif-heading mb-4 gold-text">
            {profile.headline}
          </h2>
          <p className="text-base sm:text-lg text-[#f4fff8]/90 leading-relaxed font-medium">
            {profile.intro}
          </p>
        </div>

        {/* Narrative & Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* Left Column: Deep Dive Narrative */}
          <div className="lg:col-span-7 space-y-6">
            {/* Bio Card */}
            <div className="p-7 rounded-[22px] bg-gradient-to-br from-[#0f7a43]/20 via-[#03170d]/85 to-[#010a05] card-neon-shallow shadow-xl stagger-child">
              <h3 className="text-xl font-bold font-serif-heading text-[#fff1b8] mb-3 flex items-center gap-2">
                <Palette className="w-5 h-5 text-[#f0b92e]" />
                <span>Creative Biography & Background</span>
              </h3>
              <p className="text-sm text-[#9fbfae] leading-relaxed mb-4">
                {profile.bio}
              </p>
              <div className="pt-3 border-t border-[rgba(240,185,46,0.15)] flex flex-wrap gap-2 text-xs font-mono text-[#3dff8f]">
                <span>• Graphic Design</span>
                <span>• Visual Branding</span>
                <span>• Responsive Web</span>
                <span>• Digital Content</span>
              </div>
            </div>

            {/* Creative Approach & Philosophy */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger-child">
              <div className="p-6 rounded-2xl bg-[#02130a] card-neon-shallow">
                <div className="w-9 h-9 rounded-xl bg-[#0a351e] text-[#f0b92e] flex items-center justify-center mb-3">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <h4 className="font-bold font-serif-heading text-base text-[#fff1b8] mb-2">
                  My Creative Approach
                </h4>
                <p className="text-xs text-[#9fbfae] leading-relaxed">
                  {profile.creativeApproach}
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#02130a] card-neon-shallow">
                <div className="w-9 h-9 rounded-xl bg-[#0a351e] text-[#3dff8f] flex items-center justify-center mb-3">
                  <Target className="w-5 h-5" />
                </div>
                <h4 className="font-bold font-serif-heading text-base text-[#fff1b8] mb-2">
                  Design Philosophy
                </h4>
                <p className="text-xs text-[#9fbfae] leading-relaxed">
                  {profile.designPhilosophy}
                </p>
              </div>
            </div>

            {/* Practical AI Usage Commitment */}
            <div className="p-6 rounded-2xl bg-[#010e07] card-neon-shallow stagger-child">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#3dff8f] uppercase mb-2">
                <Sparkles className="w-4 h-4 text-[#3dff8f]" />
                <span>How I Use AI Technology</span>
              </div>
              <p className="text-xs sm:text-sm text-[#f4fff8]/90 leading-relaxed">
                {profile.aiUsageStatement}
              </p>
              <div className="mt-3 text-[11px] font-mono text-[#f0b92e]">
                AI provides acceleration — human taste, craftsmanship, and verification ensure quality.
              </div>
            </div>
          </div>

          {/* Right Column: Focus Areas & Client Fit */}
          <div className="lg:col-span-5 space-y-6">
            {/* Visual Profile Highlight */}
            <div className="p-6 rounded-[22px] bg-[#02140b] card-neon-shallow flex items-center gap-5 shadow-xl stagger-child">
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl overflow-hidden p-0.5 bg-gradient-to-br from-[#f0b92e] to-[#0f7a43] shrink-0 shadow-[0_0_14px_rgba(61,255,143,0.3)] flex items-center justify-center bg-[#010a05]">
                <img
                  src={profile.logoPhoto || LOGO_DATA_URI}
                  alt={profile.name}
                  className="w-full h-full object-contain rounded-[14px]"
                />
              </div>
              <div>
                <div className="font-serif-heading font-bold text-lg text-[#fff1b8]">
                  {profile.name}
                </div>
                <div className="text-xs text-[#3dff8f] font-mono mt-0.5">
                  Based in {profile.location}
                </div>
                <div className="mt-2 text-xs text-[#9fbfae] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full neon-dot-cycle"></span>
                  <span>Available</span>
                  <span className="neon-color-cycle font-bold uppercase text-[10px] tracking-wider">Online</span>
                </div>
              </div>
            </div>

            {/* Target Clients & Industries */}
            <div className="p-6 rounded-2xl bg-[#02130a] card-neon-shallow stagger-child">
              <h4 className="text-sm font-bold font-serif-heading text-[#fff1b8] mb-3 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#f0b92e]" />
                <span>Clients & Organizations I Serve</span>
              </h4>
              <ul className="space-y-2 text-xs text-[#9fbfae]">
                {profile.targetClients.map((client) => (
                  <li key={client} className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-[#3dff8f] shrink-0 mt-0.5" />
                    <span>{client}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Professional Interests */}
            <div className="p-6 rounded-2xl bg-[#02130a] card-neon-shallow stagger-child">
              <h4 className="text-sm font-bold font-serif-heading text-[#fff1b8] mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#3dff8f]" />
                <span>Core Creative Interests</span>
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {profile.professionalInterests.map((interest) => (
                  <span
                    key={interest}
                    className="text-xs px-2.5 py-1 rounded-full bg-[#0a351e] text-[#3dff8f] border border-[#3dff8f]/20 font-mono"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0f7a43]/25 to-[#021008] card-neon-shallow flex flex-col sm:flex-row gap-3 stagger-child">
              <button
                onClick={onHireMeClick}
                className="flex-1 py-2.5 px-4 rounded-full font-bold text-xs text-[#1a1200] bg-gradient-to-b from-[#fff1b8] via-[#f0b92e] to-[#b8841a] hover:from-white hover:to-[#f0b92e] transition-all text-center cursor-pointer"
              >
                Start a Project With Me
              </button>
              <button
                onClick={onOpenResume}
                className="py-2.5 px-4 rounded-full font-semibold text-xs text-[#fff1b8] border border-[rgba(240,185,46,0.3)] hover:border-[#f0b92e] bg-[#02100a] transition-all text-center cursor-pointer"
              >
                View CV
              </button>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
