import React, { useState, useEffect, useRef } from 'react';

/**
 * ScrollNeonTracker
 * Renders a very thin green neon belt right along the edge beside the scroll icon,
 * featuring a shining green neon line, a small green-mixed-gold neon jewel
 * that glides dynamically, a percentage indicator that fades in while actively scrolling,
 * and a subtle low-frequency tactile click audio cue on section boundary transitions.
 */

const SECTION_IDS = [
  'top',
  'about',
  'services',
  'projects',
  'books',
  'video',
  'blog',
  'skills',
  'experience',
  'workflow',
  'testimonials',
  'contact'
];

export const ScrollNeonTracker: React.FC = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const currentSectionRef = useRef<string>('top');
  const lastPlayTimeRef = useRef<number>(0);

  // Play subtle, low-frequency 'click' audio cue (tactile mechanical feel)
  const playTactileClick = () => {
    try {
      const now = performance.now();
      // Throttle rapid clicks to at least 120ms apart
      if (now - lastPlayTimeRef.current < 120) return;
      lastPlayTimeRef.current = now;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Soft low-frequency click: drop from 145Hz down to 55Hz
      const startTime = ctx.currentTime;
      const duration = 0.038;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(145, startTime);
      osc.frequency.exponentialRampToValueAtTime(55, startTime + duration);

      // Low subtle volume curve for a pleasing tactile mechanical click
      gain.gain.setValueAtTime(0.045, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    } catch {
      // Audio playback fails gracefully if blocked by browser policy
    }
  };

  useEffect(() => {
    let timeoutId: any = null;

    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollHeight > 0 ? Math.min(1, Math.max(0, scrollTop / scrollHeight)) : 0;
      setScrollProgress(progress);
      setIsScrolling(true);

      // Section boundary detection: check which section the middle/trigger point of the viewport currently intersects
      const triggerY = scrollTop + window.innerHeight * 0.35;
      let activeId = SECTION_IDS[0];

      for (let i = 0; i < SECTION_IDS.length; i++) {
        const id = SECTION_IDS[i];
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop;
          if (triggerY >= top) {
            activeId = id;
          }
        }
      }

      // Check if boundary crossed
      if (activeId !== currentSectionRef.current) {
        currentSectionRef.current = activeId;
        playTactileClick();
      }

      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsScrolling(false);
      }, 750);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        try {
          audioCtxRef.current.close().catch(() => {});
        } catch {}
      }
    };
  }, []);

  const percentage = Math.round(scrollProgress * 100);

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 bottom-0 right-0 pointer-events-none z-45 select-none flex items-stretch"
    >
      {/* Floating percentage indicator: fades in beside the green neon belt only while scrolling */}
      <div
        className="absolute right-3.5 sm:right-4 flex items-center pointer-events-none transition-all duration-300 ease-out"
        style={{
          top: `${Math.max(3, Math.min(97, scrollProgress * 100))}%`,
          opacity: isScrolling ? 1 : 0,
          transform: `translateY(-50%) ${isScrolling ? 'scale(1)' : 'scale(0.95)'}`,
        }}
      >
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#001208]/95 border border-[#3dff8f]/60 shadow-[0_0_10px_rgba(61,255,143,0.45),inset_0_0_6px_rgba(61,255,143,0.15)] backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-[#f0b92e] shadow-[0_0_5px_#f0b92e] animate-pulse" />
          <span className="font-mono text-[10px] font-bold text-[#3dff8f] tracking-tight leading-none">
            {percentage}%
          </span>
        </div>
      </div>

      {/* Very thin green neon belt running from top to bottom beside the scroll icon */}
      <div className="relative h-full w-[3px] bg-[#000502] border-l border-[#3dff8f]/40 shadow-[inset_1px_0_4px_rgba(0,0,0,0.95),0_0_8px_rgba(61,255,143,0.35)] flex items-stretch justify-end">
        {/* Continuous shining very narrow green neon line */}
        <div className="w-[1px] h-full bg-[#3dff8f] shadow-[0_0_4px_#3dff8f,0_0_8px_rgba(61,255,143,0.85),0_0_16px_rgba(61,255,143,0.45)]" />

        {/* Dynamic active neon trail that illuminates with scroll progress */}
        <div
          className="absolute top-0 right-0 w-[1.5px] bg-gradient-to-b from-[#3dff8f] via-[#fff1b8] to-[#f0b92e] shadow-[0_0_8px_#3dff8f,0_0_12px_#f0b92e] transition-[height] duration-75 ease-out"
          style={{ height: `${scrollProgress * 100}%` }}
        />

        {/* Small shining green-mixed-gold neon jewel tracking the scroll icon */}
        <div
          className="absolute right-[-2.5px] -translate-y-1/2 flex items-center justify-center transition-[top] duration-75 ease-out"
          style={{ top: `${Math.max(2, Math.min(98, scrollProgress * 100))}%` }}
        >
          {/* Ambient radiant neon glow aura */}
          <div
            className={`absolute rounded-full transition-all duration-300 ${
              isScrolling
                ? 'w-7 h-7 bg-radial from-[#3dff8f]/75 via-[#f0b92e]/45 to-transparent blur-xs scale-125'
                : 'w-4 h-4 bg-radial from-[#3dff8f]/40 via-[#f0b92e]/25 to-transparent blur-xs scale-100'
            }`}
          />

          {/* Small jewel capsule mixing green & gold neon that shines bright while passing */}
          <div
            className={`relative rounded-full bg-gradient-to-b from-[#3dff8f] via-[#fff1b8] to-[#f0b92e] transition-all duration-200 border border-white/80 ${
              isScrolling
                ? 'w-2 h-4 shadow-[0_0_12px_#3dff8f,0_0_18px_#f0b92e,0_0_24px_rgba(61,255,143,0.9)] scale-110'
                : 'w-1.5 h-3 shadow-[0_0_7px_#3dff8f,0_0_11px_#f0b92e] scale-100'
            }`}
          />
        </div>
      </div>
    </div>
  );
};
