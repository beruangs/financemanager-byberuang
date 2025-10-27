'use client';

import { useState, useEffect } from 'react';
import { Users, Trash2, Edit2, Save, X, Shield, LogOut, Lock } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAlert } from '@/context/AlertContext';
import CredentialManager from './CredentialManager';

interface UserStats {
  _id: string;
  name: string;
  email: string;
  totalTransactions: number;
  totalWallets: number;
  totalSaldo: number;
  role: string;
  createdAt: string;
}

interface AdminDashboardProps {
  adminToken: string;
}

export default function AdminDashboard({ adminToken }: AdminDashboardProps) {
  const { showAlert, showConfirm } = useAlert();
  const [users, setUsers] = useState<UserStats[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<'user' | 'superadmin'>('user');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'credentials'>('users');

  useEffect(() => {
    fetchUsers();
  }, [adminToken]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      } else {
        const errorData = await res.json();
        await showAlert({
          type: 'error',
          message: errorData.error || 'Gagal mengambil data pengguna',
        });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      await showAlert({
        type: 'error',
        message: 'Terjadi kesalahan saat mengambil data',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'user' | 'superadmin') => {
    const confirmed = await showConfirm(
      `Yakin mengubah role ke ${newRole === 'superadmin' ? 'Super Admin' : 'User'}?`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        await fetchUsers();
        setEditingId(null);
        await showAlert({
          type: 'success',
          message: 'Role berhasil diubah',
        });
      } else {
        const errorData = await res.json();
        await showAlert({
          type: 'error',
          message: errorData.error || 'Gagal mengubah role',
        });
      }
    } catch (error) {
      console.error('Error updating role:', error);
      await showAlert({
        type: 'error',
        message: 'Terjadi kesalahan',
      });
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    const confirmed = await showConfirm(
      `Yakin ingin menghapus pengguna "${userName}"? Data yang terkait juga akan dihapus.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      if (res.ok) {
        await fetchUsers();
        await showAlert({
          type: 'success',
          message: 'Pengguna berhasil dihapus',
        });
      } else {
        const errorData = await res.json();
        await showAlert({
          type: 'error',
          message: errorData.error || 'Gagal menghapus pengguna',
        });
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      await showAlert({
        type: 'error',
        message: 'Terjadi kesalahan',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-white text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Pengguna</p>
              <p className="text-3xl font-bold text-white mt-2">{users.length}</p>
            </div>
            <Users className="w-12 h-12 text-purple-400 opacity-20" />
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Transaksi</p>
              <p className="text-3xl font-bold text-white mt-2">
                {users.reduce((sum, u) => sum + u.totalTransactions, 0)}
              </p>
            </div>
            <Shield className="w-12 h-12 text-blue-400 opacity-20" />
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Aset</p>
              <p className="text-3xl font-bold text-white mt-2">
                {formatCurrency(users.reduce((sum, u) => sum + u.totalSaldo, 0))}
              </p>
            </div>
            <LogOut className="w-12 h-12 text-green-400 opacity-20" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-8 flex gap-4 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold border-b-2 transition-colors ${
            activeTab === 'users'
              ? 'text-white border-b-purple-500'
              : 'text-gray-400 border-b-transparent hover:text-white'
          }`}
        >
          <Users className="w-5 h-5" />
          Kelola Pengguna
        </button>
        <button
          onClick={() => setActiveTab('credentials')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold border-b-2 transition-colors ${
            activeTab === 'credentials'
              ? 'text-white border-b-orange-500'
              : 'text-gray-400 border-b-transparent hover:text-white'
          }`}
        >
          <Lock className="w-5 h-5" />
          Kredensial
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700 border-b border-slate-600">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Nama</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Dompet</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Transaksi</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Total Saldo</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Role</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 text-white font-medium">{user.name}</td>
                    <td className="px-6 py-4 text-gray-400 text-sm">{user.email}</td>
                    <td className="px-6 py-4 text-gray-400">{user.totalWallets}</td>
                    <td className="px-6 py-4 text-gray-400">{user.totalTransactions}</td>
                    <td className="px-6 py-4 text-white font-semibold">
                      {formatCurrency(user.totalSaldo)}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === user._id ? (
                        <select
                          value={selectedRole}
                          onChange={(e) => setSelectedRole(e.target.value as 'user' | 'superadmin')}
                          className="px-3 py-1 bg-slate-600 text-white text-sm rounded border border-slate-500"
                        >
                          <option value="user">User</option>
                          <option value="superadmin">Super Admin</option>
                        </select>
                      ) : (
                        <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                          user.role === 'superadmin'
                            ? 'bg-purple-900/50 text-purple-300'
                            : 'bg-gray-900/50 text-gray-300'
                        }`}>
                          {user.role === 'superadmin' ? 'Super Admin' : 'User'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {editingId === user._id ? (
                          <>
                            <button
                              onClick={() => handleUpdateRole(user._id, selectedRole)}
                              className="p-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                              title="Simpan"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                              title="Batal"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingId(user._id);
                                setSelectedRole(user.role as 'user' | 'superadmin');
                              }}
                              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user._id, user.name)}
                              className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                              title="Hapus"
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

          {users.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Tidak ada pengguna terdaftar</p>
            </div>
          )}
        </div>
      )}

      {/* Credentials Tab */}
      {activeTab === 'credentials' && (
        <CredentialManager adminToken={adminToken} />
      )}
    </div>
  );
}
