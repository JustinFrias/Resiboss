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
      {/* Official 2D Picture Emblem (Pure Transparent Background) */}
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
          background: 'transparent',
          filter: 'drop-shadow(0 4px 14px rgba(32, 248, 161, 0.35))',
        }}
      >
        <img
          src="/resiboss-emblem.png"
          alt="Resiboss"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      </div>

      {/* Brand Wordmark: "Resi" (white) + "boss" (matched mint-emerald #20f8a1) */}
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
              color: '#20f8a1',
              fontWeight: 900,
              textShadow: '0 0 16px rgba(32, 248, 161, 0.45)',
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
