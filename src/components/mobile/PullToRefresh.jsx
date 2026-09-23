import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RefreshCw, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const PULL_THRESHOLD = 75; // px before triggering refresh
const MAX_PULL_DISTANCE = 120; // maximum visual displacement

export const PullToRefresh = ({ children }) => {
  const { refreshAppAndData, isSyncing } = useApp();
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshingState, setIsRefreshingState] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const touchStartY = useRef(0);
  const touchStartX = useRef(0);
  const canPullRef = useRef(false);

  // Sync external syncing state if triggered elsewhere
  useEffect(() => {
    if (!isSyncing && isRefreshingState) {
      setIsSuccess(true);
      const timer = setTimeout(() => {
        setIsSuccess(false);
        setIsRefreshingState(false);
        setPullDistance(0);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [isSyncing, isRefreshingState]);

  const handleTouchStart = useCallback((e) => {
    // Only allow pull-to-refresh if scrolled right to the top
    const viewportEl = document.querySelector('.view-viewport');
    const viewportScroll = viewportEl ? viewportEl.scrollTop : 0;
    const windowScroll = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    const isAtTop = windowScroll <= 3 && viewportScroll <= 3;

    if (isAtTop && !isRefreshingState) {
      touchStartY.current = e.touches[0].clientY;
      touchStartX.current = e.touches[0].clientX;
      canPullRef.current = true;
    } else {
      canPullRef.current = false;
    }
  }, [isRefreshingState]);

  const handleTouchMove = useCallback((e) => {
    if (!canPullRef.current || isRefreshingState) return;

    const currentY = e.touches[0].clientY;
    const currentX = e.touches[0].clientX;
    const deltaY = currentY - touchStartY.current;
    const deltaX = Math.abs(currentX - touchStartX.current);

    // If user is swiping horizontally more than vertically, ignore
    if (deltaX > Math.abs(deltaY)) {
      canPullRef.current = false;
      setPullDistance(0);
      setIsPulling(false);
      return;
    }

    if (deltaY > 0) {
      // Apply rubber-band damping curve
      const dampedDistance = Math.min(
        MAX_PULL_DISTANCE,
        Math.pow(deltaY, 0.85) * 1.5
      );
      setPullDistance(dampedDistance);
      setIsPulling(true);

      // Prevent native overscroll / bounce if pulling down
      if (deltaY > 10 && e.cancelable) {
        e.preventDefault();
      }
    } else {
      setPullDistance(0);
      setIsPulling(false);
    }
  }, [isRefreshingState]);

  const handleTouchEnd = useCallback(async () => {
    if (!canPullRef.current || isRefreshingState) return;
    canPullRef.current = false;
    setIsPulling(false);

    if (pullDistance >= PULL_THRESHOLD) {
      setIsRefreshingState(true);
      setPullDistance(60); // Hold at active spinner position

      try {
        await refreshAppAndData({ hardReload: false, showFeedback: false });
        setIsSuccess(true);
      } catch (_) {
        // Handled silently in AppContext
      } finally {
        setTimeout(() => {
          setIsSuccess(false);
          setIsRefreshingState(false);
          setPullDistance(0);
        }, 700);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, isRefreshingState, refreshAppAndData]);

  useEffect(() => {
    const options = { passive: false };
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, options);
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const progress = Math.min(1, pullDistance / PULL_THRESHOLD);
  const rotationDeg = progress * 360;

  return (
    <>
      {/* Floating Liquid Pull-To-Refresh Indicator */}
      <div
        className="ptr-indicator-wrap"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 99999,
          pointerEvents: 'none',
          transform: `translate3d(0, ${pullDistance > 0 ? pullDistance : -70}px, 0)`,
          transition: isPulling ? 'none' : 'transform 0.28s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '7px 16px',
            borderRadius: '9999px',
            background: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(0, 242, 254, 0.4)',
            boxShadow: '0 8px 30px rgba(0, 242, 254, 0.25), 0 4px 12px rgba(0, 0, 0, 0.5)',
            color: '#ffffff',
            fontSize: '0.78rem',
            fontWeight: 600,
            opacity: pullDistance > 10 ? 1 : 0,
            transition: 'opacity 0.15s ease',
          }}
        >
          {isSuccess ? (
            <>
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#34d399',
                }}
              >
                <Check size={13} strokeWidth={2.5} />
              </div>
              <span style={{ color: '#34d399' }}>Nai-refresh na!</span>
            </>
          ) : isRefreshingState ? (
            <>
              <RefreshCw
                size={14}
                className="animate-spin"
                style={{
                  color: '#00f2fe',
                  filter: 'drop-shadow(0 0 6px #00f2fe)',
                }}
              />
              <span style={{ color: '#00f2fe' }}>Inirerefresh...</span>
            </>
          ) : (
            <>
              <RefreshCw
                size={14}
                style={{
                  transform: `rotate(${rotationDeg}deg)`,
                  color: progress >= 1 ? '#00f2fe' : 'rgba(255, 255, 255, 0.7)',
                  transition: 'transform 0.05s linear, color 0.15s ease',
                }}
              />
              <span style={{ color: progress >= 1 ? '#00f2fe' : 'rgba(255, 255, 255, 0.85)' }}>
                {progress >= 1 ? 'Bitawan para i-refresh' : 'Hilahin para i-refresh'}
              </span>
            </>
          )}
        </div>
      </div>

      {children}
    </>
  );
};
