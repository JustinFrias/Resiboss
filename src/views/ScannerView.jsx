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
  Eye,
  EyeOff,
  Plus,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

export const ScannerView = () => {
  const { addDocument, addNotification, formatCurrency, t } = useApp();

  // Mode: 'idle' (Clean Scan Buddy) | 'camera' (taking live photo) | 'scanned' (extracted results)
  const [scanMode, setScanMode] = useState('idle');
  const [savedNotice, setSavedNotice] = useState(false);

  // File & Scanned receipt state
  const [selectedFileImage, setSelectedFileImage] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStepText, setScanStepText] = useState('');
  const [detectedBoxes, setDetectedBoxes] = useState([]);
  const [currentReceipt, setCurrentReceipt] = useState(null);
  const [showRawOcr, setShowRawOcr] = useState(false);

  // Error state for invalid / non-receipt uploads
  const [scanError, setScanError] = useState(null);

  // Zoom & Pan state for inspecting physical receipt
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [showBoxes, setShowBoxes] = useState(true);
  const [isFullscreenModal, setIsFullscreenModal] = useState(false);

  // Camera state
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Drag & drop
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Stop Webcam
  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraError(null);
  };

  // Start Webcam or native Android camera app
  const handleStartCamera = async () => {
    // If on mobile/Android, directly launch native camera app for best image quality & focus
    const isMobileDevice = /android|iphone|ipad|ipod/i.test(navigator.userAgent || '');
    if (isMobileDevice && cameraInputRef.current) {
      soundFx.playClick();
      cameraInputRef.current.value = '';
      cameraInputRef.current.click();
      return;
    }

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
      console.warn('Webcam error, falling back to camera input:', err);
      if (cameraInputRef.current) {
        cameraInputRef.current.value = '';
        cameraInputRef.current.click();
      } else {
        setCameraError('Unable to open camera. Please make sure camera permissions are granted or upload a receipt file.');
      }
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

  // Run Real Tesseract OCR Extraction with Receipt Validation
  const runRealOcr = async (imageUri, filename = '') => {
    setScanMode('scanned');
    setIsScanning(true);
    setScanProgress(5);
    setScanStepText('Analyzing receipt image with OCR...');
    setDetectedBoxes([]);
    setScanError(null);
    setCurrentReceipt(null);
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    soundFx.playLaserHum();

    try {
      const ocrResult = await extractReceiptWithOCR(imageUri, (progress, step) => {
        setScanProgress(progress);
        setScanStepText(step);
        if (progress % 25 === 0) soundFx.playScanBlip();
      });

      // Check if image was detected as a valid receipt
      if (!ocrResult.isValid) {
        setIsScanning(false);
        setScanError({
          title: 'Non-Receipt Image Detected',
          message: ocrResult.errorReason || 'The uploaded photo does not appear to be an official receipt or sales invoice.',
          tip: 'Ensure the image is clear, flat, and focused on a receipt containing a store name and prices.',
          imageUri: imageUri,
          filename: filename,
        });
        soundFx.playWarning();
        return;
      }

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
      setScanError({
        title: 'Receipt Unreadable',
        message: 'Could not extract readable text or receipt details from this image.',
        tip: 'Please try capturing a brighter and clearer photo of the receipt.',
        imageUri: imageUri,
        filename: filename,
      });
      soundFx.playWarning();
    }
  };

  // Zoom & Pan Handlers
  const handleZoomIn = () => {
    soundFx.playClick();
    setZoomLevel((prev) => Math.min(3.5, +(prev + 0.35).toFixed(2)));
  };

  const handleZoomOut = () => {
    soundFx.playClick();
    setZoomLevel((prev) => {
      const next = Math.max(1, +(prev - 0.35).toFixed(2));
      if (next === 1) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    soundFx.playClick();
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleWheelZoom = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    setZoomLevel((prev) => {
      const next = Math.min(3.5, Math.max(1, +(prev + delta).toFixed(2)));
      if (next === 1) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const handleMouseDown = (e) => {
    if (zoomLevel > 1) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning && zoomLevel > 1) {
      setPanOffset({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Touch Drag / Pan Handlers for Mobile & Android devices
  const handleTouchStart = (e) => {
    if (zoomLevel > 1 && e.touches && e.touches.length === 1) {
      setIsPanning(true);
      const touch = e.touches[0];
      setStartPan({ x: touch.clientX - panOffset.x, y: touch.clientY - panOffset.y });
    }
  };

  const handleTouchMove = (e) => {
    if (isPanning && zoomLevel > 1 && e.touches && e.touches.length === 1) {
      if (e.cancelable) e.preventDefault();
      const touch = e.touches[0];
      setPanOffset({
        x: touch.clientX - startPan.x,
        y: touch.clientY - startPan.y,
      });
    }
  };

  const handleTouchEnd = () => {
    setIsPanning(false);
  };

  const handleDoubleClick = () => {
    if (zoomLevel > 1) {
      handleResetZoom();
    } else {
      soundFx.playClick();
      setZoomLevel(2);
    }
  };

  // Directly trigger system file picker without leaving the scanner view
  const handleScanAnother = () => {
    soundFx.playClick();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleManualFallback = () => {
    soundFx.playClick();
    setScanError(null);
    const manualDoc = {
      id: `REC-2026-${Math.floor(100 + Math.random() * 900)}`,
      imageUri: selectedFileImage,
      fileName: selectedFileName || 'Manual Receipt',
      merchant: 'Manual Merchant Entry',
      date: new Date().toISOString().split('T')[0],
      time: '12:00 PM',
      tin: '000-000-000-000',
      category: 'Food',
      paymentMethod: 'Cash',
      subtotal: 100.0,
      vat: 12.0,
      total: 112.0,
      items: [{ name: 'Custom Item', qty: 1, price: 100.0, total: 100.0 }],
      currency: 'PHP',
      confidence: 100,
      rawOcrText: 'Manual Document Entry',
      detectedBoxes: [],
    };
    setCurrentReceipt(manualDoc);
  };

  const handleSaveDocument = () => {
    if (!currentReceipt) return;
    const saved = addDocument(currentReceipt);
    if (addNotification) {
      addNotification({
        title: 'Receipt Saved to Vault',
        desc: `${saved?.merchant || 'Receipt'} (${saved?.id || 'Doc'}) has been saved.`,
        type: 'scanner',
        targetTab: 'documents',
      });
    }
    // Automatically clear current receipt and reset to idle mode for scanning new receipts
    handleResetToIdle();
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
    }, 4500);
  };

  const handleResetToIdle = () => {
    stopWebcam();
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    setSelectedFileImage(null);
    setSelectedFileName('');
    setCurrentReceipt(null);
    setScanError(null);
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    setIsFullscreenModal(false);
    setScanMode('idle');
    soundFx.playClick();
  };

  // Keyboard shortcut listener for Fullscreen modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreenModal) {
        setIsFullscreenModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreenModal]);

  // Edit item inside extracted receipt
  const handleItemChange = (index, field, value) => {
    if (!currentReceipt) return;
    const updatedItems = [...(currentReceipt.items || [])];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    if (field === 'price' || field === 'qty') {
      const qty = parseFloat(updatedItems[index].qty) || 1;
      const price = parseFloat(updatedItems[index].price) || 0;
      updatedItems[index].total = +(qty * price).toFixed(2);
    } else if (field === 'total') {
      const total = parseFloat(value) || 0;
      const qty = parseFloat(updatedItems[index].qty) || 1;
      updatedItems[index].price = +(total / qty).toFixed(2);
    }

    const newSubtotal = +(updatedItems.reduce((acc, it) => acc + (parseFloat(it.total) || 0), 0)).toFixed(2);
    const isPhp = currentReceipt.currency !== 'USD';
    const newVat = +(newSubtotal * (isPhp ? 0.12 : 0.08)).toFixed(2);
    const newTotal = +(newSubtotal + newVat).toFixed(2);

    setCurrentReceipt({
      ...currentReceipt,
      items: updatedItems,
      subtotal: newSubtotal,
      vat: newVat,
      total: newTotal,
    });
  };

  const handleTotalChange = (val) => {
    if (!currentReceipt) return;
    const num = parseFloat(val) || 0;
    const isPhp = currentReceipt.currency !== 'USD';
    const newSubtotal = +(num / (isPhp ? 1.12 : 1.08)).toFixed(2);
    const newVat = +(num - newSubtotal).toFixed(2);
    setCurrentReceipt({
      ...currentReceipt,
      total: num,
      subtotal: newSubtotal,
      vat: newVat,
    });
  };

  const handleSubtotalChange = (val) => {
    if (!currentReceipt) return;
    const num = parseFloat(val) || 0;
    const currentVat = parseFloat(currentReceipt.vat) || 0;
    setCurrentReceipt({
      ...currentReceipt,
      subtotal: num,
      total: +(num + currentVat).toFixed(2),
    });
  };

  const handleVatChange = (val) => {
    if (!currentReceipt) return;
    const num = parseFloat(val) || 0;
    const currentSub = parseFloat(currentReceipt.subtotal) || 0;
    setCurrentReceipt({
      ...currentReceipt,
      vat: num,
      total: +(currentSub + num).toFixed(2),
    });
  };

  const handleAddItem = () => {
    if (!currentReceipt) return;
    const newItem = { name: 'New Item', qty: 1, price: 0, total: 0 };
    setCurrentReceipt({
      ...currentReceipt,
      items: [...(currentReceipt.items || []), newItem],
    });
  };

  const handleRemoveItem = (index) => {
    if (!currentReceipt) return;
    const updatedItems = currentReceipt.items.filter((_, i) => i !== index);
    const newSubtotal = +(updatedItems.reduce((acc, it) => acc + (parseFloat(it.total) || 0), 0)).toFixed(2);
    const isPhp = currentReceipt.currency !== 'USD';
    const newVat = +(newSubtotal * (isPhp ? 0.12 : 0.08)).toFixed(2);
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
      {/* Global File Input - Always mounted in DOM so 'Scan Another' never leaves screen */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />

      {/* Native Camera Capture Input - Directly triggers Android camera app */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />

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
              {t.scanner.resibossScanTitle}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', margin: 0 }}>
              {t.scanner.resibossScanDesc}
            </p>
          </div>

          {/* Success Banner when receipt is saved */}
          {savedNotice && (
            <div
              style={{
                marginBottom: '18px',
                padding: '12px 18px',
                borderRadius: '14px',
                background: 'rgba(32, 248, 161, 0.12)',
                border: '1px solid rgba(32, 248, 161, 0.4)',
                color: '#20F8A1',
                fontSize: '0.92rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 4px 16px rgba(32, 248, 161, 0.12)',
              }}
            >
              <CheckCircle2 size={18} />
              <span>Nai-save na ang resibo sa Document Vault! Handa na para sa bagong resibo.</span>
            </div>
          )}

          {/* Two Primary Cards: Take Photo & Upload File */}
          <div
            className="scanner-idle-grid"
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
                {t.scanner.takePhoto}
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                {t.scanner.takePhotoDesc}
              </p>
            </div>

            {/* Card 2: Upload File */}
            <div
              onClick={handleScanAnother}
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
                {t.scanner.uploadFile}
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                {t.scanner.uploadFileFormats}
              </p>
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
                {t.scanner.aiExtractionTitle}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {t.scanner.aiExtractionDesc}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Header when in camera or scanned mode */
        <div style={{ marginBottom: '24px' }}>
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              marginBottom: '4px',
            }}
          >
            {t.scanner.resibossScanTitle}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem', margin: 0 }}>
            {t.scanner.resibossScanDesc}
          </p>
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
                Align receipt in the center of the camera
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
          className="scanner-grid"
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

              {/* Scan Another Button: Immediately opens file picker directly without resetting view */}
              <button
                onClick={handleScanAnother}
                className="liquid-btn liquid-btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                }}
                title="Quickly select a new receipt from files without leaving scanner"
              >
                <Upload size={13} />
                <span>Scan Another</span>
              </button>
            </div>

            {/* Viewfinder Frame showing the User's Actual Receipt Image with Zoom & Pan */}
            <div
              className="scanner-viewport"
              onWheel={handleWheelZoom}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
              onDoubleClick={handleDoubleClick}
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
                overflow: 'hidden',
                cursor: zoomLevel > 1 ? (isPanning ? 'grabbing' : 'grab') : 'zoom-in',
                userSelect: 'none',
                touchAction: zoomLevel > 1 ? 'none' : 'auto',
              }}
            >
              <div style={{ position: 'absolute', top: '16px', left: '16px', width: '28px', height: '28px', borderTop: '3px solid #00f2fe', borderLeft: '3px solid #00f2fe', zIndex: 12, pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', top: '16px', right: '16px', width: '28px', height: '28px', borderTop: '3px solid #00f2fe', borderRight: '3px solid #00f2fe', zIndex: 12, pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: '16px', left: '16px', width: '28px', height: '28px', borderBottom: '3px solid #00f2fe', borderLeft: '3px solid #00f2fe', zIndex: 12, pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: '16px', right: '16px', width: '28px', height: '28px', borderBottom: '3px solid #00f2fe', borderRight: '3px solid #00f2fe', zIndex: 12, pointerEvents: 'none' }} />

              {/* Status Alert Pill if error */}
              {scanError && (
                <div
                  style={{
                    position: 'absolute',
                    top: '14px',
                    zIndex: 28,
                    background: 'rgba(239, 68, 68, 0.92)',
                    color: '#ffffff',
                    padding: '4px 14px',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    letterSpacing: '0.02em',
                  }}
                >
                  <AlertTriangle size={13} />
                  <span>NON-RECEIPT • SCAN REJECTED</span>
                </div>
              )}

              {/* Floating Zoom & Inspector Controls Toolbar */}
              {selectedFileImage && !isScanning && (
                <div className="scanner-zoom-toolbar" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={handleZoomOut}
                    disabled={zoomLevel <= 1}
                    className="scanner-zoom-btn"
                    title="Zoom Out (-)"
                  >
                    <ZoomOut size={15} />
                  </button>

                  <button
                    onClick={handleResetZoom}
                    className="scanner-zoom-pill"
                    title="Click to Reset (100%)"
                  >
                    {Math.round(zoomLevel * 100)}%
                  </button>

                  <button
                    onClick={handleZoomIn}
                    disabled={zoomLevel >= 3.5}
                    className="scanner-zoom-btn"
                    title="Zoom In (+)"
                  >
                    <ZoomIn size={15} />
                  </button>

                  <button
                    onClick={handleResetZoom}
                    className="scanner-zoom-btn"
                    title="Reset Zoom"
                  >
                    <RotateCcw size={13} />
                  </button>

                  <div style={{ width: '1px', height: '16px', background: 'rgba(255, 255, 255, 0.18)', margin: '0 2px' }} />

                  {!scanError && (
                    <button
                      onClick={() => setShowBoxes(!showBoxes)}
                      className={`scanner-zoom-btn ${showBoxes ? 'active' : ''}`}
                      title={showBoxes ? 'Hide Bounding Boxes' : 'Show Bounding Boxes'}
                    >
                      {showBoxes ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                  )}

                  <button
                    onClick={() => setIsFullscreenModal(true)}
                    className="scanner-zoom-btn"
                    title="Maximize / Fullscreen Inspector"
                  >
                    <Maximize2 size={15} />
                  </button>
                </div>
              )}

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

              {/* Display the Actual Uploaded Receipt Image with Transform */}
              {selectedFileImage ? (
                <div
                  style={{
                    position: 'relative',
                    width: '320px',
                    maxHeight: '410px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7)',
                    border: scanError ? '2px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                    transformOrigin: 'center center',
                    transition: isPanning ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
                  }}
                >
                  <img
                    src={selectedFileImage}
                    alt="Scanned Receipt"
                    draggable={false}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      maxHeight: '410px',
                      background: '#111827',
                      pointerEvents: 'none',
                    }}
                  />
                  {showBoxes && !scanError && detectedBoxes.map((box, idx) => (
                    <div
                      key={idx}
                      className="ocr-box"
                      style={{ top: `${box.top}%`, left: `${box.left}%`, width: `${box.width}%`, height: `${box.height}%`, zIndex: 15, pointerEvents: 'none' }}
                    >
                      <span className="ocr-box-label">{box.label}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No image selected</div>
              )}

              {zoomLevel > 1 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    background: 'rgba(0, 0, 0, 0.65)',
                    fontSize: '0.72rem',
                    color: '#94a3b8',
                    pointerEvents: 'none',
                    zIndex: 25,
                  }}
                >
                  Drag to pan
                </div>
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
                <span>{t.scanner.rescan}</span>
              </button>
            )}
          </div>

          {/* Right Side: Exact Extracted Field Inspector OR Error Decision Panel */}
          <div className="glass-panel" style={{ padding: '26px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            {scanError ? (
              /* Non-Receipt Error Screen */
              <div className="scanner-error-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '12px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ef4444',
                        boxShadow: '0 0 16px rgba(239, 68, 68, 0.25)',
                        flexShrink: 0,
                      }}
                    >
                      <AlertTriangle size={24} />
                    </div>
                    <div>
                      <span className="liquid-badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f43f5e', borderColor: 'rgba(239, 68, 68, 0.3)', fontSize: '0.68rem', padding: '2px 8px' }}>
                        SCAN REJECTED • NON-RECEIPT
                      </span>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '4px', color: 'var(--text-primary)' }}>
                        {scanError.title}
                      </h3>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: '20px' }}>
                    {scanError.message}
                  </p>

                  <div
                    style={{
                      background: 'rgba(10, 16, 34, 0.45)',
                      borderRadius: '12px',
                      border: '1px solid var(--glass-border)',
                      padding: '16px',
                      marginBottom: '18px',
                    }}
                  >
                    <div style={{ fontSize: '0.82rem', fontWeight: 650, color: 'var(--text-primary)', marginBottom: '10px' }}>
                      Why was this image rejected?
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#ef4444', fontWeight: 'bold' }}>✕</span> No Total Amount or Price detected (₱, $, PHP)
                      </li>
                      <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#ef4444', fontWeight: 'bold' }}>✕</span> No registered Merchant or Store name detected
                      </li>
                      <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#ef4444', fontWeight: 'bold' }}>✕</span> Does not match Official Receipt, Sales Invoice, or Billing Statement layout
                      </li>
                    </ul>
                  </div>

                  <div
                    style={{
                      background: 'rgba(0, 242, 254, 0.06)',
                      borderRadius: '12px',
                      border: '1px solid rgba(0, 242, 254, 0.18)',
                      padding: '14px',
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                    }}
                  >
                    <Sparkles size={16} color="var(--cyan-glow)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong style={{ color: 'var(--cyan-glow)' }}>Tips for a Successful Scan:</strong>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem' }}>
                        {scanError.tip}
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '22px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button
                      onClick={handleStartCamera}
                      className="liquid-btn liquid-btn-primary"
                      style={{ padding: '12px', fontSize: '0.85rem', borderRadius: '12px' }}
                    >
                      <Camera size={16} />
                      <span>{t.scanner.takePhoto}</span>
                    </button>
                    <button
                      onClick={handleScanAnother}
                      className="liquid-btn liquid-btn-secondary"
                      style={{ padding: '12px', fontSize: '0.85rem', borderRadius: '12px' }}
                    >
                      <Upload size={16} />
                      <span>{t.scanner.uploadFile}</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <button
                      onClick={handleManualFallback}
                      className="liquid-btn liquid-btn-secondary"
                      style={{ fontSize: '0.78rem', padding: '8px 12px' }}
                      title="Encode items manually"
                    >
                      <Plus size={14} />
                      <span>{t.scanner.manualEntry}</span>
                    </button>
                    <button
                      onClick={handleResetToIdle}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        padding: '8px',
                      }}
                    >
                      {t.scanner.resetStart}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Valid Receipt Extracted Details Form */
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {t.scanner.extractedDetailsTitle}
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {t.scanner.extractedDetailsDesc}
                    </span>
                  </div>
                  {currentReceipt && (
                    <span className="liquid-badge liquid-badge-emerald">
                      <CheckCircle2 size={12} /> {currentReceipt.confidence}% {t.scanner.precision}
                    </span>
                  )}
                </div>

                {currentReceipt ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Vendor Field */}
                    <div>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                        {t.scanner.vendor}
                      </label>
                      <input
                        className="liquid-input"
                        value={currentReceipt.merchant || ''}
                        onChange={(e) => setCurrentReceipt({ ...currentReceipt, merchant: e.target.value })}
                      />
                    </div>

                    {/* Date & TIN */}
                    <div className="scanner-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                          {t.scanner.date}
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
                          {t.scanner.invoiceNo}
                        </label>
                        <input
                          className="liquid-input"
                          value={currentReceipt.tin || ''}
                          onChange={(e) => setCurrentReceipt({ ...currentReceipt, tin: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Category & Payment Method */}
                    <div className="scanner-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                          {t.scanner.category}
                        </label>
                        <select
                          className="liquid-input"
                          value={currentReceipt.category || 'Food'}
                          onChange={(e) => setCurrentReceipt({ ...currentReceipt, category: e.target.value })}
                        >
                          {Object.keys(t.categories).map((catKey) => (
                            <option key={catKey} value={catKey}>
                              {t.categories[catKey]}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                          {t.scanner.paymentMethod}
                        </label>
                        <input
                          className="liquid-input"
                          value={currentReceipt.paymentMethod || 'Cash'}
                          onChange={(e) => setCurrentReceipt({ ...currentReceipt, paymentMethod: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Line Items Container */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          {t.scanner.itemsList} ({currentReceipt.items ? currentReceipt.items.length : 0})
                        </label>
                        <button
                          onClick={() => setShowRawOcr(!showRawOcr)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--cyan-glow)',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Eye size={12} /> {showRawOcr ? t.scanner.rawOcrHide : t.scanner.rawOcrShow}
                        </button>
                      </div>

                      {showRawOcr && (
                        <div
                          style={{
                            padding: '10px',
                            background: 'rgba(0, 0, 0, 0.4)',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontFamily: 'var(--font-mono)',
                            color: '#94a3b8',
                            maxHeight: '120px',
                            overflowY: 'auto',
                            marginBottom: '10px',
                            whiteSpace: 'pre-wrap',
                            border: '1px solid var(--glass-border)',
                          }}
                        >
                          {currentReceipt.rawOcrText || 'No raw text available'}
                        </div>
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto', paddingRight: '4px' }}>
                        {currentReceipt.items && currentReceipt.items.length > 0 ? (
                          currentReceipt.items.map((it, idx) => (
                            <div
                              key={idx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '8px',
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '8px',
                                padding: '6px 10px',
                                fontSize: '0.8rem',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                                <input
                                  type="number"
                                  min="1"
                                  style={{
                                    width: '36px',
                                    background: 'rgba(0, 242, 254, 0.08)',
                                    border: '1px solid rgba(0, 242, 254, 0.25)',
                                    borderRadius: '6px',
                                    color: 'var(--cyan-glow)',
                                    fontWeight: 700,
                                    fontSize: '0.78rem',
                                    textAlign: 'center',
                                    padding: '2px 0',
                                    outline: 'none',
                                  }}
                                  value={it.qty || 1}
                                  onChange={(e) => handleItemChange(idx, 'qty', parseInt(e.target.value, 10) || 1)}
                                  title="Quantity"
                                />
                                <input
                                  style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', width: '100%', fontSize: '0.8rem' }}
                                  value={it.name || ''}
                                  onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                                  placeholder="Item name"
                                />
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  {currentReceipt.currency === 'USD' ? '$' : '₱'}
                                </span>
                                <input
                                  type="number"
                                  step="0.01"
                                  style={{
                                    width: '78px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '6px',
                                    color: 'var(--text-primary)',
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    textAlign: 'right',
                                    padding: '3px 6px',
                                    outline: 'none',
                                  }}
                                  value={it.total !== undefined ? it.total : ''}
                                  onChange={(e) => handleItemChange(idx, 'total', e.target.value)}
                                  title="Item total price"
                                />
                                <button
                                  onClick={() => handleRemoveItem(idx)}
                                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                                  title="Delete item"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px 0' }}>
                            No line items isolated.
                          </div>
                        )}
                      </div>

                      <button
                        onClick={handleAddItem}
                        className="liquid-btn liquid-btn-secondary"
                        style={{ width: '100%', marginTop: '8px', padding: '6px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        <Plus size={13} /> {t.scanner.addItem}
                      </button>
                    </div>

                    {/* Total Summary Block */}
                    <div
                      style={{
                        marginTop: '10px',
                        padding: '16px',
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.08), rgba(168, 85, 247, 0.08))',
                        border: '1px solid rgba(0, 242, 254, 0.25)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span>{t.scanner.subtotal}:</span>
                          <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                            {currentReceipt.currency === 'USD' ? '$' : '₱'}
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            style={{
                              width: '74px',
                              background: 'rgba(255, 255, 255, 0.06)',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              borderRadius: '4px',
                              color: 'var(--text-primary)',
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.76rem',
                              padding: '2px 4px',
                              outline: 'none',
                            }}
                            value={currentReceipt.subtotal !== undefined ? currentReceipt.subtotal : ''}
                            onChange={(e) => handleSubtotalChange(e.target.value)}
                            title="Edit subtotal"
                          />
                          <span style={{ opacity: 0.5 }}>•</span>
                          <span>{t.scanner.vat}:</span>
                          <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                            {currentReceipt.currency === 'USD' ? '$' : '₱'}
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            style={{
                              width: '66px',
                              background: 'rgba(255, 255, 255, 0.06)',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              borderRadius: '4px',
                              color: 'var(--text-primary)',
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.76rem',
                              padding: '2px 4px',
                              outline: 'none',
                            }}
                            value={currentReceipt.vat !== undefined ? currentReceipt.vat : ''}
                            onChange={(e) => handleVatChange(e.target.value)}
                            title="Edit VAT"
                          />
                        </div>

                        {/* Editable Total Due */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                          <span style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--cyan-glow)', fontFamily: 'var(--font-mono)' }}>
                            {currentReceipt.currency === 'USD' ? '$' : '₱'}
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            style={{
                              background: 'rgba(0, 242, 254, 0.07)',
                              border: '1px solid rgba(0, 242, 254, 0.35)',
                              borderRadius: '8px',
                              fontSize: '1.45rem',
                              fontWeight: 800,
                              color: 'var(--cyan-glow)',
                              fontFamily: 'var(--font-mono)',
                              padding: '2px 8px',
                              width: '160px',
                              outline: 'none',
                            }}
                            value={currentReceipt.total !== undefined ? currentReceipt.total : ''}
                            onChange={(e) => handleTotalChange(e.target.value)}
                            title="Click to edit Total Due"
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                        <button
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
                    Analyzing receipt with AI OCR...
                  </div>
                )}
              </div>
            )}

            {/* Save to Vault Action Button (Only when receipt is valid) */}
            {!scanError && currentReceipt && (
              <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleSaveDocument}
                  className="liquid-btn liquid-btn-primary"
                  style={{ flex: 1, padding: '13px', fontSize: '0.98rem' }}
                >
                  <CheckCircle2 size={18} />
                  <span>{t.scanner.saveToVault}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fullscreen Receipt Zoom & Pan Inspector Modal */}
      {isFullscreenModal && selectedFileImage && (
        <div
          className="receipt-zoom-modal-backdrop"
          onClick={() => setIsFullscreenModal(false)}
        >
          <div
            className="receipt-zoom-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="liquid-badge liquid-badge-cyan">
                  <Maximize2 size={13} /> RECEIPT FULLSCREEN INSPECTOR
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {selectedFileName}
                </span>
              </div>
              <button
                onClick={() => setIsFullscreenModal(false)}
                className="liquid-btn liquid-btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                <X size={15} /> Close (ESC)
              </button>
            </div>

            <div
              className="receipt-zoom-viewport"
              onWheel={handleWheelZoom}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
              onDoubleClick={handleDoubleClick}
              style={{
                position: 'relative',
                flex: 1,
                minHeight: '520px',
                background: 'radial-gradient(circle at 50% 50%, rgba(13, 24, 52, 0.96), rgba(5, 8, 18, 0.99))',
                borderRadius: '16px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: zoomLevel > 1 ? (isPanning ? 'grabbing' : 'grab') : 'zoom-in',
                userSelect: 'none',
                border: '1px solid var(--glass-border)',
                touchAction: zoomLevel > 1 ? 'none' : 'auto',
              }}
            >
              {/* Floating Zoom Controls in Fullscreen */}
              <div className="scanner-zoom-toolbar" onClick={(e) => e.stopPropagation()}>
                <button onClick={handleZoomOut} disabled={zoomLevel <= 1} className="scanner-zoom-btn">
                  <ZoomOut size={16} />
                </button>
                <button onClick={handleResetZoom} className="scanner-zoom-pill">
                  {Math.round(zoomLevel * 100)}%
                </button>
                <button onClick={handleZoomIn} disabled={zoomLevel >= 3.5} className="scanner-zoom-btn">
                  <ZoomIn size={16} />
                </button>
                <button onClick={handleResetZoom} className="scanner-zoom-btn" title="Reset">
                  <RotateCcw size={14} />
                </button>
              </div>

              <div
                style={{
                  position: 'relative',
                  maxHeight: '85%',
                  maxWidth: '85%',
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                  transformOrigin: 'center center',
                  transition: isPanning ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
                }}
              >
                <img
                  src={selectedFileImage}
                  alt="Scanned Receipt Fullscreen"
                  draggable={false}
                  style={{
                    maxHeight: '540px',
                    maxWidth: '100%',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    boxShadow: '0 25px 50px rgba(0,0,0,0.8)',
                    pointerEvents: 'none',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
