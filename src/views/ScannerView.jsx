import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { extractReceiptWithOCR } from '../utils/receiptOcrParser';
import { soundFx } from '../utils/soundEffects';
import {
  Camera,
  FileText,
  Sparkles,
  Upload,
  CheckCircle2,
  ScanLine,
  X,
  RefreshCw,
  AlertCircle,
  ArrowLeft,
  Eye,
  Plus,
  Trash2,
} from 'lucide-react';

export const ScannerView = () => {
  const { addDocument, setInspectingDoc, formatCurrency, t } = useApp();

  // Mode: 'idle' (Clean Scan Buddy) | 'camera' (taking live photo) | 'scanned' (extracted results)
  const [scanMode, setScanMode] = useState('idle');

  // File & Scanned receipt state
  const [selectedFileImage, setSelectedFileImage] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStepText, setScanStepText] = useState('');
  const [detectedBoxes, setDetectedBoxes] = useState([]);
  const [currentReceipt, setCurrentReceipt] = useState(null);
  const [showRawOcr, setShowRawOcr] = useState(false);

  // Camera state
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Drag & drop
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef(null);

  // Stop Webcam
  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraError(null);
  };

  // Start Webcam
  const handleStartCamera = async () => {
    stopWebcam();
    setSelectedFileImage(null);
    setCameraError(null);
    setScanMode('camera');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      soundFx.playClick();
    } catch (err) {
      console.warn('Webcam error:', err);
      setCameraError('Hindi mabuksan ang camera. Pakitiyak na pinayagan ang camera permission o mag-upload ng file ng resibo.');
    }
  };

  // Capture frame from webcam
  const handleCaptureWebcam = () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

      setSelectedFileImage(dataUrl);
      setSelectedFileName('Camera_Receipt_' + new Date().toLocaleTimeString().replace(/:/g, '-') + '.jpg');
      stopWebcam();

      runRealOcr(dataUrl, 'Camera Photo Receipt');
    } catch (e) {
      console.error(e);
    }
  };

  // Process File Upload
  const processUploadedFile = (file) => {
    if (!file) return;
    stopWebcam();
    const reader = new FileReader();
    reader.onload = (event) => {
      const imgData = event.target.result;
      setSelectedFileImage(imgData);
      setSelectedFileName(file.name);

      runRealOcr(imgData, file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processUploadedFile(file);
  };

  // Drag & drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processUploadedFile(file);
  };

  // Run Real Tesseract OCR Extraction
  const runRealOcr = async (imageUri, filename = '') => {
    setScanMode('scanned');
    setIsScanning(true);
    setScanProgress(5);
    setScanStepText('Analyzing physical receipt image...');
    setDetectedBoxes([]);
    soundFx.playLaserHum();

    try {
      const ocrResult = await extractReceiptWithOCR(imageUri, (progress, step) => {
        setScanProgress(progress);
        setScanStepText(step);
        if (progress % 25 === 0) soundFx.playScanBlip();
      });

      const completeReceipt = {
        ...ocrResult,
        id: `REC-2026-${Math.floor(100 + Math.random() * 900)}`,
        imageUri: imageUri,
        fileName: filename,
      };

      setCurrentReceipt(completeReceipt);
      setDetectedBoxes(ocrResult.detectedBoxes || []);
      setIsScanning(false);
      soundFx.playSuccessChime();
    } catch (err) {
      console.error('OCR run error:', err);
      setIsScanning(false);
    }
  };

  const handleSaveDocument = () => {
    if (!currentReceipt) return;
    const saved = addDocument(currentReceipt);
    setInspectingDoc(saved);
  };

  const handleResetToIdle = () => {
    stopWebcam();
    setSelectedFileImage(null);
    setSelectedFileName('');
    setCurrentReceipt(null);
    setScanMode('idle');
    soundFx.playClick();
  };

  // Edit item inside extracted receipt
  const handleItemChange = (index, field, value) => {
    if (!currentReceipt) return;
    const updatedItems = [...(currentReceipt.items || [])];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    if (field === 'price' || field === 'qty') {
      const qty = parseFloat(updatedItems[index].qty) || 1;
      const price = parseFloat(updatedItems[index].price) || 0;
      updatedItems[index].total = qty * price;
    }

    const newSubtotal = updatedItems.reduce((acc, it) => acc + (parseFloat(it.total) || 0), 0);
    const newVat = +(newSubtotal * 0.12).toFixed(2);
    const newTotal = +(newSubtotal + newVat).toFixed(2);

    setCurrentReceipt({
      ...currentReceipt,
      items: updatedItems,
      subtotal: newSubtotal,
      vat: newVat,
      total: newTotal,
    });
  };

  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []);

  return (
    <div className="view-page" style={{ width: '100%', padding: 0 }}>
      {/* 1. When in Idle Mode: Centered Resiboss Scan Layout */}
      {scanMode === 'idle' ? (
        <div style={{ maxWidth: '720px', margin: '12px auto 0 auto', width: '100%' }}>
          {/* Centered Title & Subtitle */}
          <div style={{ textAlign: 'center', marginBottom: '18px' }}>
            <h1
              style={{
                fontSize: '2.1rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
                marginBottom: '4px',
              }}
            >
              Resiboss Scan
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', margin: 0 }}>
              Upload or photograph receipts — AI extracts vendor, amounts, VAT & line items instantly.
            </p>
          </div>

          {/* Two Primary Cards: Take Photo & Upload File */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '18px',
              marginBottom: '14px',
            }}
          >
            {/* Card 1: Take Photo */}
            <div
              onClick={handleStartCamera}
              className="glass-panel glass-panel-interactive"
              style={{
                padding: '28px 18px',
                borderRadius: '16px',
                border: '1px solid var(--glass-border)',
                background: 'var(--bg-surface)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-glass)',
                transition: 'all 0.3s ease',
              }}
            >
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: 'var(--cyan-subtle)',
                  border: '1px solid var(--cyan-glow)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '12px',
                  boxShadow: '0 0 16px var(--cyan-subtle)',
                }}
              >
                <Camera size={24} color="var(--cyan-glow)" />
              </div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Take Photo
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                Use your camera to photograph a receipt
              </p>
            </div>

            {/* Card 2: Upload File */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className="glass-panel glass-panel-interactive"
              style={{
                padding: '28px 18px',
                borderRadius: '16px',
                border: isDragOver ? '2px dashed var(--cyan-glow)' : '1px solid var(--glass-border)',
                background: isDragOver
                  ? 'radial-gradient(circle at 50% 30%, var(--cyan-subtle), var(--bg-surface-elevated))'
                  : 'var(--bg-surface)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                cursor: 'pointer',
                boxShadow: isDragOver ? '0 0 30px var(--cyan-subtle)' : 'var(--shadow-glass)',
                transition: 'all 0.3s ease',
              }}
            >
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: 'var(--cyan-subtle)',
                  border: '1px solid var(--cyan-glow)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '12px',
                  boxShadow: '0 0 16px var(--cyan-subtle)',
                }}
              >
                <FileText size={24} color="var(--cyan-glow)" />
              </div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Upload File
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                JPG, PNG, WEBP, or GIF
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {/* AI Extraction Callout Banner */}
          <div
            className="glass-panel"
            style={{
              padding: '14px 18px',
              borderRadius: '14px',
              marginBottom: '14px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--glass-border)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
            }}
          >
            <Sparkles size={18} color="var(--cyan-glow)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
                AI-powered document extraction
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Extracts vendor, TIN, OR number, date, amounts, VAT breakdown, and line items.
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Header when in camera or scanned mode */
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1
              style={{
                fontSize: '2rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: '#ffffff',
                marginBottom: '4px',
              }}
            >
              Resiboss Scan
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem', margin: 0 }}>
              Upload or photograph receipts — AI extracts vendor, amounts, VAT & line items instantly.
            </p>
          </div>

          <button
            onClick={handleResetToIdle}
            className="liquid-btn liquid-btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px', fontSize: '0.88rem' }}
          >
            <ArrowLeft size={16} />
            <span>Scan Another Receipt</span>
          </button>
        </div>
      )}

      {cameraError && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#fca5a5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            marginBottom: '24px',
            fontSize: '0.88rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} />
            <span>{cameraError}</span>
          </div>
          <button
            onClick={() => setCameraError(null)}
            className="liquid-btn liquid-btn-secondary"
            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 4. Live Camera Viewfinder Modal/Drawer if Camera is Active */}
      {scanMode === 'camera' && (
        <div
          className="glass-panel"
          style={{
            padding: '24px',
            marginBottom: '26px',
            border: '1px solid rgba(0, 242, 254, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="liquid-badge liquid-badge-cyan">
                <Camera size={13} /> LIVE VIEWFINDER
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Itapat ang resibo sa gitna ng kamera
              </span>
            </div>
            <button
              onClick={handleResetToIdle}
              className="liquid-btn liquid-btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            >
              <X size={15} /> Close Camera
            </button>
          </div>

          <div
            className="scanner-viewport"
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '680px',
              height: '420px',
              borderRadius: '16px',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#000',
            }}
          >
            <div style={{ position: 'absolute', top: '16px', left: '16px', width: '32px', height: '32px', borderTop: '3px solid #00f2fe', borderLeft: '3px solid #00f2fe', zIndex: 12 }} />
            <div style={{ position: 'absolute', top: '16px', right: '16px', width: '32px', height: '32px', borderTop: '3px solid #00f2fe', borderRight: '3px solid #00f2fe', zIndex: 12 }} />
            <div style={{ position: 'absolute', bottom: '16px', left: '16px', width: '32px', height: '32px', borderBottom: '3px solid #00f2fe', borderLeft: '3px solid #00f2fe', zIndex: 12 }} />
            <div style={{ position: 'absolute', bottom: '16px', right: '16px', width: '32px', height: '32px', borderBottom: '3px solid #00f2fe', borderRight: '3px solid #00f2fe', zIndex: 12 }} />

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />

            <button
              onClick={handleCaptureWebcam}
              className="liquid-btn liquid-btn-primary"
              style={{
                position: 'absolute',
                bottom: '24px',
                zIndex: 30,
                padding: '14px 30px',
                borderRadius: '999px',
                fontSize: '1rem',
                boxShadow: '0 0 30px rgba(0, 242, 254, 0.8)',
              }}
            >
              <Camera size={20} />
              <span>Capture & Extract Receipt</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. ONLY SHOWN AFTER A RECEIPT IS UPLOADED OR PHOTOGRAPHED - REAL ACCURATE OCR RESULTS */}
      {scanMode === 'scanned' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.1fr 1fr',
            gap: '26px',
            animation: 'pageFade3D 0.4s ease-out forwards',
          }}
        >
          {/* Left Side: Real Uploaded Image with Holographic Laser OCR Beam */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="liquid-badge liquid-badge-cyan" style={{ fontSize: '0.72rem' }}>
                  <Sparkles size={12} /> ACCURATE OPTICAL OCR
                </span>
                {selectedFileName && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    {selectedFileName}
                  </span>
                )}
              </div>

              <button
                onClick={handleResetToIdle}
                className="liquid-btn liquid-btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              >
                Scan Another
              </button>
            </div>

            {/* Viewfinder Frame showing the User's Actual Receipt Image */}
            <div
              className="scanner-viewport"
              style={{
                position: 'relative',
                width: '100%',
                minHeight: '430px',
                height: '450px',
                background: 'radial-gradient(circle at 50% 50%, rgba(13, 24, 52, 0.92), rgba(5, 8, 18, 0.98))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '18px',
              }}
            >
              <div style={{ position: 'absolute', top: '16px', left: '16px', width: '28px', height: '28px', borderTop: '3px solid #00f2fe', borderLeft: '3px solid #00f2fe', zIndex: 12 }} />
              <div style={{ position: 'absolute', top: '16px', right: '16px', width: '28px', height: '28px', borderTop: '3px solid #00f2fe', borderRight: '3px solid #00f2fe', zIndex: 12 }} />
              <div style={{ position: 'absolute', bottom: '16px', left: '16px', width: '28px', height: '28px', borderBottom: '3px solid #00f2fe', borderLeft: '3px solid #00f2fe', zIndex: 12 }} />
              <div style={{ position: 'absolute', bottom: '16px', right: '16px', width: '28px', height: '28px', borderBottom: '3px solid #00f2fe', borderRight: '3px solid #00f2fe', zIndex: 12 }} />

              {/* Laser Scan Beam */}
              {isScanning && (
                <>
                  <div className="laser-beam" style={{ zIndex: 25 }} />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundImage: 'repeating-linear-gradient(0deg, rgba(0, 242, 254, 0.08) 0, rgba(0, 242, 254, 0.08) 1px, transparent 1px, transparent 4px)',
                      pointerEvents: 'none',
                      zIndex: 20,
                    }}
                  />
                </>
              )}

              {/* Display the Actual Uploaded Receipt Image */}
              {selectedFileImage ? (
                <div
                  style={{
                    position: 'relative',
                    width: '320px',
                    maxHeight: '410px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <img
                    src={selectedFileImage}
                    alt="Scanned Receipt"
                    style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: '410px', background: '#111827' }}
                  />
                  {detectedBoxes.map((box, idx) => (
                    <div
                      key={idx}
                      className="ocr-box"
                      style={{ top: `${box.top}%`, left: `${box.left}%`, width: `${box.width}%`, height: `${box.height}%`, zIndex: 15 }}
                    >
                      <span className="ocr-box-label">{box.label}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Walang litratong napili</div>
              )}
            </div>

            {/* Scan Progress Status */}
            {isScanning ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                  <span style={{ color: '#00f2fe', fontWeight: 600 }}>{scanStepText}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{scanProgress}%</span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '10px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: '999px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${scanProgress}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #00f2fe, #a855f7)',
                      boxShadow: '0 0 15px #00f2fe',
                      transition: 'width 0.1s ease',
                    }}
                  />
                </div>
              </div>
            ) : (
              <button
                onClick={() => runRealOcr(selectedFileImage, selectedFileName)}
                className="liquid-btn liquid-btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: '1rem', borderRadius: '14px' }}
              >
                <ScanLine size={18} />
                <span>Re-scan with AI OCR</span>
              </button>
            )}
          </div>

          {/* Right Side: Exact Extracted Field Inspector */}
          <div className="glass-panel" style={{ padding: '26px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>
                    Extracted Receipt Details
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Tunay na nahimay mula sa iyong resibo gamit ang AI OCR.
                  </span>
                </div>
                {currentReceipt && (
                  <span className="liquid-badge liquid-badge-emerald">
                    <CheckCircle2 size={12} /> {currentReceipt.confidence}% Precision
                  </span>
                )}
              </div>

              {currentReceipt ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Vendor Field */}
                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                      Vendor / Merchant Name
                    </label>
                    <input
                      className="liquid-input"
                      value={currentReceipt.merchant || ''}
                      onChange={(e) => setCurrentReceipt({ ...currentReceipt, merchant: e.target.value })}
                    />
                  </div>

                  {/* Date & TIN */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                        Receipt Date
                      </label>
                      <input
                        type="date"
                        className="liquid-input"
                        value={currentReceipt.date || ''}
                        onChange={(e) => setCurrentReceipt({ ...currentReceipt, date: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                        Tax ID / TIN Number
                      </label>
                      <input
                        className="liquid-input"
                        value={currentReceipt.tin || ''}
                        onChange={(e) => setCurrentReceipt({ ...currentReceipt, tin: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Category & Payment Method */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                        Category
                      </label>
                      <select
                        className="liquid-input"
                        value={currentReceipt.category || 'Other'}
                        onChange={(e) => setCurrentReceipt({ ...currentReceipt, category: e.target.value })}
                        style={{ cursor: 'pointer' }}
                      >
                        {Object.keys(t.categories).map((cat) => (
                          <option key={cat} value={cat} style={{ background: '#090d1a', color: '#fff' }}>
                            {t.categories[cat]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                        Payment Method
                      </label>
                      <input
                        className="liquid-input"
                        value={currentReceipt.paymentMethod || 'Cash'}
                        onChange={(e) => setCurrentReceipt({ ...currentReceipt, paymentMethod: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Line Items List */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        Line Items Extracted ({currentReceipt.items?.length || 0})
                      </label>
                      <button
                        onClick={() => setShowRawOcr(!showRawOcr)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#00f2fe',
                          fontSize: '0.72rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Eye size={12} /> {showRawOcr ? 'Hide Raw OCR' : 'Inspect Raw Text'}
                      </button>
                    </div>

                    {showRawOcr ? (
                      <pre
                        style={{
                          maxHeight: '120px',
                          overflowY: 'auto',
                          background: 'rgba(5, 10, 20, 0.7)',
                          padding: '10px',
                          borderRadius: '8px',
                          border: '1px solid var(--glass-border)',
                          fontSize: '0.72rem',
                          color: '#38bdf8',
                          fontFamily: 'var(--font-mono)',
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {currentReceipt.rawOcrText || 'No raw text available'}
                      </pre>
                    ) : (
                      <div
                        style={{
                          maxHeight: '135px',
                          overflowY: 'auto',
                          background: 'rgba(10, 15, 30, 0.45)',
                          padding: '8px 12px',
                          borderRadius: '10px',
                          border: '1px solid var(--glass-border)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                        }}
                      >
                        {currentReceipt.items?.map((item, idx) => {
                          const sym = currentReceipt.currency === 'USD' ? '$' : '₱';
                          return (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', gap: '8px' }}>
                              <span style={{ color: '#ffffff', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {item.qty}x {item.name}
                              </span>
                              <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#00f2fe' }}>
                                {sym}{(parseFloat(item.total) || 0).toFixed(2)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Financial Totals */}
                  <div
                    style={{
                      background: 'rgba(0, 242, 254, 0.06)',
                      border: '1px solid rgba(0, 242, 254, 0.25)',
                      borderRadius: '12px',
                      padding: '14px 18px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Subtotal: {currentReceipt.currency === 'USD' ? '$' : '₱'}{(parseFloat(currentReceipt.subtotal) || 0).toFixed(2)} • Tax / VAT: {currentReceipt.currency === 'USD' ? '$' : '₱'}{(parseFloat(currentReceipt.vat) || 0).toFixed(2)}
                      </div>
                      <div style={{ fontSize: '1.55rem', fontWeight: 800, color: '#00f2fe', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                        {currentReceipt.currency === 'USD' ? `$${(parseFloat(currentReceipt.total) || 0).toFixed(2)}` : formatCurrency(currentReceipt.total)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setCurrentReceipt({
                          ...currentReceipt,
                          currency: currentReceipt.currency === 'USD' ? 'PHP' : 'USD'
                        })}
                        className="liquid-badge liquid-badge-cyan"
                        style={{ cursor: 'pointer', border: '1px solid rgba(0, 242, 254, 0.4)', padding: '4px 10px', fontSize: '0.72rem' }}
                        title="Click to switch currency"
                      >
                        Currency: {currentReceipt.currency || 'USD'} ⇄
                      </button>
                      <span className="liquid-badge liquid-badge-emerald">
                        {currentReceipt.currency === 'USD' ? 'TAX INCLUDED' : '12% VAT INCLUDED'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ color: 'var(--text-secondary)', padding: '20px', textAlign: 'center' }}>
                  Awaiting extraction...
                </div>
              )}
            </div>

            {/* Save to Vault Action Button */}
            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <button
                onClick={handleSaveDocument}
                className="liquid-btn liquid-btn-primary"
                style={{ flex: 1, padding: '13px', fontSize: '0.98rem' }}
              >
                <CheckCircle2 size={18} />
                <span>Save to Document Vault</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
