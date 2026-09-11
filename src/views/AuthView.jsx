import React from 'react';
import { ResibossAuthCard, LiquidBackground3D } from '../components';

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
        background: '#080c15',
        overflowX: 'hidden',
        padding: '32px 16px',
        boxSizing: 'border-box',
      }}
    >
      {/* 3D Liquid Canvas Background */}
      <LiquidBackground3D />

      {/* Centered Liquid Glass Authentication Card */}
      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '440px' }}>
        <ResibossAuthCard />
      </div>
    </div>
  );
};

