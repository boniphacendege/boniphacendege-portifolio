import React, { useState, useEffect } from 'react';

/**
 * ReadingProgressBar
 * A thin, elegant gold reading progress indicator bar fixed at the very top of the screen.
 * It fills up horizontally from 0% to 100% as the user scrolls down the page.
 */
export const ReadingProgressBar: React.FC = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollHeight > 0 ? Math.min(1, Math.max(0, scrollTop / scrollHeight)) : 0;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div
      role="progressbar"
      aria-label="Reading scroll progress"
      aria-valuenow={Math.round(scrollProgress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="fixed top-0 left-0 right-0 z-[60] h-[3px] pointer-events-none select-none bg-black/20"
    >
      {/* Thin Gold Progress Bar matching portfolio theme */}
      <div
        className="h-full bg-gradient-to-r from-[#996e14] via-[#f0b92e] to-[#fff1b8] transition-[width] duration-75 ease-out shadow-[0_0_10px_rgba(240,185,46,0.9),0_0_4px_#f0b92e]"
        style={{ width: `${scrollProgress * 100}%` }}
      />
      {/* Shimmer point at the leading edge of the gold bar */}
      {scrollProgress > 0 && scrollProgress < 1 && (
        <div
          className="absolute top-0 -translate-y-1/2 w-2 h-2 rounded-full bg-[#fff1b8] shadow-[0_0_8px_#f0b92e,0_0_12px_#fff1b8] pointer-events-none transition-[left] duration-75 ease-out"
          style={{ left: `calc(${scrollProgress * 100}% - 4px)` }}
        />
      )}
    </div>
  );
};
