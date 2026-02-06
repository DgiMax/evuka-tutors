"use client";

import { useState, useEffect, useRef } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import TanstackQueryProvider from '@/providers/TanstackQueryProvider';
import { ActiveContext } from '@/context/ActiveContext';
import api from '@/lib/api/axios';
import { GoogleProvider } from "@/context/GoogleProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const activeSlugRef = useRef<string | null>(null);

  useEffect(() => {
    const storedSlug = localStorage.getItem('activeOrgSlug');
    const storedRole = localStorage.getItem('activeOrgRole');

    if (storedSlug && storedSlug !== 'null' && storedSlug !== 'undefined') {
      setActiveSlug(storedSlug);
      activeSlugRef.current = storedSlug;
    }

    if (storedRole && storedRole !== 'null' && storedRole !== 'undefined') {
      setActiveRole(storedRole);
    }
  }, []);

  useEffect(() => {
    activeSlugRef.current = activeSlug;
    if (activeSlug === null) {
      localStorage.removeItem('activeOrgSlug');
      localStorage.removeItem('activeOrgRole');
      setActiveRole(null);
    } else {
      localStorage.setItem('activeOrgSlug', activeSlug);
    }
  }, [activeSlug]);

  useEffect(() => {
    if (activeRole === null) {
      localStorage.removeItem('activeOrgRole');
    } else {
      localStorage.setItem('activeOrgRole', activeRole);
    }
  }, [activeRole]);

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

    return () => {
      api.interceptors.request.eject(interceptorId);
    };
  }, []);

  return (
    <GoogleProvider>
      <AuthProvider>
        <ActiveContext.Provider 
          value={{ 
            activeSlug, 
            setActiveSlug, 
            activeRole, 
            setActiveRole, 
            isVerifying, 
            setIsVerifying 
          }}
        >
          <TanstackQueryProvider>
            {children}
          </TanstackQueryProvider>
        </ActiveContext.Provider>
      </AuthProvider>
    </GoogleProvider>
  );
}