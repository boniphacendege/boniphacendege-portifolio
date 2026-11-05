/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Pen and Book Icon: Displays an open book with a sleek fountain pen
 * actively resting and writing on the book page.
 */

import React from 'react';

interface PenOnBookIconProps {
  className?: string;
  size?: number | string;
  glow?: boolean;
}

export const PenOnBookIcon: React.FC<PenOnBookIconProps> = ({
  className = 'w-5 h-5',
  size,
  glow = false
}) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${glow ? 'drop-shadow-[0_0_8px_rgba(61,255,143,0.6)]' : ''}`}
      style={size ? { width: size, height: size } : undefined}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Open Book Left & Right Covers and Pages */}
      {/* Book Spine Center */}
      <path d="M12 7V20" stroke="currentColor" strokeOpacity="0.8" />
      
      {/* Left Page Leaf */}
      <path
        d="M12 7C9.5 5.5 5.5 5.5 2 6.5V19.5C5.5 18.5 9.5 18.5 12 20"
        stroke="currentColor"
      />
      {/* Left Page Inner Text Lines */}
      <path d="M4.5 10C6.5 9.5 8.5 9.5 10 10.2" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.6" />
      <path d="M4.5 13C6.5 12.5 8.5 12.5 10 13.2" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.6" />
      <path d="M4.5 16C6.5 15.5 8.5 15.5 10 16.2" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.6" />

      {/* Right Page Leaf */}
      <path
        d="M12 7C14.5 5.5 18.5 5.5 22 6.5V19.5C18.5 18.5 14.5 18.5 12 20"
        stroke="currentColor"
      />
      {/* Right Page Text Lines (written upon) */}
      <path d="M14 10C15.5 9.6 17 9.6 18.5 10" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.6" />
      <path d="M14 13C15 12.7 16 12.7 17 13" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.6" />

      {/* Stylized Fountain Pen Resting / Writing on the Right Book Page */}
      {/* Pen Nib touching the page */}
      <path
        d="M15 17.5L16.2 16.3M15 17.5L15.3 16.2M15 17.5L16.3 17.2"
        stroke="#3dff8f"
        strokeWidth="1.5"
      />
      {/* Pen Barrel Body extending diagonally upward */}
      <path
        d="M16.2 16.3L21.2 11.3C21.7 10.8 21.7 10 21.2 9.5L20.5 8.8C20 8.3 19.2 8.3 18.7 8.8L13.7 13.8L15 17.5L16.2 16.3Z"
        fill="currentColor"
        fillOpacity="0.2"
        stroke="#f0b92e"
        strokeWidth="1.6"
      />
      {/* Pen Clip and Ring Accent */}
      <path d="M19 8.5L20.5 10" stroke="#3dff8f" strokeWidth="1.5" />
    </svg>
  );
};
