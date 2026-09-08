import React from 'react';

export const ResibossLogo = ({
  size = 40,
  showText = true,
  collapsed = false,
  className = '',
  onClick,
}) => {
  const borderRadius = Math.max(8, Math.round(size * 0.22));

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
      {/* Official 2D Picture Emblem */}
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
          borderRadius: `${borderRadius}px`,
          overflow: 'hidden',
          background: '#000000',
          boxShadow: '0 4px 14px rgba(0, 242, 254, 0.25), 0 0 20px rgba(0, 242, 254, 0.1)',
          border: '1px solid rgba(0, 242, 254, 0.3)',
        }}
      >
        <img
          src="/resiboss-emblem.png"
          alt="Resiboss"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      </div>

      {/* Brand Wordmark: "Resi" + "boss" */}
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
