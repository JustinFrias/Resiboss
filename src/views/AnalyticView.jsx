import React, { useState } from 'react';
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
} from 'lucide-react';

export const AnalyticView = () => {
  const { documents, formatCurrency, t } = useApp();

  const totalSpend = documents.reduce((acc, d) => acc + (d.total || 0), 0);
  const totalVat = documents.reduce((acc, d) => acc + (d.vat || 0), 0);
  const totalSubtotal = documents.reduce((acc, d) => acc + (d.subtotal || 0), 0);

  // Category Aggregates
  const categoryMap = documents.reduce((acc, d) => {
    const cat = d.category || 'Other';
    acc[cat] = (acc[cat] || 0) + (d.total || 0);
    return acc;
  }, {});
  const categoryList = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);

  // Top Merchants
  const merchantMap = documents.reduce((acc, d) => {
    acc[d.merchant] = (acc[d.merchant] || 0) + (d.total || 0);
    return acc;
  }, {});
  const topMerchants = Object.entries(merchantMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Highest single receipt
  const highestDoc = [...documents].sort((a, b) => (b.total || 0) - (a.total || 0))[0];

  const [selectedMonth, setSelectedMonth] = useState('Aug');
  const [hoveredMonth, setHoveredMonth] = useState(null);
  const [selectedYear, setSelectedYear] = useState('FY 2026');

  const yearMultiplier = selectedYear === 'FY 2026' ? 1 : 0.82;

  // Monthly Simulation Bars
  const monthlyData = [
    { month: 'Apr', amount: totalSpend * 0.55 * yearMultiplier },
    { month: 'May', amount: totalSpend * 0.72 * yearMultiplier },
    { month: 'Jun', amount: totalSpend * 0.64 * yearMultiplier },
    { month: 'Jul', amount: totalSpend * 0.88 * yearMultiplier },
    { month: 'Aug', amount: totalSpend * 1.0 * yearMultiplier },
  ];
  const maxMonthAmount = Math.max(...monthlyData.map((m) => m.amount), 1);
  const activeMonthItem = monthlyData.find((m) => m.month === selectedMonth) || monthlyData[monthlyData.length - 1];

  return (
    <div className="" style={{ width: '100%', padding: '0 0 40px 0' }}>
      {/* Title Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.45rem', fontWeight: 500, letterSpacing: '-0.01em', color: 'var(--text-primary)', marginBottom: '4px', fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif" }}>
          {t.analytic.predictiveTitle}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          {t.analytic.subtitle}
        </p>
      </div>

      {/* Top 3 Metric Tiles */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          marginBottom: '28px',
        }}
      >
        <TiltCard>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              {t.analytic.taxableNetSubtotal}
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {formatCurrency(totalSubtotal)}
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '8px' }}>
              {t.analytic.preTaxBaseline}
            </div>
          </div>
        </TiltCard>

        <TiltCard>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              {t.analytic.inputVatDeductible}
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
              {formatCurrency(totalVat)}
            </div>
            <div style={{ fontSize: '0.76rem', color: '#34d399', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={14} /> {t.analytic.birTaxCredit}
            </div>
          </div>
        </TiltCard>

        <TiltCard>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              {t.analytic.highestSpend}
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#00f2fe', fontFamily: 'var(--font-mono)' }}>
              {highestDoc ? formatCurrency(highestDoc.total) : '₱0.00'}
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {highestDoc ? highestDoc.merchant : 'None recorded'}
            </div>
          </div>
        </TiltCard>
      </div>

      {/* Middle Grid: Monthly Trend Bars & Category Donut Chart */}
      <div
        className="analytic-trend-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '1.8fr 1.2fr',
          gap: '24px',
          marginBottom: '28px',
        }}
      >
        {/* Monthly Trend Glass Column Chart */}
        <div className="glass-panel" style={{ padding: '26px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{t.analytic.monthlyTrend}</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {t.analytic.aggregatedExpDesc}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedYear((prev) => (prev === 'FY 2026' ? 'FY 2025' : 'FY 2026'));
                soundFx.playClick();
              }}
              className="liquid-badge liquid-badge-cyan"
              style={{
                cursor: 'pointer',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '8px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s ease',
              }}
              title="Click to toggle Fiscal Year"
            >
              {selectedYear} ▾
            </button>
          </div>

          <div
            style={{
              height: '240px',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: '18px',
              padding: '0 10px 10px 10px',
              borderBottom: '1px solid var(--glass-border)',
            }}
          >
            {monthlyData.map((m) => {
              const heightPct = Math.round((m.amount / maxMonthAmount) * 100);
              const isSelected = selectedMonth === m.month;
              const isHovered = hoveredMonth === m.month;

              return (
                <div
                  key={m.month}
                  onClick={() => {
                    setSelectedMonth(m.month);
                    soundFx.playClick();
                  }}
                  onMouseEnter={() => setHoveredMonth(m.month)}
                  onMouseLeave={() => setHoveredMonth(null)}
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
                    transform: isSelected ? 'translateY(-4px)' : isHovered ? 'translateY(-2px)' : 'none',
                    transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                  title={`Click to view ${m.month} details`}
                >
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-mono)',
                      color: isSelected ? '#00f2fe' : isHovered ? 'var(--text-primary)' : 'var(--text-secondary)',
                      marginBottom: '8px',
                      fontWeight: isSelected ? 800 : 600,
                      transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {formatCurrency(m.amount)}
                  </div>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '56px',
                      height: `${heightPct}%`,
                      background: isSelected
                        ? 'linear-gradient(180deg, #00f2fe 0%, #a855f7 100%)'
                        : isHovered
                        ? 'linear-gradient(180deg, rgba(0, 242, 254, 0.45) 0%, rgba(255, 255, 255, 0.2) 100%)'
                        : 'linear-gradient(180deg, var(--glass-border-bright) 0%, var(--glass-border) 100%)',
                      borderRadius: '8px 8px 3px 3px',
                      boxShadow: isSelected
                        ? '0 0 24px rgba(0, 242, 254, 0.55), 0 4px 12px rgba(168, 85, 247, 0.35)'
                        : isHovered
                        ? '0 0 14px rgba(0, 242, 254, 0.3)'
                        : 'none',
                      border: isSelected
                        ? '1px solid rgba(255, 255, 255, 0.5)'
                        : isHovered
                        ? '1px solid rgba(0, 242, 254, 0.4)'
                        : '1px solid transparent',
                      transition: 'height 0.6s ease, background 0.2s ease, box-shadow 0.2s ease, border 0.2s ease',
                    }}
                  />
                  <div
                    style={{
                      marginTop: '10px',
                      fontSize: '0.82rem',
                      fontWeight: isSelected ? 800 : 600,
                      color: isSelected ? 'var(--cyan-glow)' : isHovered ? 'var(--text-primary)' : 'var(--text-muted)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
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
                          background: '#00f2fe',
                          boxShadow: '0 0 6px #00f2fe',
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Selected Month Summary Pill */}
          {activeMonthItem && (
            <div
              style={{
                marginTop: '18px',
                padding: '12px 18px',
                borderRadius: '14px',
                background: 'rgba(0, 242, 254, 0.07)',
                border: '1px solid rgba(0, 242, 254, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#00f2fe',
                    boxShadow: '0 0 8px #00f2fe',
                  }}
                />
                <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {activeMonthItem.month} ({selectedYear})
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Expenses: </span>
                  <span style={{ fontSize: '0.92rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#00f2fe' }}>
                    {formatCurrency(activeMonthItem.amount)}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Est. Tax: </span>
                  <span style={{ fontSize: '0.92rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#10b981' }}>
                    {formatCurrency(activeMonthItem.amount * 0.12)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Category Share SVG Ring Donut */}
        <div className="glass-panel" style={{ padding: '26px' }}>
          <div style={{ marginBottom: '18px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{t.analytic.categoryShare}</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {t.analytic.proportionalDesc}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '16px' }}>
            {/* SVG Donut Ring */}
            <div style={{ position: 'relative', width: '160px', height: '160px' }}>
              <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="var(--glass-border)" strokeWidth="12" />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#00f2fe"
                  strokeWidth="12"
                  strokeDasharray="238.7"
                  strokeDashoffset="100"
                  filter="drop-shadow(0 0 6px #00f2fe)"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#a855f7"
                  strokeWidth="12"
                  strokeDasharray="238.7"
                  strokeDashoffset="180"
                  filter="drop-shadow(0 0 6px #a855f7)"
                />
              </svg>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>CATEGORIES</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{categoryList.length}</div>
              </div>
            </div>
          </div>

          {/* Category List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {categoryList.map(([cat, val], idx) => {
              const colors = ['#00f2fe', '#a855f7', '#10b981', '#f59e0b', '#ec4899'];
              const col = colors[idx % colors.length];
              const pct = totalSpend > 0 ? Math.round((val / totalSpend) * 100) : 0;

              return (
                <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: col, boxShadow: `0 0 6px ${col}` }} />
                    <span>{t.categories[cat] || cat}</span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {formatCurrency(val)} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
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
        {/* Top Vendors */}
        <div className="glass-panel" style={{ padding: '26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <Building size={18} color="#00f2fe" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{t.analytic.topVendors}</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {topMerchants.map(([merchant, val], idx) => (
              <div
                key={merchant}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--glass-border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      background: 'var(--cyan-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--cyan-glow)',
                    }}
                  >
                    #{idx + 1}
                  </div>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{merchant}</span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#38bdf8' }}>
                  {formatCurrency(val)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
