import React from 'react';
import { useApp } from '../context/AppContext';
import { TiltCard } from '../components/TiltCard';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  ShieldCheck,
  Building,
  Sparkles,
  AlertCircle,
  Lightbulb,
  Receipt,
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

  // Monthly Simulation Bars
  const monthlyData = [
    { month: 'Apr', amount: totalSpend * 0.55 },
    { month: 'May', amount: totalSpend * 0.72 },
    { month: 'Jun', amount: totalSpend * 0.64 },
    { month: 'Jul', amount: totalSpend * 0.88 },
    { month: 'Aug', amount: totalSpend },
  ];
  const maxMonthAmount = Math.max(...monthlyData.map((m) => m.amount), 1);

  return (
    <div className="view-page" style={{ width: '100%', padding: '0 0 40px 0' }}>
      {/* Title Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <span className="liquid-badge liquid-badge-emerald">
            <BarChart3 size={13} /> {t.analytic.title}
          </span>
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Predictive Fiscal Analytics
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
              Taxable Net Subtotal
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
              {formatCurrency(totalSubtotal)}
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '8px' }}>
              Pre-tax business expense baseline
            </div>
          </div>
        </TiltCard>

        <TiltCard>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              12% Input VAT Deductible
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
              {formatCurrency(totalVat)}
            </div>
            <div style={{ fontSize: '0.76rem', color: '#34d399', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={14} /> Tax credit eligible for BIR Form 2550Q
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
                Aggregated expenditures per billing cycle
              </span>
            </div>
            <span className="liquid-badge liquid-badge-cyan">FY 2026</span>
          </div>

          <div
            style={{
              height: '240px',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: '18px',
              padding: '0 10px 10px 10px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {monthlyData.map((m, idx) => {
              const heightPct = Math.round((m.amount / maxMonthAmount) * 100);
              const isLatest = idx === monthlyData.length - 1;

              return (
                <div
                  key={m.month}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    height: '100%',
                    justifyContent: 'flex-end',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-mono)',
                      color: isLatest ? '#00f2fe' : 'var(--text-secondary)',
                      marginBottom: '8px',
                      fontWeight: 600,
                    }}
                  >
                    {formatCurrency(m.amount)}
                  </div>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '56px',
                      height: `${heightPct}%`,
                      background: isLatest
                        ? 'linear-gradient(180deg, #00f2fe 0%, #a855f7 100%)'
                        : 'linear-gradient(180deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.05) 100%)',
                      borderRadius: '8px 8px 3px 3px',
                      boxShadow: isLatest ? '0 0 20px rgba(0, 242, 254, 0.45)' : 'none',
                      transition: 'height 0.6s ease',
                    }}
                  />
                  <div style={{ marginTop: '10px', fontSize: '0.8rem', fontWeight: 600, color: isLatest ? '#ffffff' : 'var(--text-muted)' }}>
                    {m.month}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Share SVG Ring Donut */}
        <div className="glass-panel" style={{ padding: '26px' }}>
          <div style={{ marginBottom: '18px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{t.analytic.categoryShare}</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Proportional expense distribution
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '16px' }}>
            {/* SVG Donut Ring */}
            <div style={{ position: 'relative', width: '160px', height: '160px' }}>
              <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
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
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>{categoryList.length}</div>
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

      {/* Bottom Row: Top Vendors & AI Insights */}
      <div
        className="analytic-bottom-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
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
                  background: 'rgba(10, 15, 30, 0.4)',
                  border: '1px solid var(--glass-border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#00f2fe',
                    }}
                  >
                    #{idx + 1}
                  </div>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#ffffff' }}>{merchant}</span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#38bdf8' }}>
                  {formatCurrency(val)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Financial Insights */}
        <div className="glass-panel" style={{ padding: '26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <Lightbulb size={18} color="#fbbf24" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{t.analytic.insights}</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div
              style={{
                padding: '14px',
                borderRadius: '12px',
                background: 'rgba(0, 242, 254, 0.06)',
                border: '1px solid rgba(0, 242, 254, 0.2)',
                display: 'flex',
                gap: '12px',
              }}
            >
              <Sparkles size={20} color="#00f2fe" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                {t.analytic.insight1}
              </div>
            </div>

            <div
              style={{
                padding: '14px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.06)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                display: 'flex',
                gap: '12px',
              }}
            >
              <ShieldCheck size={20} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                {t.analytic.insight2}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
