import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  ShieldCheck,
  Lock,
  Scale,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  X,
  Globe,
  Printer,
  Sparkles,
} from 'lucide-react';

export const TermsModal = () => {
  const { isTermsOpen, setIsTermsOpen, isTermsAccepted, setIsTermsAccepted, language, soundFx, setIsPrivacyOpen, setIsCookieModalOpen } = useApp();
  const [modalLang, setModalLang] = useState(language === 'fil' ? 'fil' : 'en');
  const [activeSection, setActiveSection] = useState('acceptance');
  const [isAccepted, setIsAccepted] = useState(false);

  // Sync initial language if language context changes
  useEffect(() => {
    if (language === 'fil') setModalLang('fil');
    else setModalLang('en');
  }, [language]);

  // Sync acceptance checkbox with app state whenever modal opens
  useEffect(() => {
    if (isTermsOpen) {
      setIsAccepted(Boolean(isTermsAccepted));
    }
  }, [isTermsOpen, isTermsAccepted]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isTermsOpen) {
        setIsTermsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTermsOpen, setIsTermsOpen]);

  if (!isTermsOpen) return null;

  const handleClose = () => {
    soundFx?.playClick?.();
    setIsTermsOpen(false);
  };

  const handleAccept = () => {
    if (!isAccepted) return;
    soundFx?.playSuccessChime?.();
    setIsTermsAccepted?.(true);
    try {
      localStorage.setItem('resiboss_terms_accepted_v1', 'true');
    } catch (e) {}
    setIsTermsOpen(false);
  };

  const isFil = modalLang === 'fil';

  return (
    <div
      className="terms-modal-backdrop"
      onClick={handleClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(3, 7, 18, 0.88)',
        backdropFilter: 'blur(22px)',
        WebkitBackdropFilter: 'blur(22px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'pageFade3D 0.25s ease-out forwards',
        boxSizing: 'border-box',
      }}
    >
      <div
        className="glass-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '860px',
          maxHeight: '90vh',
          background: 'var(--bg-surface-elevated, #070c1a)',
          border: '1px solid var(--glass-border)',
          borderRadius: '24px',
          boxShadow: 'var(--glass-shadow, 0 30px 80px rgba(0, 0, 0, 0.8))',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Modal Top Header */}
        <div
          style={{
            padding: '22px 28px',
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface, rgba(10, 16, 36, 0.65))',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(0, 242, 254, 0.12)',
                border: '1px solid rgba(0, 242, 254, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00f2fe',
                boxShadow: '0 0 15px rgba(0, 242, 254, 0.25)',
              }}
            >
              <Scale size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="liquid-badge liquid-badge-cyan" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                  LEGAL COMPLIANCE
                </span>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  v1.2 • Sept 2026
                </span>
              </div>
              <h2
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  margin: '4px 0 0 0',
                  letterSpacing: '-0.01em',
                }}
              >
                {isFil ? 'Mga Tuntunin at Kundisyon' : 'Terms & Conditions'}
              </h2>
            </div>
          </div>

          {/* Right Controls: Language toggle + Close */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Bilingual Toggle */}
            <div
              style={{
                display: 'flex',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '10px',
                padding: '2px',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setModalLang('en');
                  soundFx?.playClick?.();
                }}
                style={{
                  background: modalLang === 'en' ? '#00f2fe' : 'transparent',
                  color: modalLang === 'en' ? '#070c1a' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '5px 10px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalLang('fil');
                  soundFx?.playClick?.();
                }}
                style={{
                  background: modalLang === 'fil' ? '#00f2fe' : 'transparent',
                  color: modalLang === 'fil' ? '#070c1a' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '5px 10px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                FIL
              </button>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={handleClose}
              className="liquid-btn liquid-btn-secondary"
              style={{
                width: '36px',
                height: '36px',
                padding: 0,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Close (ESC)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable Terms Content */}
        <div
          style={{
            padding: '24px 28px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            lineHeight: 1.6,
            fontSize: '0.88rem',
            color: 'var(--text-secondary)',
          }}
        >
          {/* Important Notice Callout */}
          <div
            style={{
              padding: '14px 18px',
              borderRadius: '14px',
              background: 'rgba(0, 242, 254, 0.08)',
              border: '1px solid rgba(0, 242, 254, 0.3)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
            }}
          >
            <ShieldCheck size={20} color="#00f2fe" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
              <strong>{isFil ? 'Mahalagang Paalala:' : 'Important Summary:'}</strong>{' '}
              {isFil
                ? 'Ang Resiboss ay isang tool para sa digital receipt tracking, OCR extraction, at VAT estimation. Nirerespeto namin ang iyong privacy (Data Privacy Act of 2012 RA 10173). Mananatiling ikaw at ang iyong Certified Public Accountant ang may pananagutan sa opisyal na pag-file ng buwis sa BIR.'
                : 'Resiboss is an AI receipt scanning, audit vault, and VAT calculation assistant. We protect your data in strict compliance with RA 10173 (Data Privacy Act). You and your designated tax consultant maintain ultimate responsibility for official BIR filings.'}
            </div>
          </div>

          {/* Section 1: Acceptance */}
          <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={16} color="#00f2fe" />
              {isFil ? '1. Pagtanggap sa mga Tuntunin' : '1. Acceptance of Terms'}
            </h3>
            <p style={{ margin: 0 }}>
              {isFil
                ? 'Sa pag-access, pag-download, o paggamit ng Resiboss (sa web, mobile, o Android APK), sumasang-ayon ka na sumailalim sa mga Tuntunin at Kundisyong ito. Kung hindi ka sumasang-ayon sa anumang bahagi, mangyaring itigil ang paggamit ng serbisyo.'
                : 'By accessing, downloading, or using Resiboss (via web app or Android application), you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions. If you do not accept these terms, you must discontinue using Resiboss immediately.'}
            </p>
          </div>

          {/* Section 2: Services & OCR Processing */}
          <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="#a855f7" />
              {isFil ? '2. Serbisyo at Optical Character Recognition (OCR)' : '2. Scope of Services & OCR Processing'}
            </h3>
            <p style={{ margin: '0 0 8px 0' }}>
              {isFil
                ? 'Nagbibigay ang Resiboss ng mga sumusunod na kakayahan:'
                : 'Resiboss provides computerized financial record-keeping tools including:'}
            </p>
            <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>
                {isFil
                  ? 'Pag-scan at pag-extract ng impormasyon sa resibo (Merchant, Petsa, TIN, Subtotal, 12% VAT, Kabuuang Halaga).'
                  : 'Automated receipt digitization and OCR field extraction (Merchant, Date, TIN, Subtotal, 12% VAT, Total).'}
              </li>
              <li>
                {isFil
                  ? 'Interactive 3D Receipt Inspector para sa detalyadong pagsusuri ng dokumento.'
                  : 'Interactive 3D Receipt Inspection and high-resolution audit verification.'}
              </li>
              <li>
                {isFil
                  ? 'Pag-export ng mga talaan sa Purchases & Expenses Journal (Excel) at Flat CSV na tugma sa accounting standard.'
                  : 'Data export to Purchases & Expenses Journal (Excel formula-preserved) and standard CSV formats.'}
              </li>
            </ul>
          </div>

          {/* Section 3: Data Privacy & Security */}
          <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={16} color="#10b981" />
              {isFil ? '3. Proteksyon ng Datos at Privacy (RA 10173)' : '3. Data Privacy & Cryptographic Security (RA 10173)'}
            </h3>
            <p style={{ margin: 0 }}>
              {isFil
                ? 'Mahigpit naming sinusunod ang Data Privacy Act of 2012 ng Pilipinas (Republic Act No. 10173). Ang lahat ng iyong na-upload na resibo ay naka-encrypt at protektado. Mayroon kang buong kontrol sa iyong impormasyon: maaari mong i-export o burahin ang lahat ng nakatagong datos anumang oras gamit ang "Clear Vault Storage" function sa iyong browser o profile settings.'
                : 'In accordance with Republic Act No. 10173 (Philippine Data Privacy Act of 2012) and global encryption standards, your financial records and receipt images are safeguarded. You retain 100% ownership of your records. You have the absolute right to export, inspect, or permanently delete your stored data at any time via the Clear Storage utility.'}
            </p>
          </div>

          {/* Section 4: Tax Calculation Disclaimer (BIR) */}
          <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} color="#f59e0b" />
              {isFil ? '4. Paalala sa Pagkukuwenta ng Buwis (BIR Disclaimer)' : '4. Statutory Tax & BIR Calculation Disclaimer'}
            </h3>
            <p style={{ margin: 0 }}>
              {isFil
                ? 'Ang mga kalkulasyon ng 12% Input/Output VAT at mga rekomendasyon para sa BIR Form 2550Q / Purchases Journal ay gabay lamang sa pag-oorganisa. Bagamat pinagsisikapan naming maging tumpak ang OCR at mathematical formulas, maaaring magkaroon ng mali dulot ng malabong resibo o sulat-kamay. Responsibilidad ng gumagamit at ng kanilang lisensyadong CPA na i-verify ang bawat numero bago ito ideklara sa Bureau of Internal Revenue (BIR).'
                : 'Calculations for 12% Input/Output VAT, deductible baselines, and BIR Form 2550Q purchase journals are designed as assistive organizational tools. Due to optical variances in printed thermal receipts and lighting, OCR may produce character discrepancies. Users, business proprietors, and certified accountants bear sole responsibility for verifying figures prior to official submission to the Bureau of Internal Revenue (BIR) or applicable tax authorities.'}
            </p>
          </div>

          {/* Section 5: User Obligations */}
          <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} color="#38bdf8" />
              {isFil ? '5. Responsibilidad ng Gumagamit' : '5. User Responsibilities & Acceptable Conduct'}
            </h3>
            <p style={{ margin: 0 }}>
              {isFil
                ? 'Sumasang-ayon ka na hindi gagamitin ang Resiboss para sa anumang labag sa batas, tulad ng pag-upload ng pekeng resibo, pekeng TIN, pagnanakaw ng impormasyon, o pagtangkang sirain ang sistema. Ikaw ang may pananagutan sa pagpapanatili ng seguridad ng iyong Google account login.'
                : 'You agree to upload only authentic commercial invoices and receipts to which you have lawful access. You must not attempt to fabricate fraudulent tax claims, inject malicious payloads, or disrupt our cloud infrastructure. You are responsible for preserving access credentials to your authenticated Google account.'}
            </p>
          </div>

          {/* Section 6: Limitation of Liability */}
          <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Scale size={16} color="#c084fc" />
              {isFil ? '6. Limitasyon ng Pananagutan (Limitation of Liability)' : '6. Limitation of Liability & "As Is" Warranty'}
            </h3>
            <p style={{ margin: 0 }}>
              {isFil
                ? 'Ipinagkakaloob ang Resiboss sa batayang "AS IS" at "AS AVAILABLE". Sa pinakamalawak na saklaw na pinapayagan ng batas, ang mga developer at tagapamahala ng Resiboss ay hindi mananagot para sa anumang hindi direkta o hindi sinasadyang pagkawala ng datos, mga parusa sa buwis, o pagkaantala ng negosyo na nagmumula sa paggamit ng serbisyo.'
                : 'Resiboss is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind. Under no circumstances shall the creators or operators of Resiboss be held liable for indirect, incidental, or punitive damages, lost profits, tax penalties, or data corruption resulting from the use or inability to use the platform.'}
            </p>
          </div>

          {/* Section 7: Governing Law & Contact */}
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HelpCircle size={16} color="#00f2fe" />
              {isFil ? '7. Batas na Sumasaklaw at Pakikipag-ugnayan' : '7. Governing Law & Contact'}
            </h3>
            <p style={{ margin: 0 }}>
              {isFil
                ? 'Ang mga Tuntuning ito ay pinamamahalaan alinsunod sa mga batas ng Republika ng Pilipinas. Kung mayroon kang mga katanungan o kahilingan ukol sa privacy, maaari kang makipag-ugnayan sa amin sa pamamagitan ng opisyal na Resiboss developer channels o sa support@resiboss.app.'
                : 'These Terms shall be governed by and construed in accordance with the laws of the Republic of the Philippines. For privacy inquiries, compliance validation, or support, reach out to our team at support@resiboss.app or through our official repository.'}
            </p>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div
          style={{
            padding: '16px 28px',
            borderTop: '1px solid var(--glass-border)',
            background: 'var(--bg-surface, rgba(10, 16, 36, 0.75))',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          {/* Agreement Checkbox */}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              userSelect: 'none',
              fontSize: '0.84rem',
              color: isAccepted ? 'var(--cyan-glow, #00f2fe)' : 'var(--text-secondary, #94a3b8)',
              transition: 'all 0.2s ease',
              padding: '8px 12px',
              borderRadius: '8px',
              background: isAccepted ? 'rgba(0, 242, 254, 0.08)' : 'rgba(255, 255, 255, 0.03)',
              border: `1px solid ${isAccepted ? 'rgba(0, 242, 254, 0.35)' : 'rgba(255, 255, 255, 0.08)'}`,
            }}
          >
            <input
              type="checkbox"
              id="terms-accept-checkbox"
              checked={isAccepted}
              onChange={(e) => {
                soundFx?.playClick?.();
                setIsAccepted(e.target.checked);
              }}
              style={{
                width: '18px',
                height: '18px',
                cursor: 'pointer',
                accentColor: '#00f2fe',
                borderRadius: '4px',
              }}
            />
            <span style={{ fontWeight: isAccepted ? 600 : 400 }}>
              {isFil
                ? 'Nabasa, naunawaan, at sumasang-ayon ako sa mga Tuntunin at Patakaran sa Privacy ng Resiboss.'
                : 'I have read, understood, and accept the Resiboss Terms of Service and Privacy Policy.'}
            </span>
          </label>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
              <Globe size={14} color="var(--cyan-glow)" />
              <span>Resiboss Legal • Philippines</span>
              <span>•</span>
              <button
                type="button"
                onClick={() => {
                  soundFx?.playClick?.();
                  setIsTermsOpen(false);
                  setIsPrivacyOpen(true);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: '#00f2fe',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                {isFil ? 'Patakaran sa Privacy' : 'Privacy Policy'}
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={handleClose}
                className="liquid-btn liquid-btn-secondary"
                style={{ padding: '8px 18px', fontSize: '0.86rem' }}
              >
                {isFil ? 'Isara' : 'Close'}
              </button>
              <button
                type="button"
                disabled={!isAccepted}
                onClick={handleAccept}
                className="liquid-btn liquid-btn-primary"
                style={{
                  padding: '8px 22px',
                  fontSize: '0.86rem',
                  opacity: isAccepted ? 1 : 0.42,
                  cursor: isAccepted ? 'pointer' : 'not-allowed',
                  filter: isAccepted ? 'none' : 'grayscale(0.7)',
                  pointerEvents: isAccepted ? 'auto' : 'none',
                  transition: 'all 0.25s ease',
                }}
              >
                <CheckCircle2 size={16} />
                <span>{isFil ? 'Nauunawaan at Tinatanggap Ko' : 'I Understand & Accept'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;
