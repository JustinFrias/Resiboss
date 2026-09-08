import React from 'react';
import { useApp } from '../../context/AppContext';

/**
 * Modern, clean, enterprise-grade ambient background.
 * Replaces distracting 3D neon ribbons with a subtle, elegant fintech atmosphere.
 */
export const LiquidBackground3D = () => {
  const { theme } = useApp();
  const isLight = theme === 'light';

  return (
    <div
      className="saas-ambient-background"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
        background: isLight ? '#f8fafc' : '#080c15',
        transition: 'background 0.4s ease',
      }}
    >
      {/* Top Ambient Glow (Subtle gradient illumination) */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '1200px',
          height: '600px',
          borderRadius: '50%',
          background: isLight
            ? 'radial-gradient(ellipse at center, rgba(2, 132, 199, 0.08) 0%, rgba(99, 102, 241, 0.04) 50%, transparent 70%)'
            : 'radial-gradient(ellipse at center, rgba(14, 165, 233, 0.08) 0%, rgba(99, 102, 241, 0.05) 45%, transparent 70%)',
          filter: 'blur(60px)',
          opacity: 0.85,
        }}
      />

      {/* Secondary Soft Ambient Glow at bottom right */}
      <div
        style={{
          position: 'absolute',
          bottom: '-15%',
          right: '-10%',
          width: '800px',
          height: '600px',
          borderRadius: '50%',
          background: isLight
            ? 'radial-gradient(ellipse at center, rgba(16, 185, 129, 0.05) 0%, transparent 65%)'
            : 'radial-gradient(ellipse at center, rgba(14, 165, 233, 0.04) 0%, rgba(168, 85, 247, 0.03) 50%, transparent 70%)',
          filter: 'blur(70px)',
          opacity: 0.7,
        }}
      />

      {/* Modern Precision Dot Grid (Linear / Raycast / Stripe aesthetic) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: isLight
            ? 'radial-gradient(rgba(15, 23, 42, 0.07) 1px, transparent 1px)'
            : 'radial-gradient(rgba(255, 255, 255, 0.065) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          maskImage: 'radial-gradient(ellipse 85% 75% at 50% 30%, #000 50%, transparent 95%)',
          WebkitMaskImage: 'radial-gradient(ellipse 85% 75% at 50% 30%, #000 50%, transparent 95%)',
          opacity: 0.75,
        }}
      />
    </div>
  );
};
