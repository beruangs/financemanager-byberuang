'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, BarChart2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { EXPENSE_CATEGORIES } from '@/lib/constants';
import { ITransaction } from '@/models/Transaction';
import { IWallet } from '@/models/Wallet';

interface DashboardAnalyticsProps {
  onDataChange?: () => void;
}

export default function DashboardAnalytics({ onDataChange }: DashboardAnalyticsProps) {
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [wallets, setWallets] = useState<IWallet[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [transactionsRes, walletsRes] = await Promise.all([
        fetch('/api/transactions'),
        fetch('/api/wallets'),
      ]);

      if (transactionsRes.ok && walletsRes.ok) {
        const transactionsData = await transactionsRes.json();
        const walletsData = await walletsRes.json();
        setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
        setWallets(Array.isArray(walletsData) ? walletsData : []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // Get last 6 months data
  const getLast6Months = () => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: d.toISOString().slice(0, 7),
        label: d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
      });
    }
    return months;
  };

  const months = getLast6Months();

  // Income vs Expense per month
  const monthlyData = months.map(({ month, label }) => {
    const income = transactions
      .filter(t => t.type === 'income' && new Date(t.date).toISOString().startsWith(month))
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = transactions
      .filter(t => (t.type === 'expense' || t.type === 'bill') && new Date(t.date).toISOString().startsWith(month))
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      month: label,
      Pemasukan: income,
      Pengeluaran: expense,
    };
  });

  // Expense by category (Pie chart)
  const expenseByCategory = EXPENSE_CATEGORIES.map(category => {
    const total = transactions
      .filter(t => t.type === 'expense' && t.category === category)
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      name: category,
      value: total,
    };
  }).filter(item => item.value > 0);

  // Top 5 biggest expenses
  const biggestExpenses = [...transactions]
    .filter(t => t.type === 'expense')
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // Current month stats
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthIncome = transactions
    .filter(t => t.type === 'income' && new Date(t.date).toISOString().startsWith(currentMonth))
    .reduce((sum, t) => sum + t.amount, 0);
  
  const currentMonthExpense = transactions
    .filter(t => (t.type === 'expense' || t.type === 'bill') && new Date(t.date).toISOString().startsWith(currentMonth))
    .reduce((sum, t) => sum + t.amount, 0);

  const previousMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7);
  const previousMonthIncome = transactions
    .filter(t => t.type === 'income' && new Date(t.date).toISOString().startsWith(previousMonth))
    .reduce((sum, t) => sum + t.amount, 0);
  
  const previousMonthExpense = transactions
    .filter(t => (t.type === 'expense' || t.type === 'bill') && new Date(t.date).toISOString().startsWith(previousMonth))
    .reduce((sum, t) => sum + t.amount, 0);

  const incomeChange = previousMonthIncome > 0 
    ? ((currentMonthIncome - previousMonthIncome) / previousMonthIncome) * 100 
    : 0;
  
  const expenseChange = previousMonthExpense > 0 
    ? ((currentMonthExpense - previousMonthExpense) / previousMonthExpense) * 100 
    : 0;

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#14b8a6', '#f97316'];

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm opacity-90 font-medium">Pemasukan Bulan Ini</p>
            <DollarSign className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-3xl font-bold mb-2">{formatCurrency(currentMonthIncome)}</p>
          {incomeChange !== 0 && (
            <div className="flex items-center text-sm">
              {incomeChange > 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
              <span>{Math.abs(incomeChange).toFixed(1)}% dari bulan lalu</span>
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm opacity-90 font-medium">Pengeluaran Bulan Ini</p>
            <TrendingDown className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-3xl font-bold mb-2">{formatCurrency(currentMonthExpense)}</p>
          {expenseChange !== 0 && (
            <div className="flex items-center text-sm">
              {expenseChange > 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
              <span>{Math.abs(expenseChange).toFixed(1)}% dari bulan lalu</span>
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm opacity-90 font-medium">Selisih Bulan Ini</p>
            <BarChart2 className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-3xl font-bold">{formatCurrency(currentMonthIncome - currentMonthExpense)}</p>
          <p className="text-sm mt-2 opacity-90">
            {currentMonthIncome > currentMonthExpense ? 'Surplus 🎉' : 'Defisit ⚠️'}
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm opacity-90 font-medium">Total Transaksi</p>
            <BarChart2 className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-3xl font-bold">{transactions.length}</p>
          <p className="text-sm mt-2 opacity-90">Sepanjang waktu</p>
        </div>
      </div>

      {/* Income vs Expense Chart */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h2 className="text-xl font-bold mb-6 text-gray-900">Pemasukan vs Pengeluaran (6 Bulan Terakhir)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip 
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
            />
            <Legend />
            <Bar dataKey="Pemasukan" fill="#10b981" radius={[8, 8, 0, 0]} />
            <Bar dataKey="Pengeluaran" fill="#ef4444" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - Expense by Category */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-bold mb-6 text-gray-900">Distribusi Pengeluaran per Kategori</h2>
          {expenseByCategory.length === 0 ? (
            <p className="text-center text-gray-700 py-12 font-medium">Belum ada data pengeluaran</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expenseByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top 5 Biggest Expenses */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-bold mb-6 text-gray-900">5 Pengeluaran Terbesar</h2>
          {biggestExpenses.length === 0 ? (
            <p className="text-center text-gray-700 py-12 font-medium">Belum ada data pengeluaran</p>
          ) : (
            <div className="space-y-4">
              {biggestExpenses.map((transaction, index) => {
                const wallet = wallets.find(w => w._id === transaction.walletId.toString());
                return (
                  <div key={transaction._id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0">
                        #{index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{transaction.category}</p>
                        <p className="text-sm text-gray-800 truncate">{wallet?.name}</p>
                        <p className="text-xs text-gray-700">{new Date(transaction.date).toLocaleDateString('id-ID')}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xl font-bold text-red-600 whitespace-nowrap">{formatCurrency(transaction.amount)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Line Chart - Trend */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h2 className="text-xl font-bold mb-6 text-gray-900">Trend Keuangan (6 Bulan Terakhir)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip 
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
            />
            <Legend />
            <Line type="monotone" dataKey="Pemasukan" stroke="#10b981" strokeWidth={3} dot={{ r: 6 }} />
            <Line type="monotone" dataKey="Pengeluaran" stroke="#ef4444" strokeWidth={3} dot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
