export const EXPENSE_CATEGORIES = [
  'Makanan & Minuman',
  'Transportasi',
  'Belanja',
  'Hiburan',
  'Kesehatan',
  'Pendidikan',
  'Rumah Tangga',
  'Pakaian',
  'Kecantikan',
  'Olahraga',
  'Hadiah',
  'Amal',
  'Lainnya',
];

export const INCOME_CATEGORIES = [
  'Gaji',
  'Bonus',
  'Investasi',
  'Bisnis',
  'Freelance',
  'Hadiah',
  'Saldo Awal',
  'Lainnya',
];

export const BILL_CATEGORIES = [
  'Listrik',
  'Air',
  'Internet',
  'Telepon',
  'TV Kabel',
  'Streaming',
  'Asuransi',
  'Cicilan',
  'Sewa',
  'Lainnya',
];

export const EWALLET_OPTIONS = [
  'GoPay',
  'OVO',
  'Dana',
  'ShopeePay',
  'LinkAja',
  'Jenius',
  'PayPal',
  'Lainnya',
];

export const BANK_OPTIONS = [
  'BCA',
  'Mandiri',
  'BNI',
  'BRI',
  'CIMB Niaga',
  'Permata',
  'Danamon',
  'BTN',
  'Mega',
  'Panin',
  'OCBC NISP',
  'Bank Jago',
  'Jenius (BTPN)',
  'Blu (BCA Digital)',
  'Seabank',
  'Neo Commerce',
  'Lainnya',
];

export type WalletType = 'cash' | 'e-wallet' | 'bank';
export type TransactionType = 'income' | 'expense' | 'bill';
export type RecurringType = 'tidak' | 'harian' | 'mingguan' | 'bulanan' | 'custom';
