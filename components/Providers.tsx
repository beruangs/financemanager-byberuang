'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import { AlertProvider } from '@/context/AlertContext';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <AlertProvider>
          {children}
        </AlertProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
