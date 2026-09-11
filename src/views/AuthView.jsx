import React from 'react';
import { ResibossAuthCard, LiquidBackground3D } from '../components';
import { useApp } from '../context/AppContext';

export const AuthView = () => {
  const { theme } = useApp();
  const isLight = theme === 'light';

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
        background: isLight ? '#f8fafc' : '#080c15',
        overflowX: 'hidden',
        padding: '32px 16px',
        boxSizing: 'border-box',
        transition: 'background 0.3s ease',
      }}
    >
      {/* 3D Liquid Canvas Background */}
      <LiquidBackground3D />

      {/* Centered Liquid Glass Authentication Card */}
      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '440px' }}>
        <ResibossAuthCard initialMode="signin" />
      </div>
    </div>
  );
};

