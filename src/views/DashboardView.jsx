import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TiltCard } from '../components';
import {
  Wallet,
  Receipt,
  PiggyBank,
  TrendingUp,
  ChevronRight,
  ShieldCheck,
  Clock,
  Eye,
  Calendar,
  ChevronDown,
  Check,
  FileText,
} from 'lucide-react';

export const DashboardView = () => {
  const { documents, setActiveTab, setInspectingDoc, formatCurrency, t, theme, soundFx } = useApp();
  const isLight = theme === 'light';

  // Time Range Filter State ('all' | 'month' | '30days' | 'year')
  const [timeRange, setTimeRange] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef(null);

  // Close filter popover on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, []);

  // Filter documents according to selected range
  const filteredDocuments = useMemo(() => {
    if (timeRange === 'all') return documents;
    const now = new Date();
    if (timeRange === 'month') {
      const currentMonth = now.toISOString().slice(0, 7);
      return documents.filter((d) => d.date && d.date.startsWith(currentMonth));
    }
    if (timeRange === '30days') {
      const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return documents.filter((d) => d.date && new Date(d.date) >= past30);
    }
    if (timeRange === 'year') {
      const currentYear = now.getFullYear().toString();
      return documents.filter((d) => d.date && d.date.startsWith(currentYear));
    }
    return documents;
  }, [documents, timeRange]);

  // Calculations
  const totalAmount = filteredDocuments.reduce((acc, doc) => acc + (doc.total || 0), 0);
  const totalVat = filteredDocuments.reduce((acc, doc) => acc + (doc.vat || 0), 0);
  const docCount = filteredDocuments.length;
  const avgAmount = docCount > 0 ? totalAmount / docCount : 0;
  const verifiedCount = filteredDocuments.filter((d) => d.status === 'Verified').length;

  // Format compact number (e.g. ₱3.0K)
  const formatCompact = (val) => {
    if (!val || val === 0) return '₱0.00';
    if (val >= 1000000) {
      return `₱${(val / 1000000).toFixed(1)}M`;
    }
    if (val >= 1000) {
      return `₱${(val / 1000).toFixed(1)}K`;
    }
    return formatCurrency(val);
  };

  // 14-Day History for Daily Document Expenses
  const dailyHistory = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayNum = d.getDate();

      const dayTotal = documents
        .filter((doc) => doc.date && doc.date.startsWith(dateStr))
        .reduce((sum, doc) => sum + (doc.total || 0), 0);

      days.push({
        dateStr,
        dayNum,
        total: dayTotal,
      });
    }
    return days;
  }, [documents]);

  const maxDailyExpense = Math.max(...dailyHistory.map((d) => d.total), 4000);

  // Category breakdown for chart
  const categoryTotals = filteredDocuments.reduce((acc, doc) => {
    const cat = doc.category || 'Other';
    acc[cat] = (acc[cat] || 0) + (doc.total || 0);
    return acc;
  }, {});

  const categoryEntries = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

  return (
    <div className="dashboard-page" style={{ width: '100%', padding: '0 0 100px 0' }}>
      {/* 1. Header: Title, Subtitle, and Time Range Filter */}
      <div style={{ marginBottom: '20px' }}>
        <h1
          style={{
            fontSize: '1.9rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: isLight ? '#0f2942' : '#f8fafc',
            marginBottom: '4px',
            fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
          }}
        >
          Dashboard
        </h1>
        <p
          style={{
            fontSize: '0.92rem',
            color: isLight ? '#475569' : '#94a3b8',
            margin: '0 0 14px 0',
            lineHeight: 1.45,
          }}
        >
          Financial overview and processing health
        </p>

        {/* Time Filter Dropdown Pill */}
        <div ref={filterRef} style={{ position: 'relative', display: 'inline-block' }}>
          <button
            type="button"
            onClick={() => {
              setIsFilterOpen(!isFilterOpen);
              soundFx?.playClick?.();
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 14px',
              borderRadius: '14px',
              background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.85)',
              border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.14)',
              color: isLight ? '#1e293b' : '#e2e8f0',
              fontSize: '0.86rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: isLight ? '0 2px 6px rgba(15, 23, 42, 0.04)' : 'none',
              outline: 'none',
              transition: 'all 0.18s ease',
            }}
          >
            <Calendar size={15} color={isLight ? '#64748b' : '#94a3b8'} />
            <span>
              {timeRange === 'all' && 'All Time'}
              {timeRange === 'month' && 'This Month'}
              {timeRange === '30days' && 'Last 30 Days'}
              {timeRange === 'year' && 'This Year'}
            </span>
            <ChevronDown size={14} color={isLight ? '#64748b' : '#94a3b8'} />
          </button>

          {isFilterOpen && (
            <div
              className="glass-panel"
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                zIndex: 50,
                background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.96)',
                border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.16)',
                borderRadius: '14px',
                padding: '6px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                minWidth: '150px',
              }}
            >
              {[
                { id: 'all', label: 'All Time' },
                { id: 'month', label: 'This Month' },
                { id: '30days', label: 'Last 30 Days' },
                { id: 'year', label: 'This Year' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setTimeRange(opt.id);
                    setIsFilterOpen(false);
                    soundFx?.playClick?.();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: timeRange === opt.id ? (isLight ? '#f1f5f9' : 'rgba(56, 189, 248, 0.15)') : 'transparent',
                    color: timeRange === opt.id ? (isLight ? '#0284c7' : '#38bdf8') : (isLight ? '#1e293b' : '#e2e8f0'),
                    fontSize: '0.84rem',
                    fontWeight: timeRange === opt.id ? 700 : 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span>{opt.label}</span>
                  {timeRange === opt.id && <Check size={14} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. 3 Stat Cards (Stacked on Mobile) */}
      <div
        className="dashboard-stats-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '18px',
        }}
      >
        {/* Card 1: Total Expenses */}
        <TiltCard>
          <div
            className="glass-panel"
            style={{
              padding: '24px 22px',
              borderRadius: '24px',
              background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.65)',
              border: isLight ? '1px solid rgba(203, 213, 225, 0.8)' : '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: isLight ? '0 4px 20px rgba(15, 23, 42, 0.04)' : '0 8px 30px rgba(0, 0, 0, 0.45)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '0.94rem', color: isLight ? '#1e293b' : '#94a3b8', fontWeight: 600 }}>
                Total Expenses
              </span>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'rgba(244, 63, 94, 0.18)',
                  color: '#f43f5e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.05rem',
                }}
              >
                ₱
              </div>
            </div>
            <div
              className="stat-card-value"
              style={{
                fontSize: '2.1rem',
                fontWeight: 800,
                color: isLight ? '#0f2942' : '#ffffff',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '-0.02em',
                marginBottom: '8px',
              }}
            >
              {formatCompact(totalAmount)}
            </div>
            <div style={{ fontSize: '0.82rem', color: isLight ? '#64748b' : '#94a3b8' }}>
              — No prior month data
            </div>
          </div>
        </TiltCard>

        {/* Card 2: Total Vat */}
        <TiltCard>
          <div
            className="glass-panel"
            style={{
              padding: '24px 22px',
              borderRadius: '24px',
              background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.65)',
              border: isLight ? '1px solid rgba(203, 213, 225, 0.8)' : '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: isLight ? '0 4px 20px rgba(15, 23, 42, 0.04)' : '0 8px 30px rgba(0, 0, 0, 0.45)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '0.94rem', color: isLight ? '#1e293b' : '#94a3b8', fontWeight: 600 }}>
                Total Vat
              </span>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'rgba(245, 158, 11, 0.18)',
                  color: '#f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.05rem',
                }}
              >
                ₱
              </div>
            </div>
            <div
              className="stat-card-value"
              style={{
                fontSize: '2.1rem',
                fontWeight: 800,
                color: isLight ? '#0f2942' : '#ffffff',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '-0.02em',
                marginBottom: '8px',
              }}
            >
              {formatCurrency(totalVat)}
            </div>
            <div style={{ fontSize: '0.82rem', color: isLight ? '#64748b' : '#94a3b8' }}>
              — No prior month data
            </div>
          </div>
        </TiltCard>

        {/* Card 3: Total Documents */}
        <TiltCard>
          <div
            className="glass-panel"
            style={{
              padding: '24px 22px',
              borderRadius: '24px',
              background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.65)',
              border: isLight ? '1px solid rgba(203, 213, 225, 0.8)' : '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: isLight ? '0 4px 20px rgba(15, 23, 42, 0.04)' : '0 8px 30px rgba(0, 0, 0, 0.45)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '0.94rem', color: isLight ? '#1e293b' : '#94a3b8', fontWeight: 600 }}>
                Total Documents
              </span>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: isLight ? 'rgba(148, 163, 184, 0.25)' : 'rgba(148, 163, 184, 0.2)',
                  color: isLight ? '#1e3a8a' : '#93c5fd',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FileText size={19} />
              </div>
            </div>
            <div
              className="stat-card-value"
              style={{
                fontSize: '2.1rem',
                fontWeight: 800,
                color: isLight ? '#0f2942' : '#ffffff',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '-0.02em',
                marginBottom: '8px',
              }}
            >
              {docCount}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#10b981', fontWeight: 600 }}>
              <TrendingUp size={15} />
              <span>Successfully processed</span>
            </div>
          </div>
        </TiltCard>
      </div>

      {/* 3. Card 4: Daily Document Expenses (Last 14 Days) */}
      <div
        className="glass-panel"
        style={{
          padding: '24px 22px',
          borderRadius: '24px',
          background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.65)',
          border: isLight ? '1px solid rgba(203, 213, 225, 0.8)' : '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: isLight ? '0 4px 20px rgba(15, 23, 42, 0.04)' : '0 8px 30px rgba(0, 0, 0, 0.45)',
          marginBottom: '28px',
        }}
      >
        <div style={{ marginBottom: '20px' }}>
          <h3
            style={{
              fontSize: '1.1rem',
              fontWeight: 800,
              color: isLight ? '#0f2942' : '#f8fafc',
              marginBottom: '4px',
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            Daily Document Expenses
          </h3>
          <div style={{ fontSize: '0.84rem', color: isLight ? '#64748b' : '#94a3b8' }}>
            Last 14 days — based on scanned documents
          </div>
        </div>

        {/* 14-Day Visual Expenses SVG Chart with Y-Axis */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', height: '180px', width: '100%' }}>
          {/* Y-Axis Labels */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '140px',
              paddingBottom: '24px',
              fontSize: '0.74rem',
              color: isLight ? '#94a3b8' : '#64748b',
              fontWeight: 600,
              textAlign: 'right',
              userSelect: 'none',
              minWidth: '28px',
            }}
          >
            <span>₱4K</span>
            <span>₱3K</span>
            <span>₱2K</span>
            <span>₱1K</span>
            <span>0</span>
          </div>

          {/* Bar Columns Container */}
          <div
            style={{
              display: 'flex',
              flex: 1,
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              height: '100%',
              gap: '4px',
              borderBottom: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)',
              paddingBottom: '6px',
            }}
          >
            {dailyHistory.map((item, idx) => {
              const heightPct = Math.max(Math.min((item.total / maxDailyExpense) * 100, 100), 4);
              const hasData = item.total > 0;

              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    height: '100%',
                    flex: 1,
                    gap: '6px',
                  }}
                  title={`${item.dateStr}: ${formatCurrency(item.total)}`}
                >
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '18px',
                      height: `${heightPct}%`,
                      minHeight: '6px',
                      borderRadius: '4px 4px 0 0',
                      background: hasData
                        ? (isLight ? 'linear-gradient(180deg, #0284c7, #38bdf8)' : 'linear-gradient(180deg, #00f2fe, #0284c7)')
                        : (isLight ? 'rgba(203, 213, 225, 0.4)' : 'rgba(255, 255, 255, 0.08)'),
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '0.65rem',
                      color: hasData ? (isLight ? '#0284c7' : '#00f2fe') : (isLight ? '#94a3b8' : '#64748b'),
                      fontWeight: hasData ? 700 : 500,
                    }}
                  >
                    {item.dayNum}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
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
                {t.dashboard.spendingSubtitle}
              </span>
            </div>
            <span className="liquid-badge liquid-badge-cyan">Q3 2026</span>
          </div>

          {/* Dynamic SVG Area Curve */}
          <div style={{ position: 'relative', width: '100%', height: '220px' }}>
            <svg viewBox="0 0 500 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="50" x2="500" y2="50" stroke="var(--chart-grid, rgba(255,255,255,0.06))" strokeDasharray="3 3" />
              <line x1="0" y1="100" x2="500" y2="100" stroke="var(--chart-grid, rgba(255,255,255,0.06))" strokeDasharray="3 3" />
              <line x1="0" y1="150" x2="500" y2="150" stroke="var(--chart-grid, rgba(255,255,255,0.06))" strokeDasharray="3 3" />

              {/* Filled Area */}
              <path
                d="M 0 170 Q 70 120 125 140 T 250 80 T 375 110 T 500 45 L 500 200 L 0 200 Z"
                fill="url(#areaGrad)"
              />

              {/* Clean Line */}
              <path
                d="M 0 170 Q 70 120 125 140 T 250 80 T 375 110 T 500 45"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data Points */}
              <circle cx="125" cy="140" r="4" fill="var(--bg-surface, #ffffff)" stroke="#38bdf8" strokeWidth="2" />
              <circle cx="250" cy="80" r="4" fill="var(--bg-surface, #ffffff)" stroke="#38bdf8" strokeWidth="2" />
              <circle cx="375" cy="110" r="4" fill="var(--bg-surface, #ffffff)" stroke="#38bdf8" strokeWidth="2" />
              <circle cx="500" cy="45" r="4.5" fill="#38bdf8" stroke="var(--bg-surface, #ffffff)" strokeWidth="1.5" />
            </svg>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <span>May 2026</span>
            <span>Jun 2026</span>
            <span>Jul 2026</span>
            <span>Aug 2026 ({t.dashboard.peakMonth})</span>
          </div>
        </div>

        {/* Category Allocation Meter */}
        <div className="glass-panel" style={{ padding: '26px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{t.dashboard.categoryBreakdown}</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {t.dashboard.topSegments}
            </span>
          </div>

          {categoryEntries.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.86rem', textAlign: 'center', padding: '36px 0' }}>
              {t.dashboard.noCategorizedExpenses}
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
                        height: '7px',
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
              {t.dashboard.recentAuditSubtitle}
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
              <Receipt size={40} color="#38bdf8" style={{ opacity: 0.35, margin: '0 auto 12px auto' }} />
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                {t.dashboard.noReceiptsYet}
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 18px auto' }}>
                {t.dashboard.noReceiptsDesc}
              </p>
              <button
                onClick={() => setActiveTab('scanner')}
                className="liquid-btn liquid-btn-primary"
                style={{ padding: '8px 22px', fontSize: '0.88rem', margin: '0 auto' }}
              >
                {t.dashboard.scanFirstBtn}
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
                    title="View Receipt"
                  >
                    <Eye size={13} />
                    <span>View</span>
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
