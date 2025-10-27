'use client';

import { useState, useEffect } from 'react';
import { Shield, Users, TrendingUp, Activity, Trash2, Edit2, Save, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface UserStats {
  _id: string;
  name: string;
  email: string;
  totalTransactions: number;
  totalWallets: number;
  totalSaldo: number;
  role: string;
}

export default function SuperAdmin() {
  const [users, setUsers] = useState<UserStats[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<'user' | 'superadmin'>('user');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Gagal mengambil data pengguna');
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'user' | 'superadmin') => {
    if (!window.confirm(`Yakin mengubah role pengguna ke ${newRole}?`)) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        await fetchUsers();
        setEditingId(null);
        alert('Role pengguna berhasil diupdate');
      } else {
        alert('Gagal mengupdate role pengguna');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!window.confirm(`Yakin ingin menghapus pengguna ${userName}? Data mereka akan dihapus!`)) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchUsers();
        alert('Pengguna berhasil dihapus');
      } else {
        alert('Gagal menghapus pengguna');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  const totalUsers = users.length;
  const totalTransactions = users.reduce((sum, u) => sum + u.totalTransactions, 0);
  const totalSaldo = users.reduce((sum, u) => sum + u.totalSaldo, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8" />
          <h2 className="text-2xl font-bold">Super Admin Dashboard</h2>
        </div>
        <p className="text-purple-100">
          Kelola semua pengguna dan pantau aktivitas sistem
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-6 h-6 text-blue-600" />
            <p className="text-sm text-blue-700 font-medium">Total Pengguna</p>
          </div>
          <p className="text-3xl font-bold text-blue-900">{totalUsers}</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-6 h-6 text-green-600" />
            <p className="text-sm text-green-700 font-medium">Total Transaksi</p>
          </div>
          <p className="text-3xl font-bold text-green-900">{totalTransactions}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-6 h-6 text-purple-600" />
            <p className="text-sm text-purple-700 font-medium">Total Aset</p>
          </div>
          <p className="text-2xl font-bold text-purple-900">{formatCurrency(totalSaldo)}</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-600" />
          Daftar Pengguna
        </h3>

        {users.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Tidak ada pengguna</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Nama</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Email</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Transaksi</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Dompet</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Total Saldo</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Role</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr key={user._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 text-gray-900 font-medium">{user.name}</td>
                    <td className="px-4 py-3 text-gray-600 truncate">{user.email}</td>
                    <td className="px-4 py-3 text-gray-600">{user.totalTransactions}</td>
                    <td className="px-4 py-3 text-gray-600">{user.totalWallets}</td>
                    <td className="px-4 py-3 text-gray-900 font-semibold">
                      {formatCurrency(user.totalSaldo)}
                    </td>
                    <td className="px-4 py-3">
                      {editingId === user._id ? (
                        <div className="flex gap-2">
                          <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value as any)}
                            className="px-2 py-1 text-xs border border-gray-300 rounded-lg"
                          >
                            <option value="user">User</option>
                            <option value="superadmin">SuperAdmin</option>
                          </select>
                          <button
                            onClick={() => handleUpdateRole(user._id, selectedRole)}
                            disabled={isLoading}
                            className="px-2 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700"
                          >
                            <Save className="w-3 h-3 inline" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                          >
                            <X className="w-3 h-3 inline" />
                          </button>
                        </div>
                      ) : (
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          user.role === 'superadmin'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {user.role === 'superadmin' ? 'SuperAdmin' : 'User'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {editingId !== user._id && (
                          <>
                            <button
                              onClick={() => {
                                setEditingId(user._id);
                                setSelectedRole(user.role as any);
                              }}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user._id, user.name)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
