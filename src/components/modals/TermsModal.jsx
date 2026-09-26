import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  Shield,
  Scale,
  AlertTriangle,
  CheckCircle2,
  X,
  Printer,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

export const TermsModal = () => {
  const { isTermsOpen, setIsTermsOpen, language, soundFx } = useApp();
  const [modalLang, setModalLang] = useState(language === 'fil' ? 'fil' : 'en');
  const [activeSection, setActiveSection] = useState('acceptance');

  useEffect(() => {
    if (language === 'fil') setModalLang('fil');
    else setModalLang('en');
  }, [language]);

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

  const isFil = modalLang === 'fil';

  const sections = [
    { id: 'acceptance', title: isFil ? 'Pagtanggap sa Kasunduan' : 'Acceptance of Terms' },
    { id: 'service', title: isFil ? 'Paggamit ng Resiboss' : 'Permitted Use & Service' },
    { id: 'ai', title: isFil ? 'AI OCR at Pagproseso' : 'AI Processing & Accuracy' },
    { id: 'ownership', title: isFil ? 'Pagmamay-ari ng Datos' : 'Data Ownership & Rights' },
    { id: 'disclaimer', title: isFil ? 'Pansamantalang Paalala' : 'Financial Disclaimer' },
    { id: 'liability', title: isFil ? 'Limitasyon ng Pananagutan' : 'Limitation of Liability' },
    { id: 'termination', title: isFil ? 'Pagtatapos ng Serbisyo' : 'Termination & Changes' },
    { id: 'contact', title: isFil ? 'Ugnayan at Suporta' : 'Governing Law & Contact' },
  ];

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
          maxWidth: '820px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.75), 0 0 40px rgba(0, 242, 254, 0.12)',
          border: '1px solid var(--glass-border-bright, rgba(255, 255, 255, 0.15))',
          background: 'var(--bg-card, rgba(12, 12, 12, 0.95))',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 28px',
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface, rgba(15, 23, 42, 0.6))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(0, 242, 254, 0.12)',
                border: '1px solid rgba(0, 242, 254, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00f2fe',
              }}
            >
              <Scale size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                {isFil ? 'Mga Tuntunin at Kundisyon ng Resiboss' : 'Resiboss Terms of Service'}
              </h2>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
                {isFil
                  ? 'Epektibo mula Setyembre 2026 · Huling binago: v2.0'
                  : 'Effective September 2026 · Platform Version: 2.0'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Language Switcher Pill */}
            <div
              style={{
                display: 'flex',
                background: 'rgba(255, 255, 255, 0.06)',
                padding: '3px',
                borderRadius: '20px',
                border: '1px solid var(--glass-border)',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  soundFx?.playClick?.();
                  setModalLang('en');
                }}
                style={{
                  padding: '4px 10px',
                  borderRadius: '14px',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: modalLang === 'en' ? 'rgba(0, 242, 254, 0.25)' : 'transparent',
                  color: modalLang === 'en' ? '#00f2fe' : 'var(--text-muted)',
                  transition: 'all 0.2s ease',
                }}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => {
                  soundFx?.playClick?.();
                  setModalLang('fil');
                }}
                style={{
                  padding: '4px 10px',
                  borderRadius: '14px',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: modalLang === 'fil' ? 'rgba(0, 242, 254, 0.25)' : 'transparent',
                  color: modalLang === 'fil' ? '#00f2fe' : 'var(--text-muted)',
                  transition: 'all 0.2s ease',
                }}
              >
                FIL
              </button>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="glass-btn-icon"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--glass-border)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
              }}
              title="Close (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body: Navigation Sidebar + Scrollable Content */}
        <div
          style={{
            display: 'flex',
            flex: 1,
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          {/* Section Nav Sidebar */}
          <div
            style={{
              width: '230px',
              borderRight: '1px solid var(--glass-border)',
              background: 'rgba(0, 0, 0, 0.2)',
              padding: '16px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              overflowY: 'auto',
            }}
          >
            {sections.map((sec) => {
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => {
                    soundFx?.playClick?.();
                    setActiveSection(sec.id);
                    document.getElementById(`terms-sec-${sec.id}`)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1px solid',
                    borderColor: isActive ? 'rgba(0, 242, 254, 0.35)' : 'transparent',
                    background: isActive ? 'rgba(0, 242, 254, 0.1)' : 'transparent',
                    color: isActive ? '#00f2fe' : 'var(--text-secondary)',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {sec.title}
                </button>
              );
            })}
          </div>

          {/* Scrollable Content Pane */}
          <div
            style={{
              flex: 1,
              padding: '24px 28px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              lineHeight: 1.65,
              fontSize: '0.9rem',
              color: 'var(--text-secondary)',
            }}
          >
            {/* Section 1: Acceptance */}
            <div id="terms-sec-acceptance">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                1. {isFil ? 'Pagtanggap sa mga Tuntunin' : 'Acceptance of Terms'}
              </h3>
              <p>
                {isFil
                  ? 'Sa pag-access, pag-download, o paggamit ng Resiboss ("Platform", "Aplikasyon"), sumasang-ayon kang sumailalim sa mga Tuntunin at Kundisyong ito. Kung hindi ka sumasang-ayon sa alinmang bahagi ng mga tuntuning ito, huwag gamitin ang serbisyo.'
                  : 'By accessing, downloading, or using Resiboss ("Platform", "Application"), you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, please do not use the application.'}
              </p>
            </div>

            {/* Section 2: Permitted Use */}
            <div id="terms-sec-service">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                2. {isFil ? 'Pinahihintulutang Paggamit' : 'Permitted Use & Service'}
              </h3>
              <p>
                {isFil
                  ? 'Ang Resiboss ay nilikha para sa personal at micro-business na pagsubaybay sa paggasta at pamamahala ng resibo. Bawal gamitin ang plataporma para sa iligal na layunin, pamemeke ng mga dokumento, o pagtatangkang ikompromiso ang seguridad ng system.'
                  : 'Resiboss is designed for personal and micro-business expense tracking and receipt management. You agree not to misuse the service, upload fraudulent or forged receipts, or attempt unauthorized access to other user accounts or servers.'}
              </p>
            </div>

            {/* Section 3: AI Processing */}
            <div id="terms-sec-ai">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                3. {isFil ? 'AI OCR at Katumpakan ng Datos' : 'AI OCR & Data Accuracy'}
              </h3>
              <p>
                {isFil
                  ? 'Gumagamit ang Resiboss ng mga advanced visual OCR models (tulad ng Google Gemini at on-device engines) upang awtomatikong basahin ang mga detalye ng resibo. Bagamat mataas ang katumpakan, hinihikayat ang mga gumagamit na suriin ang nakuha bago ito i-save.'
                  : 'Resiboss uses advanced OCR machine learning models (including Google Gemini and on-device engines) to extract receipt details. While highly accurate, automated extraction is subject to image quality, lighting, and receipt formatting. Users are responsible for verifying extracted totals before saving.'}
              </p>
            </div>

            {/* Section 4: Data Ownership */}
            <div id="terms-sec-ownership">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                4. {isFil ? 'Pagmamay-ari ng Datos at Nilalaman' : 'User Data & Ownership'}
              </h3>
              <p>
                {isFil
                  ? 'Ikaw ang nag-iisang may-ari ng lahat ng imahe ng resibo at mga talang pinansyal na inilalagay mo sa Resiboss. Hindi namin ibebenta o ibabahagi ang iyong personal na impormasyon sa mga third-party advertiser.'
                  : 'You retain full ownership of all receipt images, items, and financial records you upload to Resiboss. We do not sell your personal financial records or provide them to third-party ad brokers.'}
              </p>
            </div>

            {/* Section 5: Financial Disclaimer */}
            <div id="terms-sec-disclaimer">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                5. {isFil ? 'Pansamantalang Paalala sa Pananalapi' : 'Financial Disclaimer'}
              </h3>
              <p>
                {isFil
                  ? 'Ang Resiboss ay isang tool para sa personal na organisasyon at pagsubaybay sa paggasta. Hindi ito kapalit ng lisensyadong Certified Public Accountant (CPA) o opisyal na software sa pagbubuwis ng BIR.'
                  : 'Resiboss is an informational productivity tool for expense tracking and personal organization. It does not provide certified financial, legal, or tax advisory services, nor does it replace official BIR tax filing systems.'}
              </p>
            </div>

            {/* Section 6: Limitation of Liability */}
            <div id="terms-sec-liability">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                6. {isFil ? 'Limitasyon ng Pananagutan' : 'Limitation of Liability'}
              </h3>
              <p>
                {isFil
                  ? 'Sa pinakamataas na saklaw na pinapayagan ng batas, ang Resiboss ay ibinibigay "as is" nang walang hayag o ipinahiwatig na warranty ukol sa walang patid na serbisyo o kawalan ng error.'
                  : 'To the maximum extent permitted by applicable law, Resiboss is provided "as is" and "as available". We are not liable for incidental, indirect, or consequential damages resulting from lost receipts, network interruptions, or device failures.'}
              </p>
            </div>

            {/* Section 7: Termination */}
            <div id="terms-sec-termination">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                7. {isFil ? 'Pagtatapos at Pagbura ng Account' : 'Account Termination & Data Deletion'}
              </h3>
              <p>
                {isFil
                  ? 'Maaari mong ihinto ang paggamit ng Resiboss anumang oras. Maaari mong burahin ang lahat ng iyong resibo at data gamit ang "Delete Account" button sa Settings.'
                  : 'You may stop using Resiboss at any time. You have the right to permanently purge your account and all associated receipts directly through the "Delete Account" option in Settings.'}
              </p>
            </div>

            {/* Section 8: Governing Law */}
            <div id="terms-sec-contact">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                8. {isFil ? 'Ugnayan at Batas na Sumasaklaw' : 'Governing Law & Contact'}
              </h3>
              <p>
                {isFil
                  ? 'Ang mga Tuntuning ito ay pinamamahalaan ng mga batas ng Republika ng Pilipinas. Para sa mga katanungan o suporta, maaari kang makipag-ugnayan sa suporta ng Resiboss sa pamamagitan ng opisyal na channel.'
                  : 'These Terms are governed by and construed in accordance with the laws of the Republic of the Philippines. For legal or support inquiries, contact the Resiboss team via the application support channels.'}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 28px',
            borderTop: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface, rgba(15, 23, 42, 0.6))',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {isFil ? 'Naiintindihan at sumasang-ayon ako sa mga Tuntunin' : 'By using Resiboss, you acknowledge these Terms.'}
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rb-btn rb-btn-primary"
            style={{ padding: '8px 20px', borderRadius: '10px' }}
          >
            <CheckCircle2 size={16} /> {isFil ? 'Nauunawaan Ko' : 'I Understand'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;
