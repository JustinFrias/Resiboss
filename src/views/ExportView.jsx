import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { soundFx } from '../utils/soundEffects';
import confetti from 'canvas-confetti';
import {
  Download,
  Calendar,
  ChevronDown,
  CheckCircle2,
  FileSpreadsheet,
  Check,
  CheckSquare,
  Square,
  Layers,
  FileText,
} from 'lucide-react';

export const ExportView = () => {
  const { documents, t, formatCurrency } = useApp();

  // Multi-format selection: Array of selected format IDs ('purchases' | 'sales' | 'csv')
  const [selectedFormats, setSelectedFormats] = useState(['purchases', 'csv']);
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

  // Format cards configuration
  const formatOptions = [
    {
      id: 'purchases',
      title: t.export.purchasesJournal || 'Purchases & Expenses Journal',
      desc: t.export.purchasesDesc || 'Official BIR Monthly Purchases Ledger',
      recordLabel: (count) => `${count} expense records`,
    },
    {
      id: 'sales',
      title: t.export.vatSales || 'VAT Sales to be Reported',
      desc: t.export.vatSalesDesc || 'Official BIR Monthly VAT Sales Summary',
      recordLabel: () => '0 revenue records',
    },
    {
      id: 'csv',
      title: t.export.customCsv || 'Custom CSV',
      desc: t.export.customCsvDesc || 'All submitted documents, flat CSV format',
      recordLabel: (count) => `${count} submitted records`,
    },
  ];

  // Toggle format selection
  const handleToggleFormat = (formatId) => {
    soundFx.playClick();
    setSelectedFormats((prev) => {
      if (prev.includes(formatId)) {
        if (prev.length === 1) {
          // Keep at least one selected
          return prev;
        }
        return prev.filter((id) => id !== formatId);
      } else {
        return [...prev, formatId];
      }
    });
  };

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

  // Handle download of selected formats & receipts
  const handleDownload = () => {
    if (selectedFormats.length === 0) {
      alert('Please select at least one export format.');
      return;
    }

    const docsToExport = filteredDocs.filter((doc) => selectedDocIds.includes(doc.id));
    if (docsToExport.length === 0 && !selectedFormats.includes('sales')) {
      alert('Please select at least one document to download.');
      return;
    }

    soundFx.playLaserHum();
    const timestamp = new Date().toISOString().split('T')[0];

    selectedFormats.forEach((fmt, index) => {
      setTimeout(() => {
        let csvHeaders = [];
        let csvRows = [];

        if (fmt === 'purchases') {
          csvHeaders = [
            'Taxable Month',
            'Date',
            'Taxpayer TIN',
            'Supplier / Merchant Name',
            'Category',
            'Document Type',
            'Receipt / Invoice No',
            'Vatable Purchases',
            'Zero Rated',
            'Input Tax (12% VAT)',
            'Total Amount',
          ];

          csvRows = docsToExport.map((doc, idx) => {
            const vatExp = ((doc.total || 0) / 1.12).toFixed(2);
            const inputTax = (doc.vat || ((doc.total || 0) * 0.12) / 1.12).toFixed(2);
            const dateObj = doc.date ? new Date(doc.date) : new Date();
            const taxMonth = !isNaN(dateObj.getTime())
              ? dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
              : 'Current';

            return [
              `"${taxMonth}"`,
              `"${doc.date || ''}"`,
              `"${doc.tin || '000-000-000-000'}"`,
              `"${(doc.merchant || 'Store').replace(/"/g, '""')}"`,
              `"${doc.category || 'Business Expense'}"`,
              `"Official Receipt"`,
              `"${doc.id || 'OR-' + (idx + 1001)}"`,
              vatExp,
              '0.00',
              inputTax,
              (doc.total || 0).toFixed(2),
            ].join(',');
          });
        } else if (fmt === 'sales') {
          csvHeaders = [
            'Date',
            'Customer TIN',
            'Customer Name',
            'Invoice No',
            'Vatable Sales',
            'VAT Output (12%)',
            'Total Sales Amount',
          ];
          csvRows = [];
        } else {
          // Custom CSV - Clean, human-readable column headers without raw database underscores
          csvHeaders = [
            'Receipt ID',
            'Date',
            'Merchant Name',
            'TIN',
            'Category',
            'Payment Method',
            'Status',
            'Subtotal (Net of VAT)',
            'VAT Amount (12%)',
            'Total Amount (PHP)',
          ];
          csvRows = docsToExport.map((doc) => [
            `"${(doc.id || '').replace(/"/g, '""')}"`,
            `"${(doc.date || '').replace(/"/g, '""')}"`,
            `"${(doc.merchant || 'Unknown Merchant').replace(/"/g, '""')}"`,
            `"${(doc.tin || 'N/A').replace(/"/g, '""')}"`,
            `"${(doc.category || 'General').replace(/"/g, '""')}"`,
            `"${(doc.paymentMethod || 'Cash').replace(/"/g, '""')}"`,
            `"${(doc.status || 'Verified').replace(/"/g, '""')}"`,
            ((doc.subtotal || (doc.total ? doc.total / 1.12 : 0))).toFixed(2),
            ((doc.vat || (doc.total ? (doc.total * 0.12) / 1.12 : 0))).toFixed(2),
            ((doc.total || 0)).toFixed(2),
          ].join(','));
        }

        const csvContent = '\uFEFF' + [csvHeaders.join(','), ...csvRows].join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', downloadUrl);
        link.setAttribute('download', `Resiboss_${fmt}_Journal_${timestamp}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
      }, index * 300);
    });

    setTimeout(() => {
      soundFx.playSuccessChime();
      try {
        confetti({
          particleCount: 75,
          spread: 80,
          origin: { y: 0.65 },
          colors: ['#00f2fe', '#3b82f6', '#10b981', '#ffffff'],
        });
      } catch (e) {}

      setExportNotification(
        `Downloaded ${selectedFormats.length} file(s) with ${docsToExport.length} receipt record(s)!`
      );
      setTimeout(() => setExportNotification(null), 4500);
    }, selectedFormats.length * 300 + 100);
  };

  const activeRecordsCount = filteredDocs.filter((d) => selectedDocIds.includes(d.id)).length;

  return (
    <div className="view-page" style={{ width: '100%', padding: 0 }}>
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
            <span>
              Download Selected ({selectedFormats.length} {selectedFormats.length === 1 ? 'file' : 'files'})
            </span>
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
            gap: '10px',
            fontSize: '0.88rem',
            fontWeight: 600,
            boxShadow: '0 0 25px rgba(0, 242, 254, 0.25)',
            animation: 'fadeIn 0.25s ease',
          }}
        >
          <CheckCircle2 size={18} color="#00f2fe" />
          <span>{exportNotification}</span>
        </div>
      )}

      {/* 2. Format Selection Cards Section (Multi-Selectable) */}
      <div
        className="glass-panel"
        style={{
          padding: '22px',
          marginBottom: '20px',
          borderRadius: '16px',
          border: '1px solid var(--glass-border)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h2
              style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              {t.export.formatSelect || 'Export Formats'}
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '3px 0 0 0' }}>
              Choose which formats to export (click to toggle multiple formats)
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setSelectedFormats(['purchases', 'sales', 'csv']);
              }}
              style={{
                background: 'var(--cyan-subtle)',
                border: '1px solid var(--glass-border)',
                borderRadius: '8px',
                color: 'var(--cyan-glow)',
                fontSize: '0.78rem',
                fontWeight: 600,
                padding: '5px 10px',
                cursor: 'pointer',
              }}
            >
              Select All Formats
            </button>
          </div>
        </div>

        {/* 3 Format Cards Grid */}
        <div
          className="export-format-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '16px',
          }}
        >
          {formatOptions.map((fmt) => {
            const isSelected = selectedFormats.includes(fmt.id);
            return (
              <div
                key={fmt.id}
                onClick={() => handleToggleFormat(fmt.id)}
                style={{
                  padding: '16px 18px',
                  borderRadius: '14px',
                  background: isSelected ? 'var(--cyan-subtle)' : 'var(--bg-surface-elevated)',
                  border: isSelected ? '2px solid var(--cyan-glow)' : '1px solid var(--glass-border)',
                  boxShadow: isSelected ? '0 0 20px var(--cyan-subtle)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.22s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '110px',
                  position: 'relative',
                  userSelect: 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                  <div>
                    <div style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '3px' }}>
                      {fmt.title}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                      {fmt.desc}
                    </div>
                  </div>

                  {/* Multi-Select Checkbox Badge */}
                    <div
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '7px',
                        border: isSelected ? 'none' : '2px solid var(--glass-border-bright)',
                        background: isSelected ? 'var(--cyan-glow)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: isSelected ? '0 0 10px rgba(0, 242, 254, 0.4)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {isSelected && <Check size={14} color="#090e21" strokeWidth={3} />}
                    </div>
                </div>

                <div
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: isSelected ? 'var(--cyan-glow)' : 'var(--text-muted)',
                    marginTop: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <FileSpreadsheet size={14} />
                  <span>{fmt.recordLabel(activeRecordsCount)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Document Selection Table (Select Which Receipts to Include) */}
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
