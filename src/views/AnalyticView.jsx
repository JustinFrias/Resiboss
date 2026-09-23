import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { TiltCard } from '../components';
import { soundFx } from '../utils/soundEffects';
import {
  TrendingUp,
  PieChart,
  Building,
  AlertCircle,
  Receipt,
  ShieldCheck,
  Calendar,
  Layers,
} from 'lucide-react';

export const AnalyticView = () => {
  const { documents, formatCurrency, t, theme } = useApp();
  const isLight = theme === 'light';

  // Overall Financial Totals with Smart VAT Fallback
  const totalSpend = useMemo(() => {
    return documents.reduce((acc, d) => acc + (Number(d.total) || 0), 0);
  }, [documents]);

  const totalVat = useMemo(() => {
    return documents.reduce((acc, d) => {
      const explicitVat = Number(d.vat);
      if (!isNaN(explicitVat) && explicitVat > 0) return acc + explicitVat;
      // Standard 12% PH VAT deductible fallback: total - (total / 1.12)
      const tot = Number(d.total) || 0;
      return acc + (tot > 0 ? tot - tot / 1.12 : 0);
    }, 0);
  }, [documents]);

  const totalSubtotal = useMemo(() => {
    return documents.reduce((acc, d) => {
      const explicitSub = Number(d.subtotal);
      if (!isNaN(explicitSub) && explicitSub > 0) return acc + explicitSub;
      const tot = Number(d.total) || 0;
      return acc + (tot > 0 ? tot / 1.12 : 0);
    }, 0);
  }, [documents]);

  // Highest single receipt
  const highestDoc = useMemo(() => {
    if (!documents || documents.length === 0) return null;
    return [...documents].sort((a, b) => (Number(b.total) || 0) - (Number(a.total) || 0))[0];
  }, [documents]);

  // Available Fiscal Years
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const set = new Set([currentYear]);
    documents.forEach((d) => {
      if (d.date) {
        const y = parseInt(String(d.date).slice(0, 4), 10);
        if (!isNaN(y) && y > 2000 && y < 2100) set.add(y);
      }
    });
    return Array.from(set).sort((a, b) => b - a);
  }, [documents]);

  const [selectedYear, setSelectedYear] = useState(() => availableYears[0] || new Date().getFullYear());

  // Real Monthly Aggregates for Selected Year (Jan - Dec)
  const monthlyData = useMemo(() => {
    const months = [];
    const now = new Date();

    for (let m = 0; m < 12; m++) {
      const d = new Date(selectedYear, m, 1);
      const monthShort = d.toLocaleDateString('en-US', { month: 'short' });
      const monthKey = `${selectedYear}-${String(m + 1).padStart(2, '0')}`;

      const monthDocs = documents.filter((doc) => {
        if (!doc.date) return false;
        return String(doc.date).startsWith(monthKey);
      });

      const amount = monthDocs.reduce((sum, doc) => sum + (Number(doc.total) || 0), 0);
      const vat = monthDocs.reduce((sum, doc) => {
        const explicit = Number(doc.vat);
        if (!isNaN(explicit) && explicit > 0) return sum + explicit;
        const tot = Number(doc.total) || 0;
        return sum + (tot > 0 ? tot - tot / 1.12 : 0);
      }, 0);

      months.push({
        month: monthShort,
        monthKey,
        amount,
        vat,
        count: monthDocs.length,
        hasData: amount > 0,
        isCurrent: selectedYear === now.getFullYear() && m === now.getMonth(),
      });
    }

    // If whole year is empty, slice to last 6 months up to current
    const hasAnyInYear = months.some((m) => m.hasData);
    if (!hasAnyInYear) {
      const recentMonths = [];
      for (let i = 5; i >= 0; i--) {
        const rd = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const y = rd.getFullYear();
        const mn = rd.getMonth();
        const mKey = `${y}-${String(mn + 1).padStart(2, '0')}`;
        const mDocs = documents.filter((doc) => doc.date && String(doc.date).startsWith(mKey));
        const amt = mDocs.reduce((sum, doc) => sum + (Number(doc.total) || 0), 0);
        const vt = mDocs.reduce((sum, doc) => {
          const explicit = Number(doc.vat);
          if (!isNaN(explicit) && explicit > 0) return sum + explicit;
          const tot = Number(doc.total) || 0;
          return sum + (tot > 0 ? tot - tot / 1.12 : 0);
        }, 0);

        recentMonths.push({
          month: rd.toLocaleDateString('en-US', { month: 'short' }),
          monthKey: mKey,
          amount: amt,
          vat: vt,
          count: mDocs.length,
          hasData: amt > 0,
          isCurrent: i === 0,
        });
      }
      return recentMonths;
    }

    return months;
  }, [documents, selectedYear]);

  const maxMonthAmount = useMemo(() => {
    return Math.max(...monthlyData.map((m) => m.amount), 1);
  }, [monthlyData]);

  // Selected Month State
  const defaultActiveMonth = useMemo(() => {
    // Pick the month with highest spend, or current month
    const withData = [...monthlyData].filter((m) => m.hasData).sort((a, b) => b.amount - a.amount);
    return withData[0] || monthlyData[monthlyData.length - 1];
  }, [monthlyData]);

  const [selectedMonthKey, setSelectedMonthKey] = useState(null);
  const [hoveredMonthKey, setHoveredMonthKey] = useState(null);

  const activeMonth = useMemo(() => {
    const key = selectedMonthKey || defaultActiveMonth?.monthKey;
    return monthlyData.find((m) => m.monthKey === key) || defaultActiveMonth;
  }, [selectedMonthKey, defaultActiveMonth, monthlyData]);

  // Category Breakdown
  const categoryPalette = ['#00f2fe', '#a855f7', '#10b981', '#f59e0b', '#ec4899', '#38bdf8', '#6366f1'];

  const categoryList = useMemo(() => {
    const map = {};
    documents.forEach((d) => {
      const cat = d.category || 'Other';
      map[cat] = (map[cat] || 0) + (Number(d.total) || 0);
    });

    const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
    return entries.map(([cat, val], idx) => {
      const rawPct = totalSpend > 0 ? (val / totalSpend) * 100 : 0;
      const displayPct = val > 0 ? (rawPct < 1 ? '<1%' : `${Math.round(rawPct)}%`) : '0%';
      const color = categoryPalette[idx % categoryPalette.length];
      return {
        cat,
        val,
        rawPct,
        displayPct,
        color,
      };
    });
  }, [documents, totalSpend]);

  const [hoveredCategory, setHoveredCategory] = useState(null);

  // Dynamic SVG Donut Calculations (r = 38, C ≈ 238.76)
  const donutRadius = 38;
  const donutCircumference = 2 * Math.PI * donutRadius; // ≈ 238.761

  const donutSlices = useMemo(() => {
    if (categoryList.length === 0 || totalSpend <= 0) return [];

    let accumulatedPct = 0;
    return categoryList.map((item) => {
      const pct = item.rawPct / 100;
      // Guarantee a minimum visible arc length (at least ~6px on circumference) if value > 0
      const sliceLength = Math.max(pct * donutCircumference, item.val > 0 ? 5 : 0);
      const dashoffset = -(accumulatedPct * donutCircumference);
      accumulatedPct += pct;

      return {
        ...item,
        sliceLength,
        dashoffset,
        dasharray: `${sliceLength} ${donutCircumference}`,
      };
    });
  }, [categoryList, totalSpend, donutCircumference]);

  // Top Merchants
  const topMerchants = useMemo(() => {
    const map = {};
    documents.forEach((d) => {
      const m = d.merchant || 'Unknown Merchant';
      map[m] = (map[m] || 0) + (Number(d.total) || 0);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [documents]);

  const activeHoverCategoryItem = hoveredCategory
    ? categoryList.find((c) => c.cat === hoveredCategory)
    : null;

  return (
    <div style={{ width: '100%', padding: '0 0 40px 0' }}>
      {/* Title Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1
          style={{
            fontSize: '1.45rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: 'var(--text-primary)',
            marginBottom: '4px',
            fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
          }}
        >
          {t.analytic?.predictiveTitle || 'Predictive & Real-Time Analytics'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
          {t.analytic?.subtitle || 'Advanced expenditure breakdown, cash flow trends, and tax deductibles'}
        </p>
      </div>

      {/* Top 3 Metric Tiles with Harmonious Colors */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          marginBottom: '28px',
        }}
      >
        {/* Metric 1: Taxable Net Subtotal */}
        <TiltCard>
          <div
            className="glass-panel"
            style={{
              padding: '24px',
              border: isLight ? '1px solid rgba(203, 213, 225, 0.8)' : '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>
              {t.analytic?.taxableNetSubtotal || 'Taxable Net Subtotal'}
            </div>
            <div
              style={{
                fontSize: '1.9rem',
                fontWeight: 800,
                color: isLight ? '#0f2942' : '#ffffff',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '-0.02em',
              }}
            >
              {formatCurrency(totalSubtotal)}
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '8px' }}>
              {t.analytic?.preTaxBaseline || 'Pre-tax business expense baseline'}
            </div>
          </div>
        </TiltCard>

        {/* Metric 2: Input VAT Deductible */}
        <TiltCard>
          <div
            className="glass-panel"
            style={{
              padding: '24px',
              border: isLight ? '1px solid rgba(203, 213, 225, 0.8)' : '1px solid rgba(16, 185, 129, 0.25)',
            }}
          >
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>
              {t.analytic?.inputVatDeductible || '12% Input VAT Deductible'}
            </div>
            <div
              style={{
                fontSize: '1.9rem',
                fontWeight: 800,
                color: '#10b981',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '-0.02em',
              }}
            >
              {formatCurrency(totalVat)}
            </div>
            <div
              style={{
                fontSize: '0.76rem',
                color: '#10b981',
                marginTop: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontWeight: 600,
              }}
            >
              <ShieldCheck size={14} />
              <span>{t.analytic?.birTaxCredit || 'Estimated tax credit for tax reference'}</span>
            </div>
          </div>
        </TiltCard>

        {/* Metric 3: Largest Scanned Receipt */}
        <TiltCard>
          <div
            className="glass-panel"
            style={{
              padding: '24px',
              border: isLight ? '1px solid rgba(203, 213, 225, 0.8)' : '1px solid rgba(0, 242, 254, 0.25)',
            }}
          >
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>
              {t.analytic?.highestSpend || 'Largest Scanned Receipt'}
            </div>
            <div
              style={{
                fontSize: '1.9rem',
                fontWeight: 800,
                color: isLight ? '#0284c7' : '#00f2fe',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '-0.02em',
              }}
            >
              {highestDoc ? formatCurrency(highestDoc.total) : '₱0.00'}
            </div>
            <div
              style={{
                fontSize: '0.76rem',
                color: isLight ? '#64748b' : '#94a3b8',
                marginTop: '8px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontWeight: 600,
              }}
            >
              {highestDoc ? (highestDoc.merchant || 'Scanned Document') : 'No records yet'}
            </div>
          </div>
        </TiltCard>
      </div>

      {/* Middle Grid: Monthly Expenditure Overview & Category Distribution */}
      <div
        className="analytic-trend-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '1.8fr 1.2fr',
          gap: '24px',
          marginBottom: '28px',
        }}
      >
        {/* Monthly Trend Harmonious Glass Column Chart */}
        <div className="glass-panel" style={{ padding: '26px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '2px' }}>
                {t.analytic?.monthlyTrend || 'Monthly Expenditure Overview'}
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {t.analytic?.aggregatedExpDesc || 'Aggregated expenditures per billing cycle'}
              </span>
            </div>

            {/* Fiscal Year Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {availableYears.map((yr) => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => {
                    setSelectedYear(yr);
                    soundFx?.playClick?.();
                  }}
                  className={`liquid-badge ${selectedYear === yr ? 'liquid-badge-cyan' : ''}`}
                  style={{
                    cursor: 'pointer',
                    background: selectedYear === yr ? undefined : (isLight ? 'rgba(241, 245, 249, 0.8)' : 'rgba(255, 255, 255, 0.06)'),
                    color: selectedYear === yr ? undefined : 'var(--text-secondary)',
                    borderColor: selectedYear === yr ? undefined : 'transparent',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.74rem',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  FY {yr}
                </button>
              ))}
            </div>
          </div>

          {/* Bar Chart Area */}
          <div
            style={{
              height: '220px',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: monthlyData.length > 8 ? '8px' : '16px',
              padding: '0 8px 10px 8px',
              borderBottom: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {monthlyData.map((m, idx) => {
              const heightPct = m.hasData
                ? Math.max(Math.round((m.amount / maxMonthAmount) * 100), 12)
                : 4;
              const isSelected = activeMonth?.monthKey === m.monthKey;
              const isHovered = hoveredMonthKey === m.monthKey;

              return (
                <div
                  key={m.monthKey}
                  onClick={() => {
                    setSelectedMonthKey(m.monthKey);
                    soundFx?.playClick?.();
                  }}
                  onMouseEnter={() => setHoveredMonthKey(m.monthKey)}
                  onMouseLeave={() => setHoveredMonthKey(null)}
                  role="button"
                  tabIndex={0}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    height: '100%',
                    justifyContent: 'flex-end',
                    cursor: 'pointer',
                    userSelect: 'none',
                    position: 'relative',
                  }}
                  title={`${m.month}: ${formatCurrency(m.amount)} (${m.count} docs)`}
                >
                  {/* Amount Label on top of bar */}
                  {m.hasData && (
                    <div
                      style={{
                        fontSize: '0.7rem',
                        fontFamily: 'var(--font-mono)',
                        color: isSelected
                          ? (isLight ? '#0284c7' : '#00f2fe')
                          : isHovered
                          ? 'var(--text-primary)'
                          : 'var(--text-secondary)',
                        marginBottom: '6px',
                        fontWeight: isSelected ? 800 : 600,
                        transform: isSelected ? 'scale(1.08)' : 'none',
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {formatCurrency(m.amount)}
                    </div>
                  )}

                  {/* Harmonious Sleek Column Bar */}
                  <div
                    style={{
                      width: '100%',
                      maxWidth: monthlyData.length > 8 ? '36px' : '52px',
                      height: `${heightPct}%`,
                      background: isSelected
                        ? (isLight
                            ? 'linear-gradient(180deg, #0284c7 0%, #0369a1 100%)'
                            : 'linear-gradient(180deg, #00f2fe 0%, #0284c7 100%)')
                        : isHovered
                        ? (isLight
                            ? 'linear-gradient(180deg, rgba(2, 132, 199, 0.5) 0%, rgba(56, 189, 248, 0.3) 100%)'
                            : 'linear-gradient(180deg, rgba(0, 242, 254, 0.55) 0%, rgba(2, 132, 199, 0.35) 100%)')
                        : m.hasData
                        ? (isLight
                            ? 'linear-gradient(180deg, rgba(2, 132, 199, 0.25) 0%, rgba(56, 189, 248, 0.12) 100%)'
                            : 'linear-gradient(180deg, rgba(56, 189, 248, 0.35) 0%, rgba(14, 165, 233, 0.15) 100%)')
                        : (isLight ? 'rgba(203, 213, 225, 0.45)' : 'rgba(255, 255, 255, 0.06)'),
                      borderRadius: '8px 8px 3px 3px',
                      boxShadow: isSelected
                        ? (isLight
                            ? '0 0 16px rgba(2, 132, 199, 0.4), 0 4px 10px rgba(15, 23, 42, 0.1)'
                            : '0 0 24px rgba(0, 242, 254, 0.6), 0 4px 14px rgba(2, 132, 199, 0.35)')
                        : isHovered && m.hasData
                        ? '0 0 14px rgba(0, 242, 254, 0.3)'
                        : 'none',
                      border: isSelected
                        ? (isLight ? '1.5px solid #0284c7' : '1.5px solid rgba(255, 255, 255, 0.85)')
                        : isHovered && m.hasData
                        ? '1px solid rgba(0, 242, 254, 0.5)'
                        : m.hasData
                        ? (isLight ? '1px solid rgba(2, 132, 199, 0.2)' : '1px solid rgba(56, 189, 248, 0.25)')
                        : '1px solid transparent',
                      transform: isSelected ? 'scaleY(1.03) translateY(-2px)' : isHovered ? 'scaleY(1.02)' : 'none',
                      transformOrigin: 'bottom',
                      transition: 'height 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), background 0.25s ease, box-shadow 0.25s ease',
                      animation: `barRise 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 25}ms both`,
                    }}
                  />

                  {/* Month Label */}
                  <div
                    style={{
                      marginTop: '8px',
                      fontSize: '0.78rem',
                      fontWeight: isSelected ? 800 : 600,
                      color: isSelected
                        ? (isLight ? '#0284c7' : '#00f2fe')
                        : isHovered
                        ? 'var(--text-primary)'
                        : 'var(--text-muted)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '3px',
                      transition: 'color 0.2s ease',
                    }}
                  >
                    <span>{m.month}</span>
                    {isSelected && (
                      <span
                        style={{
                          width: '4px',
                          height: '4px',
                          borderRadius: '50%',
                          background: isLight ? '#0284c7' : '#00f2fe',
                          boxShadow: `0 0 6px ${isLight ? '#0284c7' : '#00f2fe'}`,
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Selected Month Summary Pill */}
          {activeMonth && (
            <div
              style={{
                marginTop: '18px',
                padding: '12px 18px',
                borderRadius: '14px',
                background: isLight ? 'rgba(241, 245, 249, 0.9)' : 'rgba(0, 242, 254, 0.07)',
                border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(0, 242, 254, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                animation: 'popoverFloat 0.22s cubic-bezier(0.16, 1, 0.3, 1) both',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: isLight ? '#0284c7' : '#00f2fe',
                    boxShadow: `0 0 8px ${isLight ? '#0284c7' : '#00f2fe'}`,
                  }}
                />
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {activeMonth.month} ({selectedYear})
                </span>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                  • {activeMonth.count} {activeMonth.count === 1 ? 'receipt' : 'receipts'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Expenses: </span>
                  <span
                    style={{
                      fontSize: '0.94rem',
                      fontWeight: 800,
                      fontFamily: 'var(--font-mono)',
                      color: isLight ? '#0284c7' : '#00f2fe',
                    }}
                  >
                    {formatCurrency(activeMonth.amount)}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Est. Tax: </span>
                  <span
                    style={{
                      fontSize: '0.94rem',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      color: '#10b981',
                    }}
                  >
                    {formatCurrency(activeMonth.vat)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Category Share Ring Donut & Proportional Breakdown */}
        <div className="glass-panel" style={{ padding: '26px' }}>
          <div style={{ marginBottom: '18px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '2px' }}>
              {t.analytic?.categoryShare || 'Category Distribution'}
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {t.analytic?.proportionalDesc || 'Proportional expense distribution across segments'}
            </span>
          </div>

          {categoryList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              No categories recorded yet
            </div>
          ) : (
            <>
              {/* Dynamic SVG Donut Ring */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ position: 'relative', width: '160px', height: '160px' }}>
                  <svg
                    viewBox="0 0 100 100"
                    style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%', overflow: 'visible' }}
                  >
                    {/* Background Ring Track */}
                    <circle
                      cx="50"
                      cy="50"
                      r={donutRadius}
                      fill="transparent"
                      stroke={isLight ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.08)'}
                      strokeWidth="11"
                    />

                    {/* Dynamic Proportional Segments */}
                    {donutSlices.map((slice) => {
                      const isHovered = hoveredCategory === slice.cat;
                      return (
                        <circle
                          key={slice.cat}
                          cx="50"
                          cy="50"
                          r={donutRadius}
                          fill="transparent"
                          stroke={slice.color}
                          strokeWidth={isHovered ? 13 : 11}
                          strokeDasharray={slice.dasharray}
                          strokeDashoffset={slice.dashoffset}
                          strokeLinecap="round"
                          style={{
                            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                            cursor: 'pointer',
                            filter: isHovered
                              ? `drop-shadow(0 0 8px ${slice.color})`
                              : `drop-shadow(0 0 3px ${slice.color}55)`,
                          }}
                          onMouseEnter={() => setHoveredCategory(slice.cat)}
                          onMouseLeave={() => setHoveredCategory(null)}
                        />
                      );
                    })}
                  </svg>

                  {/* Centered Donut Badge */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      pointerEvents: 'none',
                      textAlign: 'center',
                      padding: '4px',
                    }}
                  >
                    {activeHoverCategoryItem ? (
                      <>
                        <div
                          style={{
                            fontSize: '0.64rem',
                            fontWeight: 700,
                            color: activeHoverCategoryItem.color,
                            textTransform: 'uppercase',
                            maxWidth: '90px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {t.categories?.[activeHoverCategoryItem.cat] || activeHoverCategoryItem.cat}
                        </div>
                        <div
                          style={{
                            fontSize: '0.98rem',
                            fontWeight: 800,
                            color: 'var(--text-primary)',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          {activeHoverCategoryItem.displayPct}
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: '0.66rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                          CATEGORIES
                        </div>
                        <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {categoryList.length}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Complementary Category Rows with Progress Pills */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {categoryList.map((item, idx) => {
                  const isHovered = hoveredCategory === item.cat;
                  const barWidth = item.val > 0 ? Math.max(item.rawPct, 3.5) : 0;

                  return (
                    <div
                      key={item.cat}
                      onMouseEnter={() => setHoveredCategory(item.cat)}
                      onMouseLeave={() => setHoveredCategory(null)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '10px',
                        background: isHovered
                          ? (isLight ? 'rgba(241, 245, 249, 0.8)' : 'rgba(255, 255, 255, 0.04)')
                          : 'transparent',
                        transition: 'background 0.2s ease',
                        cursor: 'pointer',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.84rem',
                          marginBottom: '6px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: item.color,
                              boxShadow: `0 0 8px ${item.color}80`,
                              display: 'inline-block',
                              flexShrink: 0,
                            }}
                          />
                          <span style={{ fontWeight: isHovered ? 700 : 600, color: 'var(--text-primary)' }}>
                            {t.categories?.[item.cat] || item.cat}
                          </span>
                        </div>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700,
                            color: isHovered ? item.color : 'var(--text-secondary)',
                            transition: 'color 0.2s ease',
                          }}
                        >
                          {formatCurrency(item.val)} ({item.displayPct})
                        </span>
                      </div>

                      {/* Smooth Progress Pill */}
                      <div
                        style={{
                          width: '100%',
                          height: '5px',
                          background: isLight ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.08)',
                          borderRadius: '999px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${barWidth}%`,
                            height: '100%',
                            background: item.color,
                            borderRadius: '999px',
                            boxShadow: `0 0 8px ${item.color}55`,
                            transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                            animation: `progressSlideOut 0.75s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 50}ms both`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom Row: Top Vendors */}
      <div
        className="analytic-bottom-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '24px',
        }}
      >
        <div className="glass-panel" style={{ padding: '26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <Building size={18} color={isLight ? '#0284c7' : '#00f2fe'} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
              {t.analytic?.topVendors || 'Top Spending Vendors'}
            </h3>
          </div>

          {topMerchants.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.86rem', textAlign: 'center', padding: '24px 0' }}>
              No vendor activity found
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {topMerchants.map(([merchant, val], idx) => {
                const vendorPct = totalSpend > 0 ? (val / totalSpend) * 100 : 0;
                return (
                  <div
                    key={merchant}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      background: 'var(--bg-surface-elevated)',
                      border: isLight ? '1px solid rgba(203, 213, 225, 0.7)' : '1px solid var(--glass-border)',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '8px',
                          background: isLight ? 'rgba(2, 132, 199, 0.12)' : 'var(--cyan-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.74rem',
                          fontWeight: 800,
                          color: isLight ? '#0284c7' : 'var(--cyan-glow)',
                        }}
                      >
                        #{idx + 1}
                      </div>
                      <div>
                        <div style={{ fontWeight: 650, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                          {merchant}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          {vendorPct < 1 ? '<1%' : `${Math.round(vendorPct)}%`} of total expenses
                        </div>
                      </div>
                    </div>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 800,
                        fontSize: '0.94rem',
                        color: isLight ? '#0284c7' : '#38bdf8',
                      }}
                    >
                      {formatCurrency(val)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
