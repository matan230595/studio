
import type { Transaction } from '@/lib/data';
import { differenceInDays, isSameMonth, parseISO } from 'date-fns';

export type FinancialSummary = {
  totalOwed: number;
  monthlyRepayment: number;
  lateItems: number;
  activeItems: number;
  totalLoans: number;
  totalDebts: number;
};

export function calculateFinancialSummary(transactions: Transaction[]): FinancialSummary {
  if (!transactions) return { totalOwed: 0, monthlyRepayment: 0, lateItems: 0, activeItems: 0, totalDebts: 0, totalLoans: 0 };
  
  const activeTransactions = transactions.filter(t => t.status !== 'paid');
  
  const totalOwed = activeTransactions.reduce((acc, item) => acc + item.amount, 0);
  const monthlyRepayment = transactions.filter(d => d.status === 'active' && d.paymentType === 'installments').reduce((acc, item) => acc + (item.nextPaymentAmount || 0), 0);
  const lateItems = transactions.filter(l => l.status === 'late').length;
  const activeItems = transactions.filter(l => l.status === 'active').length;
  const totalLoans = activeTransactions.filter(t => t.type === 'loan').reduce((acc, t) => acc + t.amount, 0);
  const totalDebts = activeTransactions.filter(t => t.type === 'debt').reduce((acc, t) => acc + t.amount, 0);

  return { totalOwed, monthlyRepayment, lateItems, activeItems, totalLoans, totalDebts };
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

export function getUpcomingReminders(transactions: Transaction[], days: number): Transaction[] {
    if (!transactions) return [];
    const now = new Date();
    return transactions
        .filter(t => {
            const dueDate = new Date(t.dueDate);
            return t.status === 'active' && differenceInDays(dueDate, now) >= 0 && differenceInDays(dueDate, now) <= days;
        })
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}

export function getUrgentItem(transactions: Transaction[]): Transaction | null {
    if (!transactions) return null;
    const lateItems = getLateTransactions(transactions);
    if (lateItems.length > 0) {
        return lateItems[0];
    }
    const upcoming = getUpcomingPayments(transactions, 1);
    if (upcoming.length > 0) {
        return upcoming[0];
    }
    return null;
}

export function calculateSpendingByCategory(transactions: Transaction[], budgetMonth: string): Record<string, number> {
  if (!transactions || !budgetMonth) return {};
  
  const budgetMonthDate = parseISO(budgetMonth + '-01');

  return transactions.reduce((acc, t) => {
    if (!t.category) return acc;

    const dueDate = parseISO(t.dueDate);
    if (!isSameMonth(dueDate, budgetMonthDate)) {
      return acc;
    }

    if (!acc[t.category]) {
      acc[t.category] = 0;
    }
      
    // For installment loans, count the monthly payment. For single payments (debts or loans), count the full amount.
    if (t.paymentType === 'installments' && t.nextPaymentAmount) {
        acc[t.category] += t.nextPaymentAmount;
    } else if (t.paymentType === 'single') {
        acc[t.category] += t.amount;
    }
    
    return acc;
  }, {} as Record<string, number>);
}
