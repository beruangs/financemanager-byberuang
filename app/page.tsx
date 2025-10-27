import Link from 'next/link';
import { Wallet, TrendingUp, PieChart, Target, BarChart3, Clock } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-4 shadow-2xl">
                <Wallet className="w-16 h-16 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Finance Manager
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-2xl mx-auto">
              Kelola keuangan pribadi Anda dengan mudah dan efisien
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-xl transition-all transform hover:scale-105"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 bg-white text-indigo-600 px-8 py-4 rounded-xl font-semibold hover:shadow-xl transition-all transform hover:scale-105 border-2 border-indigo-600"
              >
                Daftar Gratis
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
          Fitur Lengkap untuk Kebutuhan Finansial Anda
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 w-fit mb-4">
              <Wallet className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">Multi Dompet</h3>
            <p className="text-gray-700">
              Kelola berbagai dompet: Kas, Bank, dan E-Wallet dalam satu aplikasi
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 w-fit mb-4">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">Transaksi Lengkap</h3>
            <p className="text-gray-700">
              Catat pemasukan, pengeluaran, dan tagihan dengan kategori yang jelas
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-3 w-fit mb-4">
              <PieChart className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">Budget Allocation</h3>
            <p className="text-gray-700">
              Atur anggaran bulanan per kategori dan pantau pengeluaran Anda
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3 w-fit mb-4">
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">Analitik Dashboard</h3>
            <p className="text-gray-700">
              Visualisasi data keuangan dengan grafik dan statistik yang mudah dipahami
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-3 w-fit mb-4">
              <Target className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">Target Tabungan</h3>
            <p className="text-gray-700">
              Tetapkan dan pantau progress target tabungan Anda dengan mudah
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-3 w-fit mb-4">
              <Clock className="w-8 h-8 text-pink-600" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">Transaksi Berulang</h3>
            <p className="text-gray-700">
              Kelola tagihan dan pembayaran berulang secara otomatis
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-8 md:p-12 text-center shadow-2xl">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Mulai Kelola Keuangan Anda Hari Ini
          </h2>
          <p className="text-xl text-white opacity-90 mb-8">
            Gratis dan mudah digunakan, tidak perlu kartu kredit
          </p>
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 bg-white text-indigo-600 px-8 py-4 rounded-xl font-bold hover:shadow-xl transition-all transform hover:scale-105"
          >
            Daftar Sekarang
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 Finance Manager. Made with ❤️</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

