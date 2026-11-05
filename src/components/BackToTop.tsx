import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

/**
 * Floating Back to Top button
 * Appears dynamically after scrolling past the hero section,
 * styled with the same green neon glowing border and card background as the project cards.
 */
export const BackToTop: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Appears after scrolling past the hero section
      const heroEl = document.getElementById('top');
      const threshold = heroEl ? Math.max(heroEl.offsetHeight * 0.65, 420) : 450;
      setVisible(window.scrollY > threshold);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      className="fixed right-5 bottom-35 sm:right-7 sm:bottom-38 z-40 w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-[#0f7a43]/30 via-[#03170d]/90 to-[#010703] border border-[#3dff8f] shadow-[0_12px_30px_rgba(0,0,0,0.85),0_0_24px_rgba(61,255,143,0.38),0_0_8px_rgba(61,255,143,0.55)] hover:shadow-[0_16px_36px_rgba(0,0,0,0.95),0_0_30px_rgba(61,255,143,0.65),0_0_12px_rgba(61,255,143,0.85)] hover:-translate-y-1 active:translate-y-0 transition-all duration-300 flex items-center justify-center cursor-pointer group backdrop-blur-md animate-in fade-in zoom-in-95 duration-200"
      title="Back to Top"
      aria-label="Scroll back to top"
    >
      <ArrowUp className="w-5 h-5 text-[#3dff8f] group-hover:text-white group-hover:-translate-y-0.5 transition-all duration-200" />
      <span className="sr-only">Back to Top</span>
    </button>
  );
};
