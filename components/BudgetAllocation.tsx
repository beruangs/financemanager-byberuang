'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, TrendingUp, AlertCircle } from 'lucide-react';
import { formatCurrency, getCurrentMonth } from '@/lib/utils';
import { EXPENSE_CATEGORIES } from '@/lib/constants';
import { IBudget } from '@/models/Budget';
import { ITransaction } from '@/models/Transaction';
import NumberInput from './NumberInput';
import { useAlert } from '@/context/AlertContext';

interface BudgetAllocationProps {
  onBudgetChange?: () => void;
}

export default function BudgetAllocation({ onBudgetChange }: BudgetAllocationProps) {
  const { showAlert, showConfirm } = useAlert();
  const [budget, setBudget] = useState<IBudget | null>(null);
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    description: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const currentMonth = getCurrentMonth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [budgetRes, transactionsRes] = await Promise.all([
        fetch(`/api/budgets?month=${currentMonth}`),
        fetch('/api/transactions'),
      ]);

      if (budgetRes.ok) {
        const budgetData = await budgetRes.json();
        setBudget(budgetData.budget || budgetData);
      }

      if (transactionsRes.ok) {
        const transactionsData = await transactionsRes.json();
        const txArray = Array.isArray(transactionsData) ? transactionsData : (transactionsData.transactions || []);
        setTransactions(txArray);
        
        // Calculate monthly income
        const income = txArray
          .filter((t: ITransaction) => 
            t.type === 'income' && 
            new Date(t.date).toISOString().startsWith(currentMonth)
          )
          .reduce((sum: number, t: ITransaction) => sum + t.amount, 0);
        setMonthlyIncome(income);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const calculateSpent = (category: string) => {
    return transactions
      .filter(t => 
        t.type === 'expense' && 
        t.category === category && 
        new Date(t.date).toISOString().startsWith(currentMonth)
      )
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const handleAddAllocation = async () => {
    if (!formData.category || !formData.amount) {
      await showAlert({
        type: 'warning',
        title: 'Peringatan',
        message: 'Mohon lengkapi kategori dan jumlah budget!',
      });
      return;
    }

    const amount = parseFloat(formData.amount.toString().replace(/\D/g, '') || '0');
    if (amount <= 0) {
      await showAlert({
        type: 'error',
        title: 'Error',
        message: 'Jumlah budget harus lebih dari 0!',
      });
      return;
    }

    setIsLoading(true);
    try {
      const newAllocation = {
        category: formData.category,
        amount: amount,
        spent: calculateSpent(formData.category),
        description: formData.description,
      };

      const allocations = budget 
        ? [...budget.allocations, newAllocation]
        : [newAllocation];

      const totalBudget = allocations.reduce((sum, a) => sum + a.amount, 0);

      console.log('Sending budget request:', {
        month: currentMonth,
        totalBudget,
        allocations: JSON.stringify(allocations),
      });

      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: currentMonth,
          totalBudget,
          allocations,
        }),
      });

      if (response.ok) {
        await fetchData();
        if (onBudgetChange) onBudgetChange();
        setFormData({ category: '', amount: '', description: '' });
        await showAlert({
          type: 'success',
          title: 'Berhasil',
          message: 'Alokasi budget berhasil ditambahkan!',
        });
      } else {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        const errorData = JSON.parse(errorText);
        await showAlert({
          type: 'error',
          title: 'Error',
          message: errorData.error || 'Gagal menambah alokasi budget',
        });
      }
    } catch (error) {
      console.error('Error adding allocation:', error);
      await showAlert({
        type: 'error',
        title: 'Error',
        message: 'Terjadi kesalahan saat menambah alokasi',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAllocation = async (category: string) => {
    if (!budget) return;

    const confirmed = await showConfirm('Yakin ingin menghapus alokasi ini?');
    if (!confirmed) return;

    setIsLoading(true);
    try {
      const allocations = budget.allocations.filter(a => a.category !== category);
      const totalBudget = allocations.reduce((sum, a) => sum + a.amount, 0);

      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: currentMonth,
          totalBudget,
          allocations,
        }),
      });

      if (response.ok) {
        await fetchData();
        if (onBudgetChange) onBudgetChange();
        await showAlert({
          type: 'success',
          title: 'Berhasil',
          message: 'Alokasi budget berhasil dihapus!',
        });
      } else {
        await showAlert({
          type: 'error',
          title: 'Error',
          message: 'Gagal menghapus alokasi',
        });
      }
    } catch (error) {
      console.error('Error deleting allocation:', error);
      await showAlert({
        type: 'error',
        title: 'Error',
        message: 'Terjadi kesalahan saat menghapus alokasi',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate allocations with current spent
  const allocationsWithSpent = (budget?.allocations && Array.isArray(budget.allocations)) 
    ? budget.allocations.map(allocation => ({
        ...allocation,
        spent: calculateSpent(allocation.category),
      }))
    : [];

  const totalAllocated = allocationsWithSpent.reduce((sum, a) => sum + (a.amount || 0), 0);
  const totalSpent = allocationsWithSpent.reduce((sum, a) => sum + (a.spent || 0), 0);
  const remaining = totalAllocated - totalSpent;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Alokasi Budget Bulanan</h2>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl">
            <p className="text-sm text-gray-800 dark:text-gray-200 font-semibold mb-1">Pemasukan Bulan Ini</p>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(monthlyIncome)}</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl">
            <p className="text-sm text-gray-800 dark:text-gray-200 font-semibold mb-1">Total Budget</p>
            <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{formatCurrency(totalAllocated)}</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 rounded-xl">
            <p className="text-sm text-gray-800 dark:text-gray-200 font-semibold mb-1">Total Terpakai</p>
            <p className="text-xl font-bold text-orange-600 dark:text-orange-400">{formatCurrency(totalSpent)}</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-xl">
            <p className="text-sm text-gray-800 dark:text-gray-200 font-semibold mb-1">Sisa Budget</p>
            <p className={`text-xl font-bold ${remaining >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(remaining)}
            </p>
          </div>
        </div>

        {/* Add Budget Form */}
        <div className="mb-6 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl">
          <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Tambah Alokasi Budget</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Kategori
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Pilih Kategori</option>
                {EXPENSE_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-800 dark:text-gray-300 mb-2">
                Jumlah Budget (Rp)
              </label>
              <NumberInput
                value={formData.amount}
                onChange={(value) => setFormData({ ...formData, amount: value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500"
                placeholder="500.000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-800 dark:text-gray-300 mb-2">
                Keterangan (Opsional)
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500"
                placeholder="Misal: Budget untuk liburan bulan ini"
                maxLength={200}
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleAddAllocation}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
              >
                <Plus className="w-5 h-5 inline mr-2" />
                Tambah
              </button>
            </div>
          </div>
        </div>

        {/* Budget Allocations List */}
        {allocationsWithSpent.length === 0 ? (
          <div className="text-center py-12">
            <TrendingUp className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-900 dark:text-gray-100 font-medium">Belum ada alokasi budget. Mulai atur budget Anda!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {allocationsWithSpent.map((allocation) => {
              const percentage = (allocation.spent / allocation.amount) * 100;
              const isOverBudget = percentage > 100;

              return (
                <div
                  key={allocation.category}
                  className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl hover:shadow-md dark:hover:bg-slate-700 transition-all border border-gray-200 dark:border-slate-600"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0 pr-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">{allocation.category}</h3>
                      {allocation.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 truncate">{allocation.description}</p>
                      )}
                      <p className="text-sm text-gray-800 dark:text-gray-300 truncate">
                        {formatCurrency(allocation.spent)} / {formatCurrency(allocation.amount)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      {isOverBudget && (
                        <div title="Melebihi budget!">
                          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                      )}
                      <button
                        onClick={() => handleDeleteAllocation(allocation.category)}
                        disabled={isLoading}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="relative w-full h-3 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isOverBudget
                          ? 'bg-red-500 dark:bg-red-600'
                          : percentage > 80
                          ? 'bg-yellow-500 dark:bg-yellow-600'
                          : 'bg-green-500 dark:bg-green-600'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>

                  <div className="mt-2 flex justify-between text-xs">
                    <span className={`font-semibold ${isOverBudget ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-gray-300'}`}>
                      {percentage.toFixed(1)}%
                    </span>
                    <span className={`font-semibold ${
                      isOverBudget ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                    }`}>
                      Sisa: {formatCurrency(allocation.amount - allocation.spent)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
