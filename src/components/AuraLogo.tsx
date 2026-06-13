/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface AuraLogoProps {
  /** Size in pixels (width & height). Defaults to 128. */
  size?: number;
  /** Whether to render the full App Store iOS-style squircle background. Defaults to true. */
  showBackground?: boolean;
  /** Additional CSS classes for styling. */
  className?: string;
}

export const AuraLogo: React.FC<AuraLogoProps> = ({
  size = 128,
  showBackground = true,
  className = '',
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={`select-none ${className}`}
      aria-label="Aura Music Brand Logo"
    >
      <defs>
        {/* Premium Gradient Background representing Aura's premium aesthetic */}
        <linearGradient id="auraBgGradComp" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D8A9C4" />
          <stop offset="60%" stopColor="#9d5ee5" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>

        {/* App Store Gloss / Subtle Radial Overlay for depth */}
        <radialGradient id="auraGlowComp" cx="50%" cy="15%" r="75%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.25} />
          <stop offset="50%" stopColor="#FFFFFF" stopOpacity={0.0} />
          <stop offset="100%" stopColor="#000000" stopOpacity={0.3} />
        </radialGradient>

        {/* Drop shadow for the inner note to stand out with elegant Apple-style depth */}
        <filter id="iconDepthComp" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="12" stdDeviation="14" floodColor="#1e033d" floodOpacity={0.45} />
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity={0.25} />
        </filter>

        {/* Outer Card Subtle Shadow */}
        <filter id="cardShadowComp" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="16" stdDeviation="20" floodColor="#000000" floodOpacity={0.3} />
        </filter>
      </defs>

      {showBackground && (
        <g filter="url(#cardShadowComp)">
          {/* Main iOS Squircle App Icon Base */}
          <rect x="32" y="32" width="448" height="448" rx="104" fill="url(#auraBgGradComp)" />
          {/* Depth overlay */}
          <rect x="32" y="32" width="448" height="448" rx="104" fill="url(#auraGlowComp)" style={{ mixBlendMode: 'overlay' }} />
          {/* Fine inner border for high definition */}
          <rect x="32" y="32" width="448" height="448" rx="104" fill="none" stroke="#FFFFFF" strokeOpacity={0.12} strokeWidth={2} />
        </g>
      )}

      {/* Centered Symbol (Musical Note merged with Broadcast Waves) */}
      <g 
        filter={showBackground ? "url(#iconDepthComp)" : undefined}
        transform={!showBackground ? "scale(1.1) translate(-25, -25)" : undefined}
        transformOrigin="center"
      >
        {/* Slanted Note Head */}
        <ellipse cx="175" cy="336" rx="42" ry="32" transform="rotate(-23 175 336)" fill="#FFFFFF" />

        {/* Sleek Note Stem */}
        <rect x="201" y="146" width="16" height="192" rx="8" fill="#FFFFFF" />

        {/* Broadcast Soundwaves radiating concentric from the Stem-axis (Center 201, 242) */}
        {/* Sound Wave 1 (Inner) */}
        <path d="M 245,198 A 62,62 0 0,1 245,286" fill="none" stroke="#FFFFFF" strokeWidth={15.5} strokeLinecap="round" />

        {/* Sound Wave 2 (Middle) */}
        <path d="M 283,160 A 114,114 0 0,1 283,324" fill="none" stroke="#FFFFFF" strokeWidth={15.5} strokeLinecap="round" />

        {/* Sound Wave 3 (Outer) */}
        <path d="M 321,122 A 166,166 0 0,1 321,362" fill="none" stroke="#FFFFFF" strokeWidth={15.5} strokeLinecap="round" />
      </g>
    </svg>
  );
};
