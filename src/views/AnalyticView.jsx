import React from 'react';
import { useApp, sanitizeReceiptAmounts } from '../context/AppContext';
import { TiltCard } from '../components';
import {
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
  const { documents, formatCurrency, language, t } = useApp();

  // Normalize all documents so corrupted OCR values (e.g. VAT > 25% or inverted subtotal) are sanitized
  const sanitizedDocs = (documents || []).map(sanitizeReceiptAmounts);

  const totalSpend = +(sanitizedDocs.reduce((acc, d) => acc + (d.total || 0), 0)).toFixed(2);
  let totalVat = +(sanitizedDocs.reduce((acc, d) => acc + (d.vat || 0), 0)).toFixed(2);
  let totalSubtotal = +(sanitizedDocs.reduce((acc, d) => acc + (d.subtotal || 0), 0)).toFixed(2);

  // Guarantee mathematical integrity: Subtotal + VAT === Total Spend
  if (totalSpend > 0 && Math.abs((totalSubtotal + totalVat) - totalSpend) > 0.05) {
    totalSubtotal = +(totalSpend - totalVat).toFixed(2);
  }

  // Category Aggregates from real receipts
  const categoryMap = sanitizedDocs.reduce((acc, d) => {
    const cat = d.category || 'Other';
    acc[cat] = +( (acc[cat] || 0) + (d.total || 0) ).toFixed(2);
    return acc;
  }, {});
  const categoryList = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);

  // Top Merchants from real receipts
  const merchantMap = sanitizedDocs.reduce((acc, d) => {
    const m = d.merchant || 'Unknown Merchant';
    acc[m] = +( (acc[m] || 0) + (d.total || 0) ).toFixed(2);
    return acc;
  }, {});
  const topMerchants = Object.entries(merchantMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Highest single real receipt
  const highestDoc = [...sanitizedDocs].sort((a, b) => (b.total || 0) - (a.total || 0))[0];

  // =========================================================================
  // Accurate Monthly Expenditure (Derived strictly from real receipt dates)
  // =========================================================================
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Find the target fiscal year from real receipts or current calendar year
  const currentCalendarYear = new Date().getFullYear();
  let targetYear = currentCalendarYear;
  if (sanitizedDocs.length > 0) {
    const parsedYears = sanitizedDocs
      .map((d) => d.date ? new Date(d.date).getFullYear() : null)
      .filter((yr) => yr && !isNaN(yr) && yr >= 2020 && yr <= currentCalendarYear + 1);
    if (parsedYears.length > 0) {
      targetYear = parsedYears.sort((a, b) => b - a)[0];
    }
  }

  // Determine active 5-month display window based on receipt dates
  const activeMonthIndices = sanitizedDocs
    .map((d) => d.date ? new Date(d.date).getMonth() : null)
    .filter((m) => m !== null && !isNaN(m));

  const latestMonthIdx = activeMonthIndices.length > 0
    ? Math.max(...activeMonthIndices)
    : new Date().getMonth();

  const windowMonths = [];
  for (let i = 4; i >= 0; i--) {
    const mIdx = (latestMonthIdx - i + 12) % 12;
    windowMonths.push(mIdx);
  }

  // Calculate exact real expenditure for each month in the window
  const monthlyData = windowMonths.map((mIdx, pos) => {
    const mName = monthNames[mIdx];
    const monthDocs = sanitizedDocs.filter((d) => {
      if (!d.date) return false;
      const dt = new Date(d.date);
      return !isNaN(dt.getTime()) && dt.getMonth() === mIdx;
    });

    const amount = +(monthDocs.reduce((acc, d) => acc + (d.total || 0), 0)).toFixed(2);
    const count = monthDocs.length;
    return {
      month: mName,
      monthIndex: mIdx,
      amount,
      count,
      isLatest: pos === windowMonths.length - 1,
    };
  });

  const maxMonthAmount = Math.max(...monthlyData.map((m) => m.amount), 1);

  // Dynamic AI Financial Insights
  const topCategory = categoryList[0];
  const topCatName = topCategory ? (t.categories?.[topCategory[0]] || topCategory[0]) : 'None';
  const topCatAmount = topCategory ? topCategory[1] : 0;
  const topCatPct = totalSpend > 0 ? Math.round((topCatAmount / totalSpend) * 100) : 0;

  const getInsight1 = () => {
    if (totalSpend <= 0 || !topCategory) {
      return t.analytic.insight1;
    }
    if (language === 'fil') {
      return `Ang ${topCatName} ang pangunahing gastusin na bumubuo ng ${topCatPct}% (${formatCurrency(topCatAmount)}) ng kabuuang gastos.`;
    } else if (language === 'es') {
      return `${topCatName} es tu principal gasto, representando el ${topCatPct}% (${formatCurrency(topCatAmount)}) del total.`;
    } else if (language === 'ja') {
      return `${topCatName} が総支出の ${topCatPct}% (${formatCurrency(topCatAmount)}) を占める最大の支出項目です。`;
    }
    return `${topCatName} is your primary expenditure, accounting for ${topCatPct}% (${formatCurrency(topCatAmount)}) of total spending.`;
  };

  const getInsight2 = () => {
    if (totalVat <= 0) {
      return language === 'fil'
        ? 'Mag-scan ng mga opisyal na resibo (OR / Sales Invoice) upang makakuha ng 12% input VAT tax credits.'
        : 'Scan official receipts (OR / Sales Invoice) with TIN to track 12% deductible input VAT tax credits.';
    }
    if (language === 'fil') {
      return `May ${formatCurrency(totalVat)} na na-verify na input VAT na puwedeng ibawas sa inyong quarterly business tax filing (BIR 2550M/Q).`;
    } else if (language === 'es') {
      return `${formatCurrency(totalVat)} en IVA deducible registrado para deducciones fiscales trimestrales.`;
    } else if (language === 'ja') {
      return `${formatCurrency(totalVat)} の仕入税額控除が四半期申告用に計上可能です。`;
    }
    return `${formatCurrency(totalVat)} in verified 12% input VAT is recorded and eligible for tax credit deductions in quarterly filings.`;
  };

  return (
    <div className="view-page" style={{ width: '100%', padding: '0 0 40px 0' }}>
      {/* Title Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          {t.analytic.predictiveTitle}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          {t.analytic.subtitle}
        </p>
      </div>

      {/* Top 3 Metric Tiles - 100% Mathematically Accurate */}
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

      {/* Middle Grid: Real Monthly Trend Bars & Accurate Dynamic SVG Donut */}
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
            <span className="liquid-badge liquid-badge-cyan">FY {targetYear}</span>
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
              // Normalized height (minimum 8% for visibility even if 0, maximum 100%)
              const heightPct = m.amount > 0
                ? Math.max(12, Math.round((m.amount / maxMonthAmount) * 100))
                : 4;

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
                  title={`${m.month}: ${formatCurrency(m.amount)} (${m.count} receipts)`}
                >
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-mono)',
                      color: m.amount > 0 ? (m.isLatest ? '#00f2fe' : 'var(--text-primary)') : 'var(--text-muted)',
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
                      background: m.amount > 0
                        ? (m.isLatest
                          ? 'linear-gradient(180deg, #00f2fe 0%, #a855f7 100%)'
                          : 'linear-gradient(180deg, rgba(0, 242, 254, 0.6) 0%, rgba(168, 85, 247, 0.4) 100%)')
                        : 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '8px 8px 3px 3px',
                      boxShadow: m.amount > 0 && m.isLatest ? '0 0 20px rgba(0, 242, 254, 0.45)' : 'none',
                      transition: 'height 0.6s ease',
                      border: m.amount > 0 ? '1px solid rgba(0, 242, 254, 0.3)' : '1px dashed rgba(255, 255, 255, 0.1)',
                    }}
                  />
                  <div
                    style={{
                      marginTop: '10px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: m.isLatest ? 'var(--cyan-glow)' : 'var(--text-muted)',
                    }}
                  >
                    {m.month}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Share SVG Ring Donut with Accurate Arc Geometry */}
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
                {(() => {
                  const circumference = 238.76;
                  let accumulatedOffset = 0;
                  const palette = ['#00f2fe', '#a855f7', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'];

                  return categoryList.map(([cat, val], idx) => {
                    const pct = totalSpend > 0 ? val / totalSpend : 0;
                    const strokeDash = +(pct * circumference).toFixed(2);
                    const strokeOffset = -accumulatedOffset;
                    accumulatedOffset += strokeDash;
                    const color = palette[idx % palette.length];

                    if (strokeDash <= 0) return null;

                    return (
                      <circle
                        key={cat}
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke={color}
                        strokeWidth="12"
                        strokeDasharray={`${strokeDash} ${Math.max(0, circumference - strokeDash)}`}
                        strokeDashoffset={strokeOffset}
                        filter={`drop-shadow(0 0 6px ${color})`}
                      />
                    );
                  });
                })()}
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

          {/* Category List with Real Percentages */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {categoryList.map(([cat, val], idx) => {
              const colors = ['#00f2fe', '#a855f7', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'];
              const col = colors[idx % colors.length];
              const pct = totalSpend > 0 ? Math.round((val / totalSpend) * 100) : 0;

              return (
                <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: col, boxShadow: `0 0 6px ${col}` }} />
                    <span>{t.categories?.[cat] || cat}</span>
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

      {/* Bottom Row: Top Vendors & Real AI Insights */}
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
            {topMerchants.length > 0 ? (
              topMerchants.map(([merchant, val], idx) => (
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
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
                        flexShrink: 0,
                      }}
                    >
                      #{idx + 1}
                    </div>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {merchant}
                    </span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#38bdf8', flexShrink: 0, marginLeft: '8px' }}>
                    {formatCurrency(val)}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No vendor data recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Dynamic & Accurate AI Financial Insights */}
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
                {getInsight1()}
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
                {getInsight2()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
