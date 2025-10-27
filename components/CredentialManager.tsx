'use client';

import { useState, useEffect } from 'react';
import { Lock, Mail, User, Save } from 'lucide-react';
import { useAlert } from '@/context/AlertContext';

interface CredentialManagerProps {
  adminToken: string;
}

export default function CredentialManager({ adminToken }: CredentialManagerProps) {
  const { showAlert } = useAlert();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    fetchCurrentCredentials();
  }, [adminToken]);

  const fetchCurrentCredentials = async () => {
    try {
      setIsFetching(true);
      const res = await fetch('/api/admin/credentials', {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setEmail(data.email || '');
        setUsername(data.username || '');
        setPassword('');
        setConfirmPassword('');
      } else {
        await showAlert({
          type: 'error',
          message: 'Gagal mengambil kredensial',
        });
      }
    } catch (error) {
      console.error('Error fetching credentials:', error);
      await showAlert({
        type: 'error',
        message: 'Terjadi kesalahan saat mengambil data',
      });
    } finally {
      setIsFetching(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      await showAlert({
        type: 'warning',
        message: 'Email dan password harus diisi!',
      });
      return;
    }

    if (password !== confirmPassword) {
      await showAlert({
        type: 'error',
        message: 'Password dan konfirmasi password tidak cocok!',
      });
      return;
    }

    if (password.length < 6) {
      await showAlert({
        type: 'error',
        message: 'Password minimal 6 karakter!',
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/credentials', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          email,
          password,
          username: username || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        await showAlert({
          type: 'success',
          title: 'Berhasil!',
          message: 'Kredensial berhasil diperbarui. Silakan login kembali dengan kredensial baru.',
        });
        setPassword('');
        setConfirmPassword('');
      } else {
        const errorData = await res.json();
        await showAlert({
          type: 'error',
          message: errorData.error || 'Gagal menyimpan kredensial',
        });
      }
    } catch (error) {
      console.error('Error saving credentials:', error);
      await showAlert({
        type: 'error',
        message: 'Terjadi kesalahan saat menyimpan kredensial',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-2xl p-8 shadow-2xl">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-orange-600 rounded-lg">
          <Lock className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Edit Kredensial Admin</h2>
          <p className="text-gray-400 text-sm">Ubah email, username, dan password admin</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
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
              placeholder="admin@example.com"
              className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              required
            />
          </div>
        </div>

        {/* Username Input */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Username Admin (Opsional)
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin_user"
              className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>
        </div>

        {/* Password Input */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Password Baru
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              required
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">Minimal 6 karakter</p>
        </div>

        {/* Confirm Password Input */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Konfirmasi Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              required
            />
          </div>
        </div>

        {/* Info Box */}
        <div className="p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
          <p className="text-sm text-yellow-200">
            ⚠️ <strong>Perhatian:</strong> Setelah mengubah kredensial, Anda harus login kembali dengan kredensial baru.
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" />
          {isLoading ? 'Menyimpan...' : 'Simpan Kredensial'}
        </button>
      </form>
    </div>
  );
}
