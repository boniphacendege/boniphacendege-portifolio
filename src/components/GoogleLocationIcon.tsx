import React from 'react';

interface GoogleLocationIconProps {
  className?: string;
  size?: number | string;
  shine?: boolean;
}

/**
 * Authentic Google Location / Maps GPS Pin Icon
 * Styled with Google's red, yellow, green, and blue signature segments,
 * center white disc with GPS core, and blinking small neon glow.
 */
export const GoogleLocationIcon: React.FC<GoogleLocationIconProps> = ({
  className = 'w-5 h-5',
  size,
  shine = true,
}) => {
  return (
    <span
      className={`inline-flex items-center justify-center relative select-none shrink-0 ${
        shine ? 'small-neon-location-pin' : ''
      } ${className}`}
      style={size ? { width: size, height: size } : undefined}
      title="Google Location · Dodoma CBD Tanzania"
    >
      <svg
        viewBox="0 0 32 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full overflow-visible drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
        aria-hidden="true"
      >
        {/* Google Maps Pin Teardrop Outer Path (Red Base) with crisp narrow neon contour */}
        <path
          d="M16 2C9.37 2 4 7.37 4 14c0 3.5 1.45 6.66 3.8 8.95L16 38l8.2-15.05C26.55 20.66 28 17.5 28 14c0-6.63-5.37-12-12-12z"
          fill="#EA4335"
          stroke="#3dff8f"
          strokeWidth="0.6"
          strokeOpacity="0.75"
        />

        {/* Yellow Segment (Top Right) */}
        <path
          d="M16 2C19.3 2 22.3 3.35 24.5 5.5L16 14V2z"
          fill="#FBBC04"
        />

        {/* Green Segment (Right Arc) */}
        <path
          d="M24.5 5.5C26.7 7.7 28 10.7 28 14c0 3.2-1.3 6.1-3.4 8.2L16 14l8.5-8.5z"
          fill="#34A853"
        />

        {/* Blue Segment (Lower GPS Pointer Anchor) */}
        <path
          d="M16 14l8.6 8.95L16 38l-8.2-15.05L16 14z"
          fill="#4285F4"
        />

        {/* Center White Disc with high contrast */}
        <circle cx="16" cy="14" r="5.2" fill="#FFFFFF" />

        {/* Inner Google Blue GPS Core dot */}
        <circle cx="16" cy="14" r="2.8" fill="#1A73E8" />
      </svg>
    </span>
  );
};
