'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { getExpiry, setExpiry, clearToken } from '@/lib/auth';
import { adminAuth } from '@/lib/api';

const WARN_BEFORE_MS = 5 * 60 * 1000; // 5 minutes
const CHECK_INTERVAL_MS = 30_000;
const CHANNEL_NAME = 'admin_session';

export function useSessionExpiry(onLogout: () => void) {
  const [showModal, setShowModal] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const doLogout = useCallback(() => {
    clearToken();
    channelRef.current?.postMessage({ type: 'logout' });
    onLogout();
  }, [onLogout]);

  const extendSession = useCallback(async () => {
    try {
      const { token, expiresIn } = await adminAuth.refresh();
      const { setToken } = await import('@/lib/auth');
      setToken(token, expiresIn);
      const newExpiry = Date.now() + expiresIn;
      setExpiry(newExpiry);
      channelRef.current?.postMessage({ type: 'refresh', expiresAt: newExpiry });
      setShowModal(false);
      if (countdownRef.current) clearInterval(countdownRef.current);
    } catch {
      doLogout();
    }
  }, [doLogout]);

  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;

    channel.onmessage = (e) => {
      if (e.data.type === 'logout') {
        clearToken();
        onLogout();
      } else if (e.data.type === 'refresh') {
        setExpiry(e.data.expiresAt);
        setShowModal(false);
        if (countdownRef.current) clearInterval(countdownRef.current);
      }
    };

    const interval = setInterval(() => {
      const expiry = getExpiry();
      if (!expiry) return;
      const remaining = expiry - Date.now();
      if (remaining <= 0) {
        doLogout();
      } else if (remaining <= WARN_BEFORE_MS && !showModal) {
        setShowModal(true);
        setCountdown(60);
        countdownRef.current = setInterval(() => {
          setCountdown((c) => {
            if (c <= 1) {
              clearInterval(countdownRef.current!);
              doLogout();
              return 0;
            }
            return c - 1;
          });
        }, 1000);
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      if (countdownRef.current) clearInterval(countdownRef.current);
      channel.close();
    };
  }, [doLogout, onLogout, showModal]);

  return { showModal, countdown, extendSession, doLogout };
}
