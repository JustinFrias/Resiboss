import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  Lock,
  Eye,
  FileText,
  Database,
  Globe,
  X,
  Printer,
  CheckCircle2,
  Server,
  UserCheck,
  Mail,
} from 'lucide-react';

export const PrivacyPolicyModal = () => {
  const { isPrivacyOpen, setIsPrivacyOpen, language, soundFx, setIsCookieModalOpen } = useApp();
  const [modalLang, setModalLang] = useState(language === 'fil' ? 'fil' : 'en');
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    if (language === 'fil') setModalLang('fil');
    else setModalLang('en');
  }, [language]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isPrivacyOpen) {
        setIsPrivacyOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPrivacyOpen, setIsPrivacyOpen]);

  if (!isPrivacyOpen) return null;

  const handleClose = () => {
    soundFx?.playClick?.();
    setIsPrivacyOpen(false);
  };

  const isFil = modalLang === 'fil';

  const sections = [
    { id: 'overview', title: isFil ? 'Pangkalahatang Buod' : 'Overview & Scope' },
    { id: 'collection', title: isFil ? 'Mga Nakokolektang Datos' : 'Data We Collect' },
    { id: 'purpose', title: isFil ? 'Layunin ng Pagproseso' : 'Purpose & Legal Basis' },
    { id: 'storage', title: isFil ? 'Pag-iimbak at Seguridad' : 'Storage & Account Isolation' },
    { id: 'rights', title: isFil ? 'Mga Karapatan Mo (DPA)' : 'Your Privacy Rights' },
    { id: 'cookies', title: isFil ? 'Cookies at Storage' : 'Cookies & Local Storage' },
    { id: 'contact', title: isFil ? 'Data Protection Officer' : 'Contact & DPO' },
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
          background: 'var(--bg-card, rgba(13, 18, 32, 0.95))',
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
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                {isFil ? 'Patakaran sa Privacy ng Resiboss' : 'Resiboss Privacy Policy'}
              </h2>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
                {isFil
                  ? 'Alinsunod sa Republic Act No. 10173 (Data Privacy Act of 2012)'
                  : 'Compliant with Republic Act No. 10173 (Data Privacy Act of 2012) & GDPR'}
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
                  borderRadius: '16px',
                  border: 'none',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: modalLang === 'en' ? '#00f2fe' : 'transparent',
                  color: modalLang === 'en' ? '#030712' : 'var(--text-secondary)',
                  transition: 'all 0.2s',
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
                  borderRadius: '16px',
                  border: 'none',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: modalLang === 'fil' ? '#00f2fe' : 'transparent',
                  color: modalLang === 'fil' ? '#030712' : 'var(--text-secondary)',
                  transition: 'all 0.2s',
                }}
              >
                FIL
              </button>
            </div>

            {/* Print Button */}
            <button
              type="button"
              onClick={() => window.print()}
              title={isFil ? 'I-print ang Patakaran' : 'Print Policy'}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-secondary)',
                borderRadius: '10px',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <Printer size={16} />
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={handleClose}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
                borderRadius: '10px',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            overflowX: 'auto',
            gap: '8px',
            padding: '10px 24px',
            borderBottom: '1px solid var(--glass-border)',
            background: 'var(--bg-surface, rgba(10, 16, 36, 0.4))',
          }}
        >
          {sections.map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => {
                soundFx?.playClick?.();
                setActiveSection(sec.id);
                document.getElementById(`privacy-sec-${sec.id}`)?.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.78rem',
                fontWeight: activeSection === sec.id ? 700 : 500,
                border: activeSection === sec.id ? '1px solid #00f2fe' : '1px solid transparent',
                background: activeSection === sec.id ? 'rgba(0, 242, 254, 0.14)' : 'rgba(255, 255, 255, 0.04)',
                color: activeSection === sec.id ? '#00f2fe' : 'var(--text-secondary)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
            >
              {sec.title}
            </button>
          ))}
        </div>

        {/* Scrollable Policy Content Body */}
        <div
          style={{
            padding: '24px 28px',
            overflowY: 'auto',
            fontSize: '0.88rem',
            lineHeight: '1.65',
            color: 'var(--text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          {/* Section 1: Overview */}
          <div id="privacy-sec-overview">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} color="#00f2fe" />
              {isFil ? '1. Pangkalahatang Buod at Saklaw' : '1. Overview & Scope'}
            </h3>
            <p style={{ margin: 0 }}>
              {isFil
                ? 'Ang Resiboss ("kami", "aming") ay nakatuon sa paggalang at pagprotekta sa iyong karapatan sa privacy alinsunod sa Republic Act No. 10173, na kilala bilang Data Privacy Act of 2012 (DPA) ng Republika ng Pilipinas, at mga kaugnay na pamantayang pandaigdig (tulad ng GDPR). Ipinapaliwanag ng Patakaran sa Privacy na ito kung paano namin kinokolekta, ginagamit, iniimbak, at pinangangalagaan ang iyong impormasyon kapag ginagamit mo ang aming receipt scanning, document vault, at financial management application.'
                : 'Resiboss ("we", "our", or "us") is dedicated to upholding and protecting your fundamental right to privacy in strict adherence with Republic Act No. 10173, known as the Data Privacy Act of 2012 (DPA) of the Philippines, along with international privacy principles (such as the GDPR). This Privacy Policy transparently details how we collect, process, store, and safeguard your information when you utilize our receipt scanning, document vault, and financial organization software.'}
            </p>
          </div>

          {/* Section 2: Data We Collect */}
          <div id="privacy-sec-collection">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={18} color="#00f2fe" />
              {isFil ? '2. Mga Datos na Aming Kinokolekta' : '2. Personal & Document Data We Collect'}
            </h3>
            <p style={{ margin: '0 0 10px 0' }}>
              {isFil
                ? 'Kinokolekta lamang namin ang impormasyong kinakailangan upang mapagana nang maayos ang app para sa iyong sariling pag-iingat ng talaan:'
                : 'We collect solely the information necessary to provide receipt scanning, archiving, and expense bookkeeping features for your personal use:'}
            </p>
            <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>
                  {isFil ? 'Impormasyon sa Account: ' : 'Account Identity Data: '}
                </strong>
                {isFil
                  ? 'Email address at pangalan mula sa iyong Google Account authentication upang matiyak na tanging ikaw lamang ang makakapasok sa iyong sariling Document Vault.'
                  : 'Email address, name, and profile picture provided via Google OAuth or account login, utilized strictly to partition and protect your personal Document Vault.'}
              </li>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>
                  {isFil ? 'Mga Resibo at Dokumentong Pinansyal: ' : 'Receipts & Transaction Documents: '}
                </strong>
                {isFil
                  ? 'Mga litrato ng resibo, pangalan ng merchant, petsa, oras, halaga, Tax Identification Number (TIN), listahan ng mga biniling aytem, at tinatayang Value-Added Tax (VAT) na kinalkula mula sa optical character recognition (OCR).'
                  : 'Uploaded receipt images, merchant names, purchase dates, amounts, Tax Identification Numbers (TIN), line item descriptions, and estimated Value-Added Tax (VAT) extracted via OCR.'}
              </li>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>
                  {isFil ? 'Kagustuhan sa Sistema (Preferences): ' : 'Device & Application Preferences: '}
                </strong>
                {isFil
                  ? 'Tema (Dark/Light mode), napiling wika (English/Filipino), tunog (Sound FX), at lokal na zoom setting na nakaimbak sa browser/device local storage.'
                  : 'UI theme (Dark/Light), selected language, acoustic preferences, and viewing zoom preferences preserved on your local device.'}
              </li>
            </ul>
          </div>

          {/* Section 3: Purpose of Processing */}
          <div id="privacy-sec-purpose">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="#00f2fe" />
              {isFil ? '3. Layunin ng Pagproseso ng Datos' : '3. Purpose & Legal Basis of Processing'}
            </h3>
            <p style={{ margin: 0 }}>
              {isFil
                ? 'Ang lahat ng datos ay pinoproseso lamang para sa: (a) pagbabasa ng teksto sa iyong resibo gamit ang OCR, (b) pag-uuri ng iyong mga gastusin sa Purchases Journal, (c) pagbibigay sa iyo ng export options (CSV, Excel format) para sa iyong personal na talaan o paghahanda ng buwis kasama ang iyong Certified Public Accountant (CPA), at (d) pagtitiyak na hindi kailanman maghahalo o makikita ng ibang user ang iyong mga resibo. Hindi namin ibinebenta, ipinaparenta, o ipinapasa ang iyong datos sa mga advertiser.'
                : 'All collected data is processed exclusively to: (a) convert physical paper receipts into structured digital records via OCR, (b) generate categorized expense ledgers and VAT summaries, (c) allow spreadsheet exports for your personal records or for your licensed CPA, and (d) enforce strict multi-tenant isolation so other accounts cannot view your private vault. We do NOT sell, rent, monetize, or disclose your financial records to advertisers or third-party marketers.'}
            </p>
          </div>

          {/* Section 4: Storage & Account Isolation */}
          <div id="privacy-sec-storage">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={18} color="#00f2fe" />
              {isFil ? '4. Seguridad at Paghihiwalay ng Account (Data Isolation)' : '4. Security & Multi-Tenant Account Isolation'}
            </h3>
            <p style={{ margin: 0 }}>
              {isFil
                ? 'Ipinatutupad ng Resiboss ang multi-tenant data isolation. Ang bawat resibo ay nakatali sa iyong account ID at email address. Kapag nag-sign in ka gamit ang Google, tanging ang mga resibong pagmamay-ari ng iyong account ang ida-download mula sa database. Sa oras na mag-log out ka, awtomatikong nililinis ng app ang aktibong memory at documents sa screen upang walang maiwang tala sa ibang gagamit ng device.'
                : 'Resiboss implements strict multi-tenant account isolation. Every receipt record is tagged with your authenticated user ID and email. When you sign in with Google, only records explicitly belonging to your account are retrieved. Upon signing out, the application immediately clears all document state from memory and UI, preventing unauthorized exposure on shared devices.'}
            </p>
          </div>

          {/* Section 5: Your Rights */}
          <div id="privacy-sec-rights">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserCheck size={18} color="#00f2fe" />
              {isFil ? '5. Ang Iyong mga Karapatan sa ilalim ng Data Privacy Act' : '5. Your Rights under the Data Privacy Act (DPA 2012)'}
            </h3>
            <p style={{ margin: '0 0 8px 0' }}>
              {isFil
                ? 'Bilang Data Subject sa Pilipinas, mayroon kang mga sumusunod na karapatan:'
                : 'As a protected Data Subject, you are entitled to statutory rights under Section 16 of Republic Act No. 10173:'}
            </p>
            <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>
                <strong>{isFil ? 'Karapatang Malaman (Right to be Informed): ' : 'Right to be Informed: '}</strong>
                {isFil ? 'Malaman kung anong datos ang kinokolekta at paano ito pinangangalagaan.' : 'Know how your financial and identity data is collected, stored, and processed.'}
              </li>
              <li>
                <strong>{isFil ? 'Karapatang Ma-access (Right to Access): ' : 'Right to Access: '}</strong>
                {isFil ? 'Makita at ma-export ang lahat ng iyong resibo anumang oras mula sa Document Vault.' : 'Inspect and export all stored receipts and expense entries at any time.'}
              </li>
              <li>
                <strong>{isFil ? 'Karapatang Magtama (Right to Rectification): ' : 'Right to Rectification: '}</strong>
                {isFil ? 'Iwasto o i-edit ang anumang detalye ng resibo sa app.' : 'Update, correct, or refine any extracted receipt field directly.'}
              </li>
              <li>
                <strong>{isFil ? 'Karapatang Magbura (Right to Erasure / Deletion): ' : 'Right to Erasure or Blocking: '}</strong>
                {isFil ? 'Burahin ang indibidwal na resibo o gamitin ang "Clear All Data" upang lubusang tanggalin ang iyong mga tala.' : 'Permanently remove individual receipts or purge your vault using the Clear All Data action.'}
              </li>
              <li>
                <strong>{isFil ? 'Karapatan sa Data Portability (Right to Portability): ' : 'Right to Data Portability: '}</strong>
                {isFil ? 'I-download ang iyong mga talaan sa karaniwang CSV o spreadsheet format.' : 'Export your complete dataset into standard CSV and spreadsheet files.'}
              </li>
            </ul>
          </div>

          {/* Section 6: Cookies & Local Storage */}
          <div id="privacy-sec-cookies">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Server size={18} color="#00f2fe" />
              {isFil ? '6. Cookies at Lokal na Imbakan (Local Storage)' : '6. Cookies & Client-Side Storage'}
            </h3>
            <p style={{ margin: '0 0 10px 0' }}>
              {isFil
                ? 'Gumagamit ang Resiboss ng Cookies at Browser Storage (LocalStorage / SessionStorage) para mapanatili ang iyong login session, i-cache ang iyong sariling mga resibo, at tandaan ang iyong tema at wika. Maaari mong suriin o baguhin ang iyong mga kagustuhan sa cookie anumang oras.'
                : 'Resiboss utilizes Cookies and Client Storage (LocalStorage and SessionStorage) to preserve authenticated sessions, securely cache your isolated receipts, and retain your selected language and aesthetic preferences. You may review or customize your cookie preferences at any time.'}
            </p>
            <button
              type="button"
              onClick={() => {
                soundFx?.playClick?.();
                setIsPrivacyOpen(false);
                setIsCookieModalOpen(true);
              }}
              className="liquid-btn liquid-btn-secondary"
              style={{ padding: '6px 14px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <span>{isFil ? 'Ayusin ang Cookie Preferences' : 'Manage Cookie Preferences'}</span>
            </button>
          </div>

          {/* Section 7: Contact & DPO */}
          <div id="privacy-sec-contact">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail size={18} color="#00f2fe" />
              {isFil ? '7. Pakikipag-ugnayan sa Data Protection Officer (DPO)' : '7. Contact Our Data Protection Team'}
            </h3>
            <p style={{ margin: '0 0 8px 0' }}>
              {isFil
                ? 'Kung mayroon kang mga katanungan, kahilingan para sa pagbura ng data, o nais maghain ng katanungan ukol sa privacy, mangyaring makipag-ugnayan sa aming team:'
                : 'For privacy inquiries, statutory DPA requests, data deletion coordination, or questions regarding our processing practices, please reach out to our team:'}
            </p>
            <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              <div><strong>Email:</strong> privacy@resiboss.app / support@resiboss.app</div>
              <div><strong>Application:</strong> Resiboss Financial Document Intelligence</div>
              <div><strong>Jurisdiction:</strong> Republic of the Philippines (National Privacy Commission compliance)</div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 28px',
            borderTop: '1px solid var(--glass-border)',
            background: 'var(--bg-surface, rgba(10, 16, 36, 0.75))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <Globe size={14} color="var(--cyan-glow)" />
            <span>Republic Act 10173 • National Privacy Commission Standards</span>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="liquid-btn liquid-btn-primary"
            style={{ padding: '8px 24px', fontSize: '0.86rem' }}
          >
            <CheckCircle2 size={16} />
            <span>{isFil ? 'Naunawaan Ko' : 'I Understand'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyModal;
