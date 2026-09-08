import React from 'react';
import {
  LiquidBackground3D,
  PipedreamAuthCard,
  ResibossLogo,
} from '../components';

export const AuthView = () => {

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-primary)',
        overflowX: 'hidden',
        padding: '24px 16px',
        boxSizing: 'border-box',
      }}
    >
      {/* 3D Liquid Canvas Background */}
      <LiquidBackground3D />

      {/* Brand Header */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: '24px',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            marginBottom: '14px',
            filter: 'drop-shadow(0 0 28px rgba(32, 248, 161, 0.5))',
          }}
        >
          <ResibossLogo size={80} showText={false} />
        </div>

        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 900,
            letterSpacing: '0.04em',
            margin: '0 0 6px 0',
            background: 'linear-gradient(135deg, #ffffff 25%, #20f8a1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 30px rgba(32, 248, 161, 0.4)',
          }}
        >
          RESIBOSS
        </h1>

        <p
          style={{
            fontSize: '0.88rem',
            color: 'var(--text-secondary)',
            margin: 0,
            maxWidth: '320px',
            lineHeight: 1.4,
          }}
        >
          Smart Receipt Scanner & Financial Intelligence
        </p>
      </div>

      {/* Main Authentication Card */}
      <div style={{ width: '100%', maxWidth: '420px', zIndex: 10 }}>
        <PipedreamAuthCard />
      </div>
    </div>
  );
};
