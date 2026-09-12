import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ResiboBuddyMascot } from '../ui/ResiboBuddyMascot';
import { soundFx } from '../../utils/soundEffects';
import { X, Sparkles, Scan, ArrowRight, TrendingUp, ShieldCheck, Heart } from 'lucide-react';

export const BiboBuddyModal = ({ isOpen, onClose }) => {
  const { documents, setActiveTab, userProfile, formatCurrency, theme } = useApp();
  const isLight = theme === 'light';

  if (!isOpen) return null;

  const totalSpent = documents.reduce((sum, d) => sum + (Number(d.total) || 0), 0);
  const firstName = userProfile?.firstName || 'Ka-Resiboss';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(3, 7, 18, 0.7)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '0 0 16px 0',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '460px',
          background: isLight ? '#ffffff' : '#0f172a',
          border: isLight ? '1.5px solid #bfdbfe' : '1px solid rgba(0, 242, 254, 0.3)',
          borderRadius: '24px 24px 18px 18px',
          padding: '22px 20px',
          boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.4)',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ResiboBuddyMascot size={38} />
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: isLight ? '#0f2942' : '#ffffff' }}>
                Bibo <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0d9488' }}>AI Companion</span>
              </div>
              <div style={{ fontSize: '0.74rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                Ang iyong smart resibo & expense buddy
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundFx?.playClick?.();
              onClose();
            }}
            style={{
              background: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: isLight ? '#475569' : '#cbd5e1',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Message Bubble */}
        <div
          style={{
            background: isLight ? 'linear-gradient(135deg, #f0fdfa, #eff6ff)' : 'rgba(13, 148, 136, 0.15)',
            border: isLight ? '1px solid #ccfbf1' : '1px solid rgba(45, 212, 191, 0.3)',
            borderRadius: '16px',
            padding: '14px 16px',
            marginBottom: '16px',
          }}
        >
          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: isLight ? '#0f2942' : '#ffffff', marginBottom: '4px' }}>
            Kumusta, {firstName}! ✨
          </div>
          <div style={{ fontSize: '0.82rem', color: isLight ? '#334155' : '#cbd5e1', lineHeight: 1.5 }}>
            May kabuuang <strong>{documents.length} resibo</strong> kang naka-imbak sa vault na may total na{' '}
            <strong>{formatCurrency ? formatCurrency(totalSpent) : `₱${totalSpent.toLocaleString()}`}</strong>.
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
          <button
            type="button"
            onClick={() => {
              soundFx?.playClick?.();
              setActiveTab('scanner');
              onClose();
            }}
            style={{
              background: '#0b1e36',
              border: 'none',
              borderRadius: '12px',
              padding: '11px',
              color: '#ffffff',
              fontSize: '0.82rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <Scan size={15} />
            <span>Scan Resibo</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFx?.playClick?.();
              setActiveTab('analytic');
              onClose();
            }}
            style={{
              background: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)',
              border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              padding: '11px',
              color: isLight ? '#0f2942' : '#ffffff',
              fontSize: '0.82rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <TrendingUp size={15} />
            <span>View Stats</span>
          </button>
        </div>
      </div>
    </div>
  );
};
