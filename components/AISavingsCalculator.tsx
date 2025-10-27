'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Target, Calendar, DollarSign, Sparkles } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { ITransaction } from '@/models/Transaction';
import NumberInput from './NumberInput';

export default function AISavingsCalculator() {
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [result, setResult] = useState<{
    dailyIncome: number;
    monthlySavings: number;
    daysNeeded: number;
    monthsNeeded: number;
    yearsNeeded: number;
    targetDate: string;
    savingsRate: number;
  } | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/transactions');
      if (response.ok) {
        const data = await response.json();
        setTransactions(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const calculateSavings = () => {
    if (!goalName || !targetAmount) {
      alert('Mohon isi nama tujuan dan target jumlah!');
      return;
    }

    const target = parseFloat(targetAmount);
    if (isNaN(target) || target <= 0) {
      alert('Target jumlah harus lebih dari 0!');
      return;
    }

    setIsCalculating(true);

    // Calculate average daily income from last 90 days
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    const recentIncomes = transactions.filter(t => 
      t.type === 'income' && new Date(t.date) >= ninetyDaysAgo
    );

    const totalIncome = recentIncomes.reduce((sum, t) => sum + t.amount, 0);
    const daysWithIncome = recentIncomes.length > 0 ? 90 : 1;
    const dailyIncome = totalIncome / daysWithIncome;

    // Calculate average daily expense from last 90 days
    const recentExpenses = transactions.filter(t => 
      (t.type === 'expense' || t.type === 'bill') && new Date(t.date) >= ninetyDaysAgo
    );

    const totalExpense = recentExpenses.reduce((sum, t) => sum + t.amount, 0);
    const dailyExpense = totalExpense / 90;

    // Calculate potential daily savings (70% of surplus)
    const dailySurplus = dailyIncome - dailyExpense;
    const dailySavings = Math.max(dailySurplus * 0.7, dailyIncome * 0.1); // Minimum 10% of income

    // Calculate monthly savings
    const monthlySavings = dailySavings * 30;

    // Calculate time needed
    const daysNeeded = Math.ceil(target / dailySavings);
    const monthsNeeded = Math.ceil(daysNeeded / 30);
    const yearsNeeded = Math.floor(monthsNeeded / 12);

    // Calculate target date
    const targetDate = new Date(now.getTime() + daysNeeded * 24 * 60 * 60 * 1000);

    // Calculate savings rate (percentage of income)
    const savingsRate = (dailySavings / dailyIncome) * 100;

    setResult({
      dailyIncome,
      monthlySavings,
      daysNeeded,
      monthsNeeded: monthsNeeded % 12,
      yearsNeeded,
      targetDate: targetDate.toLocaleDateString('id-ID', { 
        day: 'numeric',
        month: 'long', 
        year: 'numeric' 
      }),
      savingsRate
    });

    setIsCalculating(false);
  };

  const getMotivationalMessage = () => {
    if (!result) return '';
    
    if (result.yearsNeeded > 5) {
      return '💪 Target yang ambisius! Pertimbangkan untuk meningkatkan penghasilan atau mengurangi pengeluaran.';
    } else if (result.yearsNeeded > 2) {
      return '🎯 Target realistis! Konsisten menabung akan membawa Anda ke tujuan.';
    } else if (result.yearsNeeded > 0) {
      return '🚀 Target sangat achievable! Tetap disiplin dan tujuan Anda akan tercapai!';
    } else {
      return '⚡ Target bisa dicapai dalam waktu singkat! Mulai sekarang juga!';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-8 h-8" />
          <h2 className="text-2xl font-bold">AI Kalkulator Tabungan</h2>
        </div>
        <p className="text-indigo-100">
          Hitung berapa lama Anda perlu menabung untuk mencapai tujuan keuangan Anda berdasarkan pola keuangan Anda.
        </p>
      </div>

      {/* Input Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-600" />
          Tujuan Tabungan Anda
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Tujuan
            </label>
            <input
              type="text"
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Misal: Mobil Baru, Rumah, Liburan"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Jumlah (Rp)
            </label>
            <NumberInput
              value={targetAmount}
              onChange={setTargetAmount}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              placeholder="300.000.000"
            />
          </div>

          <button
            onClick={calculateSavings}
            disabled={isCalculating}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-medium flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
          >
            <Sparkles className="w-5 h-5" />
            {isCalculating ? 'Menghitung...' : 'Hitung dengan AI'}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4 animate-fadeIn">
          {/* Summary Card */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl border border-green-200 p-6">
            <div className="flex items-start gap-4">
              <div className="bg-white rounded-xl p-3 shadow-sm">
                <Target className="w-8 h-8 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-green-900 text-xl mb-2">
                  Target: {goalName}
                </h3>
                <p className="text-3xl font-bold text-green-700 mb-2">
                  {formatCurrency(parseFloat(targetAmount))}
                </p>
                <p className="text-green-800 font-medium">
                  {getMotivationalMessage()}
                </p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              Timeline Pencapaian
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-4 border border-blue-200">
                <p className="text-sm text-blue-700 font-medium mb-1">Waktu Dibutuhkan</p>
                <p className="text-2xl font-bold text-blue-900">
                  {result.yearsNeeded > 0 && `${result.yearsNeeded} Tahun `}
                  {result.monthsNeeded > 0 && `${result.monthsNeeded} Bulan`}
                  {result.yearsNeeded === 0 && result.monthsNeeded === 0 && `${result.daysNeeded} Hari`}
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-xl p-4 border border-purple-200">
                <p className="text-sm text-purple-700 font-medium mb-1">Target Tanggal</p>
                <p className="text-lg font-bold text-purple-900">
                  {result.targetDate}
                </p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl p-4 border border-orange-200">
                <p className="text-sm text-orange-700 font-medium mb-1">Total Hari</p>
                <p className="text-2xl font-bold text-orange-900">
                  {result.daysNeeded.toLocaleString()} Hari
                </p>
              </div>
            </div>

            {/* Savings Breakdown */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-600" />
                Rencana Tabungan
              </h4>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-700">Rata-rata Pendapatan Harian:</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(result.dailyIncome)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-700">Target Tabungan per Bulan:</span>
                  <span className="font-semibold text-green-600">{formatCurrency(result.monthlySavings)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-700">Persentase Nabung:</span>
                  <span className="font-semibold text-indigo-600">{result.savingsRate.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-gradient-to-br from-amber-50 to-yellow-100 rounded-2xl border border-amber-200 p-6">
            <h3 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Tips Mencapai Target
            </h3>
            <ul className="space-y-2 text-amber-800">
              <li className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <span>Buat automatic transfer ke rekening tabungan setiap gajian</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <span>Kurangi pengeluaran yang tidak perlu seperti langganan yang jarang dipakai</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <span>Cari sumber penghasilan tambahan untuk mempercepat pencapaian</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <span>Review progress setiap bulan dan adjust strategi jika perlu</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
