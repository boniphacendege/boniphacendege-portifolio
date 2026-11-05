import React, { useState, useEffect } from 'react';
import { ProfileData } from '../data/portfolioStorage';
import { LOGO_DATA_URI } from '../assets/logo';
import {
  Menu,
  X,
  FileText,
  Lock,
  Unlock,
  Sparkles,
  Send,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Heart,
  Briefcase,
  Layers,
  Award,
  MessageSquare,
  Calculator,
  Compass,
  ArrowRight,
  Facebook,
  Linkedin,
  Instagram,
  Github,
  Play,
  User,
  LogOut,
  KeyRound,
  Search,
  Home,
  Palette,
  FolderOpen,
  Wrench,
  BookOpen,
  Video as VideoIcon
} from 'lucide-react';
import { GoogleLocationIcon } from './GoogleLocationIcon';
import { PWAInstallButton } from './PWAInstallButton';
import { PenOnBookIcon } from './PenOnBookIcon';
import { BestBookBadgeIcon } from './BestBookBadgeIcon';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  profile: ProfileData;
  onOpenResume: () => void;
  onOpenAdmin: () => void;
  onOpenChat: () => void;
  isAdminAuthenticated: boolean;
  onOpenMap?: () => void;
  onReplayIntro?: () => void;
  onOpenPWA?: () => void;
  onOpenAuth: (view?: 'login' | 'register') => void;
  onOpenProfile: () => void;
  onOpenSearch: () => void;
}

// Spinach seeds representation: very small balls (1.2px to 2.0px in size) spreading into the black belt background
const SPINACH_SEEDS = [
  { left: 1.2, top: 35, size: 1.4, isGold: false, delay: 0.1 },
  { left: 3.5, top: 68, size: 1.8, isGold: true, delay: 0.8 },
  { left: 5.8, top: 22, size: 1.5, isGold: false, delay: 1.5 },
  { left: 8.4, top: 62, size: 1.9, isGold: false, delay: 0.3 },
  { left: 11.0, top: 38, size: 1.3, isGold: true, delay: 2.1 },
  { left: 13.6, top: 18, size: 1.7, isGold: false, delay: 0.6 },
  { left: 16.2, top: 65, size: 1.4, isGold: false, delay: 1.8 },
  { left: 18.9, top: 28, size: 2.0, isGold: true, delay: 0.9 },
  { left: 21.4, top: 72, size: 1.4, isGold: false, delay: 1.2 },
  { left: 24.0, top: 44, size: 1.8, isGold: false, delay: 2.4 },
  { left: 26.5, top: 20, size: 1.5, isGold: true, delay: 0.4 },
  { left: 29.2, top: 66, size: 1.9, isGold: false, delay: 1.7 },
  { left: 31.8, top: 36, size: 1.3, isGold: false, delay: 0.2 },
  { left: 34.4, top: 56, size: 1.7, isGold: true, delay: 1.9 },
  { left: 37.1, top: 26, size: 1.4, isGold: false, delay: 1.1 },
  { left: 39.7, top: 70, size: 1.9, isGold: false, delay: 2.2 },
  { left: 42.3, top: 40, size: 1.3, isGold: true, delay: 0.7 },
  { left: 45.0, top: 18, size: 1.8, isGold: false, delay: 1.5 },
  { left: 47.6, top: 64, size: 1.5, isGold: false, delay: 0.5 },
  { left: 50.2, top: 30, size: 1.9, isGold: true, delay: 2.0 },
  { left: 52.9, top: 76, size: 1.4, isGold: false, delay: 1.3 },
  { left: 55.5, top: 46, size: 1.7, isGold: false, delay: 0.8 },
  { left: 58.1, top: 22, size: 1.5, isGold: true, delay: 1.6 },
  { left: 60.8, top: 68, size: 2.0, isGold: false, delay: 2.5 },
  { left: 63.3, top: 34, size: 1.3, isGold: false, delay: 0.3 },
  { left: 65.9, top: 58, size: 1.8, isGold: true, delay: 1.0 },
  { left: 68.6, top: 24, size: 1.5, isGold: false, delay: 2.3 },
  { left: 71.2, top: 72, size: 1.9, isGold: false, delay: 0.6 },
  { left: 73.8, top: 42, size: 1.4, isGold: true, delay: 1.7 },
  { left: 76.4, top: 18, size: 1.7, isGold: false, delay: 0.9 },
  { left: 79.1, top: 60, size: 1.4, isGold: false, delay: 2.1 },
  { left: 81.7, top: 32, size: 1.9, isGold: true, delay: 1.4 },
  { left: 84.3, top: 74, size: 1.3, isGold: false, delay: 0.4 },
  { left: 86.9, top: 44, size: 1.8, isGold: false, delay: 1.8 },
  { left: 89.6, top: 20, size: 1.5, isGold: true, delay: 1.1 },
  { left: 92.2, top: 66, size: 1.9, isGold: false, delay: 2.4 },
  { left: 94.8, top: 36, size: 1.3, isGold: false, delay: 0.7 },
  { left: 97.4, top: 58, size: 1.7, isGold: true, delay: 1.5 },
];

export const Header: React.FC<HeaderProps> = ({
  profile,
  onOpenResume,
  onOpenAdmin,
  onOpenChat,
  isAdminAuthenticated,
  onOpenMap,
  onReplayIntro,
  onOpenPWA,
  onOpenAuth,
  onOpenProfile,
  onOpenSearch
}) => {
  const { user, profile: userProfile, isAdmin, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update favorite count for user
  useEffect(() => {
    try {
      const stored = localStorage.getItem('boniphace_favorites_map');
      if (stored) {
        const map = JSON.parse(stored);
        setFavoriteCount(Object.values(map).filter(Boolean).length);
      }
    } catch {}
  }, [sidebarOpen]);

  const navLinks = [
    { name: 'Home', href: '#top', desc: 'Welcome & Highlights', icon: Home },
    { name: 'About', href: '#about', desc: 'Creative Philosophy & Bio', icon: User },
    { name: 'Services', href: '#services', desc: 'Design & Web Solutions', icon: Palette },
    { name: 'Projects', href: '#projects', desc: 'Portfolio Showcase', icon: FolderOpen },
    { name: 'Books', href: '#books', desc: 'Author Store & Downloadable Books', icon: BookOpen, isBook: true },
    { name: 'Video', href: '#video', desc: '16:9 & 1:1 Motion Showcase', icon: VideoIcon, isVideo: true },
    { name: 'Blog', href: '#blog', desc: 'Articles & Creative Insights', icon: PenOnBookIcon, isBlog: true },
    { name: 'Skills', href: '#skills', desc: 'Tools & Competencies', icon: Wrench },
    { name: 'Experience', href: '#experience', desc: 'Career & Freelance (2022–Present)', icon: Briefcase },
    { name: 'AI Workflow', href: '#workflow', desc: 'Human + AI Collaboration', icon: Sparkles },
    { name: 'Testimonials', href: '#testimonials', desc: 'Verified Client Reviews', icon: Award },
    { name: 'Contact', href: '#contact', desc: 'Start a Project', icon: Send },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 sm:top-1 sm:left-1/2 sm:-translate-x-1/2 w-full sm:w-[calc(100%-16px)] sm:max-w-[1840px] 2xl:max-w-[1920px] z-40 transition-all duration-300 rounded-t-[8px] sm:rounded-t-[10px] rounded-b-xl sm:rounded-b-2xl overflow-hidden ${
          isScrolled
            ? 'bg-[#052e1b]/95 backdrop-blur-md shadow-2xl'
            : 'bg-[#052e1b]/88 backdrop-blur-sm shadow-lg'
        }`}
      >
        {/* Top shining very narrow green neon line with softened top corners */}
        <div aria-hidden="true" className="header-neon-line top-0 rounded-t-[8px]" />

        <div className="w-full max-w-[1780px] 2xl:max-w-[1900px] mx-auto px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 h-16 sm:h-20">
          {/* LEFT: Logo + Site Name (Name hidden on mobile, visible on tablet, laptop, computer) */}
          <a
            href="#top"
            className="flex items-center gap-2.5 sm:gap-3 group focus:outline-none shrink-0"
            aria-label="Boniphace Ndege - Digital Portfolio"
          >
            {/* Authentic Brand Logo Emblem - Visible across all devices (Mobile, Tablet, Laptop, Desktop) */}
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-xl overflow-hidden bg-[#010a05] border border-[#f0b92e]/60 group-hover:border-[#3dff8f] p-0.5 shrink-0 transition-all duration-300 shadow-[0_0_12px_rgba(240,185,46,0.35)] group-hover:shadow-[0_0_16px_rgba(61,255,143,0.5)] flex items-center justify-center">
              <img
                src={profile.logoPhoto || LOGO_DATA_URI}
                alt={profile.name || "Boniphace Ndege"}
                className="w-full h-full object-contain rounded-lg"
              />
            </div>

            {/* Site Name: Zero 3D style, smoothly changing color between green, gold, and white with small grow neon glow */}
            <div className="flex items-center gap-1.5 sm:gap-2 select-none">
              <span className="font-serif-heading font-extrabold text-xs min-[360px]:text-sm sm:text-base md:text-lg xl:text-xl tracking-wide header-name-neon-shift whitespace-nowrap leading-none">
                Boniphace
              </span>
              <span
                className="hidden min-[420px]:inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[9px] font-mono font-black tracking-widest text-[#3dff8f] bg-[#011409] border border-[#3dff8f]/50 shadow-[0_0_8px_rgba(61,255,143,0.3)] uppercase select-none leading-none group-hover:border-[#3dff8f] group-hover:text-white transition-all"
                title="Ultra-Crisp High-Definition (HD)"
              >
                HD
              </span>
            </div>
          </a>

          {/* DESKTOP SECTIONS NAVIGATION (Computer & Laptop Viewports) */}
          <nav className="hidden xl:flex items-center gap-0.5 2xl:gap-1 text-[11px] 2xl:text-xs font-semibold text-[#c8e6d4]">
            {navLinks.map((link) => {
              const IconComp = link.icon;
              return (
                <a
                  key={link.name}
                  href={link.href}
                  className="py-1 px-1.5 2xl:px-2 rounded-lg hover:text-[#3dff8f] hover:bg-[#3dff8f]/10 border border-transparent hover:border-[#3dff8f]/20 transition-all flex items-center gap-1.5 group whitespace-nowrap"
                  title={`${link.name} - ${link.desc}`}
                >
                  <span className="w-5 h-5 rounded-md bg-[#02180d] border border-[#3dff8f]/40 flex items-center justify-center text-[#3dff8f] group-hover:border-[#3dff8f] group-hover:bg-[#06331a] group-hover:shadow-[0_0_8px_rgba(61,255,143,0.35)] transition-all shrink-0">
                    {link.name === 'Blog' ? (
                      <PenOnBookIcon className="w-3 h-3 text-[#3dff8f]" glow={false} />
                    ) : (
                      <IconComp className="w-3 h-3 text-[#3dff8f]" />
                    )}
                  </span>
                  <span>{link.name}</span>
                </a>
              );
            })}
          </nav>

          {/* FAR RIGHT EDGE: Search Icon + User Auth buttons + In-app PWA install button & Navigation Toggle Icon */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 ml-auto">
            {/* Search Icon Button */}
            <button
              onClick={onOpenSearch}
              className="py-1.5 px-2 sm:px-2.5 md:px-3 rounded-xl bg-[#02140b] border border-[#3dff8f]/40 hover:border-[#3dff8f] hover:bg-[#3dff8f]/15 text-[#3dff8f] text-xs font-semibold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer shadow-[0_0_12px_rgba(61,255,143,0.2)] active:scale-95"
              aria-label="Search sections, projects, and skills"
              title="Search sections, projects, skills (Cmd+K)"
            >
              <Search className="w-4 h-4 text-[#3dff8f]" />
              <span className="hidden sm:inline text-xs text-[#9fbfae]">Search</span>
              <kbd className="hidden md:inline-flex items-center text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#011409] text-[#3dff8f] border border-[#3dff8f]/30">
                ⌘K
              </kbd>
            </button>
            {user ? (
              <button
                onClick={onOpenProfile}
                className="py-1 px-2 sm:px-2.5 rounded-xl bg-[#02140b] border border-[#3dff8f]/40 hover:border-[#3dff8f] text-xs font-semibold text-[#f4fff8] flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer shadow-[0_0_12px_rgba(61,255,143,0.18)]"
                title="Account Profile & Settings"
              >
                {userProfile?.photoURL ? (
                  <img
                    src={userProfile.photoURL}
                    alt="Avatar"
                    className="w-5 h-5 rounded-full object-cover border border-[#3dff8f]"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-[#0a351e] border border-[#3dff8f] flex items-center justify-center text-[10px] text-[#3dff8f] font-bold">
                    {(userProfile?.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <span className="hidden md:inline max-w-[100px] truncate text-xs text-[#3dff8f]">
                  {userProfile?.displayName || 'Profile'}
                </span>
                {isAdmin && (
                  <span className="hidden lg:inline text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#f0b92e]/20 text-[#f0b92e] border border-[#f0b92e]/40 font-bold">
                    Admin
                  </span>
                )}
              </button>
            ) : (
              <button
                data-unauth-exempt="true"
                onClick={() => onOpenAuth('login')}
                aria-label="Sign In"
                title="Sign In"
                className="h-8 sm:h-auto px-2.5 sm:px-3.5 py-1.5 sm:py-1 rounded-lg sm:rounded-xl bg-[#3dff8f] hover:bg-white text-black text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(61,255,143,0.35)] shrink-0"
              >
                <User className="w-3.5 h-3.5 text-black" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}

            <PWAInstallButton variant="header" onOpen={onOpenPWA} />

            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 sm:p-2.5 rounded-xl text-[#f0b92e] border border-[rgba(240,185,46,0.35)] hover:border-[#3dff8f] hover:text-[#3dff8f] bg-[#02140b] active:scale-95 transition-all cursor-pointer flex items-center justify-center shadow-[0_0_14px_rgba(240,185,46,0.18)] shrink-0"
              aria-label="Toggle navigation menu"
              title="Open navigation menu"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* Black Belt strip under header with moving shining neon words and spreading shining spinach seeds */}
        <div
          className="relative w-full h-8 sm:h-9 flex items-center bg-[#000502] border-t border-[#3dff8f]/20 overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_4px_16px_rgba(0,0,0,0.9)] select-none"
          aria-label="Digital Portfolio Highlights"
        >
          {/* Shining very small balls as spinach seeds in size spreading into belt Black background */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden select-none z-0">
            {SPINACH_SEEDS.map((seed, idx) => (
              <span
                key={idx}
                className={`absolute rounded-full pointer-events-none ${
                  seed.isGold
                    ? 'bg-[#f0b92e] spinach-seed-gold shadow-[0_0_2px_#f0b92e]'
                    : 'bg-[#3dff8f] spinach-seed-emerald shadow-[0_0_2px_#3dff8f]'
                }`}
                style={{
                  width: `${seed.size}px`,
                  height: `${seed.size}px`,
                  left: `${seed.left}%`,
                  top: `${seed.top}%`,
                  animationDelay: `${seed.delay}s`,
                }}
              />
            ))}
          </div>

          {/* Left and right gradient fade masks for smooth entrance/exit */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-8 sm:w-20 bg-gradient-to-r from-[#000502] to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 sm:w-20 bg-gradient-to-l from-[#000502] to-transparent z-10" />

          {/* Continuously moving shining neon text with very small ball separators */}
          <div className="animate-belt-marquee relative z-5">
            {/* Sequence 1 */}
            <div className="flex items-center gap-5 sm:gap-7 shrink-0 pr-5 sm:pr-7 text-xs sm:text-sm font-mono tracking-wide">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#3dff8f] shrink-0 shadow-[0_0_3px_#3dff8f] animate-pulse" />
              <span className="neon-shining-belt-text font-semibold">
                Welcome to Boniphace Digital Portfolio
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#f0b92e] shrink-0 shadow-[0_0_2px_#f0b92e]" />
              <span className="neon-shining-belt-gold font-bold">
                Boniphace Ndege
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#3dff8f] shrink-0 shadow-[0_0_2px_#3dff8f]" />
              <span className="neon-shining-belt-text font-medium">
                Graphic Designer
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#f0b92e] shrink-0 shadow-[0_0_2px_#f0b92e]" />
              <span className="neon-shining-belt-text font-medium">
                Website Designer &amp; Developer
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#f0b92e] shrink-0 shadow-[0_0_2px_#f0b92e]" />
              <span className="neon-shining-belt-text font-medium">
                Digital Content Creator
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#3dff8f] shrink-0 shadow-[0_0_2px_#3dff8f]" />
              <span className="neon-shining-belt-gold font-bold">
                &ldquo;Creative Design. Modern Websites. Digital Innovation.&rdquo;
              </span>
            </div>

            {/* Sequence 2 (duplicate for seamless loop) */}
            <div className="flex items-center gap-5 sm:gap-7 shrink-0 pr-5 sm:pr-7 text-xs sm:text-sm font-mono tracking-wide" aria-hidden="true">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#3dff8f] shrink-0 shadow-[0_0_3px_#3dff8f] animate-pulse" />
              <span className="neon-shining-belt-text font-semibold">
                Welcome to Boniphace Digital Portfolio
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#f0b92e] shrink-0 shadow-[0_0_2px_#f0b92e]" />
              <span className="neon-shining-belt-gold font-bold">
                Boniphace Ndege
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#3dff8f] shrink-0 shadow-[0_0_2px_#3dff8f]" />
              <span className="neon-shining-belt-text font-medium">
                Graphic Designer
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#f0b92e] shrink-0 shadow-[0_0_2px_#f0b92e]" />
              <span className="neon-shining-belt-text font-medium">
                Website Designer &amp; Developer
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#f0b92e] shrink-0 shadow-[0_0_2px_#f0b92e]" />
              <span className="neon-shining-belt-text font-medium">
                Digital Content Creator
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#3dff8f] shrink-0 shadow-[0_0_2px_#3dff8f]" />
              <span className="neon-shining-belt-gold font-bold">
                &ldquo;Creative Design. Modern Websites. Digital Innovation.&rdquo;
              </span>
            </div>
          </div>
        </div>

        {/* Down (bottom) shining very narrow green neon line under the black belt */}
        <div aria-hidden="true" className="header-neon-line bottom-0" />
      </header>

      {/* Backdrop overlay for Sidebar */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-xs transition-opacity duration-200"
        />
      )}

      {/* RIGHT-SIDE NAVIGATION & USER FEATURES DRAWER */}
      {sidebarOpen && (
        <aside
          className="fixed inset-y-0 right-0 top-0 z-50 w-full sm:w-96 bg-[#010904]/98 border-l border-[rgba(240,185,46,0.35)] shadow-[0_0_60px_rgba(0,0,0,0.95)] overflow-y-auto flex flex-col justify-between animate-in slide-in-from-right duration-200"
          aria-label="Sidebar Navigation Menu"
        >
          {/* Sidebar Top: Profile & Close */}
          <div className="p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-[rgba(240,185,46,0.25)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#010a05] border border-[#f0b92e]/40 p-0.5 shrink-0 flex items-center justify-center">
                  <img
                    src={profile.logoPhoto || LOGO_DATA_URI}
                    alt={profile.name}
                    className="w-full h-full object-contain rounded-lg"
                  />
                </div>
                <div>
                  <h3 className="font-serif-heading font-extrabold text-base text-[#fff1b8] leading-tight">
                    {profile.name}
                  </h3>
                  <div className="text-[10px] font-mono text-[#3dff8f] flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-[#3dff8f] animate-pulse" />
                    <span>Available for Projects</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-xl text-[#9fbfae] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Location & Contact Bar with Google Location Icon */}
            <div className="p-3.5 rounded-2xl bg-[#02140b] border border-[rgba(240,185,46,0.2)] space-y-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setSidebarOpen(false);
                  if (onOpenMap) {
                    onOpenMap();
                  } else {
                    window.open('https://www.google.com/maps/search/?api=1&query=Dodoma+CBD+Tanzania', '_blank', 'noopener,noreferrer');
                  }
                }}
                className="w-full flex items-center justify-between text-left group p-1.5 rounded-xl hover:bg-[#032a14] border border-transparent hover:border-[#3dff8f]/40 transition-all cursor-pointer"
                title="Click to view Dodoma CBD in Google GPS Map"
              >
                <div className="flex items-center gap-2 text-[#fff1b8] group-hover:text-[#3dff8f] transition-colors">
                  <GoogleLocationIcon className="w-4 h-5" />
                  <span className="font-semibold">{profile.location || 'Dodoma CBD Tanzania'}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0a351e] text-[#3dff8f] border border-[#3dff8f]/30 font-mono">
                  GPS MAP
                </span>
              </button>
              <p className="text-[11px] text-[#9fbfae] leading-relaxed">
                Graphic Designer, Website Designer & Developer, and Digital Content Creator combining creativity and AI workflows.
              </p>

              {/* Social Channels in Drawer */}
              <div className="flex items-center gap-2 pt-2 border-t border-[rgba(240,185,46,0.15)]">
                {profile.socialLinks?.facebook && (
                  <a
                    href={profile.socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 rounded-full shining-narrow-neon-btn"
                    style={{ animationDelay: '0s' }}
                    aria-label="Facebook profile"
                    title="Facebook"
                  >
                    <Facebook className="w-3.5 h-3.5" />
                  </a>
                )}
                {profile.socialLinks?.linkedin && (
                  <a
                    href={profile.socialLinks.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 rounded-full shining-narrow-neon-btn"
                    style={{ animationDelay: '0.4s' }}
                    aria-label="LinkedIn profile"
                    title="LinkedIn"
                  >
                    <Linkedin className="w-3.5 h-3.5" />
                  </a>
                )}
                {profile.socialLinks?.instagram && (
                  <a
                    href={profile.socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 rounded-full shining-narrow-neon-btn"
                    style={{ animationDelay: '0.8s' }}
                    aria-label="Instagram profile"
                    title="Instagram"
                  >
                    <Instagram className="w-3.5 h-3.5" />
                  </a>
                )}
                {profile.socialLinks?.github && (
                  <a
                    href={profile.socialLinks.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 rounded-full shining-narrow-neon-btn"
                    style={{ animationDelay: '1.2s' }}
                    aria-label="GitHub profile"
                    title="GitHub"
                  >
                    <Github className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>

            {/* Quick User Action Cards (All features users need) */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#f0b92e] font-bold block px-1">
                Account & Quick Actions
              </span>

              {/* User Account Card */}
              {user ? (
                <div className="p-3 rounded-xl bg-gradient-to-r from-[#052e1b] to-[#011409] border border-[#3dff8f]/40 flex items-center justify-between gap-3 shadow-[0_0_15px_rgba(61,255,143,0.15)]">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {userProfile?.photoURL ? (
                      <img
                        src={userProfile.photoURL}
                        alt="Avatar"
                        className="w-9 h-9 rounded-full object-cover border border-[#3dff8f]"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-[#0a351e] border border-[#3dff8f] flex items-center justify-center text-xs text-[#3dff8f] font-bold shrink-0">
                        {(userProfile?.displayName || user.email || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#f4fff8] truncate flex items-center gap-1.5">
                        <span>{userProfile?.displayName || 'Client User'}</span>
                        {isAdmin && (
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#f0b92e]/20 text-[#f0b92e] font-bold">
                            Admin
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-[#9fbfae] truncate">{user.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setSidebarOpen(false);
                        onOpenProfile();
                      }}
                      className="p-1.5 rounded-lg bg-[#3dff8f]/15 hover:bg-[#3dff8f]/30 text-[#3dff8f] text-xs font-bold transition-colors cursor-pointer"
                      title="Profile & Settings"
                    >
                      <User className="w-4 h-4" />
                    </button>
                    <button
                      onClick={async () => {
                        await logout();
                      }}
                      className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 text-xs font-bold transition-colors cursor-pointer"
                      title="Sign Out"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  data-unauth-exempt="true"
                  onClick={() => {
                    setSidebarOpen(false);
                    onOpenAuth('login');
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#3dff8f] hover:bg-white text-black text-xs font-bold transition-all cursor-pointer shadow-[0_0_12px_rgba(61,255,143,0.3)] flex items-center justify-center gap-2"
                >
                  <User className="w-4 h-4 text-black" />
                  <span>Sign In to Account</span>
                </button>
              )}

              {/* Search Portfolio & Sections Quick Action */}
              <button
                onClick={() => {
                  setSidebarOpen(false);
                  onOpenSearch();
                }}
                className="w-full p-2.5 rounded-xl bg-[#011409] border border-[#3dff8f]/40 hover:border-[#3dff8f] text-left transition-all cursor-pointer flex items-center justify-between group shadow-[0_0_12px_rgba(61,255,143,0.15)]"
              >
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-[#3dff8f] group-hover:scale-115 transition-transform" />
                  <span className="text-xs font-bold text-[#f4fff8]">Search Portfolio & Sections</span>
                </div>
                <span className="text-[10px] font-mono text-[#3dff8f] px-2 py-0.5 rounded-full bg-[#0a351e] border border-[#3dff8f]/30">
                  Find
                </span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                {/* 1. Download CV */}
                <button
                  onClick={() => {
                    setSidebarOpen(false);
                    onOpenResume();
                  }}
                  className="p-3 rounded-xl bg-[#02100a] border border-[rgba(240,185,46,0.25)] hover:border-[#f0b92e] hover:bg-[#f0b92e]/10 text-left transition-all cursor-pointer group"
                >
                  <FileText className="w-4 h-4 text-[#f0b92e] mb-1.5 group-hover:scale-110 transition-transform" />
                  <div className="text-xs font-bold text-[#fff1b8]">Curriculum Vitae</div>
                  <div className="text-[10px] text-[#9fbfae]">View & Download PDF</div>
                </button>

                {/* 2. Ask AI Assistant */}
                <button
                  onClick={() => {
                    setSidebarOpen(false);
                    onOpenChat();
                  }}
                  className="p-3 rounded-xl bg-[#02100a] border border-[#3dff8f]/25 hover:border-[#3dff8f] hover:bg-[#3dff8f]/10 text-left transition-all cursor-pointer group"
                >
                  <Sparkles className="w-4 h-4 text-[#3dff8f] mb-1.5 group-hover:scale-110 transition-transform" />
                  <div className="text-xs font-bold text-[#3dff8f]">AI Portfolio Guide</div>
                  <div className="text-[10px] text-[#9fbfae]">Interactive Assistant</div>
                </button>
              </div>

              {/* Replay Preloader Intro Button */}
              {onReplayIntro && (
                <button
                  onClick={() => {
                    setSidebarOpen(false);
                    onReplayIntro();
                  }}
                  className="w-full p-2.5 rounded-xl bg-[#011409] border border-[rgba(61,255,143,0.3)] hover:border-[#3dff8f] text-left transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2">
                    <Play className="w-3.5 h-3.5 text-[#3dff8f] group-hover:scale-115 transition-transform" />
                    <span className="text-xs font-bold text-[#f4fff8]">Replay Brand Preloader</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#3dff8f] px-2 py-0.5 rounded-full bg-[#0a351e] border border-[#3dff8f]/30">
                    Intro UI
                  </span>
                </button>
              )}

              {/* PWA Mobile & Desktop Install Card */}
              <PWAInstallButton
                variant="sidebar"
                onOpen={() => {
                  setSidebarOpen(false);
                  onOpenPWA?.();
                }}
              />

              {/* 3. Direct WhatsApp & Call Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`https://wa.me/${(profile.whatsapp || '255765326515').replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-[#0a351e]/80 border border-[#3dff8f]/30 hover:border-[#3dff8f] text-[#3dff8f] text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#3dff8f]" />
                  <span>WhatsApp Chat</span>
                </a>

                <a
                  href={`tel:${profile.phone || '+255765326515'}`}
                  className="p-2.5 rounded-xl bg-[#010e06] border border-white/10 hover:border-[#fff1b8] text-[#fff1b8] text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Phone className="w-3.5 h-3.5 text-[#f0b92e]" />
                  <span>Call Directly</span>
                </a>
              </div>

              {/* 4. User Favorites quick counter link */}
              {favoriteCount > 0 && (
                <a
                  href="#projects"
                  onClick={() => setSidebarOpen(false)}
                  className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center justify-between transition-all"
                >
                  <span className="flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 fill-rose-400 text-rose-400" />
                    <span>Your Saved Projects</span>
                  </span>
                  <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-200">
                    {favoriteCount}
                  </span>
                </a>
              )}
            </div>

            {/* Navigation Links with Descriptions */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#f0b92e] font-bold block px-1">
                Explore Sections
              </span>

              <nav className="flex flex-col gap-1.5">
                {navLinks.map((link) => {
                  const IconComp = link.icon;
                  return (
                    <a
                      key={link.name}
                      href={link.href}
                      onClick={() => setSidebarOpen(false)}
                      className="py-2.5 px-3 rounded-2xl text-xs sm:text-sm text-[#f4fff8] hover:text-[#3dff8f] hover:bg-[#042816] border border-white/5 hover:border-[#3dff8f]/40 transition-all flex items-center justify-between group shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Modern Green Icon Container */}
                        <div className="w-8 h-8 rounded-xl bg-[#02180d] border border-[#3dff8f]/40 text-[#3dff8f] flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(61,255,143,0.2)] group-hover:border-[#3dff8f] group-hover:bg-[#06331a] group-hover:scale-105 group-hover:shadow-[0_0_14px_rgba(61,255,143,0.45)] transition-all">
                          {link.name === 'Blog' ? (
                            <PenOnBookIcon className="w-4 h-4 text-[#3dff8f]" glow={true} />
                          ) : (
                            <IconComp className="w-4 h-4 text-[#3dff8f] drop-shadow-[0_0_6px_rgba(61,255,143,0.5)]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#f4fff8] group-hover:text-[#3dff8f] transition-colors">{link.name}</span>
                            {link.name === 'Books' && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#3dff8f]/20 text-[#3dff8f] border border-[#3dff8f]/40 font-bold">
                                Author Store
                              </span>
                            )}
                            {link.name === 'Video' && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#3dff8f]/20 text-[#3dff8f] border border-[#3dff8f]/40 font-bold">
                                16:9 &amp; 1:1
                              </span>
                            )}
                            {link.name === 'Blog' && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#3dff8f]/20 text-[#3dff8f] border border-[#3dff8f]/30 font-bold">
                                New
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-[#9fbfae] block truncate group-hover:text-[#d0f5e0] transition-colors">{link.desc}</span>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-[#f0b92e]/40 group-hover:text-[#3dff8f] group-hover:translate-x-1 transition-all shrink-0 ml-2" />
                    </a>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Sidebar Bottom: Contact CTA & Admin Access */}
          <div className="p-5 sm:p-6 bg-[#021008] border-t border-[rgba(240,185,46,0.2)] space-y-3 shrink-0">
            <a
              href="#contact"
              onClick={() => setSidebarOpen(false)}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-[#1a1200] bg-gradient-to-b from-[#fff1b8] via-[#f0b92e] to-[#b8841a] hover:from-white hover:to-[#f0b92e] shadow-lg cursor-pointer transition-all"
            >
              <Send className="w-4 h-4 text-[#1a1200]" />
              <span>Hire Me / Send Inquiry</span>
            </a>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                data-unauth-exempt="true"
                data-admin-portal="true"
                data-admin-trigger="true"
                data-admin-login="true"
                onClick={(e) => {
                  e.stopPropagation();
                  setSidebarOpen(false);
                  onOpenAdmin();
                }}
                className="text-[11px] font-mono text-[#9fbfae] hover:text-[#3dff8f] flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Admin Portal Login"
                aria-label="Admin Portal Login"
              >
                {isAdminAuthenticated ? <Unlock className="w-3.5 h-3.5 text-[#3dff8f] pointer-events-none" /> : <Lock className="w-3.5 h-3.5 text-[#f0b92e] pointer-events-none" />}
                <span className="pointer-events-none">Admin Portal {isAdminAuthenticated ? '(Active)' : '(Passcode)'}</span>
              </button>

              <span className="text-[10px] font-mono text-[#9fbfae]">
                Dodoma CBD, TZ
              </span>
            </div>
          </div>
        </aside>
      )}
    </>
  );
};
