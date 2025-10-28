'use client';

import { useState, useEffect } from 'react';
import { ArrowDownCircle, ArrowUpCircle, FileText, Calendar } from 'lucide-react';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, BILL_CATEGORIES } from '@/lib/constants';
import { IWallet } from '@/models/Wallet';
import NumberInput from './NumberInput';

interface TransactionFormProps {
  onTransactionAdd?: () => void;
}

export default function TransactionForm({ onTransactionAdd }: TransactionFormProps) {
  const [wallets, setWallets] = useState<IWallet[]>([]);
  const [transactionType, setTransactionType] = useState<'expense' | 'income' | 'bill'>('expense');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0,5), // HH:MM format
    amount: '',
    walletId: '',
    category: '',
    description: '',
    // For bills
    dueDate: '',
    isRecurring: false,
    recurringPattern: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchWallets();
  }, []);

  const fetchWallets = async () => {
    try {
      const response = await fetch('/api/wallets');
      if (response.ok) {
        const data = await response.json();
        setWallets(Array.isArray(data) ? data : (data.wallets || []));
      }
    } catch (error) {
      console.error('Error fetching wallets:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.walletId || !formData.amount || !formData.category) {
      alert('Mohon lengkapi semua field yang wajib!');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletId: formData.walletId,
          type: transactionType,
          category: formData.category,
          amount: parseInt(formData.amount),
          description: formData.description || undefined,
          date: formData.date,
          isRecurring: transactionType === 'bill' ? formData.isRecurring : false,
          recurringPattern: transactionType === 'bill' && formData.isRecurring ? formData.recurringPattern : undefined,
        }),
      });

      if (response.ok) {
        if (onTransactionAdd) onTransactionAdd();
        
        // Reset form
        const now = new Date();
        setFormData({
          date: now.toISOString().split('T')[0],
          time: now.toTimeString().slice(0, 5),
          amount: '',
          walletId: '',
          category: '',
          description: '',
          dueDate: '',
          isRecurring: false,
          recurringPattern: 'monthly',
        });
        
        alert('Transaksi berhasil ditambahkan!');
      } else {
        const data = await response.json();
        alert(data.error || 'Gagal menambah transaksi');
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  const categories = transactionType === 'expense' 
    ? EXPENSE_CATEGORIES 
    : transactionType === 'income' 
    ? INCOME_CATEGORIES 
    : BILL_CATEGORIES;

  const getTypeLabel = () => {
    if (transactionType === 'expense') return 'Pengeluaran';
    if (transactionType === 'income') return 'Pemasukan';
    return 'Tagihan';
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-slate-700 transition-colors">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Catat Transaksi</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Transaction Type */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            Tipe Transaksi
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => {
                setTransactionType('expense');
                setFormData({ ...formData, category: '' });
              }}
              className={`p-4 rounded-xl border-2 transition-all ${
                transactionType === 'expense'
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 text-gray-700 dark:text-gray-300'
              }`}
            >
              <ArrowDownCircle className="w-8 h-8 mx-auto mb-2" />
              <p className="font-semibold">Pengeluaran</p>
            </button>
            <button
              type="button"
              onClick={() => {
                setTransactionType('income');
                setFormData({ ...formData, category: '' });
              }}
              className={`p-4 rounded-xl border-2 transition-all ${
                transactionType === 'income'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 text-gray-700 dark:text-gray-300'
              }`}
            >
              <ArrowUpCircle className="w-8 h-8 mx-auto mb-2" />
              <p className="font-semibold">Pemasukan</p>
            </button>
            <button
              type="button"
              onClick={() => {
                setTransactionType('bill');
                setFormData({ ...formData, category: '' });
              }}
              className={`p-4 rounded-xl border-2 transition-all ${
                transactionType === 'bill'
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                  : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 text-gray-700 dark:text-gray-300'
              }`}
            >
              <FileText className="w-8 h-8 mx-auto mb-2" />
              <p className="font-semibold">Tagihan</p>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Tanggal
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Jam
            </label>
            <input
              type="time"
              required
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Jumlah (Rp) *
            </label>
            <NumberInput
              required
              value={formData.amount}
              onChange={(value) => setFormData({ ...formData, amount: value })}
              className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
              placeholder="50.000"
            />
          </div>

          {/* Wallet */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Saldo/Dompet *
            </label>
            <select
              required
              value={formData.walletId}
              onChange={(e) => setFormData({ ...formData, walletId: e.target.value })}
              className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
            >
              <option value="">Pilih Dompet</option>
              {wallets.map((wallet) => (
                <option key={wallet._id} value={wallet._id}>
                  {wallet.name} (Saldo: Rp {wallet.balance.toLocaleString('id-ID')})
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Kategori {getTypeLabel()} *
            </label>
            <select
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
            >
              <option value="">Pilih Kategori</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            Catatan (Opsional)
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
            rows={3}
            placeholder={
              transactionType === 'expense'
                ? 'Beli apa? Dimana?'
                : transactionType === 'income'
                ? 'Dari mana? Untuk apa?'
                : 'Detail tagihan...'
            }
          />
        </div>

        {/* Recurring for bills */}
        {transactionType === 'bill' && (
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isRecurring"
                checked={formData.isRecurring}
                onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                className="mr-2 w-4 h-4 text-indigo-600 rounded"
              />
              <label htmlFor="isRecurring" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Tagihan Berulang
              </label>
            </div>

            {formData.isRecurring && (
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Pola Berulang
                </label>
                <select
                  value={formData.recurringPattern}
                  onChange={(e) => setFormData({ ...formData, recurringPattern: e.target.value as any })}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                >
                  <option value="daily">Harian</option>
                  <option value="weekly">Mingguan</option>
                  <option value="monthly">Bulanan</option>
                  <option value="yearly">Tahunan</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Menyimpan...' : `Tambah ${getTypeLabel()}`}
        </button>
      </form>
    </div>
  );
}
