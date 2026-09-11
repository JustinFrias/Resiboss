import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { soundFx } from '../utils/soundEffects';
import { downloadReceiptsExcel } from '../utils/fileDownloader';
import confetti from 'canvas-confetti';
import {
  Download,
  Calendar,
  ChevronDown,
  CheckCircle2,
  Check,
  CheckSquare,
  Square,
} from 'lucide-react';

export const ExportView = () => {
  const { documents, t, formatCurrency } = useApp();

  const [selectedRange, setSelectedRange] = useState('All Time');
  const [isRangeOpen, setIsRangeOpen] = useState(false);
  const [exportNotification, setExportNotification] = useState(null);

  // Multi-receipt selection: Array of selected document IDs
  const [selectedDocIds, setSelectedDocIds] = useState(() => documents.map((d) => d.id));

  // Sync selectedDocIds when documents change
  useEffect(() => {
    setSelectedDocIds(documents.map((d) => d.id));
  }, [documents]);

  const ranges = ['All Time', 'This Month', 'Last Month', 'Q2 2025', 'Year to Date'];

  // Filter documents by range if applicable
  const filteredDocs = useMemo(() => {
    if (selectedRange === 'All Time') return documents;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return documents.filter((doc) => {
      if (!doc.date) return true;
      const docDate = new Date(doc.date);
      if (isNaN(docDate.getTime())) return true;

      if (selectedRange === 'This Month') {
        return docDate.getMonth() === currentMonth && docDate.getFullYear() === currentYear;
      }
      if (selectedRange === 'Last Month') {
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        return docDate.getMonth() === lastMonth && docDate.getFullYear() === lastMonthYear;
      }
      return true;
    });
  }, [documents, selectedRange]);

  // Toggle single document selection
  const handleToggleDoc = (docId) => {
    soundFx.playClick();
    setSelectedDocIds((prev) => {
      if (prev.includes(docId)) {
        return prev.filter((id) => id !== docId);
      } else {
        return [...prev, docId];
      }
    });
  };

  // Toggle select all documents
  const handleToggleSelectAllDocs = () => {
    soundFx.playClick();
    if (selectedDocIds.length === filteredDocs.length) {
      setSelectedDocIds([]);
    } else {
      setSelectedDocIds(filteredDocs.map((d) => d.id));
    }
  };

  // Handle download of selected receipts directly as Microsoft Excel (.xlsx)
  const handleDownload = async () => {
    const docsToExport = filteredDocs.filter((doc) => selectedDocIds.includes(doc.id));
    if (docsToExport.length === 0) {
      alert('Please select at least one document to download.');
      return;
    }

    soundFx.playLaserHum();
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `Resiboss_Expense_Report_${timestamp}.xlsx`;

    try {
      const res = await downloadReceiptsExcel(docsToExport, filename);

      soundFx.playSuccessChime();
      try {
        confetti({
          particleCount: 75,
          spread: 80,
          origin: { y: 0.65 },
          colors: ['#00f2fe', '#3b82f6', '#10b981', '#ffffff'],
        });
      } catch (e) {}

      setExportNotification({
        message: `Successfully generated Excel report (${docsToExport.length} receipts)!`,
        downloadUrl: res?.downloadUrl || null,
        filename,
      });
      setTimeout(() => setExportNotification(null), 8000);
    } catch (exportErr) {
      console.error('Export download error:', exportErr);
      alert('Export failed. Please check device permissions and try again.');
    }
  };

  return (
    <div className="" style={{ width: '100%', padding: 0 }}>
      {/* 1. Header Section */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {/* Left Title & Subtitle */}
        <div>
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              marginBottom: '2px',
            }}
          >
            {t.export.exportHeader}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            {t.export.exportSub}
          </p>
        </div>

        {/* Right Controls: Date Range dropdown + Multi Download Button */}
        <div className="export-header-controls" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Date Range Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setIsRangeOpen(!isRangeOpen)}
              style={{
                background: 'rgba(10, 16, 34, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.16)',
                borderRadius: '999px',
                padding: '8px 16px',
                color: '#cbd5e1',
                fontSize: '0.86rem',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <Calendar size={14} color="#94a3b8" />
              <span>{selectedRange}</span>
              <ChevronDown size={13} color="#94a3b8" />
            </button>

            {isRangeOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '115%',
                  right: 0,
                  background: '#090e21',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
                  padding: '6px',
                  width: '160px',
                  zIndex: 40,
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.7)',
                  animation: 'fadeIn 0.2s ease',
                }}
              >
                {ranges.map((r) => (
                  <div
                    key={r}
                    onClick={() => {
                      setSelectedRange(r);
                      setIsRangeOpen(false);
                      soundFx.playClick();
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      color: selectedRange === r ? '#00f2fe' : '#cbd5e1',
                      background: selectedRange === r ? 'rgba(0, 242, 254, 0.12)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    {r}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            style={{
              background: 'linear-gradient(135deg, #0284c7, #2563eb)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '999px',
              padding: '9px 20px',
              fontSize: '0.88rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 18px rgba(37, 99, 235, 0.4)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <Download size={16} />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Success Notification Toast */}
      {exportNotification && (
        <div
          style={{
            marginBottom: '16px',
            padding: '12px 18px',
            borderRadius: '12px',
            background: 'rgba(0, 242, 254, 0.12)',
            border: '1px solid rgba(0, 242, 254, 0.45)',
            color: '#38bdf8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
            fontSize: '0.88rem',
            fontWeight: 600,
            boxShadow: '0 0 25px rgba(0, 242, 254, 0.25)',
            animation: 'fadeIn 0.25s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={18} color="#00f2fe" style={{ flexShrink: 0 }} />
            <span>
              {typeof exportNotification === 'string'
                ? exportNotification
                : exportNotification.message}
            </span>
          </div>

          {typeof exportNotification === 'object' && exportNotification.downloadUrl && (
            <a
              href={exportNotification.downloadUrl}
              download={exportNotification.filename || 'Resiboss_Expense_Report.xlsx'}
              style={{
                background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                color: '#ffffff',
                padding: '7px 16px',
                borderRadius: '999px',
                fontSize: '0.82rem',
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 12px rgba(37, 99, 235, 0.45)',
                cursor: 'pointer',
              }}
            >
              <Download size={14} />
              <span>Tap to Save Excel (.xlsx)</span>
            </a>
          )}
        </div>
      )}

      {/* 2. Document Selection Table (Select Which Receipts to Include) */}
      <div
        className="glass-panel"
        style={{
          padding: '22px',
          borderRadius: '16px',
          border: '1px solid var(--glass-border)',
        }}
      >
        {/* Document Selection Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div>
            <h2
              style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              Select Receipts to Include in Export
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '3px 0 0 0' }}>
              {selectedDocIds.length} of {filteredDocs.length} receipts selected for export
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={handleToggleSelectAllDocs}
              style={{
                background: 'rgba(0, 242, 254, 0.12)',
                border: '1px solid rgba(0, 242, 254, 0.35)',
                color: '#38bdf8',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 600,
                padding: '6px 14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
              }}
            >
              {selectedDocIds.length === filteredDocs.length ? (
                <>
                  <CheckSquare size={14} />
                  <span>Deselect All</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>Select All ({filteredDocs.length})</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Documents Table */}
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.86rem',
              color: 'var(--text-primary)',
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid var(--glass-border)',
                  color: 'var(--text-secondary)',
                  textAlign: 'left',
                }}
              >
                <th style={{ padding: '10px 12px', width: '40px' }}>
                  <button
                    type="button"
                    onClick={handleToggleSelectAllDocs}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      color: selectedDocIds.length === filteredDocs.length ? '#00f2fe' : '#94a3b8',
                    }}
                  >
                    {selectedDocIds.length === filteredDocs.length && filteredDocs.length > 0 ? (
                      <CheckSquare size={17} />
                    ) : (
                      <Square size={17} />
                    )}
                  </button>
                </th>
                <th style={{ padding: '10px 12px' }}>Receipt ID</th>
                <th style={{ padding: '10px 12px' }}>Date</th>
                <th style={{ padding: '10px 12px' }}>Merchant / Vendor</th>
                <th style={{ padding: '10px 12px' }}>Category</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>VAT</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.length > 0 ? (
                filteredDocs.map((doc) => {
                  const isChecked = selectedDocIds.includes(doc.id);
                  return (
                    <tr
                      key={doc.id}
                      onClick={() => handleToggleDoc(doc.id)}
                      style={{
                        borderBottom: '1px solid var(--glass-border)',
                        background: isChecked ? 'var(--cyan-subtle)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = isChecked
                          ? 'rgba(0, 242, 254, 0.08)'
                          : 'rgba(255, 255, 255, 0.03)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = isChecked
                          ? 'rgba(0, 242, 254, 0.04)'
                          : 'transparent';
                      }}
                    >
                      <td style={{ padding: '12px' }}>
                        <div
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '5px',
                            border: isChecked ? 'none' : '2px solid var(--glass-border-bright)',
                            background: isChecked ? 'var(--cyan-glow)' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {isChecked && <Check size={13} color="#090e21" strokeWidth={3} />}
                        </div>
                      </td>
                      <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        {doc.id}
                      </td>
                      <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                        {doc.date}
                      </td>
                      <td style={{ padding: '12px', fontWeight: 600 }}>
                        {doc.merchant}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span
                          style={{
                            fontSize: '0.74rem',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: 'rgba(255, 255, 255, 0.06)',
                            color: 'var(--cyan-glow)',
                            border: '1px solid rgba(0, 242, 254, 0.25)',
                          }}
                        >
                          {doc.category || 'General'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#34d399', fontWeight: 600 }}>
                        {formatCurrency(doc.vat || 0)}
                      </td>
                      <td
                        style={{
                          padding: '12px',
                          textAlign: 'right',
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {formatCurrency(doc.total || 0)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No receipts found for the selected range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExportView;
