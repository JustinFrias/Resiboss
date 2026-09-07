import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Globe,
  Save,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  Zap,
  Key,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Database,
  Code2,
  HelpCircle,
} from 'lucide-react';

export const PIPEDREAM_NODE_CODE = `// Pipedream Node.js step for Resiboss Sign In & Registration
import { createHash } from "crypto";

export default defineComponent({
  props: {
    // I-connect sa Data Store na "resiboss_users"
    resiboss_users: {
      type: "data_store",
    },
  },
  async run({ steps, $ }) {
    // 1. Kunin ang datos mula sa Resiboss app
    const payload = steps.trigger.event.body || {};
    const action = payload.action || "login";
    const email = (payload.email || "").trim().toLowerCase();
    const password = payload.password || "";
    const fullName = payload.fullName || "";
    const firstName = payload.firstName || fullName.split(" ")[0] || "User";
    const lastName = payload.lastName || fullName.split(" ").slice(1).join(" ") || "";

    // Validation
    if (!email || !password) {
      await $.respond({
        status: 400,
        headers: { "Content-Type": "application/json" },
        body: { success: false, message: "Email and password are required." },
      });
      return;
    }

    // Helper: I-hash ang password gamit ang SHA-256
    const hashPassword = (pwd) => {
      return createHash("sha256").update(pwd).digest("hex");
    };

    const passwordHash = hashPassword(password);

    // ==========================================
    // ACTION 1: REGISTER NEW USER
    // ==========================================
    if (action === "register") {
      const existingUser = await this.resiboss_users.get(email);
      if (existingUser) {
        await $.respond({
          status: 409,
          headers: { "Content-Type": "application/json" },
          body: { success: false, message: "May account na gamit ang email na ito. Mag-sign in na lang." },
        });
        return;
      }

      const newUser = {
        id: "usr_" + Date.now(),
        email: email,
        fullName: fullName || \`\${firstName} \${lastName}\`.trim(),
        firstName: firstName,
        lastName: lastName,
        passwordHash: passwordHash,
        createdAt: new Date().toISOString(),
      };

      // I-save ang user sa Pipedream Data Store
      await this.resiboss_users.set(email, newUser);

      await $.respond({
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: {
          success: true,
          message: "Registration successful!",
          user: {
            id: newUser.id,
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
          },
        },
      });
      return;
    }

    // ==========================================
    // ACTION 2: LOGIN EXISTING USER
    // ==========================================
    if (action === "login") {
      const user = await this.resiboss_users.get(email);

      if (!user) {
        await $.respond({
          status: 401,
          headers: { "Content-Type": "application/json" },
          body: { success: false, message: "Hindi nahanap ang account na ito. Mag-register muna." },
        });
        return;
      }

      if (user.passwordHash !== passwordHash) {
        await $.respond({
          status: 401,
          headers: { "Content-Type": "application/json" },
          body: { success: false, message: "Maling password. Pakisubukang muli." },
        });
        return;
      }

      // Password matches! Return user session
      await $.respond({
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: {
          success: true,
          message: "Welcome back to Resiboss!",
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          },
        },
      });
      return;
    }

    // Unknown action
    await $.respond({
      status: 400,
      headers: { "Content-Type": "application/json" },
      body: { success: false, message: "Invalid action specified." },
    });
  },
});`;

export const PipedreamSetupTab = () => {
  const { pipedreamAuthUrl, setPipedreamAuthUrl, soundFx } = useApp();

  const [urlInput, setUrlInput] = useState(pipedreamAuthUrl || '');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testStatus, setTestStatus] = useState(null); // null | 'testing' | 'success' | 'error'
  const [testMessage, setTestMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSave = (e) => {
    e?.preventDefault();
    const trimmed = urlInput.trim();
    setPipedreamAuthUrl(trimmed);
    setSaveSuccess(true);
    soundFx?.playSuccessChime?.();
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  const handleTestConnection = async () => {
    const url = urlInput.trim();
    if (!url) {
      setTestStatus('error');
      setTestMessage('Pakilagay muna ang Pipedream Webhook URL bago mag-test.');
      return;
    }

    setTestStatus('testing');
    setTestMessage('Nagpapadala ng ping request sa Pipedream...');
    soundFx?.playClick?.();

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_ping',
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok || response.status === 400 || response.status === 401) {
        setTestStatus('success');
        setTestMessage('✓ Naabot ang Pipedream Webhook! Active at tumutugon ang endpoint.');
        soundFx?.playSuccessChime?.();
      } else {
        setTestStatus('error');
        setTestMessage(`Nagbalik ang Pipedream ng status ${response.status}. Tiyaking naka-Deploy ang workflow.`);
      }
    } catch (err) {
      setTestStatus('error');
      setTestMessage(`Hindi maabot ang webhook: ${err.message}. Tiyaking tama ang URL at may internet connection.`);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(PIPEDREAM_NODE_CODE);
    setCopied(true);
    soundFx?.playClick?.();
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div style={{ maxWidth: '820px' }}>
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
            Pipedream Authentication Integration
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>
            I-connect ang iyong Resiboss app sa Pipedream para magkaroon ng ligtas at mabilis na Email + Password sign-in sa phone APK at browser.
          </p>
        </div>

        <a
          href="https://pipedream.com"
          target="_blank"
          rel="noreferrer"
          className="liquid-btn liquid-btn-secondary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.82rem',
            padding: '8px 14px',
            flexShrink: 0,
          }}
        >
          <span>Pipedream Dashboard</span>
          <ExternalLink size={13} />
        </a>
      </div>

      {/* Webhook Configuration Box */}
      <div
        style={{
          background: 'var(--bg-surface-elevated, rgba(15, 23, 42, 0.65))',
          border: '1px solid var(--glass-border)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '26px',
          boxShadow: 'var(--glass-shadow-sm, 0 0 25px rgba(0, 242, 254, 0.08))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={18} color="#00f2fe" />
            <span style={{ fontWeight: 700, fontSize: '0.94rem', color: 'var(--text-primary)' }}>
              Your Pipedream Webhook URL
            </span>
          </div>

          <span
            style={{
              fontSize: '0.74rem',
              padding: '3px 8px',
              borderRadius: '6px',
              background: pipedreamAuthUrl ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
              color: pipedreamAuthUrl ? '#34d399' : '#fbbf24',
              border: `1px solid ${pipedreamAuthUrl ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
              fontWeight: 600,
            }}
          >
            {pipedreamAuthUrl ? '● Connected' : '○ Not Configured'}
          </span>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
            <Globe
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="url"
              required
              placeholder="https://eo...m.pipedream.net"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              style={{
                width: '100%',
                padding: '11px 12px 11px 38px',
                borderRadius: '10px',
                background: 'var(--bg-surface, rgba(0, 0, 0, 0.4))',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
                fontSize: '0.88rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="submit"
            className="liquid-btn liquid-btn-primary"
            style={{
              padding: '10px 18px',
              fontSize: '0.88rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Save size={15} />
            <span>Save URL</span>
          </button>

          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testStatus === 'testing'}
            className="liquid-btn liquid-btn-secondary"
            style={{
              padding: '10px 16px',
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {testStatus === 'testing' ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Testing...</span>
              </>
            ) : (
              <>
                <Zap size={15} />
                <span>Test Connection</span>
              </>
            )}
          </button>
        </form>

        {saveSuccess && (
          <div style={{ marginTop: '10px', color: '#34d399', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={14} />
            <span>Matagumpay na na-save ang Pipedream Webhook URL sa local storage!</span>
          </div>
        )}

        {testStatus && (
          <div
            style={{
              marginTop: '12px',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: testStatus === 'success' ? 'rgba(16, 185, 129, 0.15)' : testStatus === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(0, 242, 254, 0.1)',
              border: `1px solid ${testStatus === 'success' ? 'rgba(16, 185, 129, 0.3)' : testStatus === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(0, 242, 254, 0.3)'}`,
              color: testStatus === 'success' ? '#34d399' : testStatus === 'error' ? '#f87171' : '#00f2fe',
            }}
          >
            {testStatus === 'success' ? <CheckCircle2 size={15} /> : testStatus === 'error' ? <AlertCircle size={15} /> : <Loader2 size={15} className="animate-spin" />}
            <span>{testMessage}</span>
          </div>
        )}
      </div>

      {/* Step-by-Step Setup Guide */}
      <div style={{ marginBottom: '28px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Code2 size={18} color="#a855f7" />
          <span>Paano I-set up sa Pipedream (3 Madaling Hakbang)</span>
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Step 1 */}
          <div
            style={{
              background: 'var(--bg-surface, rgba(255, 255, 255, 0.03))',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              padding: '14px 16px',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#00f2fe', marginBottom: '4px' }}>
              1. Gumawa ng Bagong Workflow sa Pipedream
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Pumunta sa <a href="https://pipedream.com" target="_blank" rel="noreferrer" style={{ color: '#00f2fe' }}>Pipedream</a> ➔ I-click ang <strong>New Workflow +</strong> ➔ Piliin ang Trigger na <strong>"HTTP / Webhook"</strong> ➔ Piliin ang <strong>"HTTP Requests (Instant)"</strong>.
            </div>
          </div>

          {/* Step 2 */}
          <div
            style={{
              background: 'var(--bg-surface, rgba(255, 255, 255, 0.03))',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              padding: '14px 16px',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#a855f7', marginBottom: '4px' }}>
              2. Idagdag ang Node.js Step na may Data Store
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Sa ilalim ng trigger, i-click ang <strong>"+"</strong> para magdagdag ng step ➔ Piliin ang <strong>"Run Node.js code"</strong> ➔ Sa step props, i-connect o gumawa ng Data Store na may pangalang <strong><code>resiboss_users</code></strong>.
            </div>
          </div>

          {/* Step 3 */}
          <div
            style={{
              background: 'var(--bg-surface, rgba(255, 255, 255, 0.03))',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              padding: '14px 16px',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#34d399', marginBottom: '4px' }}>
              3. I-paste ang Code at I-deploy
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              I-copy ang code sa ibaba at i-paste sa Node.js code box ng Pipedream ➔ I-click ang <strong>Deploy</strong> ➔ Kopyahin ang iyong Webhook endpoint URL at i-paste sa box sa itaas!
            </div>
          </div>
        </div>
      </div>

      {/* Code Block with Copy Button */}
      <div
        style={{
          background: 'rgba(10, 15, 30, 0.9)',
          border: '1px solid var(--glass-border)',
          borderRadius: '14px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 16px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderBottom: '1px solid var(--glass-border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={15} color="#00f2fe" />
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#ffffff' }}>
              pipedream_auth_handler.js
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopyCode}
            className="liquid-btn liquid-btn-secondary"
            style={{
              padding: '5px 12px',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            {copied ? <Check size={13} color="#34d399" /> : <Copy size={13} />}
            <span>{copied ? 'Kopyado Na!' : 'Copy Code'}</span>
          </button>
        </div>

        <pre
          style={{
            padding: '16px',
            margin: 0,
            overflowX: 'auto',
            fontSize: '0.78rem',
            lineHeight: 1.6,
            color: '#a5b4fc',
            fontFamily: 'monospace',
            maxHeight: '340px',
          }}
        >
          <code>{PIPEDREAM_NODE_CODE}</code>
        </pre>
      </div>
    </div>
  );
};
