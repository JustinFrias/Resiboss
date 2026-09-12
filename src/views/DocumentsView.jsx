import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TiltCard } from '../components';
import {
  FolderArchive,
  Search,
  Filter,
  Eye,
  Trash2,
  Receipt,
  Tag,
  Calendar,
  Grid,
  List,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Download,
  Check,
  CheckSquare,
  Square,
} from 'lucide-react';
import { soundFx } from '../utils/soundEffects';
import { downloadReceiptsExcel } from '../utils/fileDownloader';
import confetti from 'canvas-confetti';

export const DocumentsView = () => {
  const { documents, setInspectingDoc, deleteDocument, formatCurrency, t, theme } = useApp();
  const isLight = theme === 'light';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Multi-receipt checklist selection
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState(null);

  // Filtering
  const filteredDocs = documents.filter((doc) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (doc.merchant && doc.merchant.toLowerCase().includes(q)) ||
      (doc.tin && doc.tin.includes(q)) ||
      (doc.receiptNumber && doc.receiptNumber.toLowerCase().includes(q)) ||
      (doc.invoiceNumber && doc.invoiceNumber.toLowerCase().includes(q)) ||
      (doc.id && doc.id.toLowerCase().includes(q));

    const matchesCategory = selectedCategory === 'ALL' || doc.category === selectedCategory;
    const matchesStatus = selectedStatus === 'ALL' || doc.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Checklist Selection Handlers
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

  // Download Handlers
  const handleDownloadSelected = async () => {
    const docsToExport = filteredDocs.filter((d) => selectedDocIds.includes(d.id));
    const targetDocs = docsToExport.length > 0 ? docsToExport : filteredDocs;

    if (targetDocs.length === 0) {
      alert('No receipts available to download.');
      return;
    }

    setIsDownloading(true);
    soundFx?.playLaserHum?.();
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `Resiboss_Receipts_${timestamp}.xlsx`;
      const res = await downloadReceiptsExcel(targetDocs, filename);
      soundFx?.playSuccessChime?.();
      try {
        confetti({
          particleCount: 70,
          spread: 75,
          origin: { y: 0.65 },
          colors: ['#00f2fe', '#3b82f6', '#10b981', '#ffffff'],
        });
      } catch (e) {}

      const msg = res?.savedToDownloads
        ? `Saved ${targetDocs.length} receipt${targetDocs.length > 1 ? 's' : ''} to Downloads!`
        : `Downloaded ${targetDocs.length} receipt${targetDocs.length > 1 ? 's' : ''}!`;
      setDownloadNotice(msg);
      setTimeout(() => setDownloadNotice(null), 7000);
    } catch (err) {
      console.error('Download error:', err);
      alert('Download failed. Please check device permissions and try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadSingle = async (doc, e) => {
    e?.stopPropagation?.();
    if (!doc) return;
    setIsDownloading(true);
    soundFx?.playLaserHum?.();
    try {
      const safeMerchant = (doc.merchant || 'Receipt').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `Receipt_${safeMerchant}_${doc.id || 'DOC'}.xlsx`;
      const res = await downloadReceiptsExcel([doc], filename);
      soundFx?.playSuccessChime?.();
      try {
        confetti({
          particleCount: 45,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#00f2fe', '#38bdf8', '#ffffff'],
        });
      } catch (e) {}

      const msg = res?.savedToDownloads
        ? `Saved receipt for ${doc.merchant} to Downloads!`
        : `Downloaded receipt for ${doc.merchant}!`;
      setDownloadNotice(msg);
      setTimeout(() => setDownloadNotice(null), 6000);
    } catch (err) {
      console.error('Single download error:', err);
      alert('Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };


  return (
    <div className="" style={{ width: '100%', padding: '0 0 40px 0' }}>
      {/* Title Header with Combined Controls at Top Right */}
      <div
        className="view-title-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 500, letterSpacing: '-0.01em', color: 'var(--text-primary)', marginBottom: '4px', fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif" }}>
            {t.documents.auditVaultTitle}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
            {t.documents.subtitle}
          </p>
        </div>

        {/* Combined Controls: Categories + Status + View Toggle (Top Right of Searchbar) */}
        <div
          className="documents-top-controls"
          style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          {/* Select All Toggle Button */}
          {filteredDocs.length > 0 && (
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="liquid-btn liquid-btn-secondary"
              style={{
                padding: '7px 12px',
                fontSize: '0.8rem',
                gap: '6px',
                borderRadius: '10px',
              }}
              title={selectedDocIds.length === filteredDocs.length ? 'Deselect all receipts' : 'Select all receipts'}
            >
              {selectedDocIds.length === filteredDocs.length && filteredDocs.length > 0 ? (
                <>
                  <CheckSquare size={15} color="var(--cyan-glow)" />
                  <span>Deselect All</span>
                </>
              ) : (
                <>
                  <Square size={15} />
                  <span>Select All ({filteredDocs.length})</span>
                </>
              )}
            </button>
          )}

          {/* Download Action Button */}
          <button
            type="button"
            onClick={handleDownloadSelected}
            disabled={isDownloading || filteredDocs.length === 0}
            className="liquid-btn"
            style={{
              background: selectedDocIds.length > 0
                ? 'linear-gradient(135deg, #0284c7, #2563eb)'
                : (isLight ? '#0284c7' : 'linear-gradient(135deg, #00f2fe, #38bdf8)'),
              color: '#ffffff',
              padding: '7px 14px',
              fontSize: '0.82rem',
              fontWeight: 700,
              borderRadius: '10px',
              border: 'none',
              cursor: isDownloading ? 'wait' : 'pointer',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: filteredDocs.length === 0 ? 0.5 : 1,
            }}
            title="Download selected receipts as Excel report"
          >
            <Download size={15} />
            <span>
              {isDownloading
                ? 'Downloading...'
                : selectedDocIds.length > 0
                ? `Download (${selectedDocIds.length})`
                : 'Download All'}
            </span>
          </button>

          {/* Category Filter */}
          <select
            className="liquid-input"
            style={{ width: 'auto', minWidth: '130px', cursor: 'pointer' }}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="ALL" style={{ background: '#090d1a', color: '#fff' }}>
              {t.documents.allCategories}
            </option>
            {Object.keys(t.categories).map((cat) => (
              <option key={cat} value={cat} style={{ background: '#090d1a', color: '#fff' }}>
                {t.categories[cat]}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            className="liquid-input"
            style={{ width: 'auto', minWidth: '120px', cursor: 'pointer' }}
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="ALL" style={{ background: '#090d1a', color: '#fff' }}>
              {t.documents.allStatus}
            </option>
            <option value="Verified" style={{ background: '#090d1a', color: '#fff' }}>
              {t.dashboard.verified}
            </option>
            <option value="Pending" style={{ background: '#090d1a', color: '#fff' }}>
              {t.dashboard.pending}
            </option>
          </select>

          {/* View Mode Toggle */}
          <div
            style={{
              display: 'flex',
              background: 'rgba(10, 15, 30, 0.6)',
              padding: '3px',
              borderRadius: '10px',
              border: '1px solid var(--glass-border)',
            }}
          >
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '6px 10px',
                borderRadius: '7px',
                border: 'none',
                background: viewMode === 'grid' ? 'rgba(0, 242, 254, 0.2)' : 'transparent',
                color: viewMode === 'grid' ? '#00f2fe' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
              title="Grid View"
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                padding: '6px 10px',
                borderRadius: '7px',
                border: 'none',
                background: viewMode === 'table' ? 'rgba(0, 242, 254, 0.2)' : 'transparent',
                color: viewMode === 'table' ? '#00f2fe' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
              title="Table View"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Download Success Notice */}
      {downloadNotice && (
        <div
          style={{
            marginBottom: '16px',
            padding: '12px 18px',
            borderRadius: '12px',
            background: isLight ? 'rgba(240, 253, 250, 0.95)' : 'rgba(0, 242, 254, 0.12)',
            border: isLight ? '1px solid #99f6e4' : '1px solid rgba(0, 242, 254, 0.45)',
            color: isLight ? '#0f766e' : '#38bdf8',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.88rem',
            fontWeight: 600,
            boxShadow: '0 4px 18px rgba(0, 242, 254, 0.2)',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <CheckCircle2 size={18} color={isLight ? '#0d9488' : '#00f2fe'} />
          <span>{downloadNotice}</span>
        </div>
      )}

      {/* Standalone Search Bar */}
      <div
        className="glass-panel resiboss-search-panel"
        style={{
          padding: '12px 18px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          borderRadius: '20px',
        }}
      >
        {/* Search Input */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
          <Search
            size={17}
            strokeWidth={2}
            className="resiboss-search-icon"
            style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              zIndex: 2,
            }}
          />
          <input
            className="resiboss-search-input"
            type="text"
            placeholder={t.documents?.searchPlaceholder || "Search vendor, doc number..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                fontSize: '14px',
                lineHeight: 1,
                padding: '4px',
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Content Rendering: Grid vs Table */}
      {filteredDocs.length === 0 ? (
        <div
          className="glass-panel"
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            color: 'var(--text-muted)',
          }}
        >
          <Receipt size={48} color="#00f2fe" style={{ opacity: 0.4, margin: '0 auto 16px auto' }} />
          <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '6px' }}>
            {t.documents.noDocs}
          </h3>
          <p style={{ fontSize: '0.88rem' }}>Try clearing filters or scanning a new receipt.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div
          className="documents-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
            gap: '20px',
          }}
        >
          {filteredDocs.map((doc) => {
            const isChecked = selectedDocIds.includes(doc.id);
            return (
              <TiltCard key={doc.id}>
                <div
                  className="glass-panel"
                  style={{
                    padding: '22px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    height: '100%',
                    border: isChecked
                      ? (isLight ? '2px solid #0284c7' : '2px solid rgba(0, 242, 254, 0.7)')
                      : '1px solid var(--glass-border)',
                    boxShadow: isChecked
                      ? (isLight ? '0 0 16px rgba(2, 132, 199, 0.25)' : '0 0 20px rgba(0, 242, 254, 0.25)')
                      : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div>
                    {/* Top Header: Checkbox + Badges */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {/* Checklist Checkbox Button */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleDoc(doc.id, e)}
                          style={{
                            background: isChecked ? 'var(--cyan-glow)' : 'rgba(255, 255, 255, 0.08)',
                            border: isChecked ? 'none' : '1.5px solid var(--glass-border-bright)',
                            borderRadius: '6px',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            padding: 0,
                            flexShrink: 0,
                            transition: 'all 0.15s ease',
                          }}
                          title={isChecked ? 'Deselect receipt' : 'Select receipt'}
                          aria-label={`Select ${doc.merchant}`}
                        >
                          {isChecked && <Check size={15} color="#090e21" strokeWidth={3} />}
                        </button>

                        <span className="liquid-badge liquid-badge-cyan" style={{ fontSize: '0.7rem' }}>
                          <Tag size={11} /> {t.categories[doc.category] || doc.category}
                        </span>
                      </div>

                      <span className={`liquid-badge ${doc.status === 'Verified' ? 'liquid-badge-emerald' : 'liquid-badge-amber'}`} style={{ fontSize: '0.7rem' }}>
                        {doc.status === 'Verified' ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                        {doc.status}
                      </span>
                    </div>

                    {/* Merchant & Info */}
                    <h3
                      style={{
                        fontSize: '1.12rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        marginBottom: '6px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {doc.merchant}
                    </h3>

                    <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                      TIN: {doc.tin || 'N/A'} • {doc.date}
                    </div>

                    {/* Items summary */}
                    <div
                      style={{
                        background: 'var(--bg-surface)',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--glass-border)',
                        marginBottom: '16px',
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {(doc.items || []).slice(0, 2).map((it, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                          <span style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {it.qty}x {it.name}
                          </span>
                          <span style={{ fontFamily: 'var(--font-mono)' }}>₱{it.total.toFixed(2)}</span>
                        </div>
                      ))}
                      {(doc.items || []).length > 2 && (
                        <div style={{ color: 'var(--cyan-glow)', fontSize: '0.7rem', marginTop: '2px' }}>
                          +{(doc.items || []).length - 2} more items
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Row: Amount & Action Buttons */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '14px', paddingTop: '10px', borderTop: '1px solid var(--glass-border)' }}>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{t.documents.totalAmount}</div>
                        <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                          {formatCurrency(doc.total)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.7rem', color: '#34d399' }}>{t.documents.vatCredit}</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                          {formatCurrency(doc.vat)}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => setInspectingDoc(doc)}
                        className="liquid-btn liquid-btn-primary"
                        style={{ flex: 1, padding: '8px 12px', fontSize: '0.82rem' }}
                      >
                        <Eye size={14} />
                        <span>{t.documents.inspect3D}</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDownloadSingle(doc, e)}
                        disabled={isDownloading}
                        className="liquid-btn liquid-btn-secondary"
                        style={{ padding: '8px 12px', color: isLight ? '#0284c7' : 'var(--cyan-glow)', borderColor: isLight ? '#bae6fd' : 'rgba(0, 242, 254, 0.3)' }}
                        title="Download this single receipt (Excel)"
                        aria-label="Download receipt"
                      >
                        <Download size={14} />
                      </button>
                      <button
                        onClick={() => deleteDocument(doc.id)}
                        className="liquid-btn liquid-btn-secondary"
                        style={{ padding: '8px 12px', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.25)' }}
                        title={t.documents.delete}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </TiltCard>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="glass-panel documents-table-wrap" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', padding: '12px' }}>
          <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '14px 16px', width: '40px' }}>
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                    title={selectedDocIds.length === filteredDocs.length ? 'Deselect all' : 'Select all'}
                  >
                    {selectedDocIds.length === filteredDocs.length && filteredDocs.length > 0 ? (
                      <CheckSquare size={16} color="var(--cyan-glow)" />
                    ) : (
                      <Square size={16} color="var(--text-muted)" />
                    )}
                  </button>
                </th>
                <th style={{ padding: '14px 16px' }}>{t.documents.tableId}</th>
                <th style={{ padding: '14px 16px' }}>{t.documents.tableMerchant}</th>
                <th style={{ padding: '14px 16px' }}>{t.documents.tableDate}</th>
                <th style={{ padding: '14px 16px' }}>{t.documents.tableCategory}</th>
                <th style={{ padding: '14px 16px' }}>{t.documents.tableStatus}</th>
                <th style={{ padding: '14px 16px' }}>{t.documents.tableVat}</th>
                <th style={{ padding: '14px 16px', textAlign: 'right' }}>{t.documents.tableTotal}</th>
                <th style={{ padding: '14px 16px', textAlign: 'center' }}>{t.documents.tableActions}</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.map((doc) => {
                const isChecked = selectedDocIds.includes(doc.id);
                return (
                  <tr
                    key={doc.id}
                    style={{
                      borderBottom: '1px solid var(--glass-border)',
                      background: isChecked
                        ? (isLight ? 'rgba(2, 132, 199, 0.08)' : 'rgba(0, 242, 254, 0.08)')
                        : 'transparent',
                      transition: 'background 0.2s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = isChecked ? (isLight ? 'rgba(2, 132, 199, 0.12)' : 'rgba(0, 242, 254, 0.12)') : 'var(--cyan-subtle)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = isChecked ? (isLight ? 'rgba(2, 132, 199, 0.08)' : 'rgba(0, 242, 254, 0.08)') : 'transparent')}
                  >
                    <td style={{ padding: '14px 16px', width: '40px' }}>
                      <div
                        onClick={(e) => handleToggleDoc(doc.id, e)}
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '5px',
                          border: isChecked ? 'none' : '1.5px solid var(--glass-border-bright)',
                          background: isChecked ? 'var(--cyan-glow)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        {isChecked && <Check size={13} color="#090e21" strokeWidth={3} />}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--cyan-glow)' }}>
                      {doc.id}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {doc.merchant}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                      {doc.date}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className="liquid-badge liquid-badge-cyan" style={{ padding: '2px 8px', fontSize: '0.7rem' }}>
                        {t.categories[doc.category] || doc.category}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className={`liquid-badge ${doc.status === 'Verified' ? 'liquid-badge-emerald' : 'liquid-badge-amber'}`} style={{ padding: '2px 8px', fontSize: '0.7rem' }}>
                        {doc.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                      {formatCurrency(doc.vat)}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                      {formatCurrency(doc.total)}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                        <button
                          onClick={() => setInspectingDoc(doc)}
                          className="liquid-btn liquid-btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                          title="View 3D Receipt"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDownloadSingle(doc, e)}
                          className="liquid-btn liquid-btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '0.75rem', color: 'var(--cyan-glow)' }}
                          title="Download this single receipt"
                        >
                          <Download size={13} />
                        </button>
                        <button
                          onClick={() => deleteDocument(doc.id)}
                          className="liquid-btn liquid-btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '0.75rem', color: '#f87171' }}
                          title="Delete Receipt"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Floating Bottom Download Action Bar on Mobile/Desktop when receipts are selected */}
      {selectedDocIds.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 'calc(72px + env(safe-area-inset-bottom, 16px))',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 130,
            background: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(10, 16, 34, 0.96)',
            border: isLight ? '1.5px solid #0284c7' : '1px solid rgba(0, 242, 254, 0.45)',
            borderRadius: '999px',
            padding: '8px 16px 8px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.5), 0 0 25px rgba(0, 242, 254, 0.3)',
            backdropFilter: 'blur(20px)',
            animation: 'fadeIn 0.2s ease',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {selectedDocIds.length} receipt{selectedDocIds.length > 1 ? 's' : ''} selected
          </span>
          <button
            type="button"
            onClick={handleDownloadSelected}
            disabled={isDownloading}
            className="liquid-btn liquid-btn-primary"
            style={{
              padding: '6px 16px',
              fontSize: '0.82rem',
              borderRadius: '999px',
              gap: '6px',
            }}
          >
            <Download size={14} />
            <span>{isDownloading ? 'Saving...' : 'Download'}</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedDocIds([])}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
};
