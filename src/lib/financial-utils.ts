import type { Transaction } from '@/lib/data';

export type FinancialSummary = {
  totalOwed: number;
  monthlyRepayment: number;
  lateItems: number;
  activeItems: number;
};

export function calculateFinancialSummary(transactions: Transaction[]): FinancialSummary {
  if (!transactions) return { totalOwed: 0, monthlyRepayment: 0, lateItems: 0, activeItems: 0 };
  const totalOwed = transactions.filter(l => l.status !== 'paid').reduce((acc, item) => acc + item.amount, 0);
  const monthlyRepayment = transactions.filter(d => d.status === 'active' && d.paymentType === 'installments').reduce((acc, item) => acc + (item.nextPaymentAmount || 0), 0);
  const lateItems = transactions.filter(l => l.status === 'late').length;
  const activeItems = transactions.filter(l => l.status === 'active').length;
  return { totalOwed, monthlyRepayment, lateItems, activeItems };
}

export function getLateTransactions(transactions: Transaction[]): Transaction[] {
  if (!transactions) return [];
  return transactions.filter(t => t.status === 'late').sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}

export function getUpcomingPayments(transactions: Transaction[], count = 5): Transaction[] {
  if (!transactions) return [];
  return transactions
    .filter(t => t.status === 'active' && new Date(t.dueDate) >= new Date())
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, count);
}
