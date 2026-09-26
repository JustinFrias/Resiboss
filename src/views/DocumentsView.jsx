import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Search,
  Eye,
  Trash2,
  Receipt,
  Tag,
  Calendar,
  Grid,
  List,
  CheckCircle2,
  Clock,
  Download,
  Check,
  CheckSquare,
  Square,
  CloudOff,
  AlertCircle,
  X,
  ScanLine,
} from 'lucide-react';
import { soundFx } from '../utils/soundEffects';
import { downloadReceiptsExcel } from '../utils/fileDownloader';
import confetti from 'canvas-confetti';

const CATEGORY_COLORS = {
  Food: '#f59e0b', Groceries: '#10b981', Shopping: '#8b5cf6',
  Transportation: '#3b82f6', Health: '#ef4444', Entertainment: '#ec4899',
  Utilities: '#06b6d4', Education: '#6366f1', Other: '#94a3b8',
};
const getCatColor = (cat) => CATEGORY_COLORS[cat] || '#94a3b8';

const CATEGORIES = ['Food', 'Groceries', 'Shopping', 'Transportation', 'Health', 'Entertainment', 'Utilities', 'Education', 'Other'];

export const DocumentsView = () => {
  const { documents, setActiveTab, setInspectingDoc, deleteDocument, formatCurrency, t, theme, triggerManualSync } = useApp();
  const isLight = theme === 'light';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState(null);
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [sortBy, setSortBy] = useState('date-desc'); // date-desc, date-asc, amount-desc
  const [dateFilter, setDateFilter] = useState('ALL'); // ALL, THIS_MONTH, 30_DAYS, THIS_YEAR

  const filteredDocs = useMemo(() => {
    let result = [...documents];

    const q = searchQuery.toLowerCase().trim();
    if (q) {
      result = result.filter((doc) => {
        const matchBasic =
          (doc.merchant && doc.merchant.toLowerCase().includes(q)) ||
          (doc.id && doc.id.toLowerCase().includes(q)) ||
          (doc.date && String(doc.date).includes(q)) ||
          (doc.category && doc.category.toLowerCase().includes(q)) ||
          (doc.branch && doc.branch.toLowerCase().includes(q)) ||
          (doc.receiptNumber && String(doc.receiptNumber).toLowerCase().includes(q));

        if (matchBasic) return true;

        if (Array.isArray(doc.items)) {
          return doc.items.some((it) => it?.name && it.name.toLowerCase().includes(q));
        }
        return false;
      });
    }

    if (selectedCategory !== 'ALL') {
      result = result.filter((d) => d.category === selectedCategory);
    }

    if (dateFilter !== 'ALL') {
      const now = new Date();
      if (dateFilter === 'THIS_MONTH') {
        const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        result = result.filter((d) => d.date && String(d.date).startsWith(currentYM));
      } else if (dateFilter === '30_DAYS') {
        const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        result = result.filter((d) => d.date && new Date(d.date) >= past30);
      } else if (dateFilter === 'THIS_YEAR') {
        const currentY = String(now.getFullYear());
        result = result.filter((d) => d.date && String(d.date).startsWith(currentY));
      }
    }

    if (sortBy === 'date-desc') result.sort((a, b) => new Date(b.date) - new Date(a.date));
    else if (sortBy === 'date-asc') result.sort((a, b) => new Date(a.date) - new Date(b.date));
    else if (sortBy === 'amount-desc') result.sort((a, b) => (b.total || 0) - (a.total || 0));

    return result;
  }, [documents, searchQuery, selectedCategory, sortBy, dateFilter]);

  const handleToggleDoc = (docId, e) => {
    e?.stopPropagation?.();
    soundFx?.playClick?.();
    setSelectedDocIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const handleToggleSelectAll = () => {
    soundFx?.playClick?.();
    if (selectedDocIds.length === filteredDocs.length && filteredDocs.length > 0) {
      setSelectedDocIds([]);
    } else {
      setSelectedDocIds(filteredDocs.map((d) => d.id));
    }
  };

  const handleDownload = async () => {
    const docsToDownload =
      selectedDocIds.length > 0
        ? filteredDocs.filter((d) => selectedDocIds.includes(d.id))
        : filteredDocs;

    if (docsToDownload.length === 0) return;
    setIsDownloading(true);
    soundFx?.playLaserHum?.();
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      await downloadReceiptsExcel(docsToDownload, `Resiboss_Receipts_${timestamp}.xlsx`);
      soundFx?.playSuccessChime?.();
      try { confetti({ particleCount: 60, spread: 70, origin: { y: 0.65 }, colors: ['#00f2fe', '#10b981', '#ffffff'] }); } catch (e) {}
      setDownloadNotice(`Downloaded ${docsToDownload.length} receipt${docsToDownload.length > 1 ? 's' : ''}`);
      setTimeout(() => setDownloadNotice(null), 5000);
    } catch (err) {
      alert('Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const totalSpend = filteredDocs.reduce((s, d) => s + (Number(d.total) || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', paddingBottom: 100 }}>

      {/* ── PAGE HEADER ── */}
      <div className="rb-page-header">
        <h1 className="rb-page-title">My Receipts</h1>
        <p className="rb-page-subtitle">
          {documents.length === 0
            ? 'Scan a receipt to start tracking your spending.'
            : `${documents.length} receipt${documents.length !== 1 ? 's' : ''} saved · Total ${formatCurrency(documents.reduce((s, d) => s + (Number(d.total) || 0), 0))}`}
        </p>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ── DOWNLOAD NOTICE ── */}
        {downloadNotice && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 14px', borderRadius: 12,
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            fontSize: 13, fontWeight: 600, color: 'var(--emerald-glow)',
            animation: 'rb-fade-up 0.2s ease',
          }}>
            <CheckCircle2 size={15} />
            {downloadNotice}
          </div>
        )}

        {/* ── SEARCH + SORT ── */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div className="rb-search-wrap" style={{ flex: 1 }}>
            <Search size={15} className="rb-search-icon" />
            <input
              className="rb-search-input"
              type="text"
              placeholder="Search by store, date, ID…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                  display: 'flex', alignItems: 'center',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <select
            value={sortBy}
            onChange={(e) => { soundFx?.playClick?.(); setSortBy(e.target.value); }}
            style={{
              background: 'var(--bg-surface)', border: '1px solid var(--glass-border)',
              borderRadius: 10, color: 'var(--text-secondary)', padding: '9px 12px',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', outline: 'none',
              fontFamily: 'var(--font-sans)',
            }}
          >
            <option value="date-desc">Newest</option>
            <option value="date-asc">Oldest</option>
            <option value="amount-desc">Highest</option>
          </select>

          {/* View toggle */}
          <div style={{ display: 'flex', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', borderRadius: 10, padding: 3 }}>
            {[{ m: 'list', icon: List }, { m: 'grid', icon: Grid }].map(({ m, icon: Icon }) => (
              <button key={m} onClick={() => { soundFx?.playClick?.(); setViewMode(m); }}
                style={{
                  padding: '6px 9px', borderRadius: 7, border: 'none', cursor: 'pointer',
                  background: viewMode === m ? 'var(--cyan-subtle)' : 'transparent',
                  color: viewMode === m ? 'var(--cyan-glow)' : 'var(--text-muted)',
                  transition: 'all 0.15s ease',
                }}>
                <Icon size={15} />
              </button>
            ))}
          </div>
        </div>

        {/* ── CATEGORY FILTER PILLS ── */}
        <div className="rb-filter-tabs">
          {['ALL', ...CATEGORIES].map((cat) => {
            const count = cat === 'ALL' ? documents.length : documents.filter(d => d.category === cat).length;
            if (cat !== 'ALL' && count === 0) return null;
            return (
              <button key={cat}
                className={`rb-filter-tab${selectedCategory === cat ? ' active' : ''}`}
                onClick={() => { soundFx?.playClick?.(); setSelectedCategory(cat); }}
              >
                {cat === 'ALL' ? 'All' : cat}
                <span style={{ opacity: 0.7, fontSize: 10 }}>·{count}</span>
              </button>
            );
          })}
        </div>

        {/* ── DATE RANGE FILTER PILLS ── */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          {[
            { id: 'ALL', label: 'All Dates' },
            { id: 'THIS_MONTH', label: 'This Month' },
            { id: '30_DAYS', label: 'Last 30 Days' },
            { id: 'THIS_YEAR', label: 'This Year' },
          ].map((df) => (
            <button
              key={df.id}
              onClick={() => { soundFx?.playClick?.(); setDateFilter(df.id); }}
              style={{
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: 11,
                fontWeight: 600,
                border: '1px solid',
                borderColor: dateFilter === df.id ? 'var(--cyan-glow)' : 'var(--glass-border)',
                background: dateFilter === df.id ? 'var(--cyan-subtle)' : 'transparent',
                color: dateFilter === df.id ? 'var(--cyan-glow)' : 'var(--text-muted)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {df.label}
            </button>
          ))}
        </div>

        {/* ── SELECTION TOOLBAR (visible when items selected) ── */}
        {selectedDocIds.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px', borderRadius: 12,
            background: 'var(--cyan-subtle)',
            border: '1px solid rgba(0, 242, 254, 0.2)',
            animation: 'rb-fade-in 0.15s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={handleToggleSelectAll} className="rb-btn rb-btn-ghost rb-btn-sm" style={{ color: 'var(--cyan-glow)', padding: '4px 8px' }}>
                {selectedDocIds.length === filteredDocs.length ? <CheckSquare size={14} /> : <Square size={14} />}
              </button>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                {selectedDocIds.length} selected
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleDownload} disabled={isDownloading} className="rb-btn rb-btn-primary rb-btn-sm">
                <Download size={13} />
                {isDownloading ? 'Downloading…' : 'Export'}
              </button>
              <button onClick={() => setSelectedDocIds([])} className="rb-btn rb-btn-ghost rb-btn-sm">
                <X size={13} /> Clear
              </button>
            </div>
          </div>
        )}

        {/* ── RESULTS SUMMARY ── */}
        {filteredDocs.length > 0 && (searchQuery || selectedCategory !== 'ALL') && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
            {filteredDocs.length} result{filteredDocs.length !== 1 ? 's' : ''} · {formatCurrency(totalSpend)}
          </div>
        )}

        {/* ── EMPTY STATE ── */}
        {documents.length === 0 ? (
          <div className="rb-empty" style={{ marginTop: 24 }}>
            <div className="rb-empty-icon">🧾</div>
            <div className="rb-empty-title">No receipts yet</div>
            <p className="rb-empty-body">
              Scan your first receipt and Resiboss will organize your spending automatically.
            </p>
            <button onClick={() => { soundFx?.playClick?.(); setActiveTab('scanner'); }} className="rb-btn rb-btn-primary" style={{ marginTop: 8 }}>
              <ScanLine size={16} /> Scan a Receipt
            </button>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="rb-empty">
            <div className="rb-empty-icon">🔍</div>
            <div className="rb-empty-title">No results found</div>
            <p className="rb-empty-body">Try a different search or clear the filters.</p>
            <button onClick={() => { setSearchQuery(''); setSelectedCategory('ALL'); }} className="rb-btn rb-btn-secondary" style={{ marginTop: 8 }}>
              Clear filters
            </button>
          </div>
        ) : viewMode === 'list' ? (
          /* ── LIST VIEW ── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredDocs.map((doc, i) => {
              const isChecked = selectedDocIds.includes(doc.id);
              const catColor = getCatColor(doc.category);
              return (
                <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 10, animation: `rb-fade-up 0.25s ease ${i * 0.03}s both` }}>
                  {/* Checkbox */}
                  <button
                    onClick={(e) => handleToggleDoc(doc.id, e)}
                    style={{
                      width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                      border: isChecked ? 'none' : '1.5px solid var(--glass-border)',
                      background: isChecked ? 'var(--cyan-glow)' : 'transparent',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {isChecked && <Check size={12} color="#000" strokeWidth={3} />}
                  </button>

                  {/* Main card */}
                  <button
                    className="rb-receipt-card"
                    onClick={() => { soundFx?.playClick?.(); setInspectingDoc(doc); }}
                    style={{
                      flex: 1,
                      borderColor: isChecked ? 'var(--cyan-glow)' : undefined,
                    }}
                  >
                    <div className="rb-receipt-card-icon">
                      <Receipt size={17} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="rb-receipt-card-merchant">{doc.merchant}</div>
                      <div className="rb-receipt-card-meta">
                        <Calendar size={11} />
                        {doc.date}
                        <span style={{ color: catColor, fontWeight: 700 }}>{doc.category}</span>
                        {doc.syncStatus === 'pending' && (
                          <span title="Queued offline"><CloudOff size={11} color="#f59e0b" /></span>
                        )}
                        {doc.status === 'Verified' && (
                          <span title="Verified"><CheckCircle2 size={11} color="var(--emerald-glow)" /></span>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div className="rb-receipt-card-amount">{formatCurrency(doc.total)}</div>
                      {doc.vat > 0 && (
                        <div style={{ fontSize: 11, color: 'var(--emerald-glow)', fontWeight: 600 }}>
                          VAT {formatCurrency(doc.vat)}
                        </div>
                      )}
                    </div>
                    <Eye size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={(e) => { e.stopPropagation(); soundFx?.playClick?.(); deleteDocument(doc.id); }}
                    style={{
                      width: 36, height: 36, borderRadius: 9, border: '1px solid var(--glass-border)',
                      background: 'transparent', cursor: 'pointer', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--text-muted)', transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                    title="Delete receipt"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── GRID VIEW ── */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))',
            gap: 14,
          }}>
            {filteredDocs.map((doc, i) => {
              const isChecked = selectedDocIds.includes(doc.id);
              const catColor = getCatColor(doc.category);
              return (
                <div key={doc.id}
                  className="rb-card"
                  style={{
                    padding: 18,
                    borderColor: isChecked ? 'var(--cyan-glow)' : undefined,
                    animation: `rb-scale-in 0.25s ease ${i * 0.03}s both`,
                  }}>
                  {/* Top row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button
                        onClick={(e) => handleToggleDoc(doc.id, e)}
                        style={{
                          width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                          border: isChecked ? 'none' : '1.5px solid var(--glass-border)',
                          background: isChecked ? 'var(--cyan-glow)' : 'transparent',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        {isChecked && <Check size={12} color="#000" strokeWidth={3} />}
                      </button>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 6,
                        background: 'transparent', color: catColor, border: `1px solid ${catColor}33`,
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: catColor }} />
                        {doc.category}
                      </span>
                    </div>
                    {doc.status === 'Verified'
                      ? <CheckCircle2 size={15} color="var(--emerald-glow)" />
                      : <Clock size={15} color="var(--amber-glow)" />}
                  </div>

                  {/* Merchant */}
                  <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {doc.merchant}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>{doc.date}</div>

                  {/* Items preview */}
                  {doc.items && doc.items.length > 0 && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.6 }}>
                      {doc.items.slice(0, 2).map((it, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }}>{it.name || 'Item'}</span>
                          <span>₱{(it.total || 0).toFixed(2)}</span>
                        </div>
                      ))}
                      {doc.items.length > 2 && (
                        <div style={{ color: 'var(--cyan-glow)', fontSize: 11 }}>+{doc.items.length - 2} more</div>
                      )}
                    </div>
                  )}

                  {/* Total + Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--glass-border)' }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Total</div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
                        {formatCurrency(doc.total)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => { soundFx?.playClick?.(); setInspectingDoc(doc); }} className="rb-btn rb-btn-primary rb-btn-sm">
                        <Eye size={13} /> View
                      </button>
                      <button onClick={() => { soundFx?.playClick?.(); deleteDocument(doc.id); }} className="rb-btn rb-btn-danger rb-btn-sm">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── DOWNLOAD FAB (when items exist, no selection) ── */}
        {filteredDocs.length > 0 && selectedDocIds.length === 0 && (
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="rb-btn rb-btn-secondary"
            style={{ alignSelf: 'flex-start', marginTop: 8 }}
          >
            <Download size={14} />
            {isDownloading ? 'Exporting…' : `Export ${filteredDocs.length} receipt${filteredDocs.length > 1 ? 's' : ''}`}
          </button>
        )}
      </div>
    </div>
  );
};
