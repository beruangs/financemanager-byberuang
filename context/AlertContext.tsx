'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import AlertModal from '@/components/AlertModal';

export type AlertType = 'info' | 'success' | 'error' | 'warning' | 'confirm';

export interface AlertOptions {
  type?: AlertType;
  title?: string;
  message: string;
  okText?: string;
  cancelText?: string;
  onOk?: () => void;
  onCancel?: () => void;
}

interface AlertContextType {
  showAlert: (options: AlertOptions | string) => Promise<boolean>;
  showConfirm: (message: string, title?: string) => Promise<boolean>;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alert, setAlert] = useState<AlertOptions & { id: string } | null>(null);
  const [resolveCallback, setResolveCallback] = useState<((value: boolean) => void) | null>(null);

  const showAlert = useCallback((options: AlertOptions | string): Promise<boolean> => {
    return new Promise((resolve) => {
      const alertOptions: AlertOptions = typeof options === 'string' 
        ? { message: options, type: 'info' }
        : options;

      setAlert({
        ...alertOptions,
        id: Date.now().toString(),
      });
      setResolveCallback(() => resolve);
    });
  }, []);

  const showConfirm = useCallback((message: string, title?: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setAlert({
        type: 'confirm',
        title: title || 'Konfirmasi',
        message,
        okText: 'Ya',
        cancelText: 'Tidak',
        id: Date.now().toString(),
      });
      setResolveCallback(() => resolve);
    });
  }, []);

  const handleClose = (result: boolean) => {
    setAlert(null);
    if (resolveCallback) {
      resolveCallback(result);
      setResolveCallback(null);
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      {alert && <AlertModal {...alert} onClose={handleClose} />}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within AlertProvider');
  }
  return context;
}
