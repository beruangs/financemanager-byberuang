'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { clearPersistedSession } from '@/lib/session-persistence';
import WalletManagement from './WalletManagement';
import TransactionForm from './TransactionForm';
import TransactionHistory from './TransactionHistory';
import BudgetAllocation from './BudgetAllocation';
import DashboardAnalytics from './DashboardAnalytics';
import Settings from './Settings';
import SavingsGoals from './SavingsGoals';
import AISavingsCalculator from './AISavingsCalculator';
import SkeletonLoader from './SkeletonLoader';
import DebtNotes from './DebtNotes';
import SuperAdmin from './SuperAdmin';
import SimpleChart from './SimpleChart';
import { formatCurrency } from '@/lib/utils';
import { generateCSVContent, downloadCSV } from '@/lib/csvExport';
import { 
  Wallet as WalletIcon, 
  Plus, 
  History, 
  PieChart, 
  LogOut, 
  Menu, 
  X,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Settings as SettingsIcon,
  Target,
  User,
  ChevronDown,
  FileDown,
  DollarSign,
  Shield
} from 'lucide-react';

type ActiveTab = 'dashboard' | 'wallets' | 'transaction' | 'history' | 'budget' | 'savings' | 'debt' | 'admin' | 'settings';

interface Wallet {
  _id: string;
  name: string;
  type: string;
  balance: number;
  color: string;
}

interface Transaction {
  _id: string;
  walletId: string;
  type: 'income' | 'expense' | 'bill';
  category: string;
  amount: number;
  date: string;
  description?: string;
  isRecurring?: boolean;
}

interface Budget {
  _id: string;
  category: string;
  allocated: number;
  spent: number;
  month: string;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budget, setBudget] = useState<Budget[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<'user' | 'superadmin' | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Load data from API
  useEffect(() => {
    if (status === 'authenticated') {
      loadData();
    }
  }, [status]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch user role from session
      const sessionRes = await fetch('/api/auth/session');
      if (sessionRes.ok) {
        const session = await sessionRes.json();
        setUserRole(session.user?.role || 'user');
      }

      // Fetch wallets
      const walletsRes = await fetch('/api/wallets');
      if (walletsRes.ok) {
        const walletsData = await walletsRes.json();
        setWallets(walletsData);
      }

      // Fetch transactions
      const transactionsRes = await fetch('/api/transactions');
      if (transactionsRes.ok) {
        const transactionsData = await transactionsRes.json();
        setTransactions(transactionsData);
      }

      // Fetch budgets
      const budgetsRes = await fetch('/api/budgets');
      if (budgetsRes.ok) {
        const budgetsData = await budgetsRes.json();
        setBudget(budgetsData);
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalletsUpdate = () => {
    loadData(); // Refresh all data
  };

  const handleTransactionAdd = () => {
    loadData(); // Refresh all data
    setActiveTab('history'); // Navigate to history after adding
  };

  const handleTransactionsUpdate = () => {
    loadData(); // Refresh all data
  };

  const handleBudgetUpdate = () => {
    loadData(); // Refresh all data
  };

  const handleLogout = async () => {
    // Clear persisted session for PWA
    clearPersistedSession();
    await signOut({ redirect: true, callbackUrl: '/' });
  };

  // Calculate statistics - with safe array checks
  const totalBalance = Array.isArray(wallets) 
    ? wallets.reduce((sum, wallet) => sum + (wallet.balance || 0), 0)
    : 0;
  
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyTransactions = Array.isArray(transactions)
    ? transactions.filter(t => String(t.date).startsWith(currentMonth))
    : [];
  
  const monthlyIncome = monthlyTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  
  const monthlyExpense = monthlyTransactions
    .filter(t => t.type === 'expense' || t.type === 'bill')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="bg-white dark:bg-slate-800 shadow-sm sticky top-0 z-40 backdrop-blur-lg bg-opacity-95 dark:bg-opacity-95 border-b border-gray-200 dark:border-slate-700 transition-colors">
          <div className="px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-2">
                <WalletIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Finance Manager</h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">Kelola keuangan dengan mudah</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* User Dropdown Menu - Desktop */}
              <div className="hidden md:block relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 bg-gray-100 rounded-lg px-4 py-2 hover:bg-gray-200 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {session.user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-medium text-gray-800">{session.user?.name}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-30" 
                      onClick={() => setIsUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-40">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{session.user?.name}</p>
                        <p className="text-xs text-gray-600 truncate">{session.user?.email}</p>
                      </div>
                      
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          setActiveTab('settings' as any);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                      >
                        <SettingsIcon className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-800">Pengaturan</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          const csvContent = generateCSVContent(transactions as any, wallets as any, budget as any);
                          const filename = `Finance-Report-${new Date().toISOString().split('T')[0]}.csv`;
                          downloadCSV(csvContent, filename);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                      >
                        <FileDown className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-800">Export CSV</span>
                      </button>
                      
                      <div className="border-t border-gray-100 my-2" />
                      
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4 text-red-600" />
                        <span className="text-sm text-red-600 font-medium">Keluar</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-slate-800 shadow-lg p-4 absolute top-16 right-0 left-0 z-30 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-4 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                {session.user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{session.user?.name}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{session.user?.email}</p>
              </div>
            </div>
            <nav className="space-y-2">
              <button
                onClick={() => {
                  setActiveTab('settings');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeTab === 'settings'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                    : 'hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <SettingsIcon className="w-5 h-5" />
                <span className="font-medium">Pengaturan</span>
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Keluar</span>
              </button>
            </nav>
          </div>
        )}

        <div className="flex">
          {/* Sidebar - Desktop */}
          <aside className="hidden md:block w-64 min-h-screen bg-white dark:bg-slate-800 shadow-lg border-r border-gray-200 dark:border-slate-700">
            <div className="p-4">
              <nav className="space-y-2">
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
                  { id: 'wallets', label: 'Dompet', icon: WalletIcon },
                  { id: 'transaction', label: 'Tambah Transaksi', icon: Plus },
                  { id: 'history', label: 'Riwayat', icon: History },
                  { id: 'budget', label: 'Budget', icon: PieChart },
                  { id: 'savings', label: 'Tabungan', icon: Target },
                  { id: 'debt', label: 'Hutang', icon: DollarSign },
                  { id: 'settings', label: 'Pengaturan', icon: SettingsIcon },
                  ...(userRole === 'superadmin' ? [{ id: 'admin', label: 'Admin', icon: Shield }] : [])
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as ActiveTab)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                          : 'hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6">
            {isLoading ? (
              <SkeletonLoader />
            ) : activeTab === 'dashboard' ? (
              <div className="space-y-6 animate-fadeIn">
                {/* Balance Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl hover-lift">
                    <p className="text-sm opacity-90 mb-2 font-medium">Total Saldo</p>
                    <p className="text-3xl font-bold">{formatCurrency(totalBalance)}</p>
                  </div>
                  <div className="bg-white rounded-2xl p-6 shadow-lg hover-lift">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-800 font-semibold">Pemasukan Bulan Ini</p>
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(monthlyIncome)}</p>
                  </div>
                  <div className="bg-white rounded-2xl p-6 shadow-lg hover-lift">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-800 font-semibold">Pengeluaran Bulan Ini</p>
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    </div>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(monthlyExpense)}</p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <h2 className="text-xl font-bold mb-4">Aksi Cepat</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button
                      onClick={() => setActiveTab('transaction')}
                      className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl hover:shadow-md transition-all"
                    >
                      <Plus className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-800">Tambah Transaksi</p>
                    </button>
                    <button
                      onClick={() => setActiveTab('wallets')}
                      className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl hover:shadow-md transition-all"
                    >
                      <WalletIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-800">Kelola Dompet</p>
                    </button>
                    <button
                      onClick={() => setActiveTab('history')}
                      className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl hover:shadow-md transition-all"
                    >
                      <History className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-800">Lihat Riwayat</p>
                    </button>
                    <button
                      onClick={() => setActiveTab('budget')}
                      className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl hover:shadow-md transition-all"
                    >
                      <PieChart className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-800">Atur Budget</p>
                    </button>
                  </div>
                </div>

                {/* Charts - Visible on Mobile */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Expense Categories Chart */}
                  <SimpleChart
                    title="Pengeluaran per Kategori"
                    type="bar"
                    data={(() => {
                      const categories: { [key: string]: number } = {};
                      monthlyTransactions
                        .filter(t => t.type === 'expense')
                        .forEach(t => {
                          categories[t.category] = (categories[t.category] || 0) + t.amount;
                        });
                      
                      const colors = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16'];
                      return Object.entries(categories)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 5)
                        .map(([label, value], index) => ({
                          label,
                          value,
                          color: colors[index % colors.length]
                        }));
                    })()}
                  />

                  {/* Income vs Expense */}
                  <SimpleChart
                    title="Pemasukan vs Pengeluaran"
                    type="pie"
                    data={[
                      { label: 'Pemasukan', value: monthlyIncome, color: '#10b981' },
                      { label: 'Pengeluaran', value: monthlyExpense, color: '#ef4444' }
                    ]}
                  />
                </div>

                {/* Recent Transactions */}
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <h2 className="text-xl font-bold mb-4 text-gray-900">Transaksi Terbaru</h2>
                  {!Array.isArray(transactions) || transactions.length === 0 ? (
                    <p className="text-gray-700 text-center py-8 font-medium">Belum ada transaksi</p>
                  ) : (
                    <div className="space-y-3">
                      {transactions.slice(-5).reverse().map(transaction => {
                        const wallet = Array.isArray(wallets) 
                          ? wallets.find(w => w._id === transaction.walletId)
                          : null;
                        return (
                          <div key={transaction._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <div className="flex-1 min-w-0 pr-3">
                              <p className="font-medium text-gray-900 truncate">{transaction.category}</p>
                              <p className="text-sm text-gray-800 truncate">
                                {wallet?.name || 'Unknown'} • {new Date(transaction.date).toLocaleDateString('id-ID')}
                              </p>
                            </div>
                            <p className={`font-bold whitespace-nowrap ${
                              transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount || 0)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Quick Analytics */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    Statistik Cepat
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-4 border border-green-200">
                      <p className="text-sm text-green-700 font-medium mb-1">Transaksi Bulan Ini</p>
                      <p className="text-2xl font-bold text-green-900">
                        {transactions.filter(t => {
                          const transDate = new Date(t.date);
                          const now = new Date();
                          return transDate.getMonth() === now.getMonth() && 
                                 transDate.getFullYear() === now.getFullYear();
                        }).length}
                      </p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-4 border border-blue-200">
                      <p className="text-sm text-blue-700 font-medium mb-1">Rata-rata/Hari</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {formatCurrency(
                          transactions.filter(t => t.type === 'expense')
                            .reduce((sum, t) => sum + t.amount, 0) / 30
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === 'wallets' ? (
              <WalletManagement 
                onWalletChange={handleWalletsUpdate}
              />
            ) : activeTab === 'transaction' ? (
              <TransactionForm onTransactionAdd={handleTransactionAdd} />
            ) : activeTab === 'history' ? (
              <TransactionHistory 
                onTransactionChange={handleTransactionsUpdate}
              />
            ) : activeTab === 'budget' ? (
              <BudgetAllocation 
                onBudgetChange={handleBudgetUpdate}
              />
            ) : activeTab === 'savings' ? (
              <div className="space-y-6 animate-fadeIn">
                <AISavingsCalculator />
                <SavingsGoals />
              </div>
            ) : activeTab === 'debt' ? (
              <DebtNotes />
            ) : activeTab === 'admin' ? (
              <SuperAdmin />
            ) : activeTab === 'settings' ? (
              <Settings onLogout={handleLogout} />
            ) : null}
          </main>
        </div>

        {/* Bottom Navigation - Mobile Only */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
          <div className="grid grid-cols-6 gap-1 px-2 py-2">
            {[
              { id: 'dashboard', label: 'Home', icon: BarChart3 },
              { id: 'wallets', label: 'Dompet', icon: WalletIcon },
              { id: 'transaction', label: 'Transaksi', icon: Plus },
              { id: 'history', label: 'Riwayat', icon: History },
              { id: 'budget', label: 'Budget', icon: PieChart },
              { id: 'debt', label: 'Hutang', icon: DollarSign }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as ActiveTab);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all min-h-[56px] ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-1 ${isActive ? 'scale-110' : ''} transition-transform`} />
                  <span className={`text-[10px] font-medium ${isActive ? 'font-semibold' : ''}`}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
