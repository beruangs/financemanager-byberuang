'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Download, User, Mail, Calendar, LogOut, Moon, Sun, History, MessageCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ITransaction } from '@/models/Transaction';
import { IWallet } from '@/models/Wallet';
import { IBudget } from '@/models/Budget';
import { useTheme } from '@/context/ThemeContext';
import { useAlert } from '@/context/AlertContext';
import LoginHistoryComponent from './LoginHistoryComponent';

interface SettingsProps {
  onLogout?: () => void;
}

export default function Settings({ onLogout }: SettingsProps) {
  const { data: session } = useSession();
  const { isDark, toggleDark } = useTheme();
  const { showAlert } = useAlert();
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [wallets, setWallets] = useState<IWallet[]>([]);
  const [budget, setBudget] = useState<IBudget | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [transactionsRes, walletsRes, budgetRes] = await Promise.all([
        fetch('/api/transactions'),
        fetch('/api/wallets'),
        fetch('/api/budgets'),
      ]);

      if (transactionsRes.ok) {
        const data = await transactionsRes.json();
        setTransactions(Array.isArray(data) ? data : (data.transactions || []));
      }
      if (walletsRes.ok) {
        const data = await walletsRes.json();
        setWallets(Array.isArray(data) ? data : (data.wallets || []));
      }
      if (budgetRes.ok) {
        const data = await budgetRes.json();
        setBudget(data.budget || data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleExportJSON = () => {
    const data = {
      user: {
        name: session?.user?.name,
        email: session?.user?.email,
      },
      wallets,
      transactions,
      budget,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-manager-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = async () => {
    if (transactions.length === 0) {
      await showAlert({
        type: 'warning',
        message: 'Tidak ada transaksi untuk diekspor',
      });
      return;
    }

    const headers = ['Tanggal', 'Tipe', 'Kategori', 'Jumlah', 'Dompet', 'Deskripsi'];
    const rows = transactions.map(t => {
      const wallet = wallets.find(w => w._id === t.walletId.toString());
      return [
        new Date(t.date).toLocaleDateString('id-ID'),
        t.type === 'income' ? 'Pemasukan' : t.type === 'expense' ? 'Pengeluaran' : 'Tagihan',
        t.category,
        t.amount,
        wallet?.name || 'Unknown',
        t.description || '',
      ];
    });

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Pengaturan</h1>
        <p className="text-gray-700 dark:text-gray-300">Kelola profil dan export data Anda</p>
      </div>

      {/* Profile Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
            {session?.user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{session?.user?.name}</h3>
            <p className="text-gray-700 dark:text-gray-300">{session?.user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <div className="flex items-center space-x-3">
              <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">Total Dompet</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{wallets.length}</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
            <div className="flex items-center space-x-3">
              <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">Total Transaksi</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{transactions.length}</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
            <div className="flex items-center space-x-3">
              <Mail className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">Total Saldo</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(wallets.reduce((sum, w) => sum + w.balance, 0))}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Theme Settings Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isDark ? (
              <Moon className="w-6 h-6 text-yellow-500" />
            ) : (
              <Sun className="w-6 h-6 text-yellow-500" />
            )}
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Mode Gelap</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {isDark ? 'Mode gelap aktif' : 'Aktifkan mode gelap untuk kenyamanan malam'}
              </p>
            </div>
          </div>
          <button
            onClick={toggleDark}
            className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${
              isDark ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                isDark ? 'translate-x-9' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Export Data Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center space-x-3 mb-6">
          <Download className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Export Data</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">Download data keuangan Anda</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleExportJSON}
            className="p-4 border-2 border-gray-200 dark:border-slate-600 rounded-xl hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400">Export JSON</h4>
                <p className="text-sm text-gray-700 dark:text-gray-400">Format lengkap untuk backup</p>
              </div>
              <Download className="w-6 h-6 text-gray-400 dark:text-gray-500 group-hover:text-purple-600 dark:group-hover:text-purple-400" />
            </div>
          </button>

          <button
            onClick={handleExportCSV}
            className="p-4 border-2 border-gray-200 dark:border-slate-600 rounded-xl hover:border-green-500 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400">Export CSV</h4>
                <p className="text-sm text-gray-700 dark:text-gray-400">Format Excel untuk transaksi</p>
              </div>
              <Download className="w-6 h-6 text-gray-400 dark:text-gray-500 group-hover:text-green-600 dark:group-hover:text-green-400" />
            </div>
          </button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Tips:</strong> Export JSON untuk backup lengkap termasuk semua dompet, transaksi, dan budget. 
            Export CSV untuk analisis transaksi di Excel atau Google Sheets.
          </p>
        </div>
      </div>

      {/* Login History Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center space-x-3 mb-6">
          <History className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">History Login</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">Kelola sesi login Anda di berbagai perangkat</p>
          </div>
        </div>
        <LoginHistoryComponent />
      </div>

      {/* Contact Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center space-x-3 mb-6">
          <MessageCircle className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Hubungi Saya</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">Terhubung dengan developer</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-200 dark:border-indigo-700">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-indigo-600 rounded-full">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-white">Discord</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">@beruang#2654</p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText('beruang#2654');
                  showAlert({
                    type: 'success',
                    message: 'Discord ID disalin ke clipboard!',
                  });
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Salin
              </button>
            </div>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-xl">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>💡 Tips:</strong> Hubungi saya melalui Discord untuk saran, bug report, atau pertanyaan tentang Finance Manager.
            </p>
          </div>
        </div>
      </div>

      {/* Logout Button */}
      {onLogout && (
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center space-x-2 bg-red-600 dark:bg-red-700 text-white px-6 py-3 rounded-xl hover:bg-red-700 dark:hover:bg-red-800 transition-colors font-semibold"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
      )}
    </div>
  );
}
