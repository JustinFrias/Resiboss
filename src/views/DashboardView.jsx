import React from 'react';
import { useApp } from '../context/AppContext';
import { TiltCard } from '../components/TiltCard';
import {
  Wallet,
  Receipt,
  PiggyBank,
  TrendingUp,
  ChevronRight,
  ShieldCheck,
  Clock,
  Eye,
} from 'lucide-react';

export const DashboardView = () => {
  const { documents, setActiveTab, setInspectingDoc, formatCurrency, t } = useApp();

  // Calculations
  const totalAmount = documents.reduce((acc, doc) => acc + (doc.total || 0), 0);
  const totalVat = documents.reduce((acc, doc) => acc + (doc.vat || 0), 0);
  const avgAmount = documents.length > 0 ? totalAmount / documents.length : 0;
  const verifiedCount = documents.filter((d) => d.status === 'Verified').length;

  // Category breakdown for chart
  const categoryTotals = documents.reduce((acc, doc) => {
    const cat = doc.category || 'Other';
    acc[cat] = (acc[cat] || 0) + (doc.total || 0);
    return acc;
  }, {});

  const categoryEntries = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

  return (
    <div className="view-page" style={{ width: '100%', padding: '0 0 20px 0' }}>
      {/* 4 Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '20px',
          marginBottom: '28px',
        }}
      >
        <TiltCard>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {t.dashboard.totalExpenses}
              </span>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(0, 242, 254, 0.12)',
                  color: '#00f2fe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(0, 242, 254, 0.25)',
                }}
              >
                <Wallet size={18} />
              </div>
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
              {formatCurrency(totalAmount)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', fontSize: '0.78rem', color: '#34d399' }}>
              <TrendingUp size={14} />
              <span>+12.4% vs last month</span>
            </div>
          </div>
        </TiltCard>

        <TiltCard>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {t.dashboard.scannedReceipts}
              </span>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(168, 85, 247, 0.12)',
                  color: '#a855f7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(168, 85, 247, 0.25)',
                }}
              >
                <Receipt size={18} />
              </div>
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
              {documents.length}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              <ShieldCheck size={14} color="#34d399" />
              <span>{verifiedCount} verified in ledger</span>
            </div>
          </div>
        </TiltCard>

        <TiltCard>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {t.dashboard.recoverableVat}
              </span>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                }}
              >
                <PiggyBank size={18} />
              </div>
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
              {formatCurrency(totalVat)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              <span>12% standard BIR tax credit</span>
            </div>
          </div>
        </TiltCard>

        <TiltCard>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {t.dashboard.avgReceipt}
              </span>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(245, 158, 11, 0.12)',
                  color: '#f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                }}
              >
                <TrendingUp size={18} />
              </div>
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
              {formatCurrency(avgAmount)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              <span>Across all categories</span>
            </div>
          </div>
        </TiltCard>
      </div>

      {/* Middle Grid: Spending Curve & Category Allocation */}
      <div
        className="dashboard-trend-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1.2fr',
          gap: '24px',
          marginBottom: '28px',
        }}
      >
        {/* Spending Flow Curve (SVG Canvas) */}
        <div className="glass-panel" style={{ padding: '26px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{t.dashboard.spendingTrend}</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Real-time expense curve with holographic projection
              </span>
            </div>
            <span className="liquid-badge liquid-badge-cyan">Q3 2026</span>
          </div>

          {/* Dynamic SVG Area Curve */}
          <div style={{ position: 'relative', width: '100%', height: '220px' }}>
            <svg viewBox="0 0 500 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.4" />
                  <stop offset="60%" stopColor="#a855f7" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#05070f" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#00f2fe" />
                  <stop offset="50%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#c084fc" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="50" x2="500" y2="50" stroke="var(--chart-grid, rgba(255,255,255,0.06))" strokeDasharray="4 4" />
              <line x1="0" y1="100" x2="500" y2="100" stroke="var(--chart-grid, rgba(255,255,255,0.06))" strokeDasharray="4 4" />
              <line x1="0" y1="150" x2="500" y2="150" stroke="var(--chart-grid, rgba(255,255,255,0.06))" strokeDasharray="4 4" />

              {/* Filled Area */}
              <path
                d="M 0 170 Q 70 120 125 140 T 250 80 T 375 110 T 500 45 L 500 200 L 0 200 Z"
                fill="url(#areaGrad)"
              />

              {/* Glowing Line */}
              <path
                d="M 0 170 Q 70 120 125 140 T 250 80 T 375 110 T 500 45"
                fill="none"
                stroke="url(#lineGrad)"
                strokeWidth="3.5"
                strokeLinecap="round"
                filter="drop-shadow(0 0 8px rgba(0, 242, 254, 0.7))"
              />

              {/* Data Points */}
              <circle cx="125" cy="140" r="5" fill="#00f2fe" filter="drop-shadow(0 0 6px #00f2fe)" />
              <circle cx="250" cy="80" r="5" fill="#38bdf8" filter="drop-shadow(0 0 6px #38bdf8)" />
              <circle cx="375" cy="110" r="5" fill="#a855f7" filter="drop-shadow(0 0 6px #a855f7)" />
              <circle cx="500" cy="45" r="6" fill="#ffffff" filter="drop-shadow(0 0 10px #ffffff)" />
            </svg>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <span>May 2026</span>
            <span>Jun 2026</span>
            <span>Jul 2026</span>
            <span>Aug 2026 (Peak)</span>
          </div>
        </div>

        {/* Category Allocation Meter */}
        <div className="glass-panel" style={{ padding: '26px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{t.dashboard.categoryBreakdown}</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Top spending segments
            </span>
          </div>

          {categoryEntries.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.86rem', textAlign: 'center', padding: '36px 0' }}>
              No categorized expenses yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {categoryEntries.slice(0, 4).map(([cat, val], idx) => {
                const pct = totalAmount > 0 ? Math.round((val / totalAmount) * 100) : 0;
                const colors = ['#00f2fe', '#a855f7', '#10b981', '#f59e0b'];
                const currentColor = colors[idx % colors.length];

                return (
                  <div key={cat}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 600 }}>{t.categories[cat] || cat}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                        {formatCurrency(val)} ({pct}%)
                      </span>
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: '8px',
                        background: 'var(--track-bg, rgba(255, 255, 255, 0.08))',
                        borderRadius: '999px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: currentColor,
                          boxShadow: `0 0 10px ${currentColor}`,
                          borderRadius: '999px',
                          transition: 'width 0.6s ease',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Scans Stream */}
      <div className="glass-panel" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{t.dashboard.recentActivity}</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Latest audited receipts with instant 3D model inspector
            </span>
          </div>
          <button
            onClick={() => setActiveTab('documents')}
            className="liquid-btn liquid-btn-secondary"
            style={{ fontSize: '0.84rem', padding: '6px 14px' }}
          >
            <span>{t.dashboard.viewAll}</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {documents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--text-muted)' }}>
              <Receipt size={40} color="#00f2fe" style={{ opacity: 0.35, margin: '0 auto 12px auto' }} />
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                No receipts recorded yet
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 18px auto' }}>
                Start scanning with your camera or upload receipt images to begin automatic OCR tracking and expense analytics.
              </p>
              <button
                onClick={() => setActiveTab('scanner')}
                className="liquid-btn liquid-btn-primary"
                style={{ padding: '8px 22px', fontSize: '0.88rem', margin: '0 auto' }}
              >
                Scan First Receipt
              </button>
            </div>
          ) : (
            documents.slice(0, 4).map((doc) => (
              <div
                key={doc.id}
                className="recent-doc-row"
                onClick={() => setInspectingDoc(doc)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div className="recent-doc-icon-wrap">
                    <Receipt size={18} />
                  </div>
                  <div>
                    <div className="recent-doc-merchant">{doc.merchant}</div>
                    <div className="recent-doc-meta">
                      <span>{doc.date}</span>
                      <span>•</span>
                      <span className="liquid-badge liquid-badge-cyan" style={{ padding: '2px 8px', fontSize: '0.7rem' }}>
                        {t.categories[doc.category] || doc.category}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div className="recent-doc-amount">
                      {formatCurrency(doc.total)}
                    </div>
                    <div className="recent-doc-vat">
                      VAT: {formatCurrency(doc.vat)}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setInspectingDoc(doc);
                    }}
                    className="recent-doc-3d-btn"
                    title="3D Model Inspector"
                  >
                    <Eye size={13} />
                    <span>3D</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
