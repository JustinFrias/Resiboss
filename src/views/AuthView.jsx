import React from 'react';
import { ResibossAuthCard } from '../components';

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
        background: 'radial-gradient(ellipse at center, #fbf9f6 0%, #efece3 100%)',
        overflowX: 'hidden',
        padding: '32px 16px',
        boxSizing: 'border-box',
      }}
    >
      {/* Centered Editorial Authentication Card */}
      <ResibossAuthCard />
    </div>
  );
};
