import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TiltCard } from '../components/TiltCard';
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
} from 'lucide-react';

export const DocumentsView = () => {
  const { documents, setInspectingDoc, deleteDocument, formatCurrency, t } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Filtering
  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.merchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.tin && doc.tin.includes(searchQuery)) ||
      doc.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'ALL' || doc.category === selectedCategory;
    const matchesStatus = selectedStatus === 'ALL' || doc.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalVaultValue = filteredDocs.reduce((acc, d) => acc + (d.total || 0), 0);
  const totalDeductibleVat = filteredDocs.reduce((acc, d) => acc + (d.vat || 0), 0);
  const approxStorageMB = Math.max(documents.length * 0.2, 0.5).toFixed(1);

  return (
    <div className="view-page" style={{ width: '100%', padding: '0 0 40px 0' }}>
      {/* Title Header */}
      <div className="view-title-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <span className="liquid-badge liquid-badge-violet">
              <FolderArchive size={13} /> {t.documents.title}
            </span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {t.documents.auditVaultTitle}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            {t.documents.subtitle}
          </p>
        </div>

        {/* Total Vault Stats */}
        <div className="view-title-stats" style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          <div
            className="glass-panel"
            style={{
              padding: '12px 18px',
              border: '1px solid rgba(168, 85, 247, 0.25)',
              textAlign: 'right',
            }}
          >
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{t.documents.totalDocuments}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#c084fc', fontFamily: 'var(--font-mono)' }}>
              {documents.length}
            </div>
          </div>
          <div
            className="glass-panel"
            style={{
              padding: '12px 18px',
              border: '1px solid rgba(0, 242, 254, 0.25)',
              textAlign: 'right',
            }}
          >
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{t.documents.approxStorage}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#00f2fe', fontFamily: 'var(--font-mono)' }}>
              {approxStorageMB} MB
            </div>
          </div>
          <div
            className="glass-panel"
            style={{
              padding: '12px 18px',
              border: '1px solid rgba(0, 242, 254, 0.25)',
              textAlign: 'right',
            }}
          >
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{t.documents.filteredVolume}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#00f2fe', fontFamily: 'var(--font-mono)' }}>
              {formatCurrency(totalVaultValue)}
            </div>
          </div>
          <div
            className="glass-panel"
            style={{
              padding: '12px 18px',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              textAlign: 'right',
            }}
          >
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{t.documents.totalDeductibleVat}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
              {formatCurrency(totalDeductibleVat)}
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        className="glass-panel documents-filter-bar"
        style={{
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          gap: '14px',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        {/* Search Input */}
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search
            size={16}
            color="var(--text-muted)"
            style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            className="liquid-input"
            style={{ paddingLeft: '40px' }}
            placeholder={t.documents.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category & Status Filter Row on Mobile */}
        <div className="documents-filter-row" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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
        </div>

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
          {filteredDocs.map((doc) => (
            <TiltCard key={doc.id}>
              <div
                className="glass-panel"
                style={{
                  padding: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: '100%',
                }}
              >
                <div>
                  {/* Top Badges */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <span className="liquid-badge liquid-badge-cyan" style={{ fontSize: '0.7rem' }}>
                      <Tag size={11} /> {t.categories[doc.category] || doc.category}
                    </span>
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
                      color: '#ffffff',
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
                      background: 'rgba(10, 15, 30, 0.45)',
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

                {/* Bottom Row: Amount & 3D Inspect Trigger */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '14px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{t.documents.totalAmount}</div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
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
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="glass-panel documents-table-wrap" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', padding: '12px' }}>
          <table style={{ width: '100%', minWidth: '660px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-secondary)' }}>
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
              {filteredDocs.map((doc) => (
                <tr
                  key={doc.id}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    transition: 'background 0.2s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0, 242, 254, 0.04)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#00f2fe' }}>
                    {doc.id}
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: '#ffffff' }}>
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
                  <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#ffffff' }}>
                    {formatCurrency(doc.total)}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                      <button
                        onClick={() => setInspectingDoc(doc)}
                        className="liquid-btn liquid-btn-secondary"
                        style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                      >
                        <Eye size={13} />
                      </button>
                      <button
                        onClick={() => deleteDocument(doc.id)}
                        className="liquid-btn liquid-btn-secondary"
                        style={{ padding: '6px 10px', fontSize: '0.75rem', color: '#f87171' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
