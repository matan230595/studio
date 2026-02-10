export type Transaction = {
  id: string;
  type: 'debt' | 'loan';
  creditor: {
    name: string;
  };
  description?: string | null;
  amount: number;
  originalAmount?: number | null;
  interestRate?: number | null;
  status: 'active' | 'paid' | 'late';
  startDate?: string | null;
  dueDate: string;
  paymentType: 'single' | 'installments';
  numberOfPayments?: number | null;
  nextPaymentAmount?: number | null;
  paymentMethod?: string | null;
  userId?: string;
};

export const transactions: Transaction[] = [];
