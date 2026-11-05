import React from 'react';
import { ProfileData } from '../data/portfolioStorage';
import { LOGO_DATA_URI } from '../assets/logo';
import {
  ArrowRight,
  Sparkles,
  MapPin,
  FileText,
  Send,
  MessageSquare,
  CheckCircle2,
  Facebook,
  Linkedin,
  Instagram,
  Github,
  ExternalLink
} from 'lucide-react';
import { GoogleLocationIcon } from './GoogleLocationIcon';

interface HeroProps {
  profile: ProfileData;
  onExploreProjects: () => void;
  onContactClick: () => void;
  onOpenResume: () => void;
  onOpenMap?: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  profile,
  onExploreProjects,
  onContactClick,
  onOpenResume,
  onOpenMap,
}) => {
  const hasCustomPhoto = Boolean(
    profile.profilePhoto &&
    profile.profilePhoto !== LOGO_DATA_URI &&
    !profile.profilePhoto.includes('<svg') &&
    !profile.profilePhoto.includes('data:image/svg')
  );

  const heroImage =
    profile.heroBackgroundImage ||
    (hasCustomPhoto ? profile.profilePhoto : (profile.logoPhoto || profile.profilePhoto || LOGO_DATA_URI));

  const isCustomHeroImage = Boolean(
    (profile.heroBackgroundImage && profile.heroBackgroundImage !== '') ||
    hasCustomPhoto ||
    (profile.logoPhoto && profile.logoPhoto !== LOGO_DATA_URI)
  );

  return (
    <section id="top" className="relative flex flex-col pt-[88px] sm:pt-[100px] pb-8 overflow-hidden w-full">
      {/* Background radial gradient ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gradient-to-tr from-[#0a5a31]/25 via-[#0f7a43]/18 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Dynamic Hero Transparent Image Background Layer if configured */}
      {profile.heroBackgroundImage && (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center">
          <img
            src={profile.heroBackgroundImage}
            alt="Hero Background Layer"
            className={`w-full h-full select-none transition-all duration-700 pointer-events-none ${
              profile.heroBackgroundPosition === 'cover'
                ? 'object-cover object-center'
                : profile.heroBackgroundPosition === 'left'
                ? 'object-contain object-left'
                : profile.heroBackgroundPosition === 'center'
                ? 'object-contain object-center'
                : 'object-contain object-right md:object-right-bottom'
            }`}
            style={{
              opacity: Math.max((profile.heroBackgroundOpacity ?? 45) / 100, 0.45)
            }}
          />
          {/* Gentle vignettes that smoothly blend without heavily darkening */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#041c10] via-transparent to-[#041c10]/40 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#041c10]/60 via-transparent to-[#041c10]/20 pointer-events-none" />
        </div>
      )}

      {/* Full-width Extended Hero Card reaching nearly to the main website left and right edges */}
      <div className="w-[calc(100%-8px)] sm:w-[calc(100%-16px)] md:w-[calc(100%-24px)] max-w-[1780px] 2xl:max-w-[1900px] mx-auto relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[rgba(240,185,46,0.35)] card-neon-shallow bg-[#052416]/80 backdrop-blur-xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] group">
        
        {/* Bright Hero Background Image Behind Card Contents with Reduced Darkness */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
          {/* Prominent 1:1 Aspect Ratio Hero Graphic Layer positioned behind contents */}
          <div className="absolute inset-0 flex items-center justify-end pr-2 sm:pr-8 md:pr-16 lg:pr-24">
            <div className="w-[300px] h-[300px] sm:w-[420px] sm:h-[420px] md:w-[520px] md:h-[520px] lg:w-[620px] lg:h-[620px] aspect-square relative flex items-center justify-center opacity-80 sm:opacity-90 group-hover:opacity-100 transition-opacity duration-700">
              <img
                src={heroImage}
                alt="Hero background graphic"
                className={`w-full h-full aspect-square ${
                  isCustomHeroImage && !profile.heroShowcaseTransparent
                    ? 'object-cover rounded-3xl'
                    : 'object-contain'
                } drop-shadow-[0_15px_40px_rgba(61,255,143,0.35)]`}
              />
            </div>
          </div>

          {/* Ambient full cover backdrop - bright, vibrant with reduced darkness */}
          <img
            src={heroImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-center opacity-30 sm:opacity-40 filter brightness-110 contrast-105 blur-[0.5px] scale-105 transition-all duration-700"
          />

          {/* Softened gradient overlays for crystal-clear readability without crushing image brightness */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#010904]/90 via-[#010904]/60 to-[#010904]/25 sm:via-[#010904]/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#010904]/85 via-transparent to-[#010904]/30" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(61,255,143,0.2),transparent_65%)]" />
        </div>

        {/* Foreground Content Stack across extended card */}
        <div className="relative z-10 w-full max-w-[1740px] 2xl:max-w-[1860px] mx-auto px-3 sm:px-6 md:px-8 lg:px-12 py-5 sm:py-8 md:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Column: Hero Content, Headings & Actions */}
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col items-start">
              
              {/* Top Row: Availability Pill */}
              <div className="w-full flex items-center mb-5 stagger-child">
                {/* Availability Pill */}
                <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-[rgba(240,185,46,0.35)] bg-[#02180d]/90 backdrop-blur-md text-[#fff1b8] text-xs sm:text-sm font-medium shadow-lg shadow-[#0a3d22]/30 select-none">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full neon-dot-cycle opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 neon-dot-cycle"></span>
                  </span>
                  <span className="flex items-center gap-1.5 font-mono text-xs sm:text-sm">
                    <span className="text-[#f4fff8] font-semibold tracking-wide">Available</span>
                    <span className="neon-color-cycle font-extrabold tracking-wider uppercase text-[11px] sm:text-xs px-2 py-0.5 rounded-full bg-black/50 border border-white/10">
                      Online
                    </span>
                  </span>
                </div>
              </div>

              {/* Name - strictly on one straight line with reduced responsive font size */}
              <h1
                title={profile.name || 'Ev Dr. Boniphace J. Ndege'}
                className="text-[16px] min-[360px]:text-[17.5px] min-[400px]:text-[19px] sm:text-2xl md:text-[1.7rem] lg:text-[1.95rem] xl:text-[2.25rem] font-extrabold font-serif-heading tracking-tight leading-tight mb-4 sm:mb-5 overflow-visible whitespace-nowrap max-w-full stagger-child"
              >
                <span className="gold-text inline-block pb-1.5 sm:pb-2 pt-0.5 overflow-visible whitespace-nowrap drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]">
                  {profile.name || 'Ev Dr. Boniphace J. Ndege'}
                </span>
              </h1>

              {/* Interactive Location Tag with Blinking Small Neon Google Location Icon */}
              <div className="flex flex-wrap items-center gap-2.5 mb-5 stagger-child">
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenMap) {
                      onOpenMap();
                    } else {
                      window.open('https://www.google.com/maps/search/?api=1&query=Dodoma+CBD+Tanzania', '_blank', 'noopener,noreferrer');
                    }
                  }}
                  className="group inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#02180d]/90 hover:bg-[#032a14] border border-[rgba(240,185,46,0.35)] hover:border-[#3dff8f] text-xs sm:text-sm text-[#f4fff8] font-mono transition-all duration-300 shadow-sm hover:shadow-[0_0_8px_rgba(61,255,143,0.2)] cursor-pointer select-none"
                  title="Click to view Dodoma CBD in Google GPS Map"
                  aria-label="Show Dodoma CBD on Google GPS Map"
                >
                  {/* Blinking, shining very small neon Google Location pin */}
                  <GoogleLocationIcon className="w-4 h-5" />
                  <span className="font-semibold text-[#f4fff8] group-hover:text-[#3dff8f] transition-colors">
                    {profile.location || 'Dodoma CBD Tanzania'}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#0a351e] group-hover:bg-[#3dff8f] text-[#3dff8f] group-hover:text-[#011408] text-[10px] font-bold tracking-wider transition-colors border border-[#3dff8f]/40">
                    <span>GPS MAP</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </span>
                </button>

                <div className="hidden sm:inline-flex items-center gap-2 text-xs text-[#c8e2d4]/80 font-mono">
                  <span className="text-[#f0b92e]/60">•</span>
                  <span className="text-[#3dff8f] font-semibold">Creative & Digital Tech</span>
                </div>
              </div>

              {/* Supporting Description */}
              <p className="text-sm sm:text-base lg:text-lg text-[#d3e7dc] max-w-[680px] leading-relaxed mb-6 drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] font-medium stagger-child">
                I create visual identities, modern websites, and engaging digital content by combining creative thinking, modern design tools, web technologies, and AI-assisted workflows.
              </p>

              {/* The 4 Action Buttons */}
              <div className="flex flex-wrap gap-3 items-center mb-6 w-full sm:w-auto stagger-child">
                {/* 1. Explore My Projects */}
                <a
                  href="#projects"
                  onClick={(e) => {
                    e.preventDefault();
                    onExploreProjects();
                  }}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full font-bold text-xs sm:text-sm text-[#1a1200] bg-gradient-to-b from-[#fff1b8] via-[#f0b92e] to-[#b8841a] hover:from-white hover:to-[#f0b92e] shadow-[0_0_0_1px_rgba(255,255,255,0.2)_inset,0_6px_22px_-6px_rgba(240,185,46,0.7)] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
                >
                  <span>Explore My Projects</span>
                  <ArrowRight className="w-4 h-4 text-[#1a1200]" />
                </a>

                {/* 2. Hire Me */}
                <a
                  href="#contact"
                  onClick={(e) => {
                    e.preventDefault();
                    onContactClick();
                  }}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full font-bold text-xs sm:text-sm text-[#3dff8f] bg-[#02180d]/80 border border-[#3dff8f] shadow-[0_0_18px_-8px_#3dff8f] hover:bg-[#3dff8f]/20 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Hire Me</span>
                </a>

                {/* 3. Download My CV */}
                <button
                  onClick={onOpenResume}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full text-xs sm:text-sm font-semibold text-[#f4fff8] border border-[rgba(240,185,46,0.35)] hover:border-[#f0b92e] hover:text-[#f0b92e] bg-[#02100a]/90 transition-all cursor-pointer shadow-md"
                >
                  <FileText className="w-3.5 h-3.5 text-[#f0b92e]" />
                  <span>Download My CV</span>
                </button>

                {/* 4. Contact Me */}
                <a
                  href="#contact"
                  onClick={(e) => {
                    e.preventDefault();
                    onContactClick();
                  }}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full text-xs sm:text-sm font-semibold text-[#9fbfae] hover:text-[#fff1b8] border border-white/20 hover:border-white/40 bg-[#02100a]/80 transition-all cursor-pointer shadow-md"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Contact Me</span>
                </a>
              </div>

              {/* Social Profiles Row */}
              <div className="flex flex-wrap items-center gap-3 mb-6 stagger-child">
                <span className="text-xs font-mono text-[#c8e2d4] font-semibold drop-shadow-sm">Social Profiles:</span>
                <div className="flex items-center gap-2">
                  {profile.socialLinks?.facebook && (
                    <a
                      href={profile.socialLinks.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group w-8 h-8 rounded-full bg-[#02140b] border border-[rgba(240,185,46,0.35)] hover:border-[#3dff8f] flex items-center justify-center text-[#c8e2d4] hover:text-[#3dff8f] hover:bg-[#032a14] hover:shadow-[0_0_15px_rgba(61,255,143,0.55)] hover:-translate-y-1 active:scale-95 transition-all duration-300 shadow-md"
                      aria-label="Facebook profile"
                      title="Facebook"
                    >
                      <Facebook className="w-4 h-4 group-hover:scale-115 transition-transform duration-300" />
                    </a>
                  )}
                  {profile.socialLinks?.linkedin && (
                    <a
                      href={profile.socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group w-8 h-8 rounded-full bg-[#02140b] border border-[rgba(240,185,46,0.35)] hover:border-[#3dff8f] flex items-center justify-center text-[#c8e2d4] hover:text-[#3dff8f] hover:bg-[#032a14] hover:shadow-[0_0_15px_rgba(61,255,143,0.55)] hover:-translate-y-1 active:scale-95 transition-all duration-300 shadow-md"
                      aria-label="LinkedIn profile"
                      title="LinkedIn"
                    >
                      <Linkedin className="w-4 h-4 group-hover:scale-115 transition-transform duration-300" />
                    </a>
                  )}
                  {profile.socialLinks?.instagram && (
                    <a
                      href={profile.socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group w-8 h-8 rounded-full bg-[#02140b] border border-[rgba(240,185,46,0.35)] hover:border-[#3dff8f] flex items-center justify-center text-[#c8e2d4] hover:text-[#3dff8f] hover:bg-[#032a14] hover:shadow-[0_0_15px_rgba(61,255,143,0.55)] hover:-translate-y-1 active:scale-95 transition-all duration-300 shadow-md"
                      aria-label="Instagram profile"
                      title="Instagram"
                    >
                      <Instagram className="w-4 h-4 group-hover:scale-115 transition-transform duration-300" />
                    </a>
                  )}
                  {profile.socialLinks?.github && (
                    <a
                      href={profile.socialLinks.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group w-8 h-8 rounded-full bg-[#02140b] border border-[rgba(240,185,46,0.35)] hover:border-[#3dff8f] flex items-center justify-center text-[#c8e2d4] hover:text-[#3dff8f] hover:bg-[#032a14] hover:shadow-[0_0_15px_rgba(61,255,143,0.55)] hover:-translate-y-1 active:scale-95 transition-all duration-300 shadow-md"
                      aria-label="GitHub profile"
                      title="GitHub"
                    >
                      <Github className="w-4 h-4 group-hover:scale-115 transition-transform duration-300" />
                    </a>
                  )}
                </div>
              </div>

              {/* Core Pillars / Highlights */}
              <div className="w-full pt-4 border-t border-[rgba(240,185,46,0.25)] grid grid-cols-2 sm:grid-cols-4 gap-3 stagger-child">
                <div className="p-3 rounded-xl bg-[#021208]/90 card-neon-shallow flex flex-col shadow-md">
                  <span className="text-xs font-mono font-bold text-[#f0b92e]">Visual Branding</span>
                  <span className="text-[11px] text-[#c8e2d4] mt-0.5">Logos & Style Guides</span>
                </div>
                <div className="p-3 rounded-xl bg-[#021208]/90 card-neon-shallow flex flex-col shadow-md">
                  <span className="text-xs font-mono font-bold text-[#3dff8f]">Responsive Web</span>
                  <span className="text-[11px] text-[#c8e2d4] mt-0.5">Mobile-First UI/UX</span>
                </div>
                <div className="p-3 rounded-xl bg-[#021208]/90 card-neon-shallow flex flex-col shadow-md">
                  <span className="text-xs font-mono font-bold text-[#f0b92e]">Digital Content</span>
                  <span className="text-[11px] text-[#c8e2d4] mt-0.5">Flyers, Posters & Media</span>
                </div>
                <div className="p-3 rounded-xl bg-[#021208]/90 card-neon-shallow flex flex-col shadow-md">
                  <span className="text-xs font-mono font-bold text-[#3dff8f]">AI Workflows</span>
                  <span className="text-[11px] text-[#c8e2d4] mt-0.5">Modern Tooling</span>
                </div>
              </div>

            </div>

            {/* Right Column: 1:1 Aspect Ratio Bright Visual Card & Badges */}
            <div className="lg:col-span-5 xl:col-span-4 flex flex-col items-center justify-center relative stagger-child">
              <div className="relative w-full max-w-[360px] sm:max-w-[400px] aspect-square flex items-center justify-center">
                
                {/* Subtle Radial Neon Glow */}
                <div className="absolute w-[82%] aspect-square rounded-full bg-radial from-[#3dff8f]/14 via-[#0f7a43]/08 to-transparent blur-xl pointer-events-none" />

                {/* Rotating Round Circle as Ring with Green Neon Shining Rotation */}
                {/* 1. Primary Green Neon Rotating Ring - Beautifully framing image with neon glow */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute w-[94%] aspect-square top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-transparent border-t-[#3dff8f]/85 border-r-[#3dff8f]/40 shining-neon-rotating-ring shadow-[0_0_10px_rgba(61,255,143,0.35),inset_0_0_6px_rgba(61,255,143,0.15)]"
                >
                  {/* Subtle Green Neon Head Satellite Bead */}
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#3dff8f] shadow-[0_0_6px_#3dff8f]" />
                  {/* Subtle Opposite Sparkle Bead */}
                  <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#fff1b8] shadow-[0_0_4px_#f0b92e]" />
                </div>

                {/* 2. Secondary Subtle Green Neon Dashed Counter Ring */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute w-[88%] aspect-square top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#3dff8f]/25 border-dashed shining-neon-counter-ring shadow-[0_0_6px_rgba(61,255,143,0.18)]"
                />
                
                {/* 1:1 Square Photo Showcase Container */}
                <div
                  className={`relative z-10 w-[84%] aspect-square rounded-3xl overflow-hidden p-1.5 bg-gradient-to-br from-[#f0b92e] via-[#0f7a43] to-[#3dff8f] shadow-[0_20px_50px_rgba(0,0,0,0.85)] animate-floating group`}
                >
                  <div
                    className={`w-full h-full rounded-[22px] overflow-hidden flex items-center justify-center relative aspect-square ${
                      isCustomHeroImage ? (profile.heroShowcaseTransparent ? 'p-2' : 'p-0') : 'p-3'
                    } ${
                      profile.heroShowcaseTransparent
                        ? 'bg-transparent shadow-[inset_0_0_25px_rgba(61,255,143,0.15)]'
                        : 'bg-[#010904]'
                    }`}
                  >
                    <img
                      src={heroImage}
                      alt={profile.name}
                      className={`w-full h-full aspect-square transition-transform duration-500 group-hover:scale-105 filter brightness-105 ${
                        isCustomHeroImage
                          ? profile.heroShowcaseTransparent
                            ? 'object-contain drop-shadow-[0_15px_30px_rgba(61,255,143,0.4)]'
                            : 'object-cover rounded-[22px]'
                          : 'object-contain mix-blend-screen drop-shadow-[0_15px_35px_rgba(61,255,143,0.4)]'
                      }`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />

                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

