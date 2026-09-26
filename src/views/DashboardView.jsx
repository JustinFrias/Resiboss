import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TiltCard } from '../components';
import {
  Wallet,
  Receipt,
  TrendingUp,
  ChevronRight,
  ShieldCheck,
  Clock,
  Eye,
  Calendar,
  ChevronDown,
  Check,
  FileText,
  ScanLine,
  Sparkles,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  Repeat,
  MessageSquare,
  Camera,
} from 'lucide-react';
import {
  getMonthOverMonthSpend,
  getCategorySpending,
  getPurchasePatterns,
} from '../utils/spendingIntelligence';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const formatCompact = (val) => {
  if (!val && val !== 0) return '₱0';
  if (val >= 1_000_000) return `₱${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `₱${(val / 1_000).toFixed(1)}K`;
  return `₱${Number(val).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const CATEGORY_COLORS = {
  Food: '#f59e0b', Groceries: '#10b981', Shopping: '#8b5cf6',
  Transportation: '#3b82f6', Health: '#ef4444', Entertainment: '#ec4899',
  Utilities: '#06b6d4', Education: '#6366f1', Other: '#94a3b8',
};
const getCatColor = (cat) => CATEGORY_COLORS[cat] || '#94a3b8';

// ─────────────────────────────────────────────────────────────────────────────
// MAIN VIEW
// ─────────────────────────────────────────────────────────────────────────────
export const DashboardView = () => {
  const { documents, setActiveTab, setInspectingDoc, formatCurrency, t, theme, soundFx, userProfile } = useApp();
  const isLight = theme === 'light';

  const [timeRange, setTimeRange] = useState('month');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [hoveredDayIdx, setHoveredDayIdx] = useState(null);
  const filterRef = useRef(null);

  // Close filter on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setIsFilterOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, []);

  // Filtered documents
  const filteredDocs = useMemo(() => {
    if (timeRange === 'all') return documents;
    const now = new Date();
    if (timeRange === 'month') {
      const ym = now.toISOString().slice(0, 7);
      return documents.filter((d) => d.date && String(d.date).startsWith(ym));
    }
    if (timeRange === '30days') {
      const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return documents.filter((d) => d.date && new Date(d.date) >= past);
    }
    if (timeRange === 'year') {
      return documents.filter((d) => d.date && String(d.date).startsWith(String(now.getFullYear())));
    }
    return documents;
  }, [documents, timeRange]);

  const totalAmount = filteredDocs.reduce((s, d) => s + (Number(d.total) || 0), 0);
  const docCount = filteredDocs.length;

  // Month-over-month
  const mom = useMemo(() => getMonthOverMonthSpend(documents), [documents]);

  // Category data (top 4)
  const categories = useMemo(() => getCategorySpending(filteredDocs).slice(0, 4), [filteredDocs]);

  // Purchase patterns (due soon)
  const dueSoonPatterns = useMemo(
    () => getPurchasePatterns(documents).filter((p) => p.daysUntilNext <= 7 || p.isOverdue).slice(0, 2),
    [documents]
  );

  // 14-day daily history
  const dailyHistory = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dayDocs = documents.filter((doc) => doc.date && String(doc.date).slice(0, 10) === dateStr);
      days.push({
        dateStr,
        dayNum: d.getDate(),
        monthShort: d.toLocaleDateString('en-US', { month: 'short' }),
        total: dayDocs.reduce((s, doc) => s + (Number(doc.total) || 0), 0),
        count: dayDocs.length,
        isToday: i === 0,
      });
    }
    return days;
  }, [documents]);

  const maxDaily = Math.max(...dailyHistory.map((d) => d.total), 1);

  // Recent receipts (last 4)
  const recentDocs = useMemo(
    () => [...documents].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 4),
    [documents]
  );

  const cardStyle = {
    borderRadius: 'var(--radius-xl)',
    background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.72)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: isLight ? '1px solid rgba(203,213,225,0.8)' : '1px solid rgba(148, 163, 184, 0.12)',
    boxShadow: isLight ? '0 4px 20px rgba(15,23,42,0.05)' : '0 8px 28px rgba(0,0,0,0.5)',
  };

  const navigateTo = (tab) => {
    soundFx?.playClick?.();
    setActiveTab(tab);
  };

  const firstName = userProfile?.firstName || '';

  return (
    <div style={{ padding: '0 0 100px', display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── GREETING HEADER ── */}
      <div style={{ padding: '6px 20px 0' }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', margin: 0, letterSpacing: '-0.02em' }}>
          {getGreeting()} {firstName ? `${firstName} ` : ''}👋
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>
          Here's what Resiboss noticed about your spending.
        </p>
      </div>

      {/* ── MONTHLY SPEND HERO CARD ── */}
      <div style={{ padding: '0 20px' }}>
        <div style={{ ...cardStyle, padding: '22px 24px' }}>
          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                {timeRange === 'month' ? 'THIS MONTH' : timeRange === '30days' ? 'LAST 30 DAYS' : timeRange === 'year' ? 'THIS YEAR' : 'ALL TIME'}
              </div>
              <div style={{ fontSize: 36, fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {formatCompact(totalAmount)}
              </div>
            </div>

            {/* Time filter */}
            <div ref={filterRef} style={{ position: 'relative' }}>
              <button
                onClick={() => { setIsFilterOpen(!isFilterOpen); soundFx?.playClick?.(); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 12px', borderRadius: 12,
                  background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.06)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >
                <Calendar size={13} />
                <ChevronDown size={12} />
              </button>
              {isFilterOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 50,
                  background: isLight ? '#fff' : 'rgba(15,23,42,0.96)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid var(--glass-border)', borderRadius: 12,
                  padding: 6, minWidth: 140,
                  boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
                }}>
                  {[{ id: 'month', label: 'This Month' }, { id: '30days', label: 'Last 30 Days' }, { id: 'year', label: 'This Year' }, { id: 'all', label: 'All Time' }].map((opt) => (
                    <button key={opt.id} onClick={() => { setTimeRange(opt.id); setIsFilterOpen(false); soundFx?.playClick?.(); }}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        width: '100%', padding: '8px 12px', borderRadius: 9, border: 'none',
                        background: timeRange === opt.id ? 'var(--primary-subtle)' : 'transparent',
                        color: timeRange === opt.id ? '#818CF8' : 'var(--text-primary)',
                        fontSize: 13, fontWeight: timeRange === opt.id ? 700 : 500, cursor: 'pointer',
                      }}
                    >
                      {opt.label}
                      {timeRange === opt.id && <Check size={13} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* MoM delta */}
          {mom.previous > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
              {mom.delta > 0
                ? <ArrowUpRight size={15} color="#FBBF24" />
                : <ArrowDownRight size={15} color="var(--emerald-glow)" />}
              <span style={{
                fontSize: 13, fontWeight: 700,
                color: mom.delta > 0 ? '#FBBF24' : 'var(--emerald-glow)',
              }}>
                {mom.delta > 0 ? '+' : ''}{mom.deltaPercent}% vs last month
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>({formatCurrency(mom.previous)})</span>
            </div>
          )}

          {/* 14-day mini bar chart */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 48 }}>
            {dailyHistory.map((day, i) => {
              const pct = maxDaily > 0 ? (day.total / maxDaily) * 100 : 0;
              const h = day.total > 0 ? Math.max(pct, 8) : 4;
              const isH = hoveredDayIdx === i;
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', position: 'relative' }}
                  onMouseEnter={() => setHoveredDayIdx(i)} onMouseLeave={() => setHoveredDayIdx(null)}>
                  {isH && day.total > 0 && (
                    <div style={{
                      position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)',
                      background: 'rgba(15,23,42,0.95)', color: '#fff',
                      padding: '4px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                      whiteSpace: 'nowrap', border: '1px solid rgba(0,242,254,0.4)', zIndex: 10,
                    }}>
                      {day.monthShort} {day.dayNum}: {formatCurrency(day.total)}
                    </div>
                  )}
                  <div style={{
                    width: '100%', height: `${h}%`, minHeight: 3, borderRadius: '2px 2px 0 0',
                    background: day.total > 0
                      ? (day.isToday ? '#38BDF8' : isLight ? 'rgba(99,102,241,0.65)' : 'rgba(56,189,248,0.55)')
                      : 'var(--track-bg)',
                    transition: 'height 0.4s ease',
                    boxShadow: isH && day.total > 0 ? '0 0 8px rgba(56,189,248,0.5)' : 'none',
                  }} />
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: 'var(--text-muted)' }}>
            <span>{dailyHistory[0]?.monthShort} {dailyHistory[0]?.dayNum}</span>
            <span style={{ color: '#38BDF8', fontWeight: 700 }}>Today</span>
          </div>

          {/* Stat row */}
          <div style={{ display: 'flex', gap: 16, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--glass-border)' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Receipts</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>{docCount}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Avg / receipt</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
                {docCount > 0 ? formatCurrency(totalAmount / docCount) : '—'}
              </div>
            </div>
            {categories[0] && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Top Category</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: getCatColor(categories[0].category) }}>{categories[0].category}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── ✦ RESIBOSS INTELLIGENCE CARD ── */}
      <div style={{ padding: '0 20px' }}>
        <div style={{
          ...cardStyle, padding: '18px 20px',
          background: isLight ? 'rgba(167, 139, 250, 0.08)' : 'rgba(167, 139, 250, 0.06)',
          border: '1px solid rgba(167, 139, 250, 0.25)',
          boxShadow: '0 4px 20px rgba(167, 139, 250, 0.12)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: 'rgba(167, 139, 250, 0.15)', border: '1px solid rgba(167, 139, 250, 0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Sparkles size={18} color="#A78BFA" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#A78BFA', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span>✦</span> RESIBOSS INTELLIGENCE
              </div>
              {documents.length === 0 ? (
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5, fontWeight: 500 }}>
                    Your intelligence layer is still learning. Keep scanning receipts and Resiboss will start recognizing your spending patterns.
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    Turn everyday receipts into smarter spending decisions
                  </div>
                </div>
              ) : mom.deltaPercent && Number(mom.deltaPercent) > 10 ? (
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5, fontWeight: 500 }}>
                    Your spending is higher than your usual monthly average.
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    Based on {documents.length} receipt{documents.length > 1 ? 's' : ''}
                  </div>
                </div>
              ) : categories[0] ? (
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5, fontWeight: 500 }}>
                    Your <strong>{categories[0].category}</strong> spending is higher than other categories this month.
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    Based on {documents.length} receipt{documents.length > 1 ? 's' : ''}
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5, fontWeight: 500 }}>
                    Resiboss noticed <strong>{documents.length}</strong> verified receipt{documents.length > 1 ? 's' : ''} saved in your memory.
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    Based on your history
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => navigateTo('insights')}
              title="View Insights"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A78BFA', padding: 4 }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* ── PURCHASE PATTERN CARD ── */}
      {dueSoonPatterns.length > 0 && (
        <div style={{ padding: '0 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Repeat size={12} color="#818CF8" />
            <span>PURCHASE PATTERN</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {dueSoonPatterns.map((p) => (
              <div key={p.name} style={{
                ...cardStyle, padding: '14px 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                border: `1px solid ${p.isOverdue ? 'rgba(251,191,36,0.35)' : 'var(--glass-border)'}`,
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{p.displayName}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    Every {p.avgIntervalDays} days · Based on {p.count || 'your'} purchases · Confidence: Medium
                  </div>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '4px 9px', borderRadius: 8,
                  background: p.isOverdue ? 'rgba(251,191,36,0.15)' : 'rgba(52,211,153,0.15)',
                  color: p.isOverdue ? '#FBBF24' : 'var(--emerald-glow)',
                }}>
                  {p.isOverdue ? `${Math.abs(p.daysUntilNext)}d overdue` : p.daysUntilNext === 0 ? 'Due Today' : `In ${p.daysUntilNext}d`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* ── CATEGORY MINI BARS ── */}
      {categories.length > 0 && (
        <div style={{ padding: '0 20px' }}>
          <div style={{ ...cardStyle, padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Spending by Category</div>
              <button onClick={() => navigateTo('insights')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cyan-glow)', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                See all <ChevronRight size={12} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {categories.map(({ category, total }) => {
                const pct = totalAmount > 0 ? (total / totalAmount) * 100 : 0;
                const color = getCatColor(category);
                return (
                  <div key={category}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{category}</span>
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 700 }}>{formatCurrency(total)}</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 5, background: 'var(--track-bg)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 5, width: `${Math.max(pct, 3)}%`, background: color, transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── QUICK ACTIONS ── */}
      <div style={{ padding: '0 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[
            { tab: 'shopping', icon: ShoppingCart, label: 'Shopping List', color: 'var(--violet-glow)' },
            { tab: 'insights', icon: TrendingUp, label: 'Insights', color: 'var(--cyan-glow)' },
            { tab: 'ask', icon: MessageSquare, label: 'Ask Resiboss', color: 'var(--emerald-glow)' },
          ].map(({ tab, icon: Icon, label, color }) => (
            <button key={tab} onClick={() => navigateTo(tab)} style={{
              padding: '14px 10px', borderRadius: 'var(--radius-lg)',
              background: isLight ? '#fff' : 'rgba(12,12,12,0.85)',
              border: '1px solid var(--glass-border)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              cursor: 'pointer', transition: 'all 0.15s ease',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = color; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
            >
              <Icon size={20} color={color} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'center' }}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── RECENT RECEIPTS ── */}
      <div style={{ padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Recent Receipts</div>
          <button onClick={() => navigateTo('documents')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cyan-glow)', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            View all <ChevronRight size={12} />
          </button>
        </div>

        {recentDocs.length === 0 ? (
          <div style={{ ...cardStyle, padding: '36px 20px', textAlign: 'center' }}>
            <Receipt size={36} color="#818CF8" style={{ marginBottom: 12, opacity: 0.6 }} />
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>No receipts yet</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18, maxWidth: 300, margin: '0 auto 18px' }}>
              Scan your first receipt and Resiboss will start building your purchase memory.
            </div>
            <button onClick={() => navigateTo('scanner')} style={{
              padding: '11px 26px', borderRadius: 12,
              background: 'linear-gradient(135deg, #818CF8 0%, #6366F1 55%, #4F46E5 100%)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              fontWeight: 700, fontSize: 13, cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)',
            }}>
              Scan Receipt
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentDocs.map((doc) => (
              <button key={doc.id} onClick={() => { soundFx?.playClick?.(); setInspectingDoc(doc); }}
                style={{
                  ...cardStyle, padding: '14px 16px', width: '100%', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = isLight ? 'rgba(203,213,225,0.8)' : 'rgba(148, 163, 184, 0.12)'; }}
              >
                <div style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Receipt size={18} color="#818CF8" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {doc.merchant || 'Store'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {doc.date || 'Today'} · <span style={{ color: getCatColor(doc.category) }}>{doc.category || 'General'}</span>
                  </div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)', flexShrink: 0, fontFamily: 'var(--font-mono)' }}>
                  {formatCurrency(doc.total)}
                </div>
                <Eye size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── SCAN CTA ── */}
      <div style={{ padding: '0 20px' }}>
        <button
          onClick={() => navigateTo('scanner')}
          style={{
            width: '100%', padding: '16px 24px',
            borderRadius: 'var(--radius-xl)',
            background: 'linear-gradient(135deg, #818CF8 0%, #6366F1 55%, #4F46E5 100%)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 12px 32px rgba(99, 102, 241, 0.55)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(99, 102, 241, 0.4)'; e.currentTarget.style.transform = 'none'; }}
        >
          <Camera size={20} color="#ffffff" strokeWidth={2.4} />
          <span style={{ fontSize: 16, fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}>
            + Scan Receipt
          </span>
        </button>
      </div>
    </div>
  );
};
