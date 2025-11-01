'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, TrendingUp, AlertCircle, Edit2, Save, X, HelpCircle, BookmarkPlus, BookmarkCheck, Copy } from 'lucide-react';
import { formatCurrency, getCurrentMonth } from '@/lib/utils';
import { IBudget } from '@/models/Budget';
import { ITransaction } from '@/models/Transaction';
import NumberInput from './NumberInput';
import { useAlert } from '@/context/AlertContext';
import { useCategories } from '@/lib/useCategories';

interface BudgetAllocationProps {
  onBudgetChange?: () => void;
}

export default function BudgetAllocation({ onBudgetChange }: BudgetAllocationProps) {
  const { showAlert, showConfirm } = useAlert();
  const { allCategories, customCategories } = useCategories('expense');
  const [budget, setBudget] = useState<IBudget | null>(null);
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    description: '',
  });
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    category: '',
    amount: '',
    description: '',
  });
  const [showGuide, setShowGuide] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [savedTemplates, setSavedTemplates] = useState<Array<{
    name: string;
    allocations: Array<{ category: string; amount: number; description?: string }>;
  }>>([]);
  const currentMonth = getCurrentMonth();

  useEffect(() => {
    fetchData();
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    try {
      const stored = localStorage.getItem('budgetTemplates');
      if (stored) {
        setSavedTemplates(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const saveTemplate = async () => {
    if (!budget || !budget.allocations || budget.allocations.length === 0) {
      await showAlert({
        type: 'warning',
        title: 'Peringatan',
        message: 'Tidak ada alokasi budget untuk disimpan sebagai template!',
      });
      return;
    }

    if (!templateName.trim()) {
      await showAlert({
        type: 'warning',
        title: 'Peringatan',
        message: 'Nama template tidak boleh kosong!',
      });
      return;
    }

    try {
      const newTemplate = {
        name: templateName.trim(),
        allocations: budget.allocations.map(a => ({
          category: a.category,
          amount: a.amount,
          description: a.description,
        })),
      };

      const templates = [...savedTemplates, newTemplate];
      localStorage.setItem('budgetTemplates', JSON.stringify(templates));
      setSavedTemplates(templates);
      setTemplateName('');
      setShowTemplateModal(false);

      await showAlert({
        type: 'success',
        title: 'Berhasil',
        message: `Template "${newTemplate.name}" berhasil disimpan!`,
      });
    } catch (error) {
      console.error('Error saving template:', error);
      await showAlert({
        type: 'error',
        title: 'Error',
        message: 'Gagal menyimpan template',
      });
    }
  };

  const loadTemplate = async (template: typeof savedTemplates[0]) => {
    const confirmed = await showConfirm(
      `Gunakan template "${template.name}"? Ini akan mengganti budget bulan ini.`
    );
    if (!confirmed) return;

    setIsLoading(true);
    try {
      const allocations = template.allocations.map(a => ({
        ...a,
        spent: 0,
      }));
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
          message: `Template "${template.name}" berhasil diterapkan!`,
        });
      } else {
        await showAlert({
          type: 'error',
          title: 'Error',
          message: 'Gagal menerapkan template',
        });
      }
    } catch (error) {
      console.error('Error loading template:', error);
      await showAlert({
        type: 'error',
        title: 'Error',
        message: 'Terjadi kesalahan saat menerapkan template',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTemplate = async (templateName: string) => {
    const confirmed = await showConfirm(`Hapus template "${templateName}"?`);
    if (!confirmed) return;

    try {
      const templates = savedTemplates.filter(t => t.name !== templateName);
      localStorage.setItem('budgetTemplates', JSON.stringify(templates));
      setSavedTemplates(templates);

      await showAlert({
        type: 'success',
        title: 'Berhasil',
        message: 'Template berhasil dihapus!',
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      await showAlert({
        type: 'error',
        title: 'Error',
        message: 'Gagal menghapus template',
      });
    }
  };


  const fetchData = async () => {
    try {
      const [budgetRes, transactionsRes] = await Promise.all([
        fetch(`/api/budgets?month=${currentMonth}`),
        fetch('/api/transactions'),
      ]);

      if (budgetRes.ok) {
        const budgetData = await budgetRes.json();
        console.log('Fetched budget data:', budgetData);
        const budgetObj = budgetData.budget || budgetData;
        // Ensure allocations is always an array
        if (budgetObj && !budgetObj.allocations) {
          budgetObj.allocations = [];
        }
        console.log('Setting budget:', budgetObj);
        setBudget(budgetObj);
      } else {
        console.error('Failed to fetch budget:', budgetRes.status, budgetRes.statusText);
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
        spent: 0, // Will be calculated from transactions
        description: formData.description,
      };

      const currentAllocations = budget?.allocations || [];
      // Map existing allocations to ensure they have proper structure
      const existingAllocations = currentAllocations.map(a => ({
        category: a.category,
        amount: a.amount,
        spent: 0, // Reset spent, will be recalculated from transactions
        description: a.description,
      }));
      const allocations = [...existingAllocations, newAllocation];

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
        const result = await response.json();
        console.log('Budget saved successfully:', result);
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
      // Filter out deleted allocation and clean up remaining allocations
      const allocations = budget.allocations
        .filter(a => a.category !== category)
        .map(a => ({
          category: a.category,
          amount: a.amount,
          spent: 0, // Reset spent, will be recalculated
          description: a.description,
        }));
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

  const handleEditAllocation = (category: string) => {
    const allocation = budget?.allocations.find(a => a.category === category);
    if (allocation) {
      setEditingCategory(category);
      setEditFormData({
        category: allocation.category,
        amount: allocation.amount.toString(),
        description: allocation.description || '',
      });
    }
  };

  const handleUpdateAllocation = async () => {
    if (!budget || !editingCategory) return;

    const amount = parseFloat(editFormData.amount.toString().replace(/\D/g, '') || '0');
    if (amount <= 0) {
      await showAlert({
        type: 'error',
        title: 'Error',
        message: 'Jumlah budget harus lebih dari 0!',
      });
      return;
    }

    if (!editFormData.category) {
      await showAlert({
        type: 'warning',
        title: 'Peringatan',
        message: 'Kategori tidak boleh kosong!',
      });
      return;
    }

    // Check if new category already exists (if category was changed)
    if (editFormData.category !== editingCategory) {
      const existingAllocation = budget.allocations.find(a => a.category === editFormData.category);
      if (existingAllocation) {
        await showAlert({
          type: 'warning',
          title: 'Peringatan',
          message: 'Kategori sudah ada! Pilih kategori lain.',
        });
        return;
      }
    }

    setIsLoading(true);
    try {
      const allocations = budget.allocations.map(a => {
        if (a.category === editingCategory) {
          // Return updated allocation without spent (spent is calculated dynamically)
          return {
            category: editFormData.category,
            amount, 
            description: editFormData.description,
            spent: 0, // Will be recalculated when fetched
          };
        }
        return {
          category: a.category,
          amount: a.amount,
          description: a.description,
          spent: 0, // Reset spent, will be recalculated
        };
      });
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
        const result = await response.json();
        console.log('Budget updated successfully:', result);
        await fetchData();
        if (onBudgetChange) onBudgetChange();
        setEditingCategory(null);
        await showAlert({
          type: 'success',
          title: 'Berhasil',
          message: 'Alokasi budget berhasil diupdate!',
        });
      } else {
        const errorText = await response.text();
        console.error('Update error response:', errorText);
        await showAlert({
          type: 'error',
          title: 'Error',
          message: 'Gagal update alokasi',
        });
      }
    } catch (error) {
      console.error('Error updating allocation:', error);
      await showAlert({
        type: 'error',
        title: 'Error',
        message: 'Terjadi kesalahan saat update alokasi',
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

  console.log('Current budget:', budget);
  console.log('Allocations with spent:', allocationsWithSpent);

  const totalAllocated = allocationsWithSpent.reduce((sum, a) => sum + (a.amount || 0), 0);
  const totalSpent = allocationsWithSpent.reduce((sum, a) => sum + (a.spent || 0), 0);
  const remaining = totalAllocated - totalSpent;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Alokasi Budget Bulanan</h2>
          <div className="flex gap-2">
            {/* Template Buttons */}
            {allocationsWithSpent.length > 0 && (
              <button
                onClick={() => setShowTemplateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                title="Simpan sebagai template"
              >
                <BookmarkPlus className="w-5 h-5" />
                <span className="text-sm font-medium hidden sm:inline">Simpan Template</span>
              </button>
            )}
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
            >
              <HelpCircle className="w-5 h-5" />
              <span className="text-sm font-medium hidden sm:inline">Panduan</span>
            </button>
          </div>
        </div>

        {/* Template Modal */}
        {showTemplateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Simpan sebagai Template</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nama Template
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      saveTemplate();
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Misal: Budget Rutin Bulanan"
                  autoFocus
                />
              </div>

              <div className="mb-4 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Template akan menyimpan:</p>
                <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
                  {allocationsWithSpent.map(a => (
                    <li key={a.category}>• {a.category}: {formatCurrency(a.amount)}</li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={saveTemplate}
                  disabled={isLoading}
                  className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  Simpan Template
                </button>
                <button
                  onClick={() => {
                    setShowTemplateModal(false);
                    setTemplateName('');
                  }}
                  className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Saved Templates Section */}
        {savedTemplates.length > 0 && (
          <div className="mb-6 p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-3">
              <BookmarkCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Template Tersimpan</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {savedTemplates.map((template, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-purple-200 dark:border-purple-700"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{template.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {template.allocations.length} kategori
                    </p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => loadTemplate(template)}
                      disabled={isLoading}
                      className="p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors disabled:opacity-50"
                      title="Gunakan template"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteTemplate(template.name)}
                      disabled={isLoading}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                      title="Hapus template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Guide/Help Section */}
        {showGuide && (
          <div className="mb-6 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3 mb-4">
              <HelpCircle className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Apa itu Budget?</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  Budget adalah rencana keuangan yang membantu Anda mengontrol pengeluaran per kategori. 
                  Dengan budget, Anda bisa mengatur berapa maksimal uang yang boleh dihabiskan untuk setiap kategori dalam sebulan.
                </p>
              </div>
            </div>

            <div className="space-y-3 ml-9">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">📝 Cara Menggunakan:</h4>
                <ol className="text-sm text-gray-700 dark:text-gray-300 space-y-1 list-decimal list-inside">
                  <li><strong>Pilih Kategori:</strong> Pilih kategori pengeluaran (misal: Makanan, Transport, Kecantikan)</li>
                  <li><strong>Tentukan Jumlah:</strong> Masukkan berapa maksimal uang yang boleh dihabiskan untuk kategori tersebut</li>
                  <li><strong>Tambah Keterangan:</strong> (Opsional) Tambahkan catatan untuk mengingatkan tujuan budget ini</li>
                  <li><strong>Pantau Progress:</strong> Lihat berapa yang sudah terpakai dari total budget yang dialokasikan</li>
                  <li><strong>Edit Budget:</strong> Klik tombol Edit (✏️) untuk mengubah kategori, jumlah, atau keterangan budget</li>
                  <li><strong>Simpan Template:</strong> Klik "Simpan Template" untuk menyimpan budget ini agar bisa digunakan lagi bulan depan</li>
                </ol>
              </div>

              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <h4 className="font-semibold text-purple-800 dark:text-purple-400 mb-1">📋 Fitur Template:</h4>
                <p className="text-sm text-purple-700 dark:text-purple-300 mb-2">
                  Template memudahkan Anda menggunakan budget yang sama setiap bulan tanpa perlu input ulang.
                </p>
                <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1 list-disc list-inside">
                  <li><strong>Simpan Template:</strong> Klik "Simpan Template" dan beri nama (misal: "Budget Rutin")</li>
                  <li><strong>Gunakan Template:</strong> Klik ikon Copy (📋) pada template yang ingin digunakan</li>
                  <li><strong>Hapus Template:</strong> Klik ikon Trash (🗑️) untuk menghapus template yang tidak diperlukan</li>
                </ul>
              </div>

              <div className="p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">💡 Contoh Penggunaan:</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Jika Anda membuat budget "Kecantikan" dengan jumlah Rp 200.000, maka setiap kali Anda mencatat 
                  transaksi pengeluaran kategori "Kecantikan" (misal: beli skincare Rp 150.000), sistem akan 
                  menghitung otomatis dan menampilkan sisa budget Anda adalah Rp 50.000.
                </p>
              </div>

              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-400 mb-1">⚠️ Tips Penting:</h4>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1 list-disc list-inside">
                  <li>Sesuaikan total budget dengan pemasukan bulanan Anda</li>
                  <li>Prioritaskan kategori kebutuhan penting (makanan, transport, tagihan)</li>
                  <li>Jika budget terlampaui, bar akan berwarna merah sebagai peringatan</li>
                  <li>Review dan sesuaikan budget setiap bulan sesuai kebutuhan</li>
                </ul>
              </div>
            </div>
          </div>
        )}

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
                {allCategories.map((cat: string) => (
                  <option key={cat} value={cat}>
                    {cat}
                    {customCategories.some(c => c.name === cat) && ' (Custom)'}
                  </option>
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
              const isEditing = editingCategory === allocation.category;

              return (
                <div
                  key={allocation.category}
                  className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl hover:shadow-md dark:hover:bg-slate-700 transition-all border border-gray-200 dark:border-slate-600"
                >
                  {isEditing ? (
                    /* Edit Mode */
                    <div className="space-y-3">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white">Edit Budget</h4>
                        <div className="flex gap-2">
                          <button
                            onClick={handleUpdateAllocation}
                            disabled={isLoading}
                            className="p-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
                            title="Simpan"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingCategory(null)}
                            disabled={isLoading}
                            className="p-2 bg-gray-400 text-white hover:bg-gray-500 rounded-lg transition-colors disabled:opacity-50"
                            title="Batal"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Kategori
                          </label>
                          <select
                            value={editFormData.category}
                            onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                          >
                            {allCategories.map((cat: string) => (
                              <option key={cat} value={cat}>
                                {cat}
                                {customCategories.some(c => c.name === cat) && ' (Custom)'}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Jumlah Budget (Rp)
                          </label>
                          <NumberInput
                            value={editFormData.amount}
                            onChange={(value) => setEditFormData({ ...editFormData, amount: value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                            placeholder="500.000"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Keterangan
                          </label>
                          <input
                            type="text"
                            value={editFormData.description}
                            onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                            placeholder="Catatan..."
                            maxLength={200}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* View Mode */
                    <>
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
                        <div className="flex items-center space-x-2">
                          {isOverBudget && (
                            <div title="Melebihi budget!">
                              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                            </div>
                          )}
                          <button
                            onClick={() => handleEditAllocation(allocation.category)}
                            disabled={isLoading}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors disabled:opacity-50"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAllocation(allocation.category)}
                            disabled={isLoading}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                            title="Hapus"
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
                    </>
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
