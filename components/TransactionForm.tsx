'use client';

import { useState, useEffect } from 'react';
import { ArrowDownCircle, ArrowUpCircle, FileText, Calendar, ArrowLeftRight } from 'lucide-react';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, BILL_CATEGORIES } from '@/lib/constants';
import { IWallet } from '@/models/Wallet';
import NumberInput from './NumberInput';

interface TransactionFormProps {
  onTransactionAdd?: () => void;
}

export default function TransactionForm({ onTransactionAdd }: TransactionFormProps) {
  const [wallets, setWallets] = useState<IWallet[]>([]);
  const [transactionType, setTransactionType] = useState<'expense' | 'income' | 'bill' | 'transfer'>('expense');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0,5), // HH:MM format
    amount: '',
    walletId: '',
    toWalletId: '', // For transfer
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

    // Validation for transfer
    if (transactionType === 'transfer') {
      if (!formData.walletId || !formData.toWalletId || !formData.amount) {
        alert('Mohon lengkapi dompet asal, dompet tujuan, dan jumlah!');
        return;
      }
      if (formData.walletId === formData.toWalletId) {
        alert('Dompet asal dan tujuan tidak boleh sama!');
        return;
      }
    } else {
      if (!formData.walletId || !formData.amount || !formData.category) {
        alert('Mohon lengkapi semua field yang wajib!');
        return;
      }
    }

    setIsLoading(true);
    try {
      // For transfer, create two transactions
      if (transactionType === 'transfer') {
        const amount = parseInt(formData.amount);
        const dateTime = `${formData.date}T${formData.time}:00`;
        
        // Create expense transaction from source wallet
        const expenseRes = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletId: formData.walletId,
            type: 'expense',
            category: 'Transfer',
            amount: amount,
            description: `Transfer ke ${wallets.find(w => w._id === formData.toWalletId)?.name || 'Dompet Tujuan'}`,
            date: dateTime,
          }),
        });

        if (!expenseRes.ok) {
          throw new Error('Gagal membuat transaksi keluar');
        }

        // Create income transaction to destination wallet
        const incomeRes = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletId: formData.toWalletId,
            type: 'income',
            category: 'Transfer',
            amount: amount,
            description: `Transfer dari ${wallets.find(w => w._id === formData.walletId)?.name || 'Dompet Asal'}`,
            date: dateTime,
          }),
        });

        if (!incomeRes.ok) {
          throw new Error('Gagal membuat transaksi masuk');
        }

        if (onTransactionAdd) onTransactionAdd();
        
        // Reset form
        const now = new Date();
        setFormData({
          date: now.toISOString().split('T')[0],
          time: now.toTimeString().slice(0, 5),
          amount: '',
          walletId: '',
          toWalletId: '',
          category: '',
          description: '',
          dueDate: '',
          isRecurring: false,
          recurringPattern: 'monthly',
        });
        
        alert('Transfer berhasil!');
      } else {
        // Normal transaction
        const dateTime = `${formData.date}T${formData.time}:00`;
        const response = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletId: formData.walletId,
            type: transactionType,
            category: formData.category,
            amount: parseInt(formData.amount),
            description: formData.description || undefined,
            date: dateTime,
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
            toWalletId: '',
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
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert(error instanceof Error ? error.message : 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  const categories = transactionType === 'expense' 
    ? EXPENSE_CATEGORIES 
    : transactionType === 'income' 
    ? INCOME_CATEGORIES 
    : transactionType === 'bill'
    ? BILL_CATEGORIES
    : [];

  const getTypeLabel = () => {
    if (transactionType === 'expense') return 'Pengeluaran';
    if (transactionType === 'income') return 'Pemasukan';
    if (transactionType === 'transfer') return 'Transfer';
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => {
                setTransactionType('expense');
                setFormData({ ...formData, category: '', toWalletId: '' });
              }}
              className={`p-3 md:p-4 rounded-xl border-2 transition-all ${
                transactionType === 'expense'
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 text-gray-700 dark:text-gray-300'
              }`}
            >
              <ArrowDownCircle className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2" />
              <p className="font-semibold text-xs md:text-sm">Pengeluaran</p>
            </button>
            <button
              type="button"
              onClick={() => {
                setTransactionType('income');
                setFormData({ ...formData, category: '', toWalletId: '' });
              }}
              className={`p-3 md:p-4 rounded-xl border-2 transition-all ${
                transactionType === 'income'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 text-gray-700 dark:text-gray-300'
              }`}
            >
              <ArrowUpCircle className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2" />
              <p className="font-semibold text-xs md:text-sm">Pemasukan</p>
            </button>
            <button
              type="button"
              onClick={() => {
                setTransactionType('bill');
                setFormData({ ...formData, category: '', toWalletId: '' });
              }}
              className={`p-3 md:p-4 rounded-xl border-2 transition-all ${
                transactionType === 'bill'
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                  : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 text-gray-700 dark:text-gray-300'
              }`}
            >
              <FileText className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2" />
              <p className="font-semibold text-xs md:text-sm">Tagihan</p>
            </button>
            <button
              type="button"
              onClick={() => {
                setTransactionType('transfer');
                setFormData({ ...formData, category: 'Transfer' });
              }}
              className={`p-3 md:p-4 rounded-xl border-2 transition-all ${
                transactionType === 'transfer'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 text-gray-700 dark:text-gray-300'
              }`}
            >
              <ArrowLeftRight className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2" />
              <p className="font-semibold text-xs md:text-sm">Pindah Uang</p>
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
              {transactionType === 'transfer' ? 'Dari Dompet *' : 'Saldo/Dompet *'}
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
                  {wallet.customName || wallet.name} (Saldo: Rp {wallet.balance.toLocaleString('id-ID')})
                </option>
              ))}
            </select>
          </div>

          {/* To Wallet - Only for Transfer */}
          {transactionType === 'transfer' && (
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Ke Dompet *
              </label>
              <select
                required
                value={formData.toWalletId}
                onChange={(e) => setFormData({ ...formData, toWalletId: e.target.value })}
                className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
              >
                <option value="">Pilih Dompet Tujuan</option>
                {wallets
                  .filter(wallet => wallet._id !== formData.walletId)
                  .map((wallet) => (
                    <option key={wallet._id} value={wallet._id}>
                      {wallet.customName || wallet.name} (Saldo: Rp {wallet.balance.toLocaleString('id-ID')})
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Category - Hide for Transfer */}
          {transactionType !== 'transfer' && (
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
          )}
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
