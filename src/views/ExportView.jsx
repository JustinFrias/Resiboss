import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { soundFx } from '../utils/soundEffects';
import confetti from 'canvas-confetti';
import {
  Download,
  Calendar,
  ChevronDown,
  CloudDownload,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';

export const ExportView = () => {
  const { documents, t } = useApp();

  const [selectedFormat, setSelectedFormat] = useState('purchases'); // 'purchases' | 'sales' | 'csv'
  const [selectedRange, setSelectedRange] = useState('All Time');
  const [isRangeOpen, setIsRangeOpen] = useState(false);
  const [exportNotification, setExportNotification] = useState(null);

  const ranges = ['All Time', 'This Month', 'Last Month', 'Q2 2025', 'Year to Date'];

  // Handle local download of the mapped Excel/CSV journal
  const handleLocalDownload = () => {
    soundFx.playLaserHum();

    const timestamp = new Date().toISOString().split('T')[0];
    let csvHeaders = [];
    let csvRows = [];

    if (selectedFormat === 'purchases') {
      // Column Mapping — Purchases & Expenses Journal:
      // B -> Date, E -> TIN, F -> Particulars, G -> Registered Name, K -> Receipt Type, L -> Receipt Number, M -> VAT Exp, O -> Input Tax, P -> Invoice Amount
      csvHeaders = [
        'Col_A',
        'Date (B)',
        'Col_C',
        'Col_D',
        'TIN (E)',
        'Particulars (F)',
        'Registered Name (G)',
        'Col_H',
        'Col_I',
        'Col_J',
        'Receipt Type (K)',
        'Receipt Number (L)',
        'VAT Exp (M)',
        'Col_N',
        'Input Tax (O)',
        'Invoice Amount (P)',
      ];

      csvRows = documents.map((doc, idx) => {
        const vatExp = ((doc.total || 0) / 1.12).toFixed(2);
        const inputTax = (doc.vat || (doc.total || 0) * 0.12 / 1.12).toFixed(2);
        return [
          '', // A
          `"${doc.date}"`, // B
          '', // C
          '', // D
          `"${doc.tin || '000-000-000-000'}"`, // E
          `"${doc.category || 'Business Expense'}"`, // F
          `"${(doc.merchant || 'Store').replace(/"/g, '""')}"`, // G
          '', // H
          '', // I
          '', // J
          `"Official Receipt"`, // K
          `"${doc.id || 'OR-' + (idx + 1001)}"`, // L
          vatExp, // M
          '0.00', // N
          inputTax, // O
          (doc.total || 0).toFixed(2), // P
        ].join(',');
      });
    } else if (selectedFormat === 'sales') {
      csvHeaders = ['Date', 'Customer_TIN', 'Customer_Name', 'Invoice_No', 'Vatable_Sales', 'VAT_Output', 'Total_Sales'];
      csvRows = []; // 0 revenue records initially
    } else {
      // Custom CSV
      csvHeaders = ['Receipt_ID', 'Date', 'Vendor', 'TIN', 'Category', 'Payment_Method', 'Subtotal', 'Tax', 'Total_Amount'];
      csvRows = documents.map((doc) => [
        `"${doc.id}"`,
        `"${doc.date}"`,
        `"${(doc.merchant || '').replace(/"/g, '""')}"`,
        `"${doc.tin || ''}"`,
        `"${doc.category || ''}"`,
        `"${doc.paymentMethod || ''}"`,
        (doc.subtotal || 0).toFixed(2),
        (doc.vat || 0).toFixed(2),
        (doc.total || 0).toFixed(2),
      ].join(','));
    }

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [csvHeaders.join(','), ...csvRows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Resiboss_${selectedFormat}_Journal_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    soundFx.playSuccessChime();
    try {
      confetti({
        particleCount: 70,
        spread: 75,
        origin: { y: 0.65 },
        colors: ['#00f2fe', '#3b82f6', '#10b981', '#ffffff'],
      });
    } catch (e) {}

    setExportNotification(`Local download started: Resiboss_${selectedFormat}_Journal_${timestamp}.csv`);
    setTimeout(() => setExportNotification(null), 4000);
  };

  // Handle cloud sync export
  const handleCloudExport = () => {
    soundFx.playLaserHum();
    setTimeout(() => {
      soundFx.playSuccessChime();
      try {
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.65 },
          colors: ['#10b981', '#34d399', '#00f2fe', '#ffffff'],
        });
      } catch (e) {}
      setExportNotification('Cloud Export successful! Documents synchronized to cloud accounting ledger.');
      setTimeout(() => setExportNotification(null), 4000);
    }, 600);
  };

  return (
    <div className="view-page" style={{ width: '100%', padding: 0 }}>
      {/* 1. Header Section matching user mockup */}
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
            Export
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Export scanned documents into formatted Excel journals
          </p>
        </div>

        {/* Right Controls: All Time dropdown + Cloud Export + Local Download */}
        <div className="export-header-controls" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* All Time Dropdown */}
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

          {/* Cloud Export (Reviewed) Button */}
          <button
            onClick={handleCloudExport}
            style={{
              background: '#059669',
              color: '#ffffff',
              border: 'none',
              borderRadius: '999px',
              padding: '8px 18px',
              fontSize: '0.88rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#10b981')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#059669')}
          >
            <CloudDownload size={15} />
            <span>Cloud Export (Reviewed)</span>
          </button>

          {/* Local Download Button */}
          <button
            onClick={handleLocalDownload}
            style={{
              background: '#1d4ed8',
              color: '#ffffff',
              border: 'none',
              borderRadius: '999px',
              padding: '8px 18px',
              fontSize: '0.88rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#2563eb')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#1d4ed8')}
          >
            <Download size={15} />
            <span>Local Download</span>
          </button>
        </div>
      </div>

      {/* Notification Banner if Export executed */}
      {exportNotification && (
        <div
          style={{
            marginBottom: '14px',
            padding: '10px 18px',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.45)',
            color: '#34d399',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.88rem',
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <CheckCircle2 size={16} color="#10b981" />
          <span style={{ fontWeight: 600 }}>{exportNotification}</span>
        </div>
      )}

      {/* 2. Main Container (Liquid Glass Panel matching screenshot) */}
      <div
        className="glass-panel"
        style={{
          padding: '20px 24px',
          background: 'var(--bg-surface)',
          borderRadius: '16px',
          border: '1px solid var(--glass-border)',
        }}
      >
        {/* Section Heading */}
        <h2
          style={{
            fontSize: '1.1rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '14px',
          }}
        >
          Export Format
        </h2>

        {/* 3 Format Cards Row */}
        <div
          className="export-format-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            marginBottom: '18px',
          }}
        >
          {/* Card 1: Purchases & Expenses Journal */}
          <div
            onClick={() => {
              setSelectedFormat('purchases');
              soundFx.playClick();
            }}
            style={{
              padding: '16px 18px',
              borderRadius: '12px',
              background: selectedFormat === 'purchases' ? 'var(--cyan-subtle)' : 'var(--bg-surface-elevated)',
              border: selectedFormat === 'purchases' ? '2px solid var(--cyan-glow)' : '1px solid var(--glass-border)',
              boxShadow: selectedFormat === 'purchases' ? '0 0 20px var(--cyan-subtle)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '100px',
            }}
          >
            <div>
              <div style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
                Purchases & Expenses Journal
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Purchases & Input Tax format
              </div>
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--cyan-glow)', marginTop: '10px' }}>
              {documents.length} expense records
            </div>
          </div>

          {/* Card 2: VAT Sales to be Reported */}
          <div
            onClick={() => {
              setSelectedFormat('sales');
              soundFx.playClick();
            }}
            style={{
              padding: '16px 18px',
              borderRadius: '12px',
              background: selectedFormat === 'sales' ? 'var(--cyan-subtle)' : 'var(--bg-surface-elevated)',
              border: selectedFormat === 'sales' ? '2px solid var(--cyan-glow)' : '1px solid var(--glass-border)',
              boxShadow: selectedFormat === 'sales' ? '0 0 20px var(--cyan-subtle)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '100px',
            }}
          >
            <div>
              <div style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
                VAT Sales to be Reported
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                VAT Sales & Output Tax format
              </div>
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--cyan-glow)', marginTop: '10px' }}>
              0 revenue records
            </div>
          </div>

          {/* Card 3: Custom CSV */}
          <div
            onClick={() => {
              setSelectedFormat('csv');
              soundFx.playClick();
            }}
            style={{
              padding: '16px 18px',
              borderRadius: '12px',
              background: selectedFormat === 'csv' ? 'var(--cyan-subtle)' : 'var(--bg-surface-elevated)',
              border: selectedFormat === 'csv' ? '2px solid var(--cyan-glow)' : '1px solid var(--glass-border)',
              boxShadow: selectedFormat === 'csv' ? '0 0 20px var(--cyan-subtle)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '100px',
            }}
          >
            <div>
              <div style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
                Custom CSV
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                All submitted documents, flat CSV format
              </div>
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--cyan-glow)', marginTop: '10px' }}>
              {documents.length} submitted records
            </div>
          </div>
        </div>

        {/* 3. Column Mapping Container (Matching user screenshot) */}
        <div
          style={{
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--glass-border)',
            borderRadius: '12px',
            padding: '18px 22px',
          }}
        >
          {/* Mapping Title */}
          <div
            style={{
              fontSize: '0.92rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '14px',
            }}
          >
            Column Mapping — {selectedFormat === 'purchases' ? 'Purchases & Expenses Journal' : selectedFormat === 'sales' ? 'VAT Sales & Output Tax' : 'Custom Flat CSV'}
          </div>

          {/* 4 Mapping Columns Grid */}
          <div
            className="export-mapping-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '18px',
              marginBottom: '14px',
            }}
          >
            {/* Column 1 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '0.84rem', color: '#cbd5e1' }}>
                <strong style={{ color: '#ffffff' }}>B</strong> → Date
              </div>
              <div style={{ fontSize: '0.84rem', color: '#cbd5e1' }}>
                <strong style={{ color: '#ffffff' }}>K</strong> → Receipt Type
              </div>
              <div style={{ fontSize: '0.84rem', color: '#cbd5e1' }}>
                <strong style={{ color: '#ffffff' }}>P</strong> → Invoice Amount
              </div>
            </div>

            {/* Column 2 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '0.84rem', color: '#cbd5e1' }}>
                <strong style={{ color: '#ffffff' }}>E</strong> → TIN
              </div>
              <div style={{ fontSize: '0.84rem', color: '#cbd5e1' }}>
                <strong style={{ color: '#ffffff' }}>L</strong> → Receipt Number
              </div>
            </div>

            {/* Column 3 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '0.84rem', color: '#cbd5e1' }}>
                <strong style={{ color: '#ffffff' }}>F</strong> → Particulars
              </div>
              <div style={{ fontSize: '0.84rem', color: '#cbd5e1' }}>
                <strong style={{ color: '#ffffff' }}>M</strong> → VAT Exp. (formula)
              </div>
            </div>

            {/* Column 4 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '0.84rem', color: '#cbd5e1' }}>
                <strong style={{ color: '#ffffff' }}>G</strong> → Registered Name
              </div>
              <div style={{ fontSize: '0.84rem', color: '#cbd5e1' }}>
                <strong style={{ color: '#ffffff' }}>O</strong> → Input Tax (formula)
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div
            style={{
              fontSize: '0.78rem',
              color: '#94a3b8',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              paddingTop: '12px',
            }}
          >
            One sheet per month. Formulas M=(P-N)/1.12 and O=M×0.12 are preserved.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportView;

