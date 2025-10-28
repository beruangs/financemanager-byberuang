'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, Wallet as WalletIcon, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { EWALLET_OPTIONS, BANK_OPTIONS } from '@/lib/constants';
import { IWallet } from '@/models/Wallet';
import NumberInput from './NumberInput';

interface WalletManagementProps {
  onWalletChange?: () => void;
}

export default function WalletManagement({ onWalletChange }: WalletManagementProps) {
  const [wallets, setWallets] = useState<IWallet[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBalanceId, setEditingBalanceId] = useState<string | null>(null);
  const [newBalance, setNewBalance] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    customName: '', // For custom naming like "GoPay (Jeje)"
    type: 'cash' as 'cash' | 'e-wallet' | 'bank',
    balance: '0',
    icon: 'wallet',
    color: '#3b82f6',
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

  const handleAdd = async () => {
    if (!formData.name) {
      alert('Nama dompet harus diisi!');
      return;
    }

    setIsLoading(true);
    try {
      // Create final wallet name with custom name if provided
      const finalName = formData.customName 
        ? `${formData.name} (${formData.customName})`
        : formData.name;

      const response = await fetch('/api/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: finalName,
          type: formData.type,
          balance: 0, // Always start with 0, balance will come from transaction
          icon: formData.icon,
          color: formData.color,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // If there's initial balance, create a transaction (this will update wallet balance automatically)
        if (parseInt(formData.balance) > 0) {
          await fetch('/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              walletId: data.wallet._id,
              type: 'income',
              category: 'Saldo Awal',
              amount: parseInt(formData.balance),
              description: `Saldo awal dompet ${finalName}`,
              date: new Date().toISOString(),
            }),
          });
        }

        await fetchWallets();
        if (onWalletChange) onWalletChange();
        
        setFormData({ name: '', customName: '', type: 'cash', balance: '0', icon: 'wallet', color: '#3b82f6' });
        setIsAdding(false);
      }
    } catch (error) {
      console.error('Error adding wallet:', error);
      alert('Gagal menambah dompet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (wallet: IWallet) => {
    setEditingId(wallet._id);
    setFormData({
      name: wallet.name,
      type: wallet.type,
      balance: wallet.balance.toString(),
      icon: wallet.icon || 'wallet',
      color: wallet.color || '#3b82f6',
    });
  };

  const handleUpdate = async () => {
    if (!editingId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/wallets/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          balance: parseInt(formData.balance) || 0,
          icon: formData.icon,
          color: formData.color,
        }),
      });

      if (response.ok) {
        await fetchWallets();
        if (onWalletChange) onWalletChange();
        
        setEditingId(null);
        setFormData({ name: '', type: 'cash', balance: '0', icon: 'wallet', color: '#3b82f6' });
      }
    } catch (error) {
      console.error('Error updating wallet:', error);
      alert('Gagal update dompet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus dompet ini? Semua transaksi terkait akan tetap ada.')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/wallets/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchWallets();
        if (onWalletChange) onWalletChange();
      }
    } catch (error) {
      console.error('Error deleting wallet:', error);
      alert('Gagal menghapus dompet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditBalance = (wallet: IWallet) => {
    setEditingBalanceId(wallet._id);
    setNewBalance(wallet.balance.toString());
  };

  const handleSaveBalance = async (walletId: string) => {
    const balance = parseFloat(newBalance);
    if (isNaN(balance)) {
      alert('Jumlah tidak valid');
      return;
    }

    const wallet = wallets.find(w => w._id === walletId);
    if (!wallet) return;

    const difference = balance - wallet.balance;
    if (difference === 0) {
      setEditingBalanceId(null);
      return;
    }

    setIsLoading(true);
    try {
      // Create adjustment transaction
      const transactionResponse = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletId: walletId,
          type: difference > 0 ? 'income' : 'expense',
          category: 'Adjustment',
          amount: Math.abs(difference),
          description: `Penyesuaian saldo ${difference > 0 ? 'masuk' : 'keluar'}`,
          date: new Date().toISOString(),
        }),
      });

      if (transactionResponse.ok) {
        await fetchWallets();
        if (onWalletChange) onWalletChange();
        setEditingBalanceId(null);
      } else {
        alert('Gagal mengupdate saldo');
      }
    } catch (error) {
      console.error('Error updating balance:', error);
      alert('Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  const getWalletTypeLabel = (type: string) => {
    if (type === 'cash') return 'Tunai';
    if (type === 'e-wallet') return 'E-Wallet';
    if (type === 'bank') return 'Bank';
    return type;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Kelola Dompet</h2>
          <button
            onClick={() => setIsAdding(!isAdding)}
            disabled={isLoading}
            className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
          >
            {isAdding ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            <span>{isAdding ? 'Batal' : 'Tambah Dompet'}</span>
          </button>
        </div>

        {/* Add Form */}
        {isAdding && (
          <div className="mb-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipe Dompet
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any, name: '' })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="cash">Tunai (Cash)</option>
                  <option value="e-wallet">Dompet Digital</option>
                  <option value="bank">Bank</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {formData.type === 'cash' ? 'Nama Dompet' : 'Pilih ' + (formData.type === 'e-wallet' ? 'E-Wallet' : 'Bank')}
                </label>
                {formData.type === 'cash' ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500"
                    placeholder="Misal: Dompet Utama"
                  />
                ) : formData.type === 'e-wallet' ? (
                  <select
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Pilih E-Wallet</option>
                    {EWALLET_OPTIONS.map(ew => (
                      <option key={ew} value={ew}>{ew}</option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Pilih Bank</option>
                    {BANK_OPTIONS.map(bank => (
                      <option key={bank} value={bank}>{bank}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Custom Name for E-Wallet and Bank */}
              {(formData.type === 'e-wallet' || formData.type === 'bank') && formData.name && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nama Tambahan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formData.customName}
                    onChange={(e) => setFormData({ ...formData, customName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500"
                    placeholder={`Misal: ${formData.name} (Jeje)`}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Untuk membedakan akun, misal: {formData.name} (Pribadi)
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Saldo Awal (Rp)
                </label>
                <NumberInput
                  value={formData.balance}
                  onChange={(value) => setFormData({ ...formData, balance: value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  placeholder="0"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleAdd}
                  disabled={isLoading}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Wallets List */}
        {wallets.length === 0 ? (
          <div className="text-center py-12">
            <WalletIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-800 font-medium">Belum ada dompet. Tambah dompet untuk memulai!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {wallets.map((wallet) => (
              <div
                key={wallet._id}
                className="p-4 rounded-xl border-2 border-gray-200 hover:border-indigo-300 transition-all bg-gradient-to-br from-white to-gray-50"
              >
                {editingId === wallet._id ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Nama dompet"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleUpdate}
                        disabled={isLoading}
                        className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                      >
                        <Save className="w-4 h-4 inline mr-1" />
                        Simpan
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setFormData({ name: '', type: 'cash', balance: '0', icon: 'wallet', color: '#3b82f6' });
                        }}
                        className="flex-1 bg-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-400"
                      >
                        <X className="w-4 h-4 inline mr-1" />
                        Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-gray-800">{wallet.name}</h3>
                        <p className="text-xs text-gray-500">{getWalletTypeLabel(wallet.type)}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(wallet)}
                          className="text-blue-600 hover:text-blue-700"
                          title="Edit Dompet"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(wallet._id)}
                          className="text-red-600 hover:text-red-700"
                          title="Hapus Dompet"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {editingBalanceId === wallet._id ? (
                      <div className="space-y-2">
                        <NumberInput
                          value={newBalance}
                          onChange={setNewBalance}
                          placeholder="Saldo baru"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveBalance(wallet._id)}
                            disabled={isLoading}
                            className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                          >
                            <Save className="w-4 h-4 inline mr-1" />
                            Simpan
                          </button>
                          <button
                            onClick={() => setEditingBalanceId(null)}
                            className="flex-1 bg-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-400"
                          >
                            <X className="w-4 h-4 inline mr-1" />
                            Batal
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-2xl font-bold text-indigo-600 mb-2">
                          {formatCurrency(wallet.balance)}
                        </p>
                        <button
                          onClick={() => handleEditBalance(wallet)}
                          className="w-full bg-indigo-50 text-indigo-600 px-3 py-2 rounded-lg text-sm hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
                        >
                          <DollarSign className="w-4 h-4" />
                          Edit Saldo
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
