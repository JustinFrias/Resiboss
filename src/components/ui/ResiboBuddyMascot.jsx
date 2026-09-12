import React from 'react';

/**
 * Cute smiling receipt mascot for Resibo Buddy / Bibo.
 * Matches the friendly receipt character in user reference designs.
 */
export const ResiboBuddyMascot = ({ size = 36, showBadge = true, className = '' }) => {
  const width = size;
  const height = size;

  return (
    <div
      className={className}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <svg
        viewBox="0 0 100 100"
        width={width}
        height={height}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <filter id="soft-mascot-shadow" x="-10%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.12" />
          </filter>
          <linearGradient id="receipt-grad" x1="0" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffffff" />
            <stop offset="1" stopColor="#f0f9ff" />
          </linearGradient>
          <linearGradient id="check-grad" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2dd4bf" />
            <stop offset="1" stopColor="#0d9488" />
          </linearGradient>
        </defs>

        {/* Receipt Body with zig-zag / ticket top & bottom */}
        <path
          d="M 22 14 
             C 22 10, 26 8, 30 8 
             L 70 8 
             C 74 8, 78 10, 78 14 
             L 78 84 
             L 72 80 
             L 66 84 
             L 60 80 
             L 54 84 
             L 48 80 
             L 42 84 
             L 36 80 
             L 30 84 
             L 22 80 
             Z"
          fill="url(#receipt-grad)"
          stroke="#0f766e"
          strokeWidth="3.5"
          strokeLinejoin="round"
          filter="url(#soft-mascot-shadow)"
        />

        {/* Receipt Header Lines */}
        <line x1="32" y1="20" x2="68" y2="20" stroke="#99f6e4" strokeWidth="3" strokeLinecap="round" />
        <line x1="36" y1="28" x2="64" y2="28" stroke="#ccfbf1" strokeWidth="2.5" strokeLinecap="round" />

        {/* Cute Kawaii Eyes */}
        <ellipse cx="38" cy="46" rx="4" ry="4.5" fill="#0f2942" />
        <circle cx="39.5" cy="44.5" r="1.5" fill="#ffffff" />

        <ellipse cx="62" cy="46" rx="4" ry="4.5" fill="#0f2942" />
        <circle cx="63.5" cy="44.5" r="1.5" fill="#ffffff" />

        {/* Happy Smiling Mouth */}
        <path
          d="M 44 54 Q 50 62 56 54"
          stroke="#0f2942"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />

        {/* Cute Blushing Pink Cheeks */}
        <ellipse cx="33" cy="53" rx="4.5" ry="2.5" fill="#f472b6" opacity="0.6" />
        <ellipse cx="67" cy="53" rx="4.5" ry="2.5" fill="#f472b6" opacity="0.6" />

        {/* Mini Receipt Details on lower body */}
        <line x1="36" y1="68" x2="64" y2="68" stroke="#e0f2fe" strokeWidth="2.5" strokeLinecap="round" />

        {/* Circular Checkmark Badge on Bottom Left */}
        {showBadge && (
          <g transform="translate(12, 60)">
            <circle cx="14" cy="14" r="14" fill="url(#check-grad)" stroke="#ffffff" strokeWidth="2.5" />
            <path
              d="M 8 14.5 L 12 18.5 L 20 10.5"
              stroke="#ffffff"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </g>
        )}
      </svg>
    </div>
  );
};
