'use client';

import { useState, useEffect } from 'react';
import { LogOut, Monitor, Clock, MapPin } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useAlert } from '@/context/AlertContext';

interface LoginHistory {
  _id: string;
  device: string;
  browser: string;
  os: string;
  ip: string;
  loginTime: string;
  logoutTime?: string;
  isActive: boolean;
}

export default function LoginHistoryComponent() {
  const { showAlert, showConfirm } = useAlert();
  const [loginHistories, setLoginHistories] = useState<LoginHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLoginHistories();
  }, []);

  const fetchLoginHistories = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/login-history');
      if (res.ok) {
        const data = await res.json();
        setLoginHistories(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching login histories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoutSession = async (sessionId: string) => {
    const confirmed = await showConfirm('Yakin ingin logout dari session ini?');
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/login-history/${sessionId}`, {
        method: 'PUT',
      });

      if (res.ok) {
        await fetchLoginHistories();
        await showAlert({
          type: 'success',
          message: 'Session berhasil di-logout',
        });
      }
    } catch (error) {
      console.error('Error logging out session:', error);
      await showAlert({
        type: 'error',
        message: 'Gagal logout session',
      });
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    const confirmed = await showConfirm('Hapus history login ini?');
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/login-history/${sessionId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchLoginHistories();
        await showAlert({
          type: 'success',
          message: 'History berhasil dihapus',
        });
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      await showAlert({
        type: 'error',
        message: 'Gagal menghapus history',
      });
    }
  };

  if (isLoading) {
    return <div className="text-gray-600 dark:text-gray-400">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {loginHistories.length === 0 ? (
        <div className="text-center py-8 text-gray-600 dark:text-gray-400">
          <Monitor className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Belum ada history login</p>
        </div>
      ) : (
        loginHistories.map((history) => (
          <div
            key={history._id}
            className={`p-4 border rounded-lg transition-colors ${
              history.isActive
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className={`p-2 rounded-lg ${
                  history.isActive
                    ? 'bg-green-100 dark:bg-green-900/50'
                    : 'bg-gray-100 dark:bg-gray-900/50'
                }`}>
                  <Monitor className={`w-5 h-5 ${
                    history.isActive
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                      {history.browser} on {history.os}
                    </h4>
                    {history.isActive && (
                      <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-xs font-medium rounded-full whitespace-nowrap">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {history.device}
                  </p>
                  <div className="space-y-1 text-xs text-gray-500 dark:text-gray-500">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>
                        Login: {formatDate(new Date(history.loginTime))}
                        {history.logoutTime && ` | Logout: ${formatDate(new Date(history.logoutTime))}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>IP: {history.ip}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 ml-4 flex-shrink-0">
                {history.isActive && (
                  <button
                    onClick={() => handleLogoutSession(history._id)}
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded transition-colors"
                    title="Logout session ini"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDeleteSession(history._id)}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 rounded transition-colors"
                  title="Hapus history"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
