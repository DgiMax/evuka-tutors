'use client';

import { useState, useEffect, useRef } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import TanstackQueryProvider from '@/providers/TanstackQueryProvider';
import { ActiveContext } from '@/context/ActiveContext';
import api from '@/lib/api/axios';

export function Providers({ children }: { children: React.ReactNode }) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const activeSlugRef = useRef<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('activeOrgSlug');
    if (stored && stored !== 'null' && stored !== 'undefined') {
      console.log('[Providers] Restoring activeSlug from localStorage:', stored);
      setActiveSlug(stored);
      activeSlugRef.current = stored;
    }
  }, []);

  // Keep ref and localStorage in sync
  useEffect(() => {
    activeSlugRef.current = activeSlug;
    if (activeSlug === null) {
      localStorage.removeItem('activeOrgSlug');
    } else {
      localStorage.setItem('activeOrgSlug', activeSlug);
    }
  }, [activeSlug]);

  // Axios interceptor for org header
  useEffect(() => {
    const interceptorId = api.interceptors.request.use((config) => {
      const currentSlug = activeSlugRef.current;
      if (currentSlug) {
        config.headers['X-Organization-Slug'] = currentSlug;
      } else {
        delete config.headers['X-Organization-Slug'];
      }
      return config;
    });

    console.log('[Providers] Axios interceptor registered');

    return () => {
      api.interceptors.request.eject(interceptorId);
      console.log('[Providers] Axios interceptor ejected');
    };
  }, []);

  return (
    <AuthProvider>
      <ActiveContext.Provider value={{ activeSlug, setActiveSlug }}>
        <TanstackQueryProvider>
          {children}
        </TanstackQueryProvider>
      </ActiveContext.Provider>
    </AuthProvider>
  );
}
