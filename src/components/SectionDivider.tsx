import React from 'react';

interface SectionDividerProps {
  className?: string;
}

/**
 * Subtle, thin horizontal divider with a low-opacity green glow
 * used between major portfolio sections for elegant visual separation.
 */
export const SectionDivider: React.FC<SectionDividerProps> = ({ className = '' }) => {
  return (
    <div
      className={`relative w-full max-w-6xl mx-auto px-4 py-3 flex items-center justify-center pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      {/* Subtle thin horizontal line with smooth edge fade and low-opacity green glow */}
      <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#3dff8f]/28 to-transparent shadow-[0_0_8px_rgba(61,255,143,0.22)]" />
      {/* Delicate center micro-accent */}
      <div className="absolute w-1.5 h-1.5 rounded-full bg-[#3dff8f]/35 blur-[0.5px]" />
    </div>
  );
};
