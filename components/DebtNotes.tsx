'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, X, Save, DollarSign, Calendar, FileText } from 'lucide-react';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import NumberInput from './NumberInput';

interface Debt {
  _id: string;
  creditor: string;
  amount: number;
  dueDate: string;
  status: 'unpaid' | 'partial' | 'paid';
  description?: string;
  createdAt: Date;
}

export default function DebtNotes() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    creditor: '',
    amount: '',
    dueDate: '',
    status: 'unpaid' as 'unpaid' | 'partial' | 'paid',
    description: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchDebts();
  }, []);

  const fetchDebts = async () => {
    try {
      const response = await fetch('/api/debts');
      if (response.ok) {
        const data = await response.json();
        setDebts(Array.isArray(data) ? data : (data.debts || []));
      }
    } catch (error) {
      console.error('Error fetching debts:', error);
    }
  };

  const handleAdd = async () => {
    if (!formData.creditor || !formData.amount || !formData.dueDate) {
      alert('Mohon isi pemberi hutang, jumlah, dan tanggal jatuh tempo!');
      return;
    }

    const amount = parseFloat(formData.amount.toString().replace(/\D/g, '') || '0');
    if (amount <= 0) {
      alert('Jumlah hutang harus lebih dari 0!');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/debts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creditor: formData.creditor,
          amount,
          dueDate: formData.dueDate,
          status: formData.status,
          description: formData.description,
        }),
      });

      if (response.ok) {
        await fetchDebts();
        setFormData({
          creditor: '',
          amount: '',
          dueDate: '',
          status: 'unpaid',
          description: '',
        });
        setIsAdding(false);
      } else {
        alert('Gagal menambah catatan hutang');
      }
    } catch (error) {
      console.error('Error adding debt:', error);
      alert('Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (debt: Debt) => {
    setEditingId(debt._id);
    setFormData({
      creditor: debt.creditor,
      amount: debt.amount.toString(),
      dueDate: new Date(debt.dueDate).toISOString().split('T')[0],
      status: debt.status,
      description: debt.description || '',
    });
  };

  const handleUpdate = async (id: string) => {
    const amount = parseFloat(formData.amount.toString().replace(/\D/g, '') || '0');
    if (amount <= 0) {
      alert('Jumlah hutang harus lebih dari 0!');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/debts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creditor: formData.creditor,
          amount,
          dueDate: formData.dueDate,
          status: formData.status,
          description: formData.description,
        }),
      });

      if (response.ok) {
        await fetchDebts();
        setEditingId(null);
        setFormData({
          creditor: '',
          amount: '',
          dueDate: '',
          status: 'unpaid',
          description: '',
        });
      } else {
        alert('Gagal mengupdate catatan hutang');
      }
    } catch (error) {
      console.error('Error updating debt:', error);
      alert('Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus catatan hutang ini?')) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/debts/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchDebts();
      } else {
        alert('Gagal menghapus catatan hutang');
      }
    } catch (error) {
      console.error('Error deleting debt:', error);
      alert('Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Lunas</span>;
      case 'partial':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">Sebagian</span>;
      case 'unpaid':
        return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">Belum Bayar</span>;
      default:
        return null;
    }
  };

  const totalDebt = debts.reduce((sum, d) => sum + d.amount, 0);
  const unpaidDebt = debts.filter(d => d.status === 'unpaid').reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-600 to-red-600 rounded-2xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <DollarSign className="w-8 h-8" />
          <h2 className="text-2xl font-bold">Catatan Hutang</h2>
        </div>
        <p className="text-orange-100">
          Kelola dan pantau semua catatan hutang Anda
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-red-50 to-orange-100 rounded-xl p-4 border border-red-200">
          <p className="text-sm text-red-700 font-medium mb-1">Total Hutang</p>
          <p className="text-2xl font-bold text-red-900">{formatCurrency(totalDebt)}</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-amber-100 rounded-xl p-4 border border-yellow-200">
          <p className="text-sm text-yellow-700 font-medium mb-1">Hutang Belum Dibayar</p>
          <p className="text-2xl font-bold text-yellow-900">{formatCurrency(unpaidDebt)}</p>
        </div>
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            {editingId ? 'Edit Catatan Hutang' : 'Tambah Hutang Baru'}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pemberi Hutang
              </label>
              <input
                type="text"
                value={formData.creditor}
                onChange={(e) => setFormData({ ...formData, creditor: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500"
                placeholder="Misal: Teman, Bank, Keluarga"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jumlah Hutang (Rp)
                </label>
                <NumberInput
                  value={formData.amount}
                  onChange={(value) => setFormData({ ...formData, amount: value })}
                  placeholder="5.000.000"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Jatuh Tempo
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500"
              >
                <option value="unpaid">Belum Dibayar</option>
                <option value="partial">Sebagian Dibayar</option>
                <option value="paid">Lunas</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Keterangan (Opsional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 resize-none"
                placeholder="Catatan tambahan..."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (editingId) {
                    handleUpdate(editingId);
                  } else {
                    handleAdd();
                  }
                }}
                disabled={isLoading}
                className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-xl hover:bg-orange-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isLoading ? 'Menyimpan...' : 'Simpan'}
              </button>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setEditingId(null);
                  setFormData({
                    creditor: '',
                    amount: '',
                    dueDate: '',
                    status: 'unpaid',
                    description: '',
                  });
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-xl hover:bg-gray-400 transition-colors font-medium"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Debts List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-600" />
            Daftar Hutang ({debts.length})
          </h3>
          {!isAdding && !editingId && (
            <button
              onClick={() => setIsAdding(true)}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Tambah
            </button>
          )}
        </div>

        {debts.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Tidak ada catatan hutang</p>
          </div>
        ) : (
          <div className="space-y-3">
            {debts.map((debt) => (
              <div
                key={debt._id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900">{debt.creditor}</h4>
                      {getStatusBadge(debt.status)}
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Jatuh tempo: {formatDateShort(new Date(debt.dueDate))}
                      </p>
                      {debt.description && (
                        <p className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          {debt.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 ml-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-600">
                        {formatCurrency(debt.amount)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(debt)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(debt._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
