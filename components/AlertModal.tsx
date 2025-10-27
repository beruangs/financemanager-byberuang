'use client';

import React from 'react';
import { X, AlertCircle, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

export interface AlertModalProps {
  type?: 'info' | 'success' | 'error' | 'warning' | 'confirm';
  title?: string;
  message: string;
  okText?: string;
  cancelText?: string;
  onClose: (result: boolean) => void;
}

export default function AlertModal({
  type = 'info',
  title,
  message,
  okText = 'OK',
  cancelText = 'Batal',
  onClose,
}: AlertModalProps) {
  const isConfirm = type === 'confirm';

  const iconConfig = {
    info: { Icon: Info, color: 'text-blue-500', bg: 'bg-blue-100' },
    success: { Icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100' },
    error: { Icon: XCircle, color: 'text-red-500', bg: 'bg-red-100' },
    warning: { Icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-100' },
    confirm: { Icon: AlertCircle, color: 'text-blue-500', bg: 'bg-blue-100' },
  };

  const config = iconConfig[type];
  const Icon = config.Icon;

  const defaultTitles = {
    info: 'Informasi',
    success: 'Berhasil',
    error: 'Error',
    warning: 'Peringatan',
    confirm: 'Konfirmasi',
  };

  const finalTitle = title || defaultTitles[type];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fadeIn"
        onClick={() => onClose(false)}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 pointer-events-auto animate-scaleIn"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-indigo-500 to-purple-600 rounded-t-2xl p-6 text-white flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              <div className={`${config.bg} p-3 rounded-xl`}>
                <Icon className={`w-6 h-6 ${config.color}`} />
              </div>
              <div>
                <h2 className="text-lg font-bold">{finalTitle}</h2>
              </div>
            </div>
            <button
              onClick={() => onClose(false)}
              className="hover:bg-white/20 p-1 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {message}
            </p>
          </div>

          {/* Footer */}
          <div className={`bg-gray-50 dark:bg-slate-700 border-t border-gray-200 dark:border-slate-600 px-6 py-4 rounded-b-2xl flex gap-3 ${
            isConfirm ? 'justify-end' : 'justify-center'
          }`}>
            {isConfirm && (
              <button
                onClick={() => onClose(false)}
                className="px-6 py-2 bg-gray-200 dark:bg-slate-600 text-gray-800 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={() => onClose(true)}
              className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all"
            >
              {okText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
