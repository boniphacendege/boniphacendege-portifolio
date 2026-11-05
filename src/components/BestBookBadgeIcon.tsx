/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Best Book Badge Icon: A high-end modern green Author Edition & Best-Seller seal
 * featuring an open tome, radiant starburst, emerald laurel crown, and neon green glow.
 */

import React from 'react';

interface BestBookBadgeIconProps {
  className?: string;
  size?: number | string;
  glow?: boolean;
  variant?: 'icon' | 'badge' | 'seal';
  label?: string;
}

export const BestBookBadgeIcon: React.FC<BestBookBadgeIconProps> = ({
  className = 'w-6 h-6',
  size,
  glow = true,
  variant = 'icon',
  label = 'Official Author Edition · Bestseller'
}) => {
  if (variant === 'badge') {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#02180d] via-[#042816] to-[#02180d] border border-[#3dff8f]/60 text-[#3dff8f] text-xs font-mono font-semibold tracking-wide ${
          glow ? 'shadow-[0_0_15px_rgba(61,255,143,0.35)]' : ''
        } ${className}`}
      >
        <BestBookBadgeIcon variant="icon" size={16} glow={false} />
        <span>{label}</span>
      </div>
    );
  }

  if (variant === 'seal') {
    return (
      <div
        className={`relative inline-flex flex-col items-center justify-center p-3 rounded-2xl bg-[#010e06] border border-[#3dff8f]/50 text-center ${
          glow ? 'shadow-[0_0_20px_rgba(61,255,143,0.3)]' : ''
        } ${className}`}
      >
        <div className="relative mb-1">
          <BestBookBadgeIcon variant="icon" size={32} glow={glow} />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#3dff8f] animate-ping" />
        </div>
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#3dff8f]">
          Author Edition
        </span>
        <span className="text-[9px] font-mono text-[#9fbfae]">
          Ev Dr. Boniphace J. Ndege
        </span>
      </div>
    );
  }

  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${
        glow ? 'drop-shadow-[0_0_8px_rgba(61,255,143,0.7)]' : ''
      }`}
      style={size ? { width: size, height: size } : undefined}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="emeraldBookGrad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#b8ffd7" />
          <stop offset="0.4" stopColor="#3dff8f" />
          <stop offset="1" stopColor="#0f7a43" />
        </linearGradient>
        <linearGradient id="emeraldInnerGlow" x1="16" y1="12" x2="16" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3dff8f" stopOpacity="0.35" />
          <stop offset="1" stopColor="#02140a" stopOpacity="0.85" />
        </linearGradient>
      </defs>

      {/* Radiant Starburst Rays behind Seal */}
      <circle cx="16" cy="16" r="14" stroke="url(#emeraldBookGrad)" strokeWidth="0.8" strokeDasharray="1.5 2.5" opacity="0.75" />
      <circle cx="16" cy="16" r="12" fill="#011409" stroke="url(#emeraldBookGrad)" strokeWidth="1.2" />

      {/* Laurel Crown Arc - Left & Right */}
      <path
        d="M8.5 20C7.5 17 7.5 13 9 10C9.8 11.5 10 13 9.5 15C9 17 9 18.5 8.5 20Z"
        fill="url(#emeraldBookGrad)"
        opacity="0.9"
      />
      <path
        d="M23.5 20C24.5 17 24.5 13 23 10C22.2 11.5 22 13 22.5 15C23 17 23 18.5 23.5 20Z"
        fill="url(#emeraldBookGrad)"
        opacity="0.9"
      />

      {/* Open Book Spine Center Line */}
      <path
        d="M16 19.5V13"
        stroke="#3dff8f"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      {/* Left Leaf of Book */}
      <path
        d="M16 13C14 11.8 11.5 11.8 9.5 12.5V19.5C11.5 18.8 14 18.8 16 19.5"
        stroke="url(#emeraldBookGrad)"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="url(#emeraldInnerGlow)"
      />
      {/* Right Leaf of Book */}
      <path
        d="M16 13C18 11.8 20.5 11.8 22.5 12.5V19.5C20.5 18.8 18 18.8 16 19.5"
        stroke="url(#emeraldBookGrad)"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="url(#emeraldInnerGlow)"
      />

      {/* Elegant Emerald Fountain Pen / Quill overlaying the book */}
      <path
        d="M19 10L21 8C21.6 7.4 22.4 7.4 23 8C23.6 8.6 23.6 9.4 23 10L20.5 12.5L18 13.5L19 10Z"
        fill="url(#emeraldBookGrad)"
        stroke="#ffffff"
        strokeWidth="0.6"
      />
      {/* Pen nib spark line */}
      <path d="M18 13.5L17.2 14.5" stroke="#b8ffd7" strokeWidth="1.4" strokeLinecap="round" />

      {/* Top 5-Point Crown Star */}
      <polygon
        points="16,4.5 17.2,7.2 20.2,7.5 17.9,9.5 18.6,12.4 16,10.8 13.4,12.4 14.1,9.5 11.8,7.5 14.8,7.2"
        fill="url(#emeraldBookGrad)"
      />

      {/* Bottom Ribbon Bookmark tails */}
      <path
        d="M14.5 19.5L13 25L14.5 24L16 25V19.5"
        fill="url(#emeraldBookGrad)"
        stroke="#0f7a43"
        strokeWidth="0.5"
      />
    </svg>
  );
};
