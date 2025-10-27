'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Users, BarChart3, Shield } from 'lucide-react';
import AdminLogin from '@/components/AdminLogin';
import AdminDashboard from '@/components/AdminDashboard';

export default function AdminPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if token is stored in localStorage
    const storedToken = localStorage.getItem('admin-token');
    const storedEmail = localStorage.getItem('admin-email');
    
    if (storedToken && storedEmail) {
      setToken(storedToken);
      setEmail(storedEmail);
    }
    setIsLoading(false);
  }, []);

  const handleLoginSuccess = (newToken: string, adminEmail: string) => {
    localStorage.setItem('admin-token', newToken);
    localStorage.setItem('admin-email', adminEmail);
    setToken(newToken);
    setEmail(adminEmail);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin-token');
    localStorage.removeItem('admin-email');
    setToken(null);
    setEmail(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {!token ? (
        <AdminLogin onLoginSuccess={handleLoginSuccess} />
      ) : (
        <>
          {/* Admin Header */}
          <div className="bg-slate-800 border-b border-slate-700 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-purple-400" />
                <div>
                  <h1 className="text-xl font-bold text-white">Admin Panel</h1>
                  <p className="text-sm text-gray-400">{email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>

          {/* Admin Dashboard */}
          <AdminDashboard adminToken={token} />
        </>
      )}
    </div>
  );
}
