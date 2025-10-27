'use client';

import { useState, useEffect } from 'react';
import { ArrowDownCircle, ArrowUpCircle, FileText, Filter, Trash2, Edit2, X, Save, Clock } from 'lucide-react';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import { ITransaction } from '@/models/Transaction';
import { IWallet } from '@/models/Wallet';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, BILL_CATEGORIES } from '@/lib/constants';
import NumberInput from './NumberInput';

interface TransactionHistoryProps {
  onTransactionChange?: () => void;
}

export default function TransactionHistory({ onTransactionChange }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [wallets, setWallets] = useState<IWallet[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income' | 'bill'>('all');
  const [filterMonth, setFilterMonth] = useState<string>(''); // Initialize as empty string for month input
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    walletId: '',
    category: '',
    amount: '',
    description: '',
    date: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [transactionsRes, walletsRes] = await Promise.all([
        fetch('/api/transactions'),
        fetch('/api/wallets'),
      ]);

      const transactionsData = await transactionsRes.json();
      const walletsData = await walletsRes.json();

      setTransactions(Array.isArray(transactionsData) ? transactionsData : (transactionsData.transactions || []));
      setWallets(Array.isArray(walletsData) ? walletsData : (walletsData.wallets || []));
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setTransactions([]);
      setWallets([]);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus transaksi ini?')) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchData();
        onTransactionChange?.();
      } else {
        alert('Gagal menghapus transaksi');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (transaction: ITransaction) => {
    setEditingId(String(transaction._id));
    
    const walletId = typeof transaction.walletId === 'object' && transaction.walletId?._id
      ? String(transaction.walletId._id)
      : String(transaction.walletId || '');

    setEditForm({
      walletId,
      category: transaction.category || '',
      amount: String(transaction.amount || ''),
      description: transaction.description || '',
      date: transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : '',
    });
  };

  const handleSaveEdit = async (id: string, type: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletId: editForm.walletId,
          category: editForm.category,
          amount: parseFloat(editForm.amount),
          description: editForm.description,
          date: editForm.date,
        }),
      });

      if (response.ok) {
        setEditingId(null);
        await fetchData();
        onTransactionChange?.();
      } else {
        alert('Gagal mengupdate transaksi');
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({
      walletId: '',
      category: '',
      amount: '',
      description: '',
      date: '',
    });
  };

  const getCategoryOptions = (type: string) => {
    switch (type) {
      case 'income':
        return INCOME_CATEGORIES;
      case 'expense':
        return EXPENSE_CATEGORIES;
      case 'bill':
        return BILL_CATEGORIES;
      default:
        return [];
    }
  };

  const getWalletName = (walletId: any) => {
    if (!walletId) return 'Unknown';
    
    const id = typeof walletId === 'object' && walletId?._id
      ? String(walletId._id)
      : String(walletId);

    const wallet = wallets.find(w => String(w._id) === id);
    return wallet?.name || 'Unknown';
  };

  const filteredTransactions = transactions.filter(transaction => {
    const typeMatch = filterType === 'all' || transaction.type === filterType;
    
    let monthMatch = true;
    if (filterMonth !== '') {
      try {
        const transactionDate = new Date(transaction.date);
        const filterDate = new Date(filterMonth);
        monthMatch = 
          transactionDate.getMonth() === filterDate.getMonth() &&
          transactionDate.getFullYear() === filterDate.getFullYear();
      } catch (e) {
        monthMatch = false;
      }
    }
    // If filterMonth is empty string, monthMatch remains true (show all months)
    
    return typeMatch && monthMatch;
  });

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalBills = filteredTransactions
    .filter(t => t.type === 'bill')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'income':
        return <ArrowUpCircle className="w-5 h-5 text-green-600" />;
      case 'expense':
        return <ArrowDownCircle className="w-5 h-5 text-red-600" />;
      case 'bill':
        return <FileText className="w-5 h-5 text-orange-600" />;
      default:
        return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'income':
        return 'text-green-600';
      case 'expense':
        return 'text-red-600';
      case 'bill':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'income':
        return 'Pemasukan';
      case 'expense':
        return 'Pengeluaran';
      case 'bill':
        return 'Tagihan';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Filter</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipe Transaksi
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Semua</option>
              <option value="income">Pemasukan</option>
              <option value="expense">Pengeluaran</option>
              <option value="bill">Tagihan</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bulan
            </label>
            <input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-xl p-6 border border-green-200 dark:border-green-700">
          <div className="flex items-center gap-3 mb-2">
            <ArrowUpCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">Total Pemasukan</span>
          </div>
          <p className="text-2xl font-bold text-green-900 dark:text-green-100">{formatCurrency(totalIncome)}</p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 rounded-xl p-6 border border-red-200 dark:border-red-700">
          <div className="flex items-center gap-3 mb-2">
            <ArrowDownCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            <span className="text-sm font-medium text-red-700 dark:text-red-300">Total Pengeluaran</span>
          </div>
          <p className="text-2xl font-bold text-red-900 dark:text-red-100">{formatCurrency(totalExpense)}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 rounded-xl p-6 border border-orange-200 dark:border-orange-700">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Total Tagihan</span>
          </div>
          <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{formatCurrency(totalBills)}</p>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          Riwayat Transaksi ({filteredTransactions.length})
        </h3>
        
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Belum ada transaksi</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((transaction) => {
              const isEditing = editingId === String(transaction._id);
              
              return (
                <div
                  key={String(transaction._id)}
                  className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  {isEditing ? (
                    /* Edit Mode */
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Dompet
                          </label>
                          <select
                            value={editForm.walletId}
                            onChange={(e) => setEditForm({ ...editForm, walletId: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            {wallets.map((wallet) => (
                              <option key={String(wallet._id)} value={String(wallet._id)}>
                                {wallet.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Kategori
                          </label>
                          <select
                            value={editForm.category}
                            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            {getCategoryOptions(transaction.type).map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Jumlah
                          </label>
                          <NumberInput
                            value={editForm.amount}
                            onChange={(value) => setEditForm({ ...editForm, amount: value })}
                            placeholder="0"
                            className="w-full"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tanggal
                          </label>
                          <input
                            type="date"
                            value={editForm.date}
                            onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Keterangan
                          </label>
                          <input
                            type="text"
                            value={editForm.description}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Keterangan transaksi..."
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={handleCancelEdit}
                          disabled={isLoading}
                          className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors flex items-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          Batal
                        </button>
                        <button
                          onClick={() => handleSaveEdit(String(transaction._id), transaction.type)}
                          disabled={isLoading}
                          className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                          <Save className="w-4 h-4" />
                          {isLoading ? 'Menyimpan...' : 'Simpan'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* View Mode */
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="mt-1">
                          {getTypeIcon(transaction.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {transaction.category}
                            </span>
                            <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded">
                              {getTypeLabel(transaction.type)}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                            <span>{getWalletName(transaction.walletId)}</span>
                            <span>•</span>
                            <span>{formatDateShort(new Date(transaction.date))}</span>
                            {transaction.description && (
                              <>
                                <span>•</span>
                                <span className="truncate">{transaction.description}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`font-bold text-lg ${getTypeColor(transaction.type)}`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount || 0)}
                        </span>
                        
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEdit(transaction)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(String(transaction._id))}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
