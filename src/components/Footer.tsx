import React from 'react';
import { ProfileData } from '../data/portfolioStorage';
import { LOGO_DATA_URI } from '../assets/logo';
import { ArrowUp, Github, Linkedin, Instagram, Facebook, Mail, Phone, Lock, Unlock, Sparkles, Shield, FileText } from 'lucide-react';
import { LegalTab } from './LegalModal';

interface FooterProps {
  profile: ProfileData;
  onOpenAdmin: () => void;
  isAdminAuthenticated: boolean;
  onOpenLegal?: (tab: LegalTab) => void;
}

export const Footer: React.FC<FooterProps> = ({
  profile,
  onOpenAdmin,
  isAdminAuthenticated,
  onOpenLegal
}) => {
  // Copyright Year: Automatically calculates current year or uses manual year from Admin Dashboard
  const dynamicCurrentYear = new Date().getFullYear();
  const displayYear =
    profile.copyrightMode === 'manual' && profile.copyrightManualYear?.trim()
      ? profile.copyrightManualYear.trim()
      : dynamicCurrentYear;

  return (
    <footer className="border-t border-[rgba(240,185,46,0.28)] pt-12 pb-0 bg-[#041c10] text-[#9fbfae] text-sm flex flex-col justify-between">
      {/* Top Section with Brand, Social Icons, and Back to Top */}
      <div className="w-full max-w-[1780px] 2xl:max-w-[1900px] mx-auto px-3 sm:px-6 pb-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden p-0.5 bg-gradient-to-br from-[#f0b92e] to-[#0f7a43] shrink-0 shadow-[0_0_12px_rgba(61,255,143,0.3)] flex items-center justify-center bg-[#010a05]">
              <img
                src={profile.logoPhoto || LOGO_DATA_URI}
                alt={profile.name}
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <div>
              <div className="font-serif-heading font-extrabold text-base text-[#f4fff8]">
                {profile.name}
              </div>
              <div className="text-xs text-[#3dff8f] font-mono">
                Graphic Designer · Website Designer & Developer · Digital Content Creator
              </div>
            </div>
          </div>

          {/* Social Links with shining narrow green neon effect */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap justify-center">
            {profile.socialLinks.github && (
              <a
                href={profile.socialLinks.github}
                target="_blank"
                rel="noopener noreferrer"
                className="group shining-narrow-neon-btn w-9 h-9 sm:w-10 sm:h-10 rounded-full"
                style={{ animationDelay: '0s' }}
                aria-label="GitHub profile"
                title="GitHub"
              >
                <Github className="w-4 h-4 sm:w-4.5 sm:h-4.5 group-hover:scale-115 transition-transform duration-300" />
              </a>
            )}
            {profile.socialLinks.linkedin && (
              <a
                href={profile.socialLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="group shining-narrow-neon-btn w-9 h-9 sm:w-10 sm:h-10 rounded-full"
                style={{ animationDelay: '0.4s' }}
                aria-label="LinkedIn profile"
                title="LinkedIn"
              >
                <Linkedin className="w-4 h-4 sm:w-4.5 sm:h-4.5 group-hover:scale-115 transition-transform duration-300" />
              </a>
            )}
            {profile.socialLinks.instagram && (
              <a
                href={profile.socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="group shining-narrow-neon-btn w-9 h-9 sm:w-10 sm:h-10 rounded-full"
                style={{ animationDelay: '0.8s' }}
                aria-label="Instagram profile"
                title="Instagram"
              >
                <Instagram className="w-4 h-4 sm:w-4.5 sm:h-4.5 group-hover:scale-115 transition-transform duration-300" />
              </a>
            )}
            {profile.socialLinks.facebook && (
              <a
                href={profile.socialLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="group shining-narrow-neon-btn w-9 h-9 sm:w-10 sm:h-10 rounded-full"
                style={{ animationDelay: '1.2s' }}
                aria-label="Facebook profile"
                title="Facebook"
              >
                <Facebook className="w-4 h-4 sm:w-4.5 sm:h-4.5 group-hover:scale-115 transition-transform duration-300" />
              </a>
            )}
            <a
              href={`mailto:${profile.email}`}
              className="group shining-narrow-neon-btn w-9 h-9 sm:w-10 sm:h-10 rounded-full"
              style={{ animationDelay: '1.6s' }}
              aria-label="Send Email"
              title="Email"
            >
              <Mail className="w-4 h-4 sm:w-4.5 sm:h-4.5 group-hover:scale-115 transition-transform duration-300" />
            </a>
            <a
              href={`https://wa.me/${profile.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group shining-narrow-neon-btn w-9 h-9 sm:w-10 sm:h-10 rounded-full"
              style={{ animationDelay: '2.0s' }}
              aria-label="WhatsApp"
              title="WhatsApp"
            >
              <Phone className="w-4 h-4 sm:w-4.5 sm:h-4.5 group-hover:scale-115 transition-transform duration-300" />
            </a>
          </div>

          {/* Back to top */}
          <a
            href="#top"
            className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#f0b92e] hover:text-white transition-colors"
          >
            <span>Back to top</span>
            <ArrowUp className="w-4 h-4 text-[#f0b92e] group-hover:text-[#3dff8f] group-hover:-translate-y-0.5 transition-all" />
          </a>
        </div>
      </div>

      {/* Sticky More Decorative Modern Dark Green Neon Card */}
      <div className="sticky bottom-0 z-30 w-full sm:bottom-1 sm:max-w-[1840px] 2xl:max-w-[1920px] sm:mx-auto border-t border-[rgba(240,185,46,0.35)] bg-gradient-to-b from-[#02180d]/96 via-[#010f06]/98 to-[#000502]/98 shadow-[0_-10px_35px_rgba(0,0,0,0.85),0_-2px_15px_rgba(61,255,143,0.18)] backdrop-blur-xl py-4 sm:py-5 relative overflow-hidden rounded-t-xl sm:rounded-t-2xl rounded-b-[8px] sm:rounded-b-[10px]">
        {/* Top Shining Dual Emerald & Gold Neon Line */}
        <div aria-hidden="true" className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#3dff8f] to-transparent shadow-[0_0_10px_#3dff8f,0_0_20px_rgba(61,255,143,0.6)]" />
        
        {/* Center Jewel Ornament on the top border */}
        <div aria-hidden="true" className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
          <div className="w-2.5 h-2.5 rounded-full bg-[#f0b92e] shadow-[0_0_8px_#f0b92e,0_0_16px_#3dff8f] ring-2 ring-[#02180d]" />
        </div>

        {/* Ambient Radial Glow Overlays */}
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(61,255,143,0.12),transparent_70%)]" />
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_40%_40%_at_50%_100%,rgba(240,185,46,0.05),transparent_70%)]" />

        <div className="relative w-full max-w-[1780px] 2xl:max-w-[1900px] mx-auto px-3 sm:px-6 flex flex-col items-center justify-center gap-2.5 text-xs text-center">
          {/* Row 1: Admin Portal & AI Status (Placed ABOVE copyright) */}
          <div className="flex items-center gap-3 select-none flex-wrap justify-center">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenAdmin();
              }}
              data-unauth-exempt="true"
              data-admin-portal="true"
              data-admin-trigger="true"
              data-admin-login="true"
              className="group relative inline-flex items-center gap-2.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#031d0f]/90 via-[#07321a]/85 to-[#031d0f]/90 hover:from-[#093d22] hover:to-[#042413] border border-[#3dff8f]/40 hover:border-[#3dff8f] text-xs font-mono text-[#fff1b8] hover:text-[#3dff8f] shadow-[0_0_12px_rgba(61,255,143,0.2),inset_0_1px_0_rgba(255,255,255,0.12)] hover:shadow-[0_0_20px_rgba(61,255,143,0.45),0_0_8px_#3dff8f] transition-all duration-300 cursor-pointer active:scale-95"
              title="Access Admin Dashboard"
              aria-label="Admin Portal Login"
            >
              <span className="relative flex items-center justify-center w-5 h-5 rounded-lg bg-black/60 border border-[rgba(240,185,46,0.35)] group-hover:border-[#3dff8f] transition-colors pointer-events-none">
                {isAdminAuthenticated ? (
                  <Unlock className="w-3 h-3 text-[#3dff8f]" />
                ) : (
                  <Lock className="w-3 h-3 text-[#f0b92e]" />
                )}
              </span>
              <span className="font-semibold tracking-wide pointer-events-none">
                {isAdminAuthenticated ? 'Admin Dashboard (Active)' : 'Admin Portal Login'}
              </span>
              <Sparkles className="w-3 h-3 text-[#f0b92e]/80 group-hover:text-[#f0b92e] group-hover:rotate-12 transition-all duration-300 pointer-events-none" />
            </button>

            {/* Decorative Diamond Ornament */}
            <div className="flex items-center gap-1.5 text-[#3dff8f]/60">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f0b92e] shadow-[0_0_6px_#f0b92e]" />
              <span className="text-[10px] text-[#3dff8f]/50 font-mono">✦</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#3dff8f] shadow-[0_0_6px_#3dff8f]" />
            </div>

            {/* AI-Enabled Decorative Radar Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#032313]/90 to-[#02180d]/90 border border-[#3dff8f]/50 text-xs font-mono text-[#3dff8f] shadow-[0_0_12px_rgba(61,255,143,0.25),inset_0_0_8px_rgba(61,255,143,0.1)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3dff8f] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3dff8f] shadow-[0_0_6px_#3dff8f]" />
              </span>
              <span className="font-bold tracking-wider text-[11px] uppercase bg-gradient-to-r from-[#3dff8f] via-[#fff1b8] to-[#3dff8f] bg-clip-text text-transparent">
                AI-Enabled
              </span>
            </div>
          </div>

          {/* Row 2: Comprehensive Legal & Compliance Links */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-3 flex-wrap text-xs text-[#9fbfae] pt-1">
            <button
              type="button"
              onClick={() => onOpenLegal?.('privacy')}
              className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono text-[#c8e2d4] hover:text-[#3dff8f] hover:bg-[#032414] border border-white/5 hover:border-[#3dff8f]/40 transition-all cursor-pointer"
            >
              <Shield className="w-3 h-3 text-[#3dff8f] group-hover:scale-110 transition-transform" />
              <span>Privacy Policy</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#0a351e] text-[#3dff8f] border border-[#3dff8f]/30 hidden sm:inline-block">
                PDPA & GDPR
              </span>
            </button>

            <span className="text-white/20">•</span>

            <button
              type="button"
              onClick={() => onOpenLegal?.('terms')}
              className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono text-[#c8e2d4] hover:text-[#f0b92e] hover:bg-[#032414] border border-white/5 hover:border-[#f0b92e]/40 transition-all cursor-pointer"
            >
              <FileText className="w-3 h-3 text-[#f0b92e] group-hover:scale-110 transition-transform" />
              <span>Terms of Service</span>
            </button>

            <span className="text-white/20">•</span>

            <button
              type="button"
              onClick={() => onOpenLegal?.('cookies')}
              className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono text-[#c8e2d4] hover:text-[#3dff8f] hover:bg-[#032414] border border-white/5 hover:border-[#3dff8f]/40 transition-all cursor-pointer"
            >
              <span>Cookies</span>
            </button>

            <span className="text-white/20">•</span>

            <button
              type="button"
              onClick={() => onOpenLegal?.('services')}
              className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono text-[#c8e2d4] hover:text-[#f0b92e] hover:bg-[#032414] border border-white/5 hover:border-[#f0b92e]/40 transition-all cursor-pointer"
            >
              <span>Client Agreement</span>
            </button>
          </div>

          {/* Decorative Subtle Divider */}
          <div aria-hidden="true" className="flex items-center justify-center gap-3 w-full max-w-xs my-0.5 opacity-75">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[rgba(61,255,143,0.3)] to-transparent" />
            <span className="w-1.5 h-1.5 rotate-45 border border-[#f0b92e] bg-[#02180d] shadow-[0_0_6px_#f0b92e]" />
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[rgba(61,255,143,0.3)] to-transparent" />
          </div>

          {/* Row 3: Copyright (Placed BELOW Legal Links) */}
          <div className="flex items-center justify-center gap-2 text-[#c2dfd0] font-medium text-center text-xs tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3dff8f] shadow-[0_0_6px_#3dff8f] shrink-0" />
            <span>
              &copy; {displayYear}{' '}
              <strong className="text-[#f4fff8] font-bold tracking-normal hover:text-[#3dff8f] transition-colors">
                {profile.name}
              </strong>
              . All rights reserved.
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#f0b92e] shadow-[0_0_6px_#f0b92e] shrink-0" />
          </div>
        </div>

        {/* Bottom edge green neon line with increased size, softened angles and glowing neon style */}
        <div aria-hidden="true" className="footer-neon-line rounded-b-[8px]" />
      </div>
    </footer>
  );
};
