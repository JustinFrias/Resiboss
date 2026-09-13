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
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState(null);
  const [selectedDocIds, setSelectedDocIds] = useState([]);

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

  // Receipt Selection Handlers
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

    if (docsToDownload.length === 0) {
      alert('No receipts selected or available to download.');
      return;
    }

    setIsDownloading(true);
    soundFx?.playLaserHum?.();
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `Resiboss_Receipts_${timestamp}.xlsx`;
      const res = await downloadReceiptsExcel(docsToDownload, filename);
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
        ? `Saved ${docsToDownload.length} receipt${docsToDownload.length > 1 ? 's' : ''} to Downloads!`
        : `Downloaded ${docsToDownload.length} receipt${docsToDownload.length > 1 ? 's' : ''}!`;
      setDownloadNotice(msg);
      setTimeout(() => setDownloadNotice(null), 6000);
    } catch (err) {
      console.error('Download error:', err);
      alert('Download failed. Please check device permissions and try again.');
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

        {/* Combined Controls: Download + Categories + Status + View Toggle */}
        <div
          className="documents-top-controls"
          style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          {/* Download Action Button */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading || filteredDocs.length === 0}
            className="liquid-btn"
            style={{
              background: isLight ? '#0284c7' : 'linear-gradient(135deg, #00f2fe, #38bdf8)',
              color: isLight ? '#ffffff' : '#090e21',
              padding: '7px 16px',
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
              transition: 'all 0.2s ease',
            }}
            title={selectedDocIds.length > 0 ? `Download ${selectedDocIds.length} selected receipts` : "Download all receipts as Excel report"}
          >
            <Download size={15} />
            <span>
              {isDownloading
                ? 'Downloading...'
                : selectedDocIds.length > 0
                ? `Download (${selectedDocIds.length})`
                : 'Download'}
            </span>
          </button>

          {/* Quick Clear Selection if items selected */}
          {selectedDocIds.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedDocIds([])}
              className="liquid-btn liquid-btn-secondary"
              style={{
                padding: '6px 10px',
                fontSize: '0.78rem',
                borderRadius: '8px',
                color: 'var(--text-muted)',
              }}
              title="Clear selection"
            >
              Clear ({selectedDocIds.length})
            </button>
          )}

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


      {/* Download Status Notification */}
      {downloadNotice && (
        <div
          style={{
            marginBottom: '16px',
            padding: '10px 16px',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            color: '#10b981',
            fontSize: '0.88rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={16} />
          <span>{downloadNotice}</span>
        </div>
      )}

      {/* Standalone Search Bar + Selection Controls */}
      <div
        className="glass-panel resiboss-search-panel"
        style={{
          padding: '12px 18px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderRadius: '20px',
          gap: '12px',
          flexWrap: 'wrap',
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

        {/* Selection / Select All Controls */}
        {filteredDocs.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="liquid-btn liquid-btn-secondary"
              style={{
                padding: '6px 12px',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '8px',
              }}
            >
              {selectedDocIds.length === filteredDocs.length && filteredDocs.length > 0 ? (
                <>
                  <CheckSquare size={15} color="var(--cyan-glow)" />
                  <span>Deselect All</span>
                </>
              ) : (
                <>
                  <Square size={15} color="var(--text-muted)" />
                  <span>Select All ({filteredDocs.length})</span>
                </>
              )}
            </button>

            {selectedDocIds.length > 0 && (
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--cyan-glow)' }}>
                {selectedDocIds.length} selected
              </span>
            )}
          </div>
        )}
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
                      ? (isLight ? '2px solid #0284c7' : '2px solid var(--cyan-glow)')
                      : '1px solid var(--glass-border)',
                    background: isChecked
                      ? (isLight ? 'rgba(2, 132, 199, 0.05)' : 'rgba(0, 242, 254, 0.06)')
                      : undefined,
                    transition: 'all 0.2s ease',
                    boxShadow: isChecked
                      ? (isLight ? '0 4px 20px rgba(2, 132, 199, 0.18)' : '0 4px 20px rgba(0, 242, 254, 0.22)')
                      : undefined,
                  }}
                >
                  <div>
                    {/* Top Header: Selection Checkbox + Category + Status Badges */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={(e) => handleToggleDoc(doc.id, e)}
                          style={{
                            background: isChecked ? 'var(--cyan-glow)' : 'rgba(255, 255, 255, 0.08)',
                            border: isChecked ? 'none' : '1.5px solid var(--glass-border-bright)',
                            borderRadius: '6px',
                            width: '22px',
                            height: '22px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            flexShrink: 0,
                            padding: 0,
                            transition: 'all 0.15s ease',
                          }}
                          title={isChecked ? 'Deselect receipt' : 'Select receipt for download'}
                        >
                          {isChecked && <Check size={13} color="#090e21" strokeWidth={3} />}
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
                <th style={{ padding: '14px 16px', width: '44px' }}>
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                    title={selectedDocIds.length === filteredDocs.length && filteredDocs.length > 0 ? 'Deselect all' : 'Select all'}
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
                    <td style={{ padding: '14px 16px', width: '44px' }}>
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
                        title={isChecked ? 'Deselect receipt' : 'Select receipt for download'}
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
    </div>
  );
};
