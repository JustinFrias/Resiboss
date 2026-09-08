import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, RotateCw, Sparkles, CheckCircle2, ShieldCheck, Download, Trash2, Tag, Calendar, Building2, Receipt } from 'lucide-react';

export const ReceiptViewer3D = () => {
  const { inspectingDoc, setInspectingDoc, updateDocument, deleteDocument, formatCurrency, t } = useApp();
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isFlipped, setIsFlipped] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const isMobile = windowWidth <= 768;
  const baseScale = isMobile ? Math.max(0.46, Math.min(0.56, (windowWidth - 32) / 620)) : 1;

  if (!inspectingDoc) return null;

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - rotation.y * 3, y: e.clientY - rotation.x * 3 });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const newY = (e.clientX - dragStart.x) / 3;
    const newX = (e.clientY - dragStart.y) / 3;
    // Constrain X to prevent flipping upside down unintentionally
    const clampedX = Math.max(-45, Math.min(45, newX));
    setRotation({ x: clampedX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for Android / touchscreen devices
  const handleTouchStart = (e) => {
    if (e.touches && e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - rotation.y * 3, y: touch.clientY - rotation.x * 3 });
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !e.touches || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const newY = (touch.clientX - dragStart.x) / 3;
    const newX = (touch.clientY - dragStart.y) / 3;
    const clampedX = Math.max(-45, Math.min(45, newX));
    setRotation({ x: clampedX, y: newY });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const toggleFlip = () => {
    setIsFlipped(!isFlipped);
    setRotation((prev) => ({ ...prev, y: prev.y + 180 }));
  };

  const handleStatusToggle = () => {
    const nextStatus = inspectingDoc.status === 'Verified' ? 'Pending' : 'Verified';
    updateDocument(inspectingDoc.id, { status: nextStatus });
  };

  return (
    <div
      className="modal-3d-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(3, 7, 18, 0.82)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        animation: 'pageFade3D 0.3s ease-out forwards',
      }}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
    >
      <div
        className="glass-panel modal-3d-card"
        style={{
          width: '100%',
          maxWidth: '1100px',
          maxHeight: '90vh',
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          border: '1px solid rgba(255, 255, 255, 0.22)',
          boxShadow: '0 25px 60px -15px rgba(0, 242, 254, 0.25)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Mobile floating close button (always visible at top right) */}
        <button
          onClick={() => setInspectingDoc(null)}
          className="modal-3d-mobile-close"
          title="Close Inspection"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            zIndex: 60,
            background: 'rgba(5, 8, 20, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            borderRadius: '50%',
            width: '38px',
            height: '38px',
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.6)',
          }}
        >
          <X size={18} />
        </button>

        {/* Left Side: 3D Interactive Physical Receipt Canvas */}
        <div
          className="modal-3d-canvas-wrap"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(14, 25, 55, 0.8), rgba(5, 8, 20, 0.95))',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '30px',
            userSelect: 'none',
            cursor: isDragging ? 'grabbing' : 'grab',
            perspective: '1200px',
            overflow: 'hidden',
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          {/* Subtle Grid / Measurement background */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'radial-gradient(rgba(0, 242, 254, 0.12) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
              opacity: 0.5,
              pointerEvents: 'none',
            }}
          />

          {/* 3D Model Controls HUD */}
          <div
            style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              display: 'flex',
              gap: '8px',
              zIndex: 20,
            }}
          >
            <button
              onClick={toggleFlip}
              className="liquid-btn liquid-btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              title="Flip Receipt"
            >
              <RotateCw size={14} /> Flip 180°
            </button>
            <button
              onClick={() => { setRotation({ x: 0, y: 0 }); setZoom(1); }}
              className="liquid-btn liquid-btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            >
              Reset 3D
            </button>
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              left: '16px',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Sparkles size={13} color="#00f2fe" />
            <span>{isMobile ? 'Drag to rotate • Scroll down for details' : 'Click & drag to rotate in 3D space'}</span>
          </div>

          {/* 3D Physical Paper Receipt */}
          <div
            className="receipt-3d-paper"
            style={{
              transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(${zoom * baseScale})`,
              transformStyle: 'preserve-3d',
              transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              width: '320px',
              minHeight: '460px',
              position: 'relative',
              filter: 'drop-shadow(0 20px 30px rgba(0, 0, 0, 0.7))',
            }}
          >
            {/* Front Paper Face */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: '#fafaf9',
                color: '#1c1917',
                borderRadius: '6px',
                padding: '24px 20px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.82rem',
                backfaceVisibility: 'hidden',
                boxShadow: 'inset 0 0 40px rgba(0,0,0,0.04)',
                border: '1px solid #e7e5e4',
                overflow: 'hidden',
              }}
            >
              {/* Paper zigzag jagged cut at top */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'repeating-linear-gradient(45deg, #1c1917 0, #1c1917 2px, transparent 2px, transparent 4px)',
                  opacity: 0.15,
                }}
              />

              {/* Holographic Seal Badge */}
              <div
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #00f2fe, #a855f7, #f59e0b, #10b981)',
                  opacity: 0.85,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  boxShadow: '0 0 10px rgba(0, 242, 254, 0.5)',
                  fontSize: '0.6rem',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  transform: 'rotate(-15deg)',
                }}
              >
                VERIFIED
              </div>

              <div style={{ textAlign: 'center', marginBottom: '14px', borderBottom: '1px dashed #d6d3d1', paddingBottom: '12px' }}>
                <div style={{ fontSize: '1rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {inspectingDoc.merchant}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#78716c', marginTop: '2px' }}>
                  TIN: {inspectingDoc.tin || '000-000-000-000'}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#78716c' }}>
                  {inspectingDoc.date} • {inspectingDoc.time}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#a8a29e', marginTop: '3px' }}>
                  DIGITAL RECEIPT #{inspectingDoc.id}
                </div>
              </div>

              {/* Items List */}
              <div style={{ marginBottom: '14px', minHeight: '140px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#78716c', marginBottom: '6px' }}>
                  <span>ITEM</span>
                  <span>AMT</span>
                </div>
                {(inspectingDoc.items || []).map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.78rem' }}>
                    <span style={{ maxWidth: '210px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.qty}x {item.name}
                    </span>
                    <span style={{ fontWeight: 600 }}>₱{item.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Totals Calculation */}
              <div style={{ borderTop: '1px dashed #d6d3d1', paddingTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '3px' }}>
                  <span style={{ color: '#78716c' }}>Subtotal:</span>
                  <span>₱{(inspectingDoc.subtotal || 0).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px' }}>
                  <span style={{ color: '#78716c' }}>VAT (12%):</span>
                  <span>₱{(inspectingDoc.vat || 0).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 'bold', borderTop: '1px solid #1c1917', paddingTop: '6px' }}>
                  <span>TOTAL:</span>
                  <span>₱{(inspectingDoc.total || 0).toFixed(2)}</span>
                </div>
              </div>

              {/* Barcode representation */}
              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <div
                  style={{
                    height: '28px',
                    background: 'repeating-linear-gradient(90deg, #1c1917 0, #1c1917 2px, transparent 2px, transparent 4px, #1c1917 4px, #1c1917 7px, transparent 7px, transparent 9px)',
                    margin: '0 auto',
                    width: '80%',
                    opacity: 0.8,
                  }}
                />
                <div style={{ fontSize: '0.62rem', color: '#78716c', marginTop: '4px' }}>
                  AUTHENTICATED BY RESIBOSS 3D OCR
                </div>
              </div>
            </div>

            {/* Back Paper Face (for 3D flip inspection) */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: '#f5f5f4',
                color: '#78716c',
                borderRadius: '6px',
                padding: '24px 20px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                transform: 'rotateY(180deg)',
                backfaceVisibility: 'hidden',
                boxShadow: 'inset 0 0 30px rgba(0,0,0,0.06)',
                border: '1px solid #e7e5e4',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#44403c', marginBottom: '8px' }}>
                  DOCUMENT RECORD
                </div>
                <p style={{ fontSize: '0.7rem', lineHeight: '1.4', marginBottom: '12px' }}>
                  This electronic record is stored in your personal Resiboss Document Vault for expense tracking and bookkeeping reference.
                </p>
                <div style={{ padding: '10px', background: '#e7e5e4', borderRadius: '4px', fontSize: '0.68rem', marginBottom: '12px' }}>
                  <div><strong>HASH:</strong> SHA256-7f8a92...</div>
                  <div><strong>RECORD_STATUS:</strong> {inspectingDoc.status}</div>
                </div>
              </div>
              <div style={{ textAlign: 'center', opacity: 0.4 }}>
                <Receipt size={48} style={{ margin: '0 auto' }} />
                <div style={{ fontSize: '0.65rem', marginTop: '6px' }}>VERIFIED DIGITAL ARCHIVE</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Detailed Metadata & Inspector Drawer */}
        <div
          className="modal-3d-details-wrap"
          style={{
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: 'var(--bg-surface-elevated)',
            overflowY: 'auto',
          }}
        >
          <div>
            {/* Header with Close */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`liquid-badge ${inspectingDoc.status === 'Verified' ? 'liquid-badge-emerald' : 'liquid-badge-amber'}`}>
                    <ShieldCheck size={12} /> {inspectingDoc.status}
                  </span>
                  <span className="liquid-badge liquid-badge-cyan">
                    <Tag size={12} /> {t.categories[inspectingDoc.category] || inspectingDoc.category}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '10px', color: 'var(--text-primary)' }}>
                  {inspectingDoc.merchant}
                </h3>
              </div>

              <button
                onClick={() => setInspectingDoc(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Stats Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '20px',
              }}
            >
              <div style={{ background: 'var(--bg-surface, rgba(10, 15, 30, 0.5))', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t.documents.convertedTotal}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--cyan-glow)', marginTop: '2px' }}>
                  {formatCurrency(inspectingDoc.total)}
                </div>
              </div>
              <div style={{ background: 'var(--bg-surface, rgba(10, 15, 30, 0.5))', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t.scanner.confidence}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--emerald-glow)', marginTop: '2px' }}>
                  {inspectingDoc.confidence ? `${inspectingDoc.confidence}%` : 'N/A'}
                </div>
              </div>
            </div>

            {/* Metadata Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--glass-border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{t.documents.tableId}:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{inspectingDoc.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--glass-border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{t.scanner.invoiceNo}:</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{inspectingDoc.tin}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--glass-border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{t.scanner.paymentMethod}:</span>
                <span style={{ fontWeight: 500 }}>{inspectingDoc.paymentMethod}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--glass-border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{t.documents.totalDeductibleVat}:</span>
                <span style={{ fontWeight: 600, color: '#34d399' }}>{formatCurrency(inspectingDoc.vat)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Notes:</span>
                <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>{inspectingDoc.notes || 'No annotations added'}</span>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '24px', paddingTop: '18px', borderTop: '1px solid var(--glass-border)' }}>
            <button
              onClick={() => {
                deleteDocument(inspectingDoc.id);
                setInspectingDoc(null);
              }}
              className="liquid-btn liquid-btn-secondary"
              style={{
                flex: 1,
                justifyContent: 'center',
                color: '#f87171',
                borderColor: 'rgba(239, 68, 68, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
              }}
              title={t.documents.delete}
            >
              <Trash2 size={16} />
              <span>{t.documents.delete || 'Delete Receipt'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
