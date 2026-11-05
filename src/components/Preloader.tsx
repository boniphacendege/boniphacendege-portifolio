import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, CheckCircle2, Timer } from 'lucide-react';
import { LOGO_DATA_URI } from '../assets/logo';

interface PreloaderProps {
  onComplete?: () => void;
  brandName?: string;
  titles?: string[];
  logoPhoto?: string;
}

const PHASES = [
  'INITIALIZING CREATIVE PORTFOLIO...',
  'LOADING VISUAL BRANDING ASSETS...',
  'CALIBRATING RESPONSIVE INTERFACES...',
  'INITIALIZING AI DESIGN WORKFLOWS...',
  'PORTFOLIO READY — WELCOME'
];

export const Preloader: React.FC<PreloaderProps> = ({
  onComplete,
  brandName = 'Boniphace Ndege',
  titles = [
    'Graphic Designer',
    'Website Designer & Developer',
    'Digital Content Creator'
  ],
  logoPhoto
}) => {
  const activeLogo = logoPhoto || LOGO_DATA_URI;
  const [progress, setProgress] = useState(0);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isRemoved, setIsRemoved] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startTimeRef = useRef<number>(performance.now());
  const finalTimeRef = useRef<string>('');

  const MIN_DISPLAY_MS = 500;       // Minimum display duration: 500ms (0.5s) to prevent flicker
  const IDEAL_TARGET_MS = 1200;     // Ideal target: 1.0–1.5s for polished premium feel
  const MAX_NORMAL_TARGET_MS = 2000;// Maximum target under normal conditions: 2.0s

  const isContentReadyRef = useRef<boolean>(false);
  const completedRef = useRef<boolean>(false);

  // Monitor DOM, fonts, and critical assets readiness
  useEffect(() => {
    let isMounted = true;
    const markReady = () => {
      if (isMounted) {
        isContentReadyRef.current = true;
      }
    };

    let fallbackTimer: NodeJS.Timeout | undefined;

    if (document.readyState === 'complete') {
      if (document.fonts && 'ready' in document.fonts) {
        document.fonts.ready.then(markReady).catch(markReady);
      } else {
        markReady();
      }
    } else {
      const handleLoad = () => {
        if (document.fonts && 'ready' in document.fonts) {
          document.fonts.ready.then(markReady).catch(markReady);
        } else {
          markReady();
        }
      };

      window.addEventListener('load', handleLoad, { once: true });
      fallbackTimer = setTimeout(markReady, MAX_NORMAL_TARGET_MS);
    }

    return () => {
      isMounted = false;
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, []);

  useEffect(() => {
    // High-performance timer loop with dynamic content readiness & 500ms min / 1-1.5s ideal / 2s max
    const interval = setInterval(() => {
      if (completedRef.current) return;

      const currentElapsed = Math.round(performance.now() - startTimeRef.current);
      setElapsedMs(currentElapsed);

      const isReady = isContentReadyRef.current;

      // When ready and minimum display duration (500ms) has elapsed:
      if (isReady && currentElapsed >= MIN_DISPLAY_MS) {
        // Under ideal conditions, complete smoothly around IDEAL_TARGET_MS (1.2s)
        if (currentElapsed >= IDEAL_TARGET_MS) {
          completedRef.current = true;
          clearInterval(interval);
          setProgress(100);
          setPhaseIndex(PHASES.length - 1);
          if (!finalTimeRef.current) {
            finalTimeRef.current = (currentElapsed / 1000).toFixed(2) + 's';
          }
          return;
        }

        // Between 500ms and IDEAL_TARGET_MS: smoothly accelerate from 50% to 100%
        const fraction = (currentElapsed - MIN_DISPLAY_MS) / (IDEAL_TARGET_MS - MIN_DISPLAY_MS);
        const curved = Math.sin((fraction * Math.PI) / 2);
        const calculatedProgress = Math.min(99, Math.floor(50 + 49 * curved));

        setProgress((prev) => Math.max(prev, calculatedProgress));
        const idx = Math.min(
          PHASES.length - 1,
          Math.floor((calculatedProgress / 100) * PHASES.length)
        );
        setPhaseIndex(idx);
      } else if (isReady && currentElapsed < MIN_DISPLAY_MS) {
        // Ready very fast (e.g. cached), smoothly advance up to 50% during the required 500ms minimum
        const fraction = currentElapsed / MIN_DISPLAY_MS;
        const calculatedProgress = Math.min(50, Math.floor(fraction * 50));
        setProgress((prev) => Math.max(prev, calculatedProgress));
        const idx = Math.min(
          PHASES.length - 1,
          Math.floor((calculatedProgress / 100) * PHASES.length)
        );
        setPhaseIndex(idx);
      } else {
        // Content still loading (Specification 5: "If loading takes longer, keep visible until ready")
        // Progress advances up to 92% across MAX_NORMAL_TARGET_MS and holds until ready
        const fraction = Math.min(1, currentElapsed / MAX_NORMAL_TARGET_MS);
        const curved = Math.sin((fraction * Math.PI) / 2);
        const calculatedProgress = Math.min(92, Math.floor(curved * 92));

        setProgress((prev) => Math.max(prev, calculatedProgress));
        const idx = Math.min(
          PHASES.length - 2,
          Math.floor((calculatedProgress / 100) * PHASES.length)
        );
        setPhaseIndex(idx);
      }
    }, 20);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress === 100) {
      // Crisp 100ms pause to show loaded state without unnecessary delay
      const fadeTimer = setTimeout(() => {
        setIsFadingOut(true);
      }, 100);

      // Smooth 300ms fade-out transition duration (100ms pause + 300ms fade = 400ms)
      const removeTimer = setTimeout(() => {
        setIsRemoved(true);
        if (onComplete) onComplete();
      }, 400);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(removeTimer);
      };
    }
  }, [progress, onComplete]);

  if (isRemoved) return null;

  return (
    <div
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Portfolio Loading Screen"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#041c10] text-[#f4fff8] select-none transition-all duration-300 ease-out will-change-[opacity,transform] ${
        isFadingOut ? 'opacity-0 scale-102 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Background Radial Glow Atmosphere */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute w-[450px] sm:w-[600px] aspect-square rounded-full bg-radial from-[#3dff8f]/18 via-[#0f7a43]/10 to-transparent blur-3xl animate-pulse-glow"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute w-[300px] aspect-square rounded-full bg-radial from-[#f0b92e]/12 to-transparent blur-2xl"
      />

      <div className="relative z-10 flex flex-col items-center max-w-md px-6 text-center">
        {/* Animated Brand Emblem Centerpiece with Rotating Rings */}
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 mb-7 flex items-center justify-center">
          {/* Small Outer Shining Green Neon Rotating Ring - Reduced Neon */}
          <div
            aria-hidden="true"
            className="absolute -inset-1 rounded-full border-[1.5px] border-transparent border-t-[#3dff8f]/90 border-r-[#3dff8f]/50 shining-neon-rotating-ring shadow-[0_0_8px_rgba(61,255,143,0.35)]"
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#3dff8f] shadow-[0_0_6px_#3dff8f]" />
          </div>

          {/* Secondary Gold Dashed Counter-Rotating Ring */}
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-full border border-[#f0b92e]/40 border-dashed shining-neon-counter-ring shadow-[0_0_6px_rgba(240,185,46,0.25)]"
          />

          {/* Center Logo / Monogram Container */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-[#02140b] border border-[rgba(240,185,46,0.4)] p-1.5 shadow-[0_0_25px_rgba(0,0,0,0.9),inset_0_0_15px_rgba(61,255,143,0.2)] flex items-center justify-center">
            <img
              src={activeLogo}
              alt="Boniphace Ndege Emblem"
              className="w-full h-full object-contain filter drop-shadow-[0_0_10px_rgba(61,255,143,0.5)]"
            />
          </div>
        </div>

        {/* Brand Name with Elegant Serif Display */}
        <h1 className="font-serif-heading font-extrabold text-2xl sm:text-3xl lg:text-4xl tracking-tight mb-2 drop-shadow-[0_2px_14px_rgba(0,0,0,0.9)]">
          <span className="gold-text inline-block">{brandName}</span>
        </h1>

        {/* Professional Titles Subtitle */}
        <p className="text-xs sm:text-sm font-mono text-[#3dff8f] tracking-wide mb-6">
          {titles.join(' • ')}
        </p>

        {/* Progress Bar Container */}
        <div className="w-full max-w-xs space-y-2 mb-4">
          <div className="flex items-center justify-between text-xs font-mono text-[#9fbfae]">
            <span className="flex items-center gap-1.5 text-[#3dff8f]">
              <Sparkles className="w-3 h-3 text-[#f0b92e] animate-pulse" />
              <span>LOADING SYSTEM</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] text-[#f0b92e] bg-[#f0b92e]/10 border border-[#f0b92e]/30 px-2 py-0.5 rounded-full shadow-[0_0_6px_rgba(240,185,46,0.2)]">
                <Timer className="w-2.5 h-2.5 text-[#f0b92e]" />
                <span>{finalTimeRef.current || (elapsedMs / 1000).toFixed(2) + 's'}</span>
              </span>
              <span className="font-bold text-[#fff1b8]">{progress}%</span>
            </div>
          </div>

          {/* Glowing Track & Fill */}
          <div className="relative w-full h-2 rounded-full bg-[#000d05] border border-[rgba(61,255,143,0.3)] overflow-hidden p-[1px] shadow-[inset_0_1px_4px_rgba(0,0,0,0.8)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#0f7a43] via-[#3dff8f] to-[#f0b92e] shadow-[0_0_12px_#3dff8f] transition-all duration-75 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Status Phase Label with Loading Time */}
        <div className="h-5 flex items-center justify-center text-[11px] font-mono text-[#c8e2d4]/80 tracking-wider">
          {progress === 100 ? (
            <span className="inline-flex items-center gap-1.5 text-[#3dff8f] font-semibold animate-pulse">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#3dff8f]" />
              <span>LOADED IN {finalTimeRef.current || (elapsedMs / 1000).toFixed(2) + 's'} • EXPERIENCE READY</span>
            </span>
          ) : (
            <span>{PHASES[phaseIndex]}</span>
          )}
        </div>

        {/* Loading Time Benchmark Indicator */}
        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 border border-white/5 text-[10px] font-mono text-[#9fbfae]/80">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3dff8f] animate-ping" />
          <span>Page load benchmark:</span>
          <span className="text-[#3dff8f] font-bold">{finalTimeRef.current || (elapsedMs / 1000).toFixed(2) + 's'}</span>
        </div>

        {/* Skip button for immediate entry */}
        <button
          onClick={() => {
            setIsFadingOut(true);
            setTimeout(() => setIsRemoved(true), 300);
            if (onComplete) onComplete();
          }}
          className="mt-6 text-[11px] font-mono text-[#9fbfae]/70 hover:text-[#f0b92e] underline transition-colors cursor-pointer"
        >
          Skip Intro
        </button>
      </div>
    </div>
  );
};
