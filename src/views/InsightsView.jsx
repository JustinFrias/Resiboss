import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  TrendingUp, TrendingDown, Calendar, ChevronRight,
  ShoppingBag, Repeat, BarChart3, Info, ScanLine,
  ArrowUpRight, ArrowDownRight, Minus,
} from 'lucide-react';
import {
  getMonthOverMonthSpend,
  getCategorySpending,
  getPurchasePatterns,
  getStoreFrequency,
  getItemPriceHistory,
} from '../utils/spendingIntelligence';

const CATEGORY_COLORS = {
  Food: '#f59e0b', Groceries: '#10b981', Shopping: '#8b5cf6',
  Transportation: '#3b82f6', Health: '#ef4444', Entertainment: '#ec4899',
  Utilities: '#06b6d4', Education: '#6366f1', Other: '#94a3b8',
};
const getCatColor = (cat) => CATEGORY_COLORS[cat] || '#94a3b8';

const fmtDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
  } catch { return dateStr; }
};

export const InsightsView = () => {
  const { documents, formatCurrency, setActiveTab, theme, soundFx } = useApp();
  const isLight = theme === 'light';

  const [selectedItem, setSelectedItem] = useState(null);

  const mom = useMemo(() => getMonthOverMonthSpend(documents), [documents]);
  const categories = useMemo(() => getCategorySpending(documents), [documents]);
  const patterns = useMemo(() => getPurchasePatterns(documents), [documents]);
  const stores = useMemo(() => getStoreFrequency(documents).slice(0, 5), [documents]);
  const itemPriceHistory = useMemo(() => getItemPriceHistory(documents), [documents]);
  const trackedItems = useMemo(() => Object.entries(itemPriceHistory).slice(0, 10), [itemPriceHistory]);

  const totalSpend = documents.reduce((s, d) => s + (Number(d.total) || 0), 0);

  const isUp = mom.delta > 0;
  const isFlat = mom.delta === 0 || mom.previous === 0;

  if (documents.length < 2) {
    return (
      <div style={{ padding: '0 0 100px' }}>
        <div className="rb-page-header">
          <h1 className="rb-page-title">Insights</h1>
          <p className="rb-page-subtitle">Your spending patterns will appear here.</p>
        </div>
        <div style={{ padding: '0 20px' }}>
          <div className="rb-empty" style={{ paddingTop: 60 }}>
            <div className="rb-empty-icon">📊</div>
            <div className="rb-empty-title">Not enough data yet</div>
            <p className="rb-empty-body">
              Scan a few more receipts and Resiboss will start identifying your spending patterns.
            </p>
            <button onClick={() => { soundFx?.playClick?.(); setActiveTab('scanner'); }} className="rb-btn rb-btn-primary" style={{ marginTop: 8 }}>
              <ScanLine size={15} /> Scan a Receipt
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 0 100px', display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div className="rb-page-header">
        <h1 className="rb-page-title">Insights</h1>
        <p className="rb-page-subtitle">Based on your {documents.length} saved receipts.</p>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ── MONTH-OVER-MONTH ── */}
        <div className="rb-card" style={{ padding: '20px 20px' }}>
          <div className="rb-label" style={{ marginBottom: 10 }}>Month vs Last Month</div>
          <div style={{ display: 'flex', gap: 20 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>This Month</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
                {formatCurrency(mom.current)}
              </div>
            </div>
            {mom.previous > 0 && (
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>Last Month</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}>
                  {formatCurrency(mom.previous)}
                </div>
              </div>
            )}
          </div>

          {mom.previous > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--glass-border)' }}>
              {isFlat ? <Minus size={15} color="var(--text-muted)" />
                : isUp ? <ArrowUpRight size={15} color="#f59e0b" />
                : <ArrowDownRight size={15} color="var(--emerald-glow)" />}
              <span style={{ fontSize: 14, fontWeight: 700, color: isFlat ? 'var(--text-muted)' : isUp ? '#f59e0b' : 'var(--emerald-glow)' }}>
                {isFlat ? 'Same as last month'
                  : `${isUp ? '+' : ''}${mom.deltaPercent}% compared to last month`}
              </span>
            </div>
          )}
        </div>

        {/* ── CATEGORY BREAKDOWN ── */}
        {categories.length > 0 && (
          <div className="rb-card" style={{ padding: '18px 20px' }}>
            <div className="rb-label" style={{ marginBottom: 14 }}>Spending by Category</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {categories.slice(0, 6).map(({ category, total, count }) => {
                const pct = totalSpend > 0 ? (total / totalSpend) * 100 : 0;
                const color = getCatColor(category);
                return (
                  <div key={category}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 9, height: 9, borderRadius: '50%', background: color, flexShrink: 0 }} />
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{category}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{count} receipt{count !== 1 ? 's' : ''}</span>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                        {formatCurrency(total)}
                      </span>
                    </div>
                    <div className="rb-progress">
                      <div className="rb-progress-fill" style={{ width: `${Math.max(pct, 3)}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── PURCHASE PATTERNS ── */}
        {patterns.length > 0 && (
          <div className="rb-card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div className="rb-label">Purchase Patterns</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Info size={11} /> Based on your history
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {patterns.slice(0, 4).map((p) => (
                <div key={p.name} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 14px', borderRadius: 12,
                  background: p.isOverdue ? 'rgba(245,158,11,0.06)' : 'var(--bg-surface)',
                  border: `1px solid ${p.isOverdue ? 'rgba(245,158,11,0.2)' : 'var(--glass-border)'}`,
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                      {p.displayName}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      Usually every {p.avgIntervalDays} days · {p.count} purchases
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      display: 'inline-block', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                      background: p.isOverdue ? 'rgba(245,158,11,0.12)' : p.daysUntilNext <= 3 ? 'rgba(0,242,254,0.1)' : 'var(--bg-surface)',
                      color: p.isOverdue ? '#f59e0b' : p.daysUntilNext <= 3 ? 'var(--cyan-glow)' : 'var(--text-muted)',
                      border: `1px solid ${p.isOverdue ? 'rgba(245,158,11,0.25)' : 'var(--glass-border)'}`,
                    }}>
                      {p.isOverdue ? `${Math.abs(p.daysUntilNext)}d overdue`
                        : p.daysUntilNext === 0 ? 'Today'
                        : `In ${p.daysUntilNext}d`}
                    </span>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      avg {formatCurrency(p.avgAmount)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── FREQUENT STORES ── */}
        {stores.length > 0 && (
          <div className="rb-card" style={{ padding: '18px 20px' }}>
            <div className="rb-label" style={{ marginBottom: 14 }}>Where You Shop Most</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stores.map((store, i) => (
                <div key={store.merchant} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: 'var(--bg-surface)', border: '1px solid var(--glass-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 900, color: 'var(--text-muted)',
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {store.merchant}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {store.count} visit{store.count !== 1 ? 's' : ''} · avg {formatCurrency(store.avgTotal)}
                    </div>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)', flexShrink: 0 }}>
                    {formatCurrency(store.totalSpend)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ITEM PRICE HISTORY ── */}
        {trackedItems.length > 0 && (
          <div className="rb-card" style={{ padding: '18px 20px' }}>
            <div className="rb-label" style={{ marginBottom: 14 }}>Price History</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {trackedItems.slice(0, 6).map(([itemName, history]) => {
                const sorted = [...history].sort((a, b) => new Date(b.date) - new Date(a.date));
                const latest = sorted[0];
                const prev = sorted[1];
                const priceDelta = prev ? latest.price - prev.price : 0;
                return (
                  <button key={itemName}
                    onClick={() => { soundFx?.playClick?.(); setSelectedItem(selectedItem === itemName ? null : itemName); }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '11px 14px', borderRadius: 10, border: '1px solid var(--glass-border)',
                      background: selectedItem === itemName ? 'var(--cyan-subtle)' : 'transparent',
                      cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'all 0.15s ease',
                    }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {itemName}
                      </div>
                      {selectedItem === itemName && sorted.length > 0 && (
                        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {sorted.slice(0, 5).map((h, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
                              <span>{h.merchant} · {fmtDate(h.date)}</span>
                              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(h.price)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                        {formatCurrency(latest.price)}
                      </div>
                      {prev && (
                        <div style={{ fontSize: 11, fontWeight: 700, color: priceDelta > 0 ? '#f59e0b' : 'var(--emerald-glow)', display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'flex-end' }}>
                          {priceDelta > 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                          {priceDelta > 0 ? '+' : ''}{formatCurrency(priceDelta)}
                        </div>
                      )}
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{history.length} records</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── SCAN CTA ── */}
        <button
          onClick={() => { soundFx?.playClick?.(); setActiveTab('scanner'); }}
          className="rb-btn rb-btn-primary rb-btn-lg"
          style={{ marginTop: 4 }}
        >
          <ScanLine size={18} /> Scan Another Receipt
        </button>

      </div>
    </div>
  );
};
