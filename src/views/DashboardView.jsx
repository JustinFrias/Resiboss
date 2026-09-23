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
  const [hoveredDayIdx, setHoveredDayIdx] = useState(null);
  const [hoveredMonthIdx, setHoveredMonthIdx] = useState(null);

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

  // 14-Day History for Daily Document Expenses (dynamically computed from real documents)
  const dailyHistory = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const dayNum = d.getDate();
      const monthShort = d.toLocaleDateString('en-US', { month: 'short' });

      const dayDocs = documents.filter((doc) => {
        if (!doc.date) return false;
        const s = String(doc.date).slice(0, 10);
        return s === dateStr;
      });

      const dayTotal = dayDocs.reduce((sum, doc) => sum + (Number(doc.total) || 0), 0);

      days.push({
        dateStr,
        formattedDate: `${monthShort} ${dayNum}`,
        dayNum,
        total: dayTotal,
        count: dayDocs.length,
        isToday: i === 0,
      });
    }
    return days;
  }, [documents]);

  const rawMaxDaily = Math.max(...dailyHistory.map((d) => d.total), 0);
  const maxDailyExpense = useMemo(() => {
    if (rawMaxDaily <= 0) return 1000;
    if (rawMaxDaily > 10000) return Math.ceil(rawMaxDaily / 5000) * 5000;
    if (rawMaxDaily > 1000) return Math.ceil(rawMaxDaily / 1000) * 1000;
    if (rawMaxDaily > 100) return Math.ceil(rawMaxDaily / 100) * 100;
    return Math.ceil(rawMaxDaily / 10) * 10;
  }, [rawMaxDaily]);

  const yAxisSteps = useMemo(() => {
    return [1, 0.75, 0.5, 0.25, 0].map((ratio) => maxDailyExpense * ratio);
  }, [maxDailyExpense]);

  // Real Monthly Spending Flow Trends calculated from user documents
  const monthlyTrends = useMemo(() => {
    const now = new Date();
    const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
    const quarterLabel = `Q${currentQuarter} ${now.getFullYear()}`;

    const months = [];
    for (let i = 3; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthNum = d.getMonth();
      const prefix = `${year}-${String(monthNum + 1).padStart(2, '0')}`;
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });
      const label = `${monthName} ${year}`;

      const monthDocs = documents.filter((doc) => doc.date && String(doc.date).startsWith(prefix));
      const monthTotal = monthDocs.reduce((sum, doc) => sum + (Number(doc.total) || 0), 0);

      months.push({
        label,
        monthName,
        year,
        prefix,
        total: monthTotal,
        count: monthDocs.length,
      });
    }

    const maxTotal = Math.max(...months.map((m) => m.total), 0);
    const peakIdx = maxTotal > 0 ? months.findIndex((m) => m.total === maxTotal) : -1;

    // Layout 4 points on SVG viewBox 0 0 500 200
    const xCoords = [55, 185, 315, 445];
    const points = months.map((m, idx) => {
      const x = xCoords[idx];
      const y = maxTotal > 0 ? Math.round(165 - (m.total / maxTotal) * 120) : 165;
      return { x, y, ...m };
    });

    const pathD = `M ${points[0].x} ${points[0].y} C ${points[0].x + 45} ${points[0].y}, ${points[1].x - 45} ${points[1].y}, ${points[1].x} ${points[1].y} C ${points[1].x + 45} ${points[1].y}, ${points[2].x - 45} ${points[2].y}, ${points[2].x} ${points[2].y} C ${points[2].x + 45} ${points[2].y}, ${points[3].x - 45} ${points[3].y}, ${points[3].x} ${points[3].y}`;
    const areaD = `${pathD} L ${points[3].x} 195 L ${points[0].x} 195 Z`;

    return {
      months,
      points,
      pathD,
      areaD,
      maxTotal,
      quarterLabel,
      peakIdx,
    };
  }, [documents]);

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
            fontSize: '1.45rem',
            fontWeight: 500,
            letterSpacing: '-0.01em',
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
              background: isLight ? '#ffffff' : 'rgba(14, 14, 14, 0.85)',
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
                background: isLight ? '#ffffff' : 'rgba(14, 14, 14, 0.96)',
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
              background: isLight ? '#ffffff' : 'rgba(12, 12, 12, 0.75)',
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
              background: isLight ? '#ffffff' : 'rgba(12, 12, 12, 0.75)',
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
              background: isLight ? '#ffffff' : 'rgba(12, 12, 12, 0.75)',
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
          background: isLight ? '#ffffff' : 'rgba(12, 12, 12, 0.75)',
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

        {/* 14-Day Visual Expenses SVG Chart with Dynamic Y-Axis */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', height: '180px', width: '100%' }}>
          {/* Dynamic Y-Axis Labels */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '140px',
              paddingBottom: '24px',
              fontSize: '0.72rem',
              color: isLight ? '#64748b' : '#94a3b8',
              fontWeight: 600,
              textAlign: 'right',
              userSelect: 'none',
              minWidth: '40px',
            }}
          >
            {yAxisSteps.map((stepVal, idx) => (
              <span key={idx}>{formatCompact(stepVal)}</span>
            ))}
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
              const hasData = item.total > 0;
              const heightPct = hasData
                ? Math.max(Math.min((item.total / maxDailyExpense) * 100, 100), 10)
                : 4;
              const isHovered = hoveredDayIdx === idx;

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
                    position: 'relative',
                  }}
                  onMouseEnter={() => setHoveredDayIdx(idx)}
                  onMouseLeave={() => setHoveredDayIdx(null)}
                >
                  {/* Floating Interactive Tooltip */}
                  {isHovered && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 'calc(100% + 8px)',
                        background: isLight ? 'rgba(15, 23, 42, 0.94)' : 'rgba(15, 23, 42, 0.96)',
                        color: '#ffffff',
                        padding: '6px 12px',
                        borderRadius: '10px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
                        border: '1px solid rgba(0, 242, 254, 0.45)',
                        zIndex: 35,
                        pointerEvents: 'none',
                        textAlign: 'center',
                        backdropFilter: 'blur(8px)',
                      }}
                    >
                      <div style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.68rem', marginBottom: '2px' }}>
                        {item.formattedDate}
                      </div>
                      <div style={{ color: hasData ? '#00f2fe' : '#ffffff', fontWeight: 700, fontSize: '0.78rem' }}>
                        {hasData ? formatCurrency(item.total) : 'Walang expenses'}
                      </div>
                      {hasData && (
                        <div style={{ fontSize: '0.66rem', color: '#38bdf8', marginTop: '1px' }}>
                          {item.count} {item.count === 1 ? 'receipt' : 'receipts'}
                        </div>
                      )}
                    </div>
                  )}

                  <div
                    style={{
                      width: '100%',
                      maxWidth: '18px',
                      height: `${heightPct}%`,
                      minHeight: '6px',
                      borderRadius: '4px 4px 0 0',
                      background: hasData
                        ? (isLight
                            ? 'linear-gradient(180deg, #0284c7, #38bdf8)'
                            : 'linear-gradient(180deg, #00f2fe, #0284c7)')
                        : (isLight ? 'rgba(203, 213, 225, 0.4)' : 'rgba(255, 255, 255, 0.08)'),
                      boxShadow: hasData
                        ? (isHovered ? '0 0 16px rgba(0, 242, 254, 0.7)' : '0 0 8px rgba(0, 242, 254, 0.25)')
                        : 'none',
                      transform: isHovered && hasData ? 'scaleY(1.05)' : 'none',
                      transformOrigin: 'bottom',
                      transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      cursor: hasData ? 'pointer' : 'default',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '0.65rem',
                      color: hasData
                        ? (isLight ? '#0284c7' : '#00f2fe')
                        : (isLight ? '#94a3b8' : '#64748b'),
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
        {/* Dynamic Spending Flow Curve (SVG Canvas) */}
        <div className="glass-panel" style={{ padding: '26px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{t.dashboard?.spendingTrend || 'Expense Flow Trends'}</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {t.dashboard?.spendingSubtitle || 'Monthly expense activity and cash flow breakdown'}
              </span>
            </div>
            <span className="liquid-badge liquid-badge-cyan">{monthlyTrends.quarterLabel}</span>
          </div>

          {/* Dynamic SVG Area Curve */}
          <div style={{ position: 'relative', width: '100%', height: '220px' }}>
            <svg viewBox="0 0 500 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="40" y1="50" x2="460" y2="50" stroke="var(--chart-grid, rgba(255,255,255,0.06))" strokeDasharray="3 3" />
              <line x1="40" y1="100" x2="460" y2="100" stroke="var(--chart-grid, rgba(255,255,255,0.06))" strokeDasharray="3 3" />
              <line x1="40" y1="150" x2="460" y2="150" stroke="var(--chart-grid, rgba(255,255,255,0.06))" strokeDasharray="3 3" />

              {/* Filled Area */}
              <path
                d={monthlyTrends.areaD}
                fill="url(#areaGrad)"
                style={{ transition: 'all 0.5s ease' }}
              />

              {/* Clean Line */}
              <path
                d={monthlyTrends.pathD}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: 'drop-shadow(0 2px 8px rgba(56, 189, 248, 0.45))' }}
              />

              {/* Real Data Points */}
              {monthlyTrends.points.map((pt, idx) => {
                const isHovered = hoveredMonthIdx === idx;
                const isPeak = idx === monthlyTrends.peakIdx && monthlyTrends.maxTotal > 0;

                return (
                  <g
                    key={idx}
                    onMouseEnter={() => setHoveredMonthIdx(idx)}
                    onMouseLeave={() => setHoveredMonthIdx(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 6.5 : isPeak ? 5 : 4}
                      fill={isPeak ? '#00f2fe' : 'var(--bg-surface, #0f172a)'}
                      stroke="#38bdf8"
                      strokeWidth={isPeak ? 2.5 : 2}
                      style={{ transition: 'all 0.2s ease' }}
                    />
                    {isHovered && (
                      <g>
                        <rect
                          x={Math.max(10, pt.x - 55)}
                          y={Math.max(10, pt.y - 38)}
                          width="110"
                          height="26"
                          rx="6"
                          fill="rgba(15, 23, 42, 0.95)"
                          stroke="rgba(0, 242, 254, 0.5)"
                          strokeWidth="1"
                        />
                        <text
                          x={Math.max(10, pt.x - 55) + 55}
                          y={Math.max(10, pt.y - 38) + 17}
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="10"
                          fontWeight="700"
                        >
                          {formatCurrency(pt.total)}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Dynamic Month Labels */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {monthlyTrends.months.map((m, idx) => {
              const isPeak = idx === monthlyTrends.peakIdx && monthlyTrends.maxTotal > 0;
              return (
                <span
                  key={idx}
                  style={{
                    color: isPeak ? (isLight ? '#0284c7' : '#00f2fe') : undefined,
                    fontWeight: isPeak ? 700 : 500,
                  }}
                >
                  {m.label} {isPeak ? `(${t.dashboard?.peakMonth || 'Peak'})` : ''}
                </span>
              );
            })}
          </div>
        </div>

        {/* Dynamic Category Allocation Meter */}
        <div className="glass-panel" style={{ padding: '26px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{t.dashboard?.categoryBreakdown || 'Category Allocation'}</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {t.dashboard?.topSegments || 'Top spending segments'}
            </span>
          </div>

          {categoryEntries.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.86rem', textAlign: 'center', padding: '36px 0' }}>
              {t.dashboard?.noCategorizedExpenses || 'No categorized expenses yet'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {categoryEntries.slice(0, 5).map(([cat, val], idx) => {
                const pct = totalAmount > 0 ? (val / totalAmount) * 100 : 0;
                // If value exists, never show 0%; show <1% for tiny segments
                const displayPct = val > 0 ? (pct < 1 ? '<1%' : `${Math.round(pct)}%`) : '0%';
                // Always give a visible bar segment if value > 0
                const barWidth = val > 0 ? Math.max(pct, 3.5) : 0;
                const colors = ['#00f2fe', '#a855f7', '#10b981', '#f59e0b', '#ec4899'];
                const currentColor = colors[idx % colors.length];

                return (
                  <div key={cat}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: currentColor,
                            boxShadow: `0 0 8px ${currentColor}80`,
                            display: 'inline-block',
                          }}
                        />
                        <span style={{ fontWeight: 600 }}>{t.categories?.[cat] || cat}</span>
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        {formatCurrency(val)} ({displayPct})
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
                          width: `${barWidth}%`,
                          height: '100%',
                          background: currentColor,
                          borderRadius: '999px',
                          boxShadow: `0 0 10px ${currentColor}55`,
                          transition: 'width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
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
