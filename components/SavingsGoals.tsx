'use client';

import { useState, useEffect } from 'react';
import { Target, Plus, Trash2, Edit2, Check, X, TrendingUp, Calendar } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { ISavingsGoal } from '@/models/SavingsGoal';
import NumberInput from './NumberInput';

interface SavingsGoalsProps {
  onGoalChange?: () => void;
}

export default function SavingsGoals({ onGoalChange }: SavingsGoalsProps) {
  const [goals, setGoals] = useState<ISavingsGoal[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    deadline: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const response = await fetch('/api/savings-goals');
      if (response.ok) {
        const data = await response.json();
        setGoals(data.goals || []);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      targetAmount: '',
      currentAmount: '',
      deadline: '',
    });
  };

  const handleAddGoal = async () => {
    if (!formData.name || !formData.targetAmount) {
      alert('Nama goal dan target amount harus diisi!');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/savings-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          targetAmount: parseInt(formData.targetAmount),
          currentAmount: parseInt(formData.currentAmount) || 0,
          deadline: formData.deadline || undefined,
        }),
      });

      if (response.ok) {
        await fetchGoals();
        if (onGoalChange) onGoalChange();
        resetForm();
        setShowAddForm(false);
      } else {
        alert('Gagal menambah goal');
      }
    } catch (error) {
      console.error('Error adding goal:', error);
      alert('Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Hapus goal ini?')) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/savings-goals/${goalId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchGoals();
        if (onGoalChange) onGoalChange();
      } else {
        alert('Gagal menghapus goal');
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
      alert('Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProgress = async (goalId: string, newAmount: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/savings-goals/${goalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentAmount: newAmount }),
      });

      if (response.ok) {
        await fetchGoals();
        if (onGoalChange) onGoalChange();
      }
    } catch (error) {
      console.error('Error updating goal:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getProgressPercentage = (goal: ISavingsGoal) => {
    return Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 75) return 'bg-green-500';
    if (percentage >= 50) return 'bg-blue-500';
    if (percentage >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getDaysRemaining = (deadline?: Date) => {
    if (!deadline) return null;
    const now = new Date();
    const target = new Date(deadline);
    const diff = target.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center">
              <Target className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Tabungan & Goals</h2>
              <p className="text-purple-200">Atur target tabungan Anda</p>
            </div>
          </div>
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setEditingGoalId(null);
              resetForm();
            }}
            disabled={isLoading}
            className="px-4 py-2 bg-white text-purple-600 rounded-xl font-semibold hover:bg-purple-50 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
            <span>Tambah Goal</span>
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Goal Baru</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Goal
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Misal: Beli Mobil, Liburan Bali, dll"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Target Amount (Rp)
                </label>
                <NumberInput
                  value={formData.targetAmount}
                  onChange={(value) => setFormData({ ...formData, targetAmount: value })}
                  placeholder="300000000"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Saldo Awal (Rp)
                </label>
                <NumberInput
                  value={formData.currentAmount}
                  onChange={(value) => setFormData({ ...formData, currentAmount: value })}
                  placeholder="0"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deadline (Opsional)
              </label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleAddGoal}
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
              >
                <Check className="w-5 h-5 inline mr-2" />
                Simpan Goal
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  resetForm();
                }}
                className="px-6 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
              >
                <X className="w-5 h-5 inline" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Goals List */}
      {goals.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
          <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-800 font-medium">Belum ada savings goal. Mulai atur target tabungan Anda!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {goals.map((goal) => {
            const percentage = getProgressPercentage(goal);
            const daysRemaining = getDaysRemaining(goal.deadline);
            const isCompleted = percentage >= 100;

            return (
              <div
                key={goal._id}
                className={`bg-white rounded-2xl p-6 shadow-lg border-2 ${
                  isCompleted ? 'border-green-500' : 'border-gray-200'
                } hover:shadow-xl transition-all`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-gray-900 truncate">{goal.name}</h3>
                    {isCompleted && (
                      <span className="inline-block mt-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                        ✓ Tercapai!
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteGoal(goal._id)}
                    disabled={isLoading}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm text-gray-700 mb-2">
                      <span>Progress</span>
                      <span className="font-semibold">{percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${getProgressColor(percentage)}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-700">Terkumpul</p>
                      <p className="text-lg font-bold text-purple-600">
                        {formatCurrency(goal.currentAmount)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-700">Target</p>
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(goal.targetAmount)}
                      </p>
                    </div>
                  </div>

                  {daysRemaining !== null && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-700" />
                      <span className="text-gray-700">
                        {daysRemaining > 0
                          ? `${daysRemaining} hari tersisa`
                          : daysRemaining === 0
                          ? 'Deadline hari ini!'
                          : 'Deadline terlewat'}
                      </span>
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-700 mb-2">Tambah Tabungan:</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateProgress(goal._id, goal.currentAmount + 50000)}
                        disabled={isLoading}
                        className="flex-1 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-semibold disabled:opacity-50"
                      >
                        +50k
                      </button>
                      <button
                        onClick={() => handleUpdateProgress(goal._id, goal.currentAmount + 100000)}
                        disabled={isLoading}
                        className="flex-1 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-semibold disabled:opacity-50"
                      >
                        +100k
                      </button>
                      <button
                        onClick={() => handleUpdateProgress(goal._id, goal.currentAmount + 500000)}
                        disabled={isLoading}
                        className="flex-1 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-semibold disabled:opacity-50"
                      >
                        +500k
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
