import React from 'react';

/**
 * Global Error Boundary – catches any unhandled render crash in the React tree
 * and shows a recovery screen with the exact error message for debugging.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[Resiboss ErrorBoundary]', error, info);
    this.setState({ info });
  }

  handleReload = () => {
    try {
      sessionStorage.clear();
    } catch (e) {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const errMsg = this.state.error
        ? (this.state.error.message || this.state.error.toString())
        : 'Unknown error';
      const stack = this.state.info?.componentStack || '';

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
            overflowY: 'auto',
          }}
        >
          <img
            src="/resiboss-emblem.png"
            alt="Resiboss"
            style={{ width: '64px', height: '64px', objectFit: 'contain', marginBottom: '20px', opacity: 0.9 }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />

          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
            Resiboss encountered an error
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', maxWidth: '380px', lineHeight: 1.6, margin: '0 0 20px 0' }}>
            Something went wrong. Error details below:
          </p>

          {/* Error message — always visible */}
          <div
            style={{
              width: '100%',
              maxWidth: '500px',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '10px',
              padding: '14px 16px',
              marginBottom: '16px',
              textAlign: 'left',
              fontSize: '0.8rem',
              color: '#fca5a5',
              wordBreak: 'break-all',
              whiteSpace: 'pre-wrap',
            }}
          >
            <strong style={{ color: '#f87171', display: 'block', marginBottom: '6px' }}>Error:</strong>
            {errMsg}
          </div>

          {/* Component stack */}
          {stack && (
            <div
              style={{
                width: '100%',
                maxWidth: '500px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '10px',
                padding: '12px 14px',
                marginBottom: '20px',
                textAlign: 'left',
                fontSize: '0.68rem',
                color: '#64748b',
                wordBreak: 'break-all',
                whiteSpace: 'pre-wrap',
                maxHeight: '160px',
                overflowY: 'auto',
              }}
            >
              <strong style={{ color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Component stack:</strong>
              {stack}
            </div>
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
