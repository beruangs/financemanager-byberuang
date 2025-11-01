'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode, useEffect } from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import { AlertProvider } from '@/context/AlertContext';
import { isPWA } from '@/lib/session-persistence';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  useEffect(() => {
    // Log PWA status for debugging
    if (isPWA()) {
      console.log('Running as PWA (standalone mode)');
      console.log('Session will persist in localStorage for iOS compatibility');
    }
  }, []);

  return (
    <SessionProvider 
      refetchInterval={5 * 60} // Refetch session every 5 minutes
      refetchOnWindowFocus={true}
    >
      <ThemeProvider>
        <AlertProvider>
          {children}
        </AlertProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
