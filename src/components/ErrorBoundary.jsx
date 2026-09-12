import React from 'react';

/**
 * Global Error Boundary – catches any unhandled render crash in the React tree
 * and shows a recovery screen instead of a blank white page.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[Resiboss ErrorBoundary]', error, info);
  }

  handleReload = () => {
    try {
      // Clear any potentially corrupt state before reloading
      sessionStorage.clear();
    } catch (e) {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'linear-gradient(135deg, #080c15 0%, #0d1527 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px 20px',
            fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
            color: '#f8fafc',
            textAlign: 'center',
            zIndex: 99999,
          }}
        >
          {/* Glow */}
          <div
            style={{
              position: 'absolute',
              top: '15%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '500px',
              height: '300px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(56,189,248,0.12), transparent 70%)',
              filter: 'blur(60px)',
              pointerEvents: 'none',
            }}
          />

          {/* Logo */}
          <img
            src="/resiboss-emblem.png"
            alt="Resiboss"
            style={{ width: '72px', height: '72px', objectFit: 'contain', marginBottom: '24px', opacity: 0.9 }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />

          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              margin: '0 0 10px 0',
              letterSpacing: '-0.02em',
            }}
          >
            Resiboss encountered an error
          </h1>
          <p
            style={{
              fontSize: '0.88rem',
              color: '#94a3b8',
              maxWidth: '380px',
              lineHeight: 1.6,
              margin: '0 0 28px 0',
            }}
          >
            Something went wrong while loading the app. This is usually temporary — try reloading the page.
          </p>

          {/* Error detail (collapsed) */}
          {this.state.error && (
            <details
              style={{
                marginBottom: '24px',
                fontSize: '0.72rem',
                color: '#64748b',
                maxWidth: '400px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '10px',
                padding: '10px 14px',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <summary style={{ cursor: 'pointer', color: '#94a3b8', marginBottom: '6px' }}>
                View error details
              </summary>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {this.state.error.toString()}
              </pre>
            </details>
          )}

          <button
            onClick={this.handleReload}
            style={{
              padding: '13px 32px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981, #06b6d4)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.95rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
              letterSpacing: '0.01em',
            }}
          >
            Reload Resiboss
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
