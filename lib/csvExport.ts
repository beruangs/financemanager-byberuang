import { ITransaction } from '@/models/Transaction';
import { IWallet } from '@/models/Wallet';
import { IBudget } from '@/models/Budget';

export function generateCSVContent(
  transactions: ITransaction[],
  wallets: IWallet[],
  budgets: IBudget[]
): string {
  const lines: string[] = [];
  const today = new Date().toLocaleDateString('id-ID');

  // Header
  lines.push('LAPORAN KEUANGAN LENGKAP');
  lines.push(`Tanggal Export: ${today}`);
  lines.push('');

  // DOMPET (WALLETS)
  lines.push('=== DAFTAR DOMPET ===');
  lines.push('Nama,Tipe,Saldo (Rp)');
  wallets.forEach(wallet => {
    lines.push(`"${wallet.name}","${wallet.type}","${wallet.balance}"`);
  });
  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);
  lines.push(`"TOTAL SALDO","",${totalBalance}`);
  lines.push('');

  // TRANSAKSI (TRANSACTIONS)
  lines.push('=== RIWAYAT TRANSAKSI ===');
  lines.push('Tanggal,Kategori,Tipe,Jumlah (Rp),Dompet,Keterangan');
  transactions.forEach(transaction => {
    const wallet = wallets.find(w => String(w._id) === String(transaction.walletId));
    const walletName = wallet?.name || 'Unknown';
    const date = new Date(transaction.date).toLocaleDateString('id-ID');
    const typeLabel = transaction.type === 'income' ? 'Pemasukan' : 
                      transaction.type === 'expense' ? 'Pengeluaran' : 'Tagihan';
    
    lines.push(
      `"${date}","${transaction.category}","${typeLabel}","${transaction.amount}","${walletName}","${transaction.description || ''}"`
    );
  });
  lines.push('');

  // SUMMARY
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalBill = transactions
    .filter(t => t.type === 'bill')
    .reduce((sum, t) => sum + t.amount, 0);

  lines.push('=== RINGKASAN ===');
  lines.push(`Total Pemasukan (Rp),${totalIncome}`);
  lines.push(`Total Pengeluaran (Rp),${totalExpense}`);
  lines.push(`Total Tagihan (Rp),${totalBill}`);
  lines.push(`Net (Rp),${totalIncome - totalExpense - totalBill}`);
  lines.push('');

  // BUDGET
  if (budgets && budgets.length > 0) {
    lines.push('=== ALOKASI BUDGET ===');
    lines.push('Bulan,Kategori,Budget (Rp),Terbayar (Rp),Sisa (Rp),Keterangan');
    
    budgets.forEach(budget => {
      if (budget.allocations && Array.isArray(budget.allocations)) {
        budget.allocations.forEach(allocation => {
          const remaining = allocation.amount - allocation.spent;
          lines.push(
            `"${budget.month}","${allocation.category}","${allocation.amount}","${allocation.spent}","${remaining}","${allocation.description || ''}"`
          );
        });
      }
    });
    lines.push('');
  }

  return lines.join('\n');
}

export function downloadCSV(content: string, filename: string): void {
  const element = document.createElement('a');
  element.setAttribute(
    'href',
    'data:text/csv;charset=utf-8,' + encodeURIComponent(content)
  );
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}
