import React from 'react';

export const ResibossLogo = ({
  size = 40,
  showText = true,
  collapsed = false,
  className = '',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`resiboss-logo-container ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
      }}
    >
      {/* 2D Flat Vector App Icon */}
      <div
        className="resiboss-app-icon-wrap"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.22s ease',
        }}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 44 44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block', width: '100%', height: '100%' }}
        >
          <defs>
            <linearGradient id="rb-bg" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0b1120" />
              <stop offset="1" stopColor="#020617" />
            </linearGradient>
            <linearGradient id="rb-cyan" x1="11" y1="10" x2="32" y2="34" gradientUnits="userSpaceOnUse">
              <stop stopColor="#00f2fe" />
              <stop offset="1" stopColor="#0284c7" />
            </linearGradient>
          </defs>

          {/* Clean Flat Squircle */}
          <rect
            x="1"
            y="1"
            width="42"
            height="42"
            rx="12"
            fill="url(#rb-bg)"
            stroke="#00f2fe"
            strokeOpacity="0.4"
            strokeWidth="1.5"
          />

          {/* Vertical Receipt Spine */}
          <rect x="11" y="10.5" width="4.5" height="23" rx="2.25" fill="url(#rb-cyan)" />

          {/* Upper Loop */}
          <path
            d="M14 10.5H23.5C27.6421 10.5 31 13.8579 31 18C31 22.1421 27.6421 25.5 23.5 25.5H14"
            stroke="url(#rb-cyan)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Receipt Data Lines */}
          <line x1="19.5" y1="16" x2="25.5" y2="16" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          <line x1="19.5" y1="20" x2="23.5" y2="20" stroke="#00f2fe" strokeWidth="2" strokeLinecap="round" />

          {/* Dynamic Diagonal Kick */}
          <path
            d="M20.5 23L29.5 33.5"
            stroke="#ffffff"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Brand Wordmark: "Resiboss" Only */}
      {showText && !collapsed && (
        <span
          style={{
            fontFamily: "'Space Grotesk', 'Outfit', sans-serif",
            fontSize: `${Math.max(size * 0.52, 21)}px`,
            fontWeight: 800,
            letterSpacing: '-0.035em',
            display: 'inline-flex',
            alignItems: 'baseline',
            lineHeight: 1,
          }}
        >
          <span
            className="resiboss-text-resi"
            style={{
              color: '#ffffff',
            }}
          >
            Resi
          </span>
          <span
            className="resiboss-text-boss"
            style={{
              color: '#00f2fe',
              fontWeight: 900,
            }}
          >
            boss
          </span>
        </span>
      )}
    </div>
  );
};

export default ResibossLogo;
