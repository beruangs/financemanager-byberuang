'use client';

import { useState } from 'react';
import { Shield, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAlert } from '@/context/AlertContext';

interface AdminLoginProps {
  onLoginSuccess: (token: string, email: string) => void;
}

export default function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const { showAlert } = useAlert();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      await showAlert({
        type: 'warning',
        message: 'Email dan password harus diisi!',
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        await showAlert({
          type: 'error',
          title: 'Login Gagal',
          message: data.error || 'Email atau password salah',
        });
        return;
      }

      await showAlert({
        type: 'success',
        title: 'Login Berhasil',
        message: 'Selamat datang di admin panel!',
      });

      onLoginSuccess(data.token, data.email);
    } catch (error) {
      console.error('Login error:', error);
      await showAlert({
        type: 'error',
        title: 'Error',
        message: 'Terjadi kesalahan saat login',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-purple-600 rounded-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
          <p className="text-gray-400">Masuk menggunakan kredensial admin</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="bg-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Admin
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@financemanager.com"
                className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
              />
            </div>
          </div>

          {/* Info Box */}
          <div className="flex gap-3 p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-200">
              Gunakan kredensial admin yang telah dikonfigurasi di .env.local
            </p>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            {isLoading ? 'Memproses...' : 'Masuk ke Admin Panel'}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-400">
          <p>Panel admin Finance Manager v1.0</p>
        </div>
      </div>
    </div>
  );
}
